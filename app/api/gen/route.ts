import { NextResponse } from 'next/server';

export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { messages, fileData } = await req.json();

    const processedMessages = messages.map((msg: any, index: number) => {
      // Attach file data only to the latest user message
      if (index === messages.length - 1 && fileData) {
        
        // If it's a PDF (sent as plain text from the frontend)
        if (!fileData.startsWith('data:image')) {
          return {
            role: "user",
            content: `${msg.content}\n\n[DOCUMENT CONTENT]:\n${fileData}`,
          };
        } 
        
        // If it's an image, this model is blind to it.
        // We ignore the image data to save tokens and prevent confusion.
        return {
          role: "user",
          content: msg.content,
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
        model: "openai/gpt-oss-120b:free", 
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