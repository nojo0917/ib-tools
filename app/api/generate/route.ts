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

  const { subject, taskType, prompt, messages } = await req.json()
  
  if (!subject || !taskType || !prompt) {
    return new Response('Missing fields', { status: 400 })
  }
  if (prompt.length > 2000) {
    return new Response('Prompt too long (max 2000 characters)', { status: 400 })
  }

  // Get the base system prompt for the subject
  const baseSystemPrompt = getSubjectPrompt(subject, taskType)

  // Append strict formatting rules to ensure math doesn't break
  const strictInstructions = `
    IMPORTANT: You are a professional IB Tutor. 
    1. Language: Use perfect academic English. No gibberish or random tokens.
    2. Math: Use LaTeX for ALL math. 
       - Inline: $expression$ 
       - Block/Fractions: $$expression$$
    3. Output: Be concise and structured.
  `;

  // Construct messages: Ensure the system prompt is ALWAYS first
  const apiMessages = [
    { role: 'system', content: baseSystemPrompt + strictInstructions },
    ...(messages?.filter((m: any) => m.role !== 'system') || [{ role: 'user', content: `Task: ${taskType}\n\n${prompt}` }])
  ];

  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'IB Study Tools',
    },
    body: JSON.stringify({
      // Llama 3.1 is significantly more stable than the OSS-120B model
      model: 'meta-llama/llama-3.1-8b-instruct:free', 
      stream: true,
      messages: apiMessages,
      temperature: 0.5,     // Lowered further for maximum stability and math accuracy
      top_p: 1,
      max_tokens: 2000,
      repetition_penalty: 1.1 // Prevents the AI from getting stuck in loops
    }),
  })

  if (!aiResponse.ok) {
    const errText = await aiResponse.text()
    console.error('OpenRouter error:', errText)
    return new Response(errText, { status: aiResponse.status })
  }

  return new Response(aiResponse.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}