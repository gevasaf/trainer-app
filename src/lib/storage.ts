import { supabase } from './supabase'

// Maps the keys used throughout the app to Supabase column names
const COL: Record<string, string> = {
  appData:     'app_data',
  entries:     'entries',
  bodyPoints:  'body_points',
  chatHistory: 'chat_history',
  lang:        'lang',
}

let userId: string | null = null

export function initStorage(id: string) {
  userId = id
}

export async function storageGet(key: string): Promise<{ value: string } | null> {
  if (!userId) return null
  const col = COL[key] ?? key

  const { data, error } = await supabase
    .from('user_data')
    .select(col)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data || data[col] == null) return null

  const val = data[col]
  return { value: typeof val === 'string' ? val : JSON.stringify(val) }
}

export async function clearUserData(): Promise<void> {
  if (!userId) return
  await supabase.from('user_data').delete().eq('user_id', userId)
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (!userId) return
  const col = COL[key] ?? key

  // lang is stored as plain text; everything else as JSONB
  let dbValue: unknown
  try {
    dbValue = key === 'lang' ? value : JSON.parse(value)
  } catch {
    dbValue = value
  }

  await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, [col]: dbValue, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
}
