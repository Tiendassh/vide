import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, addConnectionLog, incrementRequestCount, BotVideo } from "@/lib/serverDb";

export const dynamic = 'force-dynamic';

// Helper to extract embed url (same logic as client-side)
function getEmbedUrl(rawUrl: string): string | null {
  let url = rawUrl.trim();
  
  // Extract URL from iframe if present
  if (url.includes('<iframe') || url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    }
  }

  // YouTube Shorts support
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts[1]) {
      const id = parts[1].split(/[?&#]/)[0];
      if (id && id.length === 11) {
        return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&modestbranding=1&enablejsapi=1`;
      }
    }
  }

  // YouTube matchers
  const ytReg1 = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
  const ytMatch1 = url.match(ytReg1);
  if (ytMatch1 && ytMatch1[1]) {
    return `https://www.youtube.com/embed/${ytMatch1[1]}?autoplay=1&mute=0&modestbranding=1&enablejsapi=1`;
  }

  // Vimeo matchers
  const vimeoReg = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i;
  const vimeoMatch = url.match(vimeoReg);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Twitch support
  if (url.includes('twitch.tv/')) {
    const parts = url.split('twitch.tv/');
    if (parts[1]) {
      const channelOrVideo = parts[1].split(/[?&#]/)[0];
      if (channelOrVideo) {
        const isTwitchVideo = channelOrVideo.startsWith('videos/');
        if (isTwitchVideo) {
          const videoId = channelOrVideo.substring(7);
          return `https://player.twitch.tv/?video=${videoId}&autoplay=true`;
        } else {
          return `https://player.twitch.tv/?channel=${channelOrVideo}&autoplay=true`;
        }
      }
    }
  }

  // Already an embed url
  if (url.includes('/embed/') || url.includes('player.vimeo.com/video/')) {
    return url;
  }

  // Simple validation for generic video links
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  incrementRequestCount();

  try {
    const body = await req.json();
    
    // Parse message info from Telegram payload
    const message = body.message || body.edited_message;
    if (!message) {
      addConnectionLog(
        'BOT_WRITE',
        'ERROR',
        'Webhook recibido con formato inválido (sin mensaje)',
        Date.now() - startTime
      );
      return NextResponse.json({ success: false, error: 'Invalid update body' }, { status: 400 });
    }

    const chatId = message.chat?.id;
    const fromUser = message.from?.username || message.from?.first_name || 'Usuario_Telegram';
    const rawText = (message.text || '').trim();

    if (!rawText) {
      addConnectionLog(
        'BOT_WRITE',
        'ERROR',
        `Mensaje vacío de @${fromUser} (Chat: ${chatId})`,
        Date.now() - startTime
      );
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "⚠️ No puedo procesar mensajes vacíos. Por favor envíame un enlace de vídeo o código embed de iframe."
      });
    }

    // Handle commands
    if (rawText.startsWith('/start') || rawText.startsWith('/help')) {
      addConnectionLog(
        'BOT_WRITE',
        'SUCCESS',
        `Comando /start o /help procesado para @${fromUser}`,
        Date.now() - startTime
      );
      
      const welcomeText = `¡Bienvenido al Bot de la Red Nocturna! ⚡\n\n` +
                          `He conectado de forma segura con la Base de Datos del servidor.\n\n` +
                          `📌 ¿Cómo inyectar videos en la página?\n` +
                          `• Envíame directamente un enlace de YouTube o Vimeo.\n` +
                          `• O envíame el código HTML embed de iframe completo.\n` +
                          `• O usa el comando: /add [enlace] [título opcional]\n\n` +
                          `Los videos agregados se sincronizan de inmediato y se reproducen en vivo en el reproductor web.`;

      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: welcomeText
      });
    }

    if (rawText.startsWith('/status')) {
      const db = getDb();
      addConnectionLog(
        'BOT_WRITE',
        'SUCCESS',
        `Consulta de estado de base de datos desde @${fromUser}`,
        Date.now() - startTime
      );

      const statusText = `🌐 CONEXIÓN ESTADO: ACTIVA 🟢\n` +
                         `📂 Servidor: Cloud Run (Node.js)\n` +
                         `📦 Base de Datos: Local Server Store\n` +
                         `📼 Videos en la red: ${db.videos.length}\n` +
                         `🔌 Logs de Sincronización: ${db.logs.length}\n` +
                         `⏳ Uptime del Proceso: ${Math.floor(process.uptime())}s\n` +
                         `⚡ Conexiones Totales: ${db.serverRequests}`;

      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: statusText
      });
    }

    // Try to parse video link / embed code
    let videoUrlInput = rawText;
    let titleInput = '';

    if (rawText.startsWith('/add')) {
      const parts = rawText.split(' ');
      if (parts.length < 2) {
        return NextResponse.json({
          method: "sendMessage",
          chat_id: chatId,
          text: "⚠️ Formato incorrecto. Uso: /add [enlace] [título opcional]"
        });
      }
      videoUrlInput = parts[1];
      titleInput = parts.slice(2).join(' ');
    }

    const embedUrl = getEmbedUrl(videoUrlInput);
    if (!embedUrl) {
      addConnectionLog(
        'BOT_WRITE',
        'ERROR',
        `Enlace no soportado de @${fromUser}: "${rawText.substring(0, 50)}"`,
        Date.now() - startTime
      );
      return NextResponse.json({
        method: "sendMessage",
        chat_id: chatId,
        text: "❌ No reconozco ese formato de vídeo. Por favor, asegúrate de enviar un enlace válido de YouTube, Vimeo, o su código iframe embed."
      });
    }

    // Save to server database
    const db = getDb();
    const finalTitle = titleInput.trim() || `Vídeo Bot por @${fromUser}`;
    
    const newVideo: BotVideo = {
      id: 'bot-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      title: finalTitle,
      url: embedUrl,
      author: `@${fromUser}`,
      category: 'Inyectado por Bot 🤖',
      description: `Transmitido remotamente desde Telegram por @${fromUser} hacia la consola principal.`,
      isCustom: true,
      addedAt: new Date().toISOString(),
      source: 'bot'
    };

    db.videos.push(newVideo);
    saveDb(db);

    // Add connection log
    addConnectionLog(
      'BOT_WRITE',
      'SUCCESS',
      `Vídeo "${finalTitle}" inyectado exitosamente vía Telegram bot por @${fromUser}`,
      Date.now() - startTime
    );

    const successMessage = `✅ ¡INYECCIÓN COMPLETA! 📼\n\n` +
                           `🎬 Título: ${finalTitle}\n` +
                           `🌐 Origen: @${fromUser}\n` +
                           `📦 Base de Datos: Sincronizada\n\n` +
                           `El vídeo ya está disponible en vivo en la Red Nocturna de forma invisible.`;

    // Try to trigger a fetch request back to Telegram if a token is configured (optional background flow)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: successMessage
          })
        });
      } catch (err) {
        console.error('Error sending outgoing telegram message:', err);
      }
    }

    return NextResponse.json({
      method: "sendMessage",
      chat_id: chatId,
      text: successMessage
    });
  } catch (error: any) {
    addConnectionLog(
      'BOT_WRITE',
      'ERROR',
      `Fallo en procesamiento del webhook del Bot: ${error.message || 'Error desconocido'}`,
      Date.now() - startTime
    );
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
