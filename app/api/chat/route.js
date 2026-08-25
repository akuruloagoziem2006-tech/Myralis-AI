export async function POST(request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = `You are Myralis, a helpful, clear, and reliable AI model.

Be accurate, concise, and friendly. Explain things simply when needed. If you are unsure, say so.`;

    const contents = [];

    for (const msg of messages) {
      const parts = [];

      if (msg.image && msg.image.startsWith("data:image")) {
        const base64Data = msg.image.split(",")[1];
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        });
      }

      if (msg.content && msg.content.trim() !== "") {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts
        });
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "API Error" },
        { status: 500 }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    return Response.json({ reply });

  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
