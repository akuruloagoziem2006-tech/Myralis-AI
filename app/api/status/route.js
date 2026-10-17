export const dynamic = "force-dynamic";

function pick(name) {
  const specific = process.env[name];
  if (specific && specific.trim()) return { set: true, via: name };
  const fallback = process.env.GEMINI_API_KEY;
  if (fallback && fallback.trim()) return { set: true, via: "GEMINI_API_KEY (fallback)" };
  return { set: false, via: null };
}

export async function GET() {
  return Response.json({
    chat: pick("CHAT_API_KEY"),
    voice: pick("VOICE_API_KEY"),
    screen: pick("SCREEN_API_KEY"),
    sense: pick("SENSE_API_KEY")
  });
}
