import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, addConnectionLog, incrementRequestCount, BotVideo, TelegramFeedPost, LiveChatMessage, DirectMessage } from "@/lib/serverDb";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('GET /api/videos called');
  const startTime = Date.now();
  incrementRequestCount();

  try {
    const db = getDb();
    
    // Add health check/sync connection log
    addConnectionLog(
      'SYNC', 
      'SUCCESS', 
      'Sincronización general del cliente web (Videos, Telegram Feed, Chat, Inbox)', 
      Date.now() - startTime
    );

    return NextResponse.json({
      success: true,
      videos: db.videos,
      logs: db.logs,
      serverRequests: db.serverRequests,
      telegramUrl: db.telegramUrl || 'https://t.me/+8tGCFc_J0eoxOWEx',
      telegramFeed: db.telegramFeed || [],
      inboxMessages: db.inboxMessages || [],
      chatMessages: db.chatMessages || [],
      status: 'HEALTHY',
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN
    });
  } catch (error: any) {
    addConnectionLog(
      'SYNC', 
      'ERROR', 
      `Fallo en la sincronización del cliente: ${error.message || 'Error desconocido'}`, 
      Date.now() - startTime
    );
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  incrementRequestCount();

  try {
    const body = await req.json();
    const action = body.action || 'addVideo'; // Fallback to original video addition behavior

    const db = getDb();

    if (action === 'addVideo') {
      const { title, url, author, category, description } = body;
      if (!url) {
        addConnectionLog(
          'WEB_WRITE',
          'ERROR',
          'Intento de inyección de video fallido: URL vacía',
          Date.now() - startTime
        );
        return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
      }

      const newVideo: BotVideo = {
        id: 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        title: title || `Vídeo Secreto #${db.videos.length + 1}`,
        url: url,
        author: author || 'Explorador Nocturno',
        category: category || 'Infiltrado / Secreto 🔒',
        description: description || 'Video integrado mediante canal invisible de inyección directa.',
        isCustom: true,
        addedAt: new Date().toISOString(),
        source: 'web'
      };

      db.videos.push(newVideo);
      saveDb(db);

      addConnectionLog(
        'WEB_WRITE',
        'SUCCESS',
        `Vídeo "${newVideo.title}" inyectado exitosamente desde la web`,
        Date.now() - startTime
      );

      return NextResponse.json({ success: true, video: newVideo });
    }

    if (action === 'updateTelegramUrl') {
      const { telegramUrl } = body;
      if (!telegramUrl) {
        return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
      }
      db.telegramUrl = telegramUrl;
      saveDb(db);
      addConnectionLog(
        'TELEGRAM_WRITE',
        'SUCCESS',
        `Grupo/Canal de Telegram asociado actualizado a: ${telegramUrl}`,
        Date.now() - startTime
      );
      return NextResponse.json({ success: true, telegramUrl });
    }

    if (action === 'addTelegramPost') {
      const { senderName, senderUsername, text } = body;
      if (!text) {
        return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
      }
      const newPost: TelegramFeedPost = {
        id: 'feed-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        senderName: senderName || 'Anónimo',
        senderUsername: senderUsername || 'anon_nox',
        text: text,
        timestamp: new Date().toISOString(),
        likes: 0
      };
      if (!db.telegramFeed) db.telegramFeed = [];
      db.telegramFeed.unshift(newPost);
      saveDb(db);
      addConnectionLog(
        'TELEGRAM_WRITE',
        'SUCCESS',
        `Nueva publicación en el Feed de Telegram por @${senderUsername}`,
        Date.now() - startTime
      );
      return NextResponse.json({ success: true, post: newPost });
    }

    if (action === 'addChatMessage') {
      const { sender, text, avatarColor } = body;
      if (!text) {
        return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
      }
      const newMessage: LiveChatMessage = {
        id: 'chat-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        sender: sender || 'Invitado',
        text: text,
        timestamp: new Date().toISOString(),
        avatarColor: avatarColor || 'bg-slate-600'
      };
      if (!db.chatMessages) db.chatMessages = [];
      db.chatMessages.push(newMessage);
      // Keep last 150 chat messages
      if (db.chatMessages.length > 150) {
        db.chatMessages = db.chatMessages.slice(-150);
      }
      saveDb(db);
      addConnectionLog(
        'CHAT_WRITE',
        'SUCCESS',
        `Mensaje de chat en vivo de ${sender}`,
        Date.now() - startTime
      );
      return NextResponse.json({ success: true, message: newMessage });
    }

    if (action === 'addInboxMessage') {
      const { sender, recipient, text } = body;
      if (!text || !recipient) {
        return NextResponse.json({ success: false, error: 'Recipient and text are required' }, { status: 400 });
      }
      const newMessage: DirectMessage = {
        id: 'inbox-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        sender: sender || 'invitado',
        recipient: recipient,
        text: text,
        timestamp: new Date().toISOString()
      };
      if (!db.inboxMessages) db.inboxMessages = [];
      db.inboxMessages.push(newMessage);
      saveDb(db);
      addConnectionLog(
        'INBOX_WRITE',
        'SUCCESS',
        `Mensaje privado enviado de ${sender} a ${recipient}`,
        Date.now() - startTime
      );
      return NextResponse.json({ success: true, message: newMessage });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    addConnectionLog(
      'WEB_WRITE',
      'ERROR',
      `Error de backend POST: ${error.message || 'Error desconocido'}`,
      Date.now() - startTime
    );
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
