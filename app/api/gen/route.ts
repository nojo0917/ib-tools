import { NextResponse } from 'next/server';

export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { messages, fileData } = await req.json();

    // 1. Prepare the messages for the AI
    // We take the last message (the user's prompt) and turn it into a content array if there's an image
    const processedMessages = messages.map((msg: any, index: number) => {
      if (index === messages.length - 1 && fileData) {
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content },
            {
              type: "image_url",
              image_url: {
                url: fileData, // The Base64 string from the frontend
              },
            },
          ],
        };
      }
      return msg;
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ib-study-tools.vercel.app", 
        "X-Title": "IB Study Tools",
      },
      body: JSON.stringify({
        // SWITCHED TO A VISION MODEL: Gemini Flash is free/cheap and great at screenshots
        model: "google/gemini-flash-1.5-8b", 
        messages: processedMessages,
        stream: true,
        temperature: 0.5,
        max_tokens: 2000, 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}