import { NextResponse } from 'next/server';

// Edge runtime is perfect for streaming and global low-latency
export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    const { messages, fileData } = await req.json();

    // Reconstruct messages to handle different file types (Vision vs Text)
    const processedMessages = messages.map((msg: any, index: number) => {
      // Only attach the file to the VERY LAST message from the user
      if (index === messages.length - 1 && fileData) {
        
        // CASE 1: The file is an image (Base64)
        if (fileData.startsWith('data:image')) {
          return {
            role: "user",
            content: [
              { type: "text", text: msg.content || "Analyze this image for me." },
              {
                type: "image_url",
                image_url: {
                  url: fileData, // The Base64 string
                },
              },
            ],
          };
        } 
        
        // CASE 2: The file is a PDF (Plain Text from the frontend)
        else {
          return {
            role: "user",
            content: `${msg.content}\n\n[ATTACHED DOCUMENT CONTENT]:\n${fileData}`,
          };
        }
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
        // Gemini 1.5 Flash 8B is the best "bang for buck" for OCR and screenshots
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

    // Return the raw stream directly to the frontend
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