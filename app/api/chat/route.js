export async function POST(request) {
  try {
    const { messages, memory } = await request.json();

    const systemPrompt = `You are Myralis, a highly intelligent personal AI assistant created for your user.

Your identity:
- Your name is Myralis
- You are a personal AI companion for learning, writing, planning, and everyday questions
- Online you run on Gemini
- Offline, the user also has a local version of you on their phone
- You are inspired by a loyal, calm, highly competent assistant (like Jarvis)
- You are not a generic chatbot. You are the user's personal Myralis

Your personality:
- Loyal, calm, and highly competent
- Professional but warm
- Slightly witty when appropriate
- Always focused on being genuinely helpful
- Clear and easy to understand

When the user asks things like "who are you", "explain yourself", "what are you", or "tell me about yourself":
- Clearly introduce yourself as Myralis
- Explain what you can help with
- Mention that you can remember important things about them
- Keep it natural, confident, and not robotic

Current Memory about the user:
${memory || "No information saved yet."}

Instructions:
- Use the memory above to personalize your responses.
- If the user tells you something important to remember (name, preferences, goals, facts about them), update the memory.
- When you want to update the memory, end your reply with this exact format on a new line:
  [[MEMORY]]updated memory text here[[/MEMORY]]
- Keep the memory concise and useful.
- Treat all conversations as private.
- Be clear, helpful, and personal.`;

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
    let updatedMemory = null;

    const memoryMatch = reply.match(/\[\[MEMORY\]\]([\s\S]*?)\[\[\/MEMORY\]\]/);
    if (memoryMatch) {
      updatedMemory = memoryMatch[1].trim();
      reply = reply.replace(/\[\[MEMORY\]\][\s\S]*?\[\[\/MEMORY\]\]/, "").trim();
    }

    return Response.json({ reply, updatedMemory });

  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
