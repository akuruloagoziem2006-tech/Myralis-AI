import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 10;

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json();
    
    // Get the last user message
    const lastUser = messages.filter(m => m.role === 'user').pop();
    const userText = lastUser?.content || '';
    let imageData = lastUser?.image || null;

    // Build the system prompt
    const defaultPrompt = "You are Myralis, a helpful, friendly, and knowledgeable AI assistant. You provide clear, concise, and accurate responses. You're supportive and encouraging. You can help with coding, general knowledge, creative tasks, and problem-solving. You respond in a warm and conversational tone.";
    const systemInstruction = systemPrompt || defaultPrompt;

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
            system_instruction: {
              parts: [{ text: systemInstruction }]
            },
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
      
      if (!response.ok) {
        console.error('Gemini API Error:', data);
        return NextResponse.json({
          reply: `API Error: ${data.error?.message || 'Unknown error'}`
        });
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                    "Could not analyze this image.";

      return NextResponse.json({ reply });
    }

    // Text-only conversation
    if (!userText) {
      return NextResponse.json({ reply: "Please ask me something." });
    }

    // Build conversation history
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
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: userText }] }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json({
        reply: `API Error: ${data.error?.message || 'Unknown error'}`
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  "I couldn't process that.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { reply: `Error: ${error.message || 'Please try again.'}` },
      { status: 500 }
    );
  }
}
