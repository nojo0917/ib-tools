import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

interface DetectionResult {
  service: string
  score: number
  label: string
  reasoning?: string
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

async function checkWithAI(text: string): Promise<DetectionResult> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert at detecting AI-generated text. Analyse the given text for signs of AI generation such as:
- Overly uniform sentence structure and length
- Lack of genuine personal voice or opinion
- Repetitive transitional phrases
- Unnaturally perfect grammar and flow
- Generic or vague statements without specific detail
- Absence of hesitation, personality, or natural imperfection

Respond ONLY with a JSON object in this exact format, nothing else:
{"score": <number 0-100>, "reasoning": "<one sentence explanation>"}

Where score is 0 = definitely human, 100 = definitely AI.`,
          },
          {
            role: 'user',
            content: `Analyse this text for AI generation:\n\n${text}`,
          },
        ],
      }),
    })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    const score = Math.min(100, Math.max(0, Math.round(parsed.score)))
    return {
      service: 'AI Analysis',
      score,
      label: score > 70 ? 'Likely AI' : score > 40 ? 'Mixed' : 'Likely Human',
      reasoning: parsed.reasoning,
    }
  } catch {
    return { service: 'AI Analysis', score: -1, label: 'Error', error: 'Failed' }
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

  const [sapling, aiAnalysis] = await Promise.all([
    checkSapling(text),
    checkWithAI(text),
  ])

  const validScores = [sapling, aiAnalysis].filter(r => r.score >= 0).map(r => r.score)
  const average = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : -1

  const results = {
    detectors: [sapling, aiAnalysis],
    average,
    averageLabel: average > 70 ? 'Likely AI' : average > 40 ? 'Mixed Content' : 'Likely Human',
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