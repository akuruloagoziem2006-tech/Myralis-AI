import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 10;

export async function POST(req) {
  try {
    const { messages } = await req.json();
    
    // Get the last user message
    const lastUser = messages.filter(m => m.role === 'user').pop();
    const userText = lastUser?.content || '';
    let imageData = lastUser?.image || null;

    // If there's an image, handle it with Gemini
    if (imageData) {
      if (imageData.includes(',')) {
        imageData = imageData.split(',')[1];
      }

      if (imageData.length > 4_000_000) {
        return NextResponse.json({
          reply: "Image too large. Please use a smaller image."
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: userText || "Describe what you see briefly." },
                { inline_data: { mime_type: "image/jpeg", data: imageData } }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                    "Could not analyze this image.";

      return NextResponse.json({ reply });
    }

    // Text-only conversation
    if (!userText) {
      return NextResponse.json({ reply: "Please ask me something." });
    }

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...history,
            { role: 'user', parts: [{ text: userText }] }
          ]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "I couldn't process that.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { reply: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
