import fs from 'fs';
import path from 'path';

export interface BotVideo {
  id: string;
  title: string;
  url: string;
  author: string;
  category: string;
  description: string;
  isCustom: boolean;
  addedAt: string;
  source: 'bot' | 'web';
}

export interface DbConnectionLog {
  id: string;
  timestamp: string;
  type: 'SYNC' | 'BOT_WRITE' | 'WEB_WRITE' | 'HEALTH_CHECK' | 'TELEGRAM_WRITE' | 'CHAT_WRITE' | 'INBOX_WRITE';
  status: 'SUCCESS' | 'ERROR';
  details: string;
  durationMs: number;
}

export interface TelegramFeedPost {
  id: string;
  senderName: string;
  senderUsername: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface DirectMessage {
  id: string;
  sender: string; // username
  recipient: string; // username
  text: string;
  timestamp: string;
}

export interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  avatarColor: string;
}

export interface DatabaseSchema {
  videos: BotVideo[];
  logs: DbConnectionLog[];
  serverRequests: number;
  telegramUrl: string;
  telegramFeed: TelegramFeedPost[];
  inboxMessages: DirectMessage[];
  chatMessages: LiveChatMessage[];
}

const DB_FILE_PATH = path.join('/tmp', 'nocturnal_db.json');

// Initial seed data
const initialData: DatabaseSchema = {
  videos: [],
  logs: [
    {
      id: 'init-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'HEALTH_CHECK',
      status: 'SUCCESS',
      details: 'Base de datos Nocturna inicializada correctamente con Feed, Chat e Inbox',
      durationMs: 1
    }
  ],
  serverRequests: 1,
  telegramUrl: 'https://t.me/+8tGCFc_J0eoxOWEx',
  telegramFeed: [
    {
      id: 'feed-1',
      senderName: 'Admin Nocturno',
      senderUsername: 'admin_nox',
      text: '🌌 ¡Bienvenidos al feed oficial de la Comunidad Nocturna! Este espacio sincroniza todas las novedades del grupo de Telegram asociado. Comparte, debate y mantén la vibra chill.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      likes: 12
    },
    {
      id: 'feed-2',
      senderName: 'Soporte Técnico',
      senderUsername: 'tech_support',
      text: '🛠️ Novedad: Hemos integrado la cola de reproducción automática, el chat grupal y la mensajería directa (Inbox) entre usuarios. ¡Regístrate con tus amigos para probar el Inbox!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 8
    }
  ],
  inboxMessages: [
    {
      id: 'inbox-seed-1',
      sender: 'Admin_Nocturno',
      recipient: 'invitado',
      text: '¡Hola! Bienvenido a tu bandeja de entrada privada. Aquí puedes chatear de forma individual con cualquier usuario registrado o con los moderadores de la comunidad.',
      timestamp: new Date().toISOString()
    }
  ],
  chatMessages: [
    {
      id: 'chat-seed-1',
      sender: 'Lucas_Chill',
      text: 'Qué buena música hay en esta playlist nocturna, ideal para programar ☕',
      timestamp: new Date(Date.now() - 60000 * 10).toISOString(),
      avatarColor: 'bg-indigo-500'
    },
    {
      id: 'chat-seed-2',
      sender: 'Nox_Explorer',
      text: '¿Alguien sabe de más códigos secretos en la terminal? Encontré "cinema" y "glow" jaja',
      timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      avatarColor: 'bg-rose-500'
    },
    {
      id: 'chat-seed-3',
      sender: 'Moderador',
      text: 'Sientan la libertad de añadir sus propios enlaces de YouTube, Shorts, Vimeo o Twitch en el botón lateral 🚀',
      timestamp: new Date(Date.now() - 60000 * 2).toISOString(),
      avatarColor: 'bg-emerald-500'
    }
  ]
};

// Helper to initialize the DB file if it doesn't exist
function initDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    
    // Ensure backwards compatibility by checking nested collections
    let modified = false;
    if (!parsed.telegramUrl) {
      parsed.telegramUrl = initialData.telegramUrl;
      modified = true;
    }
    if (!parsed.telegramFeed) {
      parsed.telegramFeed = initialData.telegramFeed;
      modified = true;
    }
    if (!parsed.inboxMessages) {
      parsed.inboxMessages = initialData.inboxMessages;
      modified = true;
    }
    if (!parsed.chatMessages) {
      parsed.chatMessages = initialData.chatMessages;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (error) {
    console.error('Error initializing nocturnal DB, returning fallback data:', error);
    return initialData;
  }
}

// Get entire database state
export function getDb(): DatabaseSchema {
  return initDb();
}

// Save database state
export function saveDb(data: DatabaseSchema): boolean {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write database file:', error);
    return false;
  }
}

// Add a connection log
export function addConnectionLog(
  type: DbConnectionLog['type'],
  status: DbConnectionLog['status'],
  details: string,
  durationMs: number
): DbConnectionLog {
  const db = initDb();
  const newLog: DbConnectionLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    type,
    status,
    details,
    durationMs
  };
  
  db.logs.unshift(newLog);
  // Keep last 100 logs
  if (db.logs.length > 100) {
    db.logs = db.logs.slice(0, 100);
  }
  
  saveDb(db);
  return newLog;
}

// Increment server request metric
export function incrementRequestCount(): number {
  const db = initDb();
  db.serverRequests = (db.serverRequests || 0) + 1;
  saveDb(db);
  return db.serverRequests;
}
