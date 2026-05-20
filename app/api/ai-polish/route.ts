import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

async function fixGrammar(text: string): Promise<string> {
  try {
    const params = new URLSearchParams({ text, language: 'en-GB' })
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const data = await res.json()
    let corrected = text
    const matches = [...(data.matches || [])].reverse()
    for (const match of matches) {
      if (match.replacements && match.replacements.length > 0) {
        const before = corrected.slice(0, match.offset)
        const after = corrected.slice(match.offset + match.length)
        corrected = before + match.replacements[0].value + after
      }
    }
    return corrected
  } catch (e) {
    console.error('Grammar API Error:', e)
    return text 
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { success } = await checkRateLimit(user.id, 'ai-polish')
    if (!success) return new Response('Rate limit exceeded', { status: 429 })

    const { text, style } = await req.json()
    if (!text) return new Response('Missing text', { status: 400 })

    const POLISH_PROMPTS: Record<string, string> = {
      'Standard': 'Fix grammar and spelling. Keep the tone natural.',
      'Academic': 'Elevate vocabulary for an IB student. Use formal academic tone.',
      'Creative': 'Make the writing more descriptive and flow better.',
      'Professional': 'Make the text concise, clear, and business-formal.',
      'Simple': 'Use basic English but fix all grammatical errors.'
    }

    const stylePrompt = POLISH_PROMPTS[style] || POLISH_PROMPTS['Standard']

    const grammarFixed = await fixGrammar(text)

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'IB Study Tools',
      },
      body: JSON.stringify({
        // Swapping to a highly reliable free model
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: `${stylePrompt} Respond ONLY with the corrected text. No chat.` },
          { role: 'user', content: grammarFixed },
        ],
        temperature: 0.3, // Lower temperature keeps it closer to your original text
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      console.error('OpenRouter Error:', errorData)
      return new Response(JSON.stringify({ output: "AI Service busy. Try again." }), { status: 500 })
    }

    const data = await aiResponse.json()
    const output = data.choices?.[0]?.message?.content?.trim()

    if (!output) {
      return new Response(JSON.stringify({ output: "AI returned an empty response." }), { status: 500 })
    }

    return new Response(JSON.stringify({ output }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('Internal API Error:', err)
    return new Response(JSON.stringify({ output: "Server error occurred." }), { status: 500 })
  }
}