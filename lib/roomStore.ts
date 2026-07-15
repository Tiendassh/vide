export interface RoomVideoState {
  url: string;
  title: string;
  playing: boolean;
  currentTime: number;
  lastUpdated: number;
  sender: string;
}

export interface RoomParticipant {
  username: string;
  lastActive: number;
}

export interface RoomMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface WebRTCSignal {
  id: string;
  sender: string;
  type: 'offer' | 'answer' | 'candidate';
  sdp?: any;
  candidate?: any;
  timestamp: number;
}

export interface CoWatchingRoom {
  roomId: string;
  videoState: RoomVideoState;
  participants: RoomParticipant[];
  messages: RoomMessage[];
  signals: WebRTCSignal[];
  createdAt: number;
}

// Persist in-memory rooms across Next.js dev reloads
const globalForRooms = global as unknown as {
  rooms: Record<string, CoWatchingRoom>;
};

if (!globalForRooms.rooms) {
  globalForRooms.rooms = {};
}

export const roomsStore = globalForRooms.rooms;

// Helper to generate a clean, random room code (e.g. CW-XXXX)
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CW-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Clean up idle rooms older than 4 hours, or rooms with no active participants for 5 minutes
export function cleanStaleRooms() {
  const now = Date.now();
  Object.keys(roomsStore).forEach(roomId => {
    const room = roomsStore[roomId];
    
    // Filter active participants (joined/pinged within last 10 seconds)
    const activeParticipants = room.participants.filter(p => now - p.lastActive < 10000);
    
    // If room is older than 4 hours, or has been empty for more than 5 minutes
    const isRoomVeryOld = now - room.createdAt > 4 * 60 * 60 * 1000;
    const isRoomEmptyLongTime = room.participants.length === 0 && (now - room.createdAt > 5 * 60 * 1000);
    const isIdleEmptyRoom = activeParticipants.length === 0 && (now - room.createdAt > 10 * 60 * 1000);

    if (isRoomVeryOld || isRoomEmptyLongTime || isIdleEmptyRoom) {
      delete roomsStore[roomId];
    }
  });
}
