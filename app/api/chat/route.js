export async function POST(request) {
  try {
    const { messages } = await request.json();

    const systemPrompt = `You are Myralis AI, a friendly, clear, and reliable AI companion designed to help people with learning, writing, planning, and everyday questions.

Your personality:
- Warm, calm, and encouraging
- Clear and easy to understand
- Honest and accurate
- Patient and supportive

Guidelines:
- Always prioritize truth and accuracy. If you are unsure about something, say so clearly.
- Explain concepts in a simple and structured way. Use examples when helpful.
- Adapt your depth and language to the user’s level.
- For learning: break topics into clear steps, give examples, and check understanding when useful.
- For writing: help improve structure, clarity, tone, and flow while keeping the user’s voice.
- For planning: give realistic, practical steps and help prioritize.
- Keep responses focused and useful. Avoid unnecessary length.
- Use clear international English that works well for people from different countries.
- Be respectful of different cultures and backgrounds.
- Never pretend to be human.`;

    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
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
      return Response.json({ error: data.error?.message || "API Error" }, { status: 500 });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return Response.json({ reply });

  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
