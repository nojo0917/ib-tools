import { NextResponse } from 'next/server';

// 1. THIS IS THE MAGIC LINE: Forces Vercel to stream instead of buffer
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
        model: "google/gemini-2.0-flash-exp:free", 
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    // 2. FORCING STREAM HEADERS: Tells the browser not to close the connection
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}