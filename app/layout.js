export const metadata = {
  title: "Myralis AI",
  description: "Your helpful AI model for learning, writing, planning, and everyday questions.",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Myralis",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ margin: 0, background: "#09090b" }}>
        {children}
      <script dangerouslySetInnerHTML={{ __html: NATIVE_VOICE }} />
      </body>
    </html>
  );
}


const NATIVE_VOICE = String.raw`(function(){
  try {
    var C = window.Capacitor;
    if (!C || !(C.isNativePlatform && C.isNativePlatform())) return;
    var T = C.Plugins && C.Plugins.TextToSpeech;
    function clean(t){
      return String(t || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/Sources:[\s\S]*$/, "").replace(/[*_#~>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 3500);
    }
    window.SpeechSynthesisUtterance = function(text){
      this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.lang = "en-US"; this.voice = null;
    };
    var shim = {
      speaking: false, pending: false, paused: false,
      getVoices: function(){ return []; },
      cancel: function(){ try { if (T) T.stop(); } catch (e) {} },
      speak: function(u){
        if (!T) { alert("Native TTS plugin missing. Plugins: " + Object.keys(C.Plugins || {}).join(", ")); return; }
        var t = clean(u && u.text);
        if (!t) return;
        try { T.stop(); } catch (e) {}
        T.speak({ text: t, lang: (u && u.lang) || "en-US", rate: (u && u.rate) || 1, pitch: (u && u.pitch) || 1, volume: (u && u.volume) || 1 })
          .catch(function(e){ alert("TTS error: " + ((e && e.message) || e)); });
      },
      addEventListener: function(){}, removeEventListener: function(){}
    };
    Object.defineProperty(window, "speechSynthesis", { value: shim, configurable: true });
  } catch (e) {}
})();`;
