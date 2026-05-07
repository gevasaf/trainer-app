import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify Supabase session token
  const token = (req.headers.authorization ?? '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { type, description, weightKg } = req.body as {
    type: 'food' | 'activity'
    description: string
    weightKg?: number
  }

  const prompt = type === 'food'
    ? `Estimate nutrition for: "${description}". Return JSON: {"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"water_ml":number,"label":string}`
    : `Estimate calories burned for a ${weightKg}kg person: "${description}". Return JSON: {"calories_burned":number,"label":string,"duration_min":number}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: 'You are a nutrition and fitness assistant. Always respond with valid JSON only. No markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map(b => b.type === 'text' ? b.text : '').join('')
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())
    return res.json(result)
  } catch {
    return res.status(500).json({ error: 'Failed to analyze' })
  }
}
