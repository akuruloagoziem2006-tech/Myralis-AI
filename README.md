# Myralis AI

**Myralis** is a personal AI assistant for learning, writing, planning, and everyday questions.

🌐 **Live web app:** https://myralis-ai.vercel.app  

📱 **Android APK:** https://github.com/akuruloagoziem2006-tech/Myralis-AI/releases/tag/apk-latest  

## Install

### Web (phone or laptop)
- Open https://myralis-ai.vercel.app
- **Android Chrome:** menu → Install app / Add to Home screen  
- **iPhone Safari:** Share → Add to Home Screen  
- **Laptop (Chrome/Edge):** Install app from the address bar  

### Android app (APK)
1. Open [Myralis Android APK (latest)](https://github.com/akuruloagoziem2006-tech/Myralis-AI/releases/tag/apk-latest)
2. Download **Myralis.apk**
3. Install on your phone (allow install from this source if prompted)

The Android app is a Capacitor shell that loads the live web app, so updates to the website apply without a new APK (for UI/features hosted on Vercel).

### iOS (native)
Native iOS uses the same Capacitor approach as Android and requires a **Mac + Xcode**.  
Point Capacitor at `https://myralis-ai.vercel.app`, then build in Xcode.  
See `android-app/capacitor.config.json` for the current app id / server URL pattern.

## Features

- Smart chat powered by Google Gemini
- Spider-Sense suggestion chips (follow-ups & typing)
- Quick-start prompts
- Conversation memory (browser storage)
- Voice input / text-to-speech
- Image understanding and live Vision mode
- Message actions: edit, copy, share, regenerate
- Past chats: pin, rename, delete
- Installable PWA + Android APK

## Tech stack

- **Web:** Next.js 14 (App Router), Vercel  
- **AI:** Google Gemini API  
- **Vision:** TensorFlow.js (COCO-SSD) + Gemini image analysis  
- **Android:** Capacitor (`android-app/`), GitHub Actions → APK  

## Run the web app locally

```bash
git clone https://github.com/akuruloagoziem2006-tech/Myralis-AI.git
cd Myralis-AI
npm install
Create .env.local:
GEMINI_API_KEY=your_api_key_here
# optional
VISION_API_KEY=your_vision_key
SENSE_API_KEY=your_sense_key
npm run dev
Open http://localhost:3000
Deploy web (Vercel)
Import this repo on vercel.com
Add env vars: GEMINI_API_KEY (and optional VISION_API_KEY, SENSE_API_KEY)
Deploy
Build Android APK
Automatic: push changes under android-app/ or run Actions → Build Android APK
Output: GitHub Release apk-latest → Myralis.apk
Author
Akurulo Agoziem
https://github.com/akuruloagoziem2006-tech
License
MIT
