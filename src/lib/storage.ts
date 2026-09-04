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

// ---------------------------------------------------------------------------
// Journeys live INSIDE the existing `app_data` column (no schema change / no
// migration needed). The column holds one of two shapes:
//
//   • Legacy  →  the active journey's appData object directly, e.g. {profile,…}
//   • Wrapped →  { __v: 2, active: <appData|null>, journeys: [ …archived… ] }
//
// A row that has never started a second journey stays in the legacy shape and
// reads back as "active = that appData, journeys = []". The wrapper only
// appears once the user starts their first new journey.
// ---------------------------------------------------------------------------

type AppWrapper = { active: any; journeys: any[] }

function unwrapAppData(raw: any): AppWrapper {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.__v === 2) {
    return { active: raw.active ?? null, journeys: Array.isArray(raw.journeys) ? raw.journeys : [] }
  }
  // Legacy row (bare appData) or null → treat as the active journey, no history
  return { active: raw ?? null, journeys: [] }
}

async function readAppWrapper(): Promise<AppWrapper> {
  if (!userId) return { active: null, journeys: [] }
  const { data, error } = await supabase
    .from('user_data')
    .select('app_data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return { active: null, journeys: [] }
  return unwrapAppData((data as any).app_data)
}

// Writes the app_data column as the wrapper, optionally clearing the active
// log columns in the same upsert (used when starting a fresh journey).
async function writeAppWrapper(wrapper: AppWrapper, extra: Record<string, unknown> = {}): Promise<void> {
  if (!userId) throw new Error('Not signed in')
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        app_data: { __v: 2, active: wrapper.active ?? null, journeys: wrapper.journeys || [] },
        updated_at: new Date().toISOString(),
        ...extra,
      },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}

export async function storageGet(key: string): Promise<{ value: string } | null> {
  if (!userId) return null

  // appData is unwrapped from the container so callers see only the active journey
  if (key === 'appData') {
    const w = await readAppWrapper()
    if (w.active == null) return null
    return { value: JSON.stringify(w.active) }
  }

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

// Reads the archived journeys array (empty if none).
export async function getJourneys(): Promise<any[]> {
  const w = await readAppWrapper()
  return w.journeys || []
}

// Archives the current journey AND installs a freshly-set-up journey as the
// active one, in a single write: the old journey is appended to the archive
// (embedded in app_data), the new setup becomes active, and the active log
// columns are emptied for the fresh start. Throws on failure so the caller can
// report it — nothing is changed unless the write succeeds.
export async function archiveAndStart(journey: unknown, newActive: unknown): Promise<void> {
  const w = await readAppWrapper()
  const journeys = [...(w.journeys || []), journey]
  await writeAppWrapper(
    { active: newActive, journeys },
    { entries: [], body_points: [], chat_history: [] },
  )
}

// Persists the full journeys array (used when deleting an archived journey).
export async function saveJourneys(list: unknown[]): Promise<void> {
  const w = await readAppWrapper()
  await writeAppWrapper({ active: w.active, journeys: list })
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (!userId) return

  // appData must preserve the embedded journeys archive on every write
  if (key === 'appData') {
    const w = await readAppWrapper()
    let active: any
    try { active = JSON.parse(value) } catch { active = null }
    await writeAppWrapper({ active, journeys: w.journeys })
    return
  }

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
