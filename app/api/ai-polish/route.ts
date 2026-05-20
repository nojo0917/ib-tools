import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ output: 'Please login again' }), { status: 401 })

    // Basic rate limit check
    const { success } = await checkRateLimit(user.id, 'ai-polish')
    if (!success) return new Response(JSON.stringify({ output: 'Rate limit exceeded' }), { status: 429 })

    const { text, style } = await req.json()

    const POLISH_PROMPTS: Record<string, string> = {
      'Standard': 'Fix grammar and flow.',
      'Academic': 'Use formal IB academic vocabulary.',
      'Creative': 'Make the writing more descriptive.',
      'Professional': 'Make it concise and professional.',
      'Simple': 'Use clear, basic English.'
    }

    const stylePrompt = POLISH_PROMPTS[style] || POLISH_PROMPTS['Standard']

    // Direct fetch to OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [
          { role: 'system', content: `${stylePrompt} Return only the corrected text.` },
          { role: 'user', content: text },
        ],
      }),
    })

    const data = await aiResponse.json()
    
    // Log this to your terminal so you can see the error!
    if (data.error) {
      console.error('OpenRouter API Error:', data.error)
      return new Response(JSON.stringify({ output: `API Error: ${data.error.message}` }), { status: 500 })
    }

    const output = data.choices?.[0]?.message?.content || 'No response from AI.'
    return new Response(JSON.stringify({ output }), { status: 200 })

  } catch (err: any) {
    console.error('Polish Route Error:', err)
    return new Response(JSON.stringify({ output: 'Server Error. Check your console.' }), { status: 500 })
  }
}