import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { HUMANIZE_PROMPTS } from '@/lib/prompts'
import { NextRequest } from 'next/server'

async function fixGrammar(text: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      text,
      language: 'en-GB',
    })
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const data = await res.json()
    let corrected = text
    const matches = [...data.matches].reverse()
    for (const match of matches) {
      if (match.replacements.length > 0) {
        const before = corrected.slice(0, match.offset)
        const after = corrected.slice(match.offset + match.length)
        corrected = before + match.replacements[0].value + after
      }
    }
    return corrected
  } catch {
    return text
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success } = await checkRateLimit(user.id, 'humanize')
  if (!success) return new Response('Rate limit exceeded', { status: 429 })

  const { text, style } = await req.json()
  if (!text || !style) return new Response('Missing fields', { status: 400 })

  const stylePrompt = HUMANIZE_PROMPTS[style]
  if (!stylePrompt) return new Response('Invalid style', { status: 400 })

  const grammarFixed = await fixGrammar(text)

  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
      stream: true,
      messages: [
        { role: 'system', content: stylePrompt },
        { role: 'user', content: grammarFixed },
      ],
    }),
  })

  return new Response(aiResponse.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}