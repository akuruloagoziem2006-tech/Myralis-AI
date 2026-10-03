# Myralis AI

**Myralis** is a personal AI assistant for learning, writing, planning, and everyday questions.

🌐 **Live:** https://myralis-ai.vercel.app

## Features

- Smart chat powered by Google Gemini
- Quick-start prompt chips
- Conversation memory (saved in your browser)
- Voice input and text-to-speech
- Image understanding and live Vision mode
- Message actions: edit, copy, share, regenerate
- Past chats with pin, rename, and delete
- Installable PWA (Add to Home Screen)
- Responsive on phone, tablet, and desktop

## Tech stack

- **Frontend:** Next.js 14 (App Router)
- **AI:** Google Gemini API
- **Vision:** TensorFlow.js (COCO-SSD)
- **Deploy:** Vercel
- **Markdown:** react-markdown + remark-gfm

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
Import this repo on vercel.com
Add environment variable GEMINI_API_KEY
Deploy
Author
Akurulo Agoziem
GitHub: akuruloagoziem2006-tech
License
MIT
