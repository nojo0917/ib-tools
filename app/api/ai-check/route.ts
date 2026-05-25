import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { success } = await checkRateLimit(user.id, 'ai-check')
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  try {
    const { text } = await req.json()
    
    const saplingRes = await fetch('https://api.sapling.ai/api/v1/aidetect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.SAPLING_API_KEY,
        text,
      }),
    })

    const data = await saplingRes.json()
    
    // Convert 0.0-1.0 to 0-100. Default to 0 if data is missing.
    const rawScore = data.score !== undefined ? data.score : 0
    const score = Math.round(rawScore * 100)
    
    const label = score > 70 ? 'Likely AI' : score > 35 ? 'Uncertain' : 'Likely Human'

    const results = { score, label }

    // Log to Supabase
    await supabase.from('generations').insert({
      user_id: user.id,
      tool: 'ai-check',
      input: text.slice(0, 500),
      output: JSON.stringify(results),
      metadata: results,
    })

    return NextResponse.json(results)

  } catch (err) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}