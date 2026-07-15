import { NextRequest, NextResponse } from "next/server";
import { roomsStore, generateRoomId, cleanStaleRooms, CoWatchingRoom, RoomMessage, WebRTCSignal } from "@/lib/roomStore";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Clear any old idle rooms first to keep server memory clean
  cleanStaleRooms();
  
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId')?.toUpperCase();

  if (!roomId) {
    return NextResponse.json({ success: false, error: "Falta el ID de la sala" }, { status: 400 });
  }

  const room = roomsStore[roomId];
  if (!room) {
    return NextResponse.json({ success: false, error: "La sala especificada no existe" }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}

export async function POST(req: NextRequest) {
  try {
    cleanStaleRooms();
    
    const body = await req.json();
    const { action, roomId, username, videoState, text, signal } = body;

    const normRoomId = roomId ? roomId.toUpperCase() : '';

    // 1. CREATE ROOM
    if (action === 'create') {
      if (!username) {
        return NextResponse.json({ success: false, error: "Nombre de usuario es requerido" }, { status: 400 });
      }

      const newId = generateRoomId();
      const newRoom: CoWatchingRoom = {
        roomId: newId,
        videoState: {
          url: videoState?.url || '',
          title: videoState?.title || '',
          playing: videoState?.playing || false,
          currentTime: videoState?.currentTime || 0,
          lastUpdated: Date.now(),
          sender: username
        },
        participants: [
          { username, lastActive: Date.now() }
        ],
        messages: [
          {
            id: 'system-' + Date.now(),
            sender: 'Sistema',
            text: `Sala de Co-reproducción creada. Código: ${newId}. Comparte este código con tu amigo para ver videos juntos y hablar por micrófono.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ],
        signals: [],
        createdAt: Date.now()
      };

      roomsStore[newId] = newRoom;
      return NextResponse.json({ success: true, room: newRoom });
    }

    // 2. JOIN ROOM
    if (action === 'join') {
      if (!normRoomId) {
        return NextResponse.json({ success: false, error: "Código de sala es requerido" }, { status: 400 });
      }
      if (!username) {
        return NextResponse.json({ success: false, error: "Nombre de usuario es requerido" }, { status: 400 });
      }

      const room = roomsStore[normRoomId];
      if (!room) {
        return NextResponse.json({ success: false, error: "Código de sala no válido o expirado." }, { status: 404 });
      }

      // Check if user already exists
      const existingUserIdx = room.participants.findIndex(p => p.username.toLowerCase() === username.toLowerCase());
      
      if (existingUserIdx === -1) {
        // Limit private room to 2 or 3 active participants for voice performance and privacy
        if (room.participants.length >= 4) {
          return NextResponse.json({ success: false, error: "La sala está llena (máximo 4 personas)." }, { status: 403 });
        }
        
        room.participants.push({ username, lastActive: Date.now() });
        room.messages.push({
          id: 'system-' + Date.now(),
          sender: 'Sistema',
          text: `👋 ${username} se ha unido a la sala.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        room.participants[existingUserIdx].lastActive = Date.now();
      }

      return NextResponse.json({ success: true, room });
    }

    // FROM HERE ON, ROOM MUST EXIST
    if (!normRoomId) {
      return NextResponse.json({ success: false, error: "ID de sala requerido" }, { status: 400 });
    }

    const room = roomsStore[normRoomId];
    if (!room) {
      return NextResponse.json({ success: false, error: "La sala no existe o ha expirado" }, { status: 404 });
    }

    // 3. PING & SYNC
    if (action === 'ping') {
      if (!username) {
        return NextResponse.json({ success: false, error: "Nombre de usuario requerido" }, { status: 400 });
      }

      // Update user active timestamp
      const user = room.participants.find(p => p.username.toLowerCase() === username.toLowerCase());
      if (user) {
        user.lastActive = Date.now();
      } else {
        // Auto-rejoin if was dropped
        room.participants.push({ username, lastActive: Date.now() });
      }

      // Filter out participants inactive for more than 15 seconds
      const now = Date.now();
      const initialLength = room.participants.length;
      room.participants = room.participants.filter(p => {
        const isActive = now - p.lastActive < 15000;
        if (!isActive && p.username.toLowerCase() !== username.toLowerCase()) {
          room.messages.push({
            id: 'system-' + Date.now(),
            sender: 'Sistema',
            text: `🛑 ${p.username} se desconectó por inactividad.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
        return isActive;
      });

      return NextResponse.json({ success: true, room });
    }

    // 4. UPDATE VIDEO PLAYBACK STATE
    if (action === 'updateVideo') {
      if (!username) {
        return NextResponse.json({ success: false, error: "Usuario requerido" }, { status: 400 });
      }
      if (!videoState) {
        return NextResponse.json({ success: false, error: "Falta estado de video" }, { status: 400 });
      }

      room.videoState = {
        url: videoState.url,
        title: videoState.title || room.videoState.title,
        playing: videoState.playing,
        currentTime: videoState.currentTime,
        lastUpdated: Date.now(),
        sender: username
      };

      return NextResponse.json({ success: true, videoState: room.videoState });
    }

    // 5. SEND ROOM MESSAGE
    if (action === 'chat') {
      if (!username || !text) {
        return NextResponse.json({ success: false, error: "Mensaje o usuario faltante" }, { status: 400 });
      }

      const newMessage: RoomMessage = {
        id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        sender: username,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      room.messages.push(newMessage);
      // Cap room messages at last 50
      if (room.messages.length > 50) {
        room.messages = room.messages.slice(-50);
      }

      return NextResponse.json({ success: true, message: newMessage });
    }

    // 6. SEND WEBRTC SIGNAL (OFFER, ANSWER, ICE CANDIDATE)
    if (action === 'sendSignal') {
      if (!username || !signal) {
        return NextResponse.json({ success: false, error: "Señal o usuario faltante" }, { status: 400 });
      }

      const newSignal: WebRTCSignal = {
        id: 'sig-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        sender: username,
        type: signal.type, // 'offer', 'answer', 'candidate'
        sdp: signal.sdp,
        candidate: signal.candidate,
        timestamp: Date.now()
      };

      room.signals.push(newSignal);

      // Clean up old signals (older than 2 minutes) to prevent memory leak
      const now = Date.now();
      room.signals = room.signals.filter(s => now - s.timestamp < 120000);

      return NextResponse.json({ success: true });
    }

    // 7. GET SIGNALS FOR SELF
    if (action === 'getSignals') {
      if (!username) {
        return NextResponse.json({ success: false, error: "Usuario requerido" }, { status: 400 });
      }

      // Return signals that are NOT sent by the current user
      const incomingSignals = room.signals.filter(s => s.sender.toLowerCase() !== username.toLowerCase());
      
      // We can clear signals once fetched, or keep them for idempotency. Let's return them all.
      return NextResponse.json({ success: true, signals: incomingSignals });
    }

    // 8. LEAVE ROOM
    if (action === 'leave') {
      if (!username) {
        return NextResponse.json({ success: false, error: "Usuario requerido" }, { status: 400 });
      }

      room.participants = room.participants.filter(p => p.username.toLowerCase() !== username.toLowerCase());
      room.messages.push({
        id: 'system-' + Date.now(),
        sender: 'Sistema',
        text: `🚪 ${username} ha salido de la sala.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Remove signals from this user
      room.signals = room.signals.filter(s => s.sender.toLowerCase() !== username.toLowerCase());

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });

  } catch (error: any) {
    console.error("Error en API de sala compartida:", error);
    return NextResponse.json({ success: false, error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
