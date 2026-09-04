import { supabase } from './supabase'

// Maps the keys used throughout the app to Supabase column names
const COL: Record<string, string> = {
  appData:     'app_data',
  entries:     'entries',
  bodyPoints:  'body_points',
  chatHistory: 'chat_history',
  journeys:    'journeys',
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

// Reads the archived journeys array (empty if none / column missing).
export async function getJourneys(): Promise<any[]> {
  const r = await storageGet('journeys')
  if (!r?.value) return []
  try {
    const v = JSON.parse(r.value)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

// Appends one journey to the archive. Throws on failure so callers can
// abort before clearing the active data (avoids losing data if the
// `journeys` column hasn't been migrated yet).
export async function appendJourney(journey: unknown): Promise<void> {
  if (!userId) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('user_data')
    .select('journeys')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error

  const list = Array.isArray((data as any)?.journeys) ? (data as any).journeys : []
  const next = [...list, journey]

  const { error: upErr } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, journeys: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  if (upErr) throw upErr
}

// Persists the full journeys array (used when deleting an archived journey).
export async function saveJourneys(list: unknown[]): Promise<void> {
  await storageSet('journeys', JSON.stringify(list))
}

// Clears the active timeline (program + logs + measurements + chat) while
// keeping the archived journeys and language. Used when starting fresh.
export async function resetActiveData(): Promise<void> {
  if (!userId) return
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        app_data: null,
        entries: [],
        body_points: [],
        chat_history: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  if (error) throw error
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
