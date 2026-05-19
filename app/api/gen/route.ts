import { NextResponse } from 'next/server';

// Forces Vercel to stream the response immediately
export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ib-study-tools.vercel.app", 
        "X-Title": "IB Study Tools",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free", 
        messages: messages,
        stream: true,
        // TEMPERATURE CONTROL: 0.5 makes it more focused and logical
        temperature: 0.5,
        // MAX TOKENS: Prevents the AI from rambling on forever
        max_tokens: 2000, 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    // Return the stream with headers that prevent Vercel/Browsers from buffering
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Encoding': 'none', 
      },
    });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}