import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional, for OpenRouter rankings
        "X-Title": "IB Study Tools", 
      },
      body: JSON.stringify({
        // Switching to Gemini 2.0 Flash Free - highly reliable and fast
        model: "google/gemini-2.0-flash-exp:free", 
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return new NextResponse(
        JSON.stringify({ error: "The AI service is currently busy. Please try again." }), 
        { status: response.status }
      );
    }

    // Return the stream directly to the frontend
    return new NextResponse(response.body);

  } catch (error) {
    console.error("Internal Server Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to connect to the AI." }), 
      { status: 500 }
    );
  }
}