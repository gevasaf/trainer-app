import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Helpers (mirrored from client) ──────────────────────────────────────────

function buildSystemPrompt(appData: any, clientNow?: string, utcOffset?: number) {
  const { profile, goals, tdee } = appData
  const n = goals.nutrition
  const offsetStr = utcOffset != null
    ? `UTC${utcOffset >= 0 ? '+' : ''}${Math.floor(utcOffset / 60)}${utcOffset % 60 ? ':' + String(Math.abs(utcOffset % 60)).padStart(2, '0') : ''}`
    : 'UTC'
  return `You are a personal fitness and diet trainer AI. Be concise, warm, direct, and motivating. Respond in the SAME LANGUAGE the user writes in (Hebrew if Hebrew, English otherwise).

## Current date & time
${clientNow ?? 'unknown'} (${offsetStr})
All log dates are in the user's local timezone. Use this date when computing relative references like "yesterday" or "3 days ago".

## User profile
Name: ${profile.name} | Age: ${profile.age} | Gender: ${profile.gender} | Height: ${profile.height}cm | Starting weight: ${profile.weight}kg | Starting waist: ${profile.waist}cm
TDEE: ${tdee} kcal/day | BMI: ${profile.bmi} | Est. body fat: ${profile.fatPct}%

## Program
Goal type: ${goals.goalType || 'weight loss'} | Duration: ${goals.durationWeeks} weeks | Start: ${goals.startDate}
Break weeks: ${goals.breakWeeks?.length ? goals.breakWeeks.join(', ') : 'none'} | Committed workouts/week: ${goals.workoutsPerWeek}
Target weight: ${goals.targetWeight}kg | Target waist: ${goals.targetWaist}cm | Target fat%: ${goals.targetFat || 'n/a'}%

## Daily targets
Calories: ${n.targetCal} kcal | Protein: ${n.protein}g | Carbs: ${n.carbs}g | Fat: ${n.fat}g | Fiber: ${n.fiber}g | Water: ${n.water}L
Calorie deficit: ${goals.deficit} kcal/day vs TDEE

## Instructions
- You have a query_log tool. Use it ONLY when the user asks about specific foods, activities, or patterns over time that you cannot answer from conversation history.
- For end-of-day and measurement events you will receive full data inline — do NOT call tools for those.
- Keep responses under 150 words unless the user asks for detail.
- Sunday is the first day of the week (Fri–Sat are weekend).`
}

function aggregateLogQuery(allEntries: any[], { dateFrom, dateTo, type, search }: any): string {
  const filtered = allEntries.filter(e => {
    if (dateFrom && e.date < dateFrom) return false
    if (dateTo   && e.date > dateTo)   return false
    if (type && type !== 'all' && e.type !== type) return false
    if (search && !(e.label ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  if (!filtered.length) return 'No matching entries found.'

  if (type === 'food' || filtered[0]?.type === 'food') {
    const g: Record<string, any> = {}
    filtered.forEach(e => {
      const k = (e.label ?? 'food').toLowerCase()
      if (!g[k]) g[k] = { count: 0, cal: 0, protein: 0 }
      g[k].count++; g[k].cal += e.calories ?? 0; g[k].protein += e.protein ?? 0
    })
    return `Found ${filtered.length} food entries across ${new Set(filtered.map(e => e.date)).size} days:\n` +
      Object.entries(g).slice(0, 15).map(([k, v]: any) =>
        `  ${k}: ${v.count}x, avg ${Math.round(v.cal / v.count)} kcal, avg ${Math.round(v.protein / v.count)}g protein`
      ).join('\n')
  }

  if (type === 'activity' || filtered[0]?.type === 'activity') {
    const g: Record<string, any> = {}
    filtered.forEach(e => {
      const k = (e.label ?? 'activity').toLowerCase()
      if (!g[k]) g[k] = { count: 0, burned: 0, min: 0 }
      g[k].count++; g[k].burned += e.calories_burned ?? 0; g[k].min += e.duration_min ?? 0
    })
    return `Found ${filtered.length} activity entries:\n` +
      Object.entries(g).slice(0, 15).map(([k, v]: any) =>
        `  ${k}: ${v.count}x, total ${v.burned} kcal burned, ${v.min} min`
      ).join('\n')
  }

  return `Found ${filtered.length} entries between ${dateFrom ?? 'start'} and ${dateTo ?? 'today'}.`
}

const QUERY_LOG_TOOL: Anthropic.Tool = {
  name: 'query_log',
  description: "Search the user's food, activity, and body stat logs. Use when the user asks about specific foods, activities, or patterns over time.",
  input_schema: {
    type: 'object',
    properties: {
      date_from: { type: 'string', description: 'Start date YYYY-MM-DD' },
      date_to:   { type: 'string', description: 'End date YYYY-MM-DD' },
      type:      { type: 'string', enum: ['food', 'activity', 'body', 'eod', 'all'], description: 'Entry type to filter' },
      search:    { type: 'string', description: 'Optional text to match against entry label' },
    },
    required: [],
  },
}

const N_FULL = 20

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = (req.headers.authorization ?? '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { mode, userMsg, eventContext, chatHistory, appData, allEntries, clientNow, utcOffset } = req.body

  const systemPrompt = buildSystemPrompt(appData, clientNow, utcOffset)

  // Build message list — filter out UI-only event cards (role:"event")
  const full = (chatHistory as any[]).slice(-N_FULL)
  const older = (chatHistory as any[]).slice(0, -N_FULL)

  let messages: Anthropic.MessageParam[] = []
  if (older.length > 0) {
    messages.push({ role: 'user', content: `[Context: ${older.length} earlier messages not shown. Continue naturally.]` })
    messages.push({ role: 'assistant', content: "Understood, I'll continue from our recent conversation." })
  }

  // Filter event cards and ensure messages start with 'user' and strictly alternate roles
  const rawMessages = full
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }))

  // Drop leading assistant messages (can appear when event cards are filtered out before them)
  const firstUserIdx = rawMessages.findIndex((m: any) => m.role === 'user')
  const trimmed = firstUserIdx <= 0 ? rawMessages : rawMessages.slice(firstUserIdx)

  // Deduplicate consecutive same-role messages (keep last)
  const apiMessages = trimmed.reduce((acc: any[], msg: any) => {
    if (acc.length && acc[acc.length - 1].role === msg.role) {
      return [...acc.slice(0, -1), msg]
    }
    return [...acc, msg]
  }, [])

  messages = [...messages, ...apiMessages]

  try {
    if (mode === 'user') {
      // userMsg is already the last entry in apiMessages (client sends [...history, userEntry])
      // Do NOT push it again or we get consecutive user messages → Anthropic 400

      let response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        tools: [QUERY_LOG_TOOL],
        messages,
      })

      let usedTool = false
      while (response.stop_reason === 'tool_use') {
        usedTool = true
        const toolUse = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock
        const toolResult = aggregateLogQuery(allEntries, {
          dateFrom: (toolUse.input as any).date_from,
          dateTo:   (toolUse.input as any).date_to,
          type:     (toolUse.input as any).type,
          search:   (toolUse.input as any).search,
        })

        messages = [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: toolResult }] },
        ]

        response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: systemPrompt,
          tools: [QUERY_LOG_TOOL],
          messages,
        })
      }

      const text = response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('') || '…'
      return res.json({ text, usedTool })
    }

    if (mode === 'eod' || mode === 'measurement') {
      messages.push({ role: 'user', content: eventContext + '\n\nPlease respond to this event.' })
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      })
      const text = response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('') || '…'
      return res.json({ text, usedTool: false })
    }

    return res.status(400).json({ error: 'Unknown mode' })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
