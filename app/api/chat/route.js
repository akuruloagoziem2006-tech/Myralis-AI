export async function POST(request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = `You are Myralis AI, a friendly, clear, and reliable AI companion.

Your personality:
- Warm, calm, and encouraging
- Clear and easy to understand
- Honest and accurate
- Patient and supportive

When the user sends an image, carefully look at it and answer based on what you actually see.
Never say you cannot see the image if one was provided.`;

    const contents = [];

    for (const msg of messages) {
      const parts = [];

      // Add image first if it exists
      if (msg.image && msg.image.startsWith("data:image")) {
        const base64Data = msg.image.split(",")[1];
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        });
      }

      // Add text
      if (msg.content && msg.content.trim() !== "") {
        parts.push({
          text: msg.content
        });
      }

      // Only add if there is at least one part
      if (parts.length > 0) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: parts
        });
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);
      return Response.json(
        { error: data.error?.message || "API Error" },
        { status: 500 }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    return Response.json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
