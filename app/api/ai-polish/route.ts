import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new Response(JSON.stringify({ output: 'Please login again' }), { status: 401 })
    }

    const { success } = await checkRateLimit(user.id, 'ai-polish')
    if (!success) {
      return new Response(JSON.stringify({ output: 'Rate limit exceeded. Try again later.' }), { status: 429 })
    }

    const { text, style } = await req.json()

    const POLISH_PROMPTS: Record<string, string> = {
      'Standard': 'Fix grammar and flow.',
      'Academic': 'Use formal IB academic vocabulary.',
      'Creative': 'Make the writing more descriptive.',
      'Professional': 'Make it concise and professional.',
      'Simple': 'Use clear, basic English.'
    }

    const stylePrompt = POLISH_PROMPTS[style] || POLISH_PROMPTS['Standard']

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'IB Study Tools',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free', // Reverted to your working model
        messages: [
          { 
            role: 'system', 
            content: `${stylePrompt} Return only the corrected text. Do not add any conversational filler, introductory remarks, or quotes.` 
          },
          { role: 'user', content: text },
        ],
        temperature: 0.4,
      }),
    })

    const data = await aiResponse.json()
    
    // Check for OpenRouter specific errors
    if (!aiResponse.ok || data.error) {
      const errorMsg = data.error?.message || data.error || 'OpenRouter Error'
      console.error('AI Error:', errorMsg)
      return new Response(JSON.stringify({ output: `AI Error: ${errorMsg}` }), { status: 500 })
    }

    const output = data.choices?.[0]?.message?.content || 'No response from AI.'
    return new Response(JSON.stringify({ output }), { status: 200 })

  } catch (err: any) {
    console.error('Polish Route Error:', err)
    return new Response(JSON.stringify({ output: 'Internal Server Error' }), { status: 500 })
  }
}