export const runtime = 'edge';
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getSubjectPrompt } from '@/lib/prompts'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success } = await checkRateLimit(user.id, 'generate')
  if (!success) return new Response('Rate limit exceeded. Try again in an hour.', { status: 429 })

  const { subject, taskType, prompt } = await req.json()
  if (!subject || !taskType || !prompt) {
    return new Response('Missing fields', { status: 400 })
  }
  if (prompt.length > 2000) {
    return new Response('Prompt too long (max 2000 characters)', { status: 400 })
  }

  const systemPrompt = getSubjectPrompt(subject, taskType)

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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Task: ${taskType}\n\n${prompt}` },
      ],
    }),
  })

  console.log('OpenRouter status:', aiResponse.status)

  if (!aiResponse.ok) {
    const errText = await aiResponse.text()
    console.log('OpenRouter error:', errText)
    return new Response(errText, { status: aiResponse.status })
  }

  return new Response(aiResponse.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}