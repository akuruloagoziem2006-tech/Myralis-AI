export const VOICE_STYLES = {
  warm: { label: "Warm", rate: 0.95, pitch: 0.95 },
  bright: { label: "Bright", rate: 1.2, pitch: 1.35 },
  deep: { label: "Deep", rate: 0.85, pitch: 0.6 },
  calm: { label: "Calm", rate: 0.8, pitch: 1.05 }
};

export function getVoicePrefs() {
  try {
    const v = JSON.parse(localStorage.getItem("myralis_voice") || "{}");
    const preset = VOICE_STYLES[v.style] || VOICE_STYLES.warm;
    return { style: v.style || "warm", rate: preset.rate, pitch: preset.pitch, voice: v.name || "" };
  } catch {
    return { style: "warm", rate: 0.95, pitch: 0.95, voice: "" };
  }
}
