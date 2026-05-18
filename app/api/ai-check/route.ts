import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

interface DetectionResult {
  service: string
  score: number
  label: string
  error?: string
}

async function checkSapling(text: string): Promise<DetectionResult> {
  try {
    const res = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.SAPLING_API_KEY,
        text,
      }),
    })
    const data = await res.json()
    const score = Math.round(data.score * 100)
    return {
      service: 'Sapling AI',
      score,
      label: score > 70 ? 'Likely AI' : score > 40 ? 'Mixed' : 'Likely Human',
    }
  } catch {
    return { service: 'Sapling AI', score: -1, label: 'Error', error: 'Failed' }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success } = await checkRateLimit(user.id, 'ai-check')
  if (!success) return new Response('Rate limit exceeded', { status: 429 })

  const { text } = await req.json()
  if (!text || text.length < 50) {
    return Response.json({ error: 'Text too short (minimum 50 characters)' }, { status: 400 })
  }
  if (text.length > 5000) {
    return Response.json({ error: 'Text too long (maximum 5000 characters)' }, { status: 400 })
  }

  const sapling = await checkSapling(text)

  const results = {
    detectors: [sapling],
    average: sapling.score,
    averageLabel: sapling.score > 70 ? 'Likely AI' : sapling.score > 40 ? 'Mixed Content' : 'Likely Human',
  }

  await supabase.from('generations').insert({
    user_id: user.id,
    tool: 'ai-check',
    input: text.slice(0, 500),
    output: JSON.stringify(results),
    metadata: results,
  })

  return Response.json(results)
}