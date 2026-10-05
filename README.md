# Myralis AI

**Myralis** is a personal AI assistant for learning, writing, planning, and everyday questions.

🌐 **Live:** https://myralis-ai.vercel.app

## Features

- Smart chat powered by Google Gemini
- Quick-start prompt chips
- Conversation memory (browser localStorage)
- Voice input / text-to-speech (with stop control)
- Image understanding and live Vision mode
- Message actions: edit, copy, share, regenerate
- Past chats: pin, rename, delete
- Installable PWA
- Responsive on phone, tablet, and desktop

## Tech stack

- Next.js 14 (App Router)
- Google Gemini API
- TensorFlow.js (COCO-SSD) for on-device detection
- Vercel
- react-markdown + remark-gfm

## Run locally

```bash
git clone https://github.com/akuruloagoziem2006-tech/Myralis-AI.git
cd Myralis-AI
npm install
Create .env.local:
GEMINI_API_KEY=your_api_key_here
npm run dev
Open http://localhost:3000
Deploy on Vercel
Import this GitHub repo on vercel.com
Add GEMINI_API_KEY
Deploy
Author
Akurulo Agoziem
https://github.com/akuruloagoziem2006-tech
License
MIT
