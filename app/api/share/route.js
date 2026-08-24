import { NextResponse } from 'next/server';

export const runtime = 'edge';

// In-memory store (would use database in production)
const sharedChats = new Map();

export async function POST(req) {
  try {
    const { messages, title, systemPrompt } = await req.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages to share' }, { status: 400 });
    }

    const shareId = Math.random().toString(36).substring(2, 10);
    const shareData = {
      id: shareId,
      title: title || 'Shared Chat',
      messages: messages,
      systemPrompt: systemPrompt || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    sharedChats.set(shareId, shareData);

    return NextResponse.json({
      shareId,
      url: `${process.env.NEXT_PUBLIC_URL || 'https://myralis-ai.vercel.app'}/share/${shareId}`
    });
  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.json({ error: 'Failed to share' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
    }

    const shareData = sharedChats.get(id);
    
    if (!shareData) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 });
    }

    if (shareData.expiresAt < Date.now()) {
      sharedChats.delete(id);
      return NextResponse.json({ error: 'Share expired' }, { status: 410 });
    }

    return NextResponse.json(shareData);
  } catch (error) {
    console.error('Fetch share error:', error);
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 });
  }
}
