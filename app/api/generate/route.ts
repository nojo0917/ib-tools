import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      return new NextResponse(JSON.stringify({ error: "API Key missing" }), { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "IB Study Tools",
      },
      body: JSON.stringify({
        // Gemini 2.0 Flash is extremely stable for free users
        model: "google/gemini-2.0-flash-exp:free", 
        messages: messages,
        stream: true,
      }),
    });

    // 2. Log error if the API fails
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error Details:", errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    // 3. Return the raw stream
    return new NextResponse(response.body);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}