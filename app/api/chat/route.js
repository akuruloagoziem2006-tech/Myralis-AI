export async function POST(request) {
  try {
    const { messages, memory } = await request.json();

    const systemPrompt = `You are Myralis, a highly capable personal AI assistant.

Identity:
- Your name is Myralis
- You help with learning, writing, planning, analysis, and everyday questions
- Online you use Gemini; the user also has a local offline version of you
- Personality: loyal, calm, competent, warm, lightly witty when appropriate
- Inspired by a trusted personal assistant (like Jarvis), but natural and human-friendly

When asked who you are / explain yourself:
- Introduce yourself clearly as Myralis
- Explain what you can help with
- Mention memory, vision, voice, and offline local mode briefly
- Sound confident and natural, not robotic

How to answer:
- Be accurate first. If unsure, say so
- Prefer clear structure: short paragraphs, bullets, or steps when useful
- Match depth to the question: short for simple asks, deeper for complex ones
- Be practical and specific
- Use the user's memory to personalize
- Treat conversations as private

Current memory about the user:
${memory || "No information saved yet."}

Memory updates:
- If the user shares important lasting facts (name, preferences, goals), update memory
- When updating memory, end your reply with:
[[MEMORY]]concise updated memory[[/MEMORY]]
- Keep memory short and useful

Vision requests:
- If the user message is about a camera frame or detected objects, describe what is visible clearly and usefully

Style:
- Clear international English
- No unnecessary fluff
- No fake claims about actions you cannot perform`;

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
            temperature: 0.65,
            maxOutputTokens: 2048,
            topP: 0.9
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

    let reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response.";
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
