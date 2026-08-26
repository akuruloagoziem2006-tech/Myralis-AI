# Myralis AI

**Myralis** is a modern AI assistant powered by Google Gemini.  
A clean, fast web app that works great on mobile and desktop.

🌐 **Live Demo:** [https://myralis-ai.vercel.app](https://myralis-ai.vercel.app)

---

## Features

- Clean dark interface inspired by modern AI chat apps
- Conversation memory (saved in the browser)
- Speech-to-Text and Text-to-Speech
- Image understanding (upload or camera)
- Message actions: Edit, Copy, Share, Like, Regenerate
- Past conversations with Pin, Rename, and Delete
- Progressive Web App (PWA) — installable on home screen
- Fully responsive (phone, tablet, and laptop)

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **AI:** Google Gemini API
- **Deployment:** Vercel
- **Markdown:** react-markdown + remark-gfm

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/akuruloagoziem2006-tech/myralis-ai.git
cd myralis-ai
2. Install dependencies
npm install
3. Add your Gemini API Key
Create a file named .env.local in the root folder:
GEMINI_API_KEY=your_api_key_here
Get a free API key from Google AI Studio.
4. Run locally
npm run dev
Open http://localhost:3000
Deploy on Vercel
Push the project to GitHub
Import the repository on vercel.com
Add the environment variable GEMINI_API_KEY
Deploy
Project Structure
├── app/
│   ├── api/chat/route.js     # Gemini API route
│   ├── layout.js             # Root layout + PWA meta
│   └── page.js               # Main chat interface
├── public/
│   ├── manifest.json         # PWA manifest
│   └── icons/                # App icons
└── package.json
Author
Akurulo Agoziem
GitHub: akuruloagoziem2006-tech
License
MIT
