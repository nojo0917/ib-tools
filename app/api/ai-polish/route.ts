import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
// We will define the prompts directly or ensure they match your new names
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
    return text // Fallback to original text if LanguageTool fails
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Updated rate limit key to match the new tool name
  const { success } = await checkRateLimit(user.id, 'ai-polish')
  if (!success) return new Response('Rate limit exceeded', { status: 429 })

  const { text, style } = await req.json()
  if (!text || !style) return new Response('Missing fields', { status: 400 })

  // Define the Polish prompts here to ensure they match your frontend button names exactly
  const POLISH_PROMPTS: Record<string, string> = {
    'Standard': 'You are an expert editor. Fix grammar, spelling, and punctuation while keeping the tone natural and unchanged.',
    'Academic': 'Refine this text for an IB Diploma level. Improve vocabulary and formal structure while maintaining the original argument.',
    'Creative': 'Polish this text to be more engaging and descriptive while fixing all grammatical errors.',
    'Professional': 'Rewrite this text to be concise, clear, and formal. Ideal for professional communications.',
    'Simple': 'Fix the grammar but ensure the language is very simple and easy to understand.'
  }

  const stylePrompt = POLISH_PROMPTS[style]
  
  // This was causing your "Invalid style" error - we now use a fallback
  if (!stylePrompt) {
    console.error(`Style received: ${style} - Not found in POLISH_PROMPTS`)
    return new Response('Invalid style selected', { status: 400 })
  }

  const grammarFixed = await fixGrammar(text)

  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      // Using a valid, reliable free model name
      model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
      messages: [
        { 
          role: 'system', 
          content: `${stylePrompt} Respond ONLY with the polished text. Do not include introductions like "Here is your text" or conversational filler.` 
        },
        { role: 'user', content: grammarFixed },
      ],
    }),
  })

  // IMPORTANT: Since you are using "result" in your frontend and not a stream reader, 
  // let's return a standard JSON response instead of a stream to keep it simple,
  // OR keep the stream if your frontend is built to handle it.
  
  // If your frontend uses: const data = await res.json(); setResult(data.output);
  // Use this block:
  const data = await aiResponse.json()
  const output = data.choices?.[0]?.message?.content || 'Error polishing text.'
  
  return new Response(JSON.stringify({ output }), {
    headers: { 'Content-Type': 'application/json' },
  })
}