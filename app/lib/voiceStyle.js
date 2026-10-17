export function getVoicePrefs() {
  try {
    const v = JSON.parse(localStorage.getItem("myralis_voice") || "{}");
    return { rate: 1.0, pitch: 1.0, voice: v.name || "" };
  } catch {
    return { rate: 1.0, pitch: 1.0, voice: "" };
  }
}
