'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { getSupabase } from '@/lib/supabaseClient';
import { 
  Play, Pause, Plus, Trash2, Send, Share2, Copy, Check, MessageSquare, 
  Link as LinkIcon, Monitor, Users, Shield, Lock, Film, MessagesSquare, SkipBack, SkipForward, ExternalLink,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Interfaces
interface BotVideo {
  id: string;
  title: string;
  url: string;
  author?: string;
  category?: string;
  description?: string;
  isCustom?: boolean;
  addedAt?: string;
  source?: string;
}

interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  avatarColor: string;
}

interface TelegramFeedPost {
  id: string;
  senderName: string;
  senderUsername: string;
  text: string;
  timestamp: string;
  likes: number;
}

export default function RedesignedDashboard() {
  const [activeTab, setActiveTab] = useState<'stream' | 'videos' | 'telegram' | 'chat' | 'blog' | 'subscribe'>('stream');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [videos, setVideos] = useState<BotVideo[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [telegramFeed, setTelegramFeed] = useState<TelegramFeedPost[]>([]);
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/+8tGCFc_J0eoxOWEx');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Room/Link States
  const [roomLink, setRoomLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/videos');
      if (!res.ok) {
        const text = await res.text();
        console.error('Error de API:', res.status, text);
        throw new Error(`API error: ${res.status} - ${text.substring(0, 50)}`);
      }
      const data = await res.json();
      setVideos(data.videos || []);
      setChatMessages(data.chatMessages || []);
      setTelegramFeed(data.telegramFeed || []);
      setTelegramUrl(data.telegramUrl || 'https://t.me/+8tGCFc_J0eoxOWEx');
    } catch (error: any) {
      console.error('Error detallado en fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData().catch(console.error);
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl) return;

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addVideo',
          url: newVideoUrl,
          title: newVideoTitle || 'Nuevo Video'
        })
      });
      
      if (res.ok) {
        setNewVideoUrl('');
        setNewVideoTitle('');
        
    fetchData().catch(console.error);
      }
    } catch (error) {
      console.error('Error adding video:', error);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const tempInput = chatInput;
    setChatInput('');

    try {
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addChatMessage',
          text: tempInput,
          sender: 'Usuario (Tú)',
          avatarColor: 'bg-emerald-600'
        })
      });
      
    fetchData().catch(console.error);
    } catch (error) {
      console.error('Error sending chat:', error);
    }
  };

  const generateEncryptedLink = () => {
    const roomId = Math.random().toString(36).substring(2, 15);
    const key = Math.random().toString(36).substring(2, 10);
    const link = `${window.location.origin}?room=${roomId}&key=${key}`;
    setRoomLink(link);
    setIsEncrypted(true);
  };

  const copyLink = () => {
    if (!roomLink) return;
    navigator.clipboard.writeText(roomLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans flex overflow-hidden relative">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={cn(
        "w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col p-4 transition-transform duration-300 z-50",
        "fixed inset-y-0 left-0 md:static md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Nocturnal</span>
          </div>
          {/* Close button inside sidebar on mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 flex-1">
          <button 
            onClick={() => {
              setActiveTab('stream');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'stream' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <Monitor className="w-4 h-4" />
            Sala de Transmisión
          </button>
          <button 
            onClick={() => {
              setActiveTab('videos');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'videos' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <Film className="w-4 h-4" />
            Cola de Videos
          </button>
          <button 
            onClick={() => {
              setActiveTab('telegram');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'telegram' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <MessagesSquare className="w-4 h-4" />
            Integración Telegram
          </button>
          <button 
            onClick={() => {
              setActiveTab('chat');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'chat' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Salas de Chat
          </button>
          <button 
            onClick={() => {
              setActiveTab('blog');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'blog' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <Users className="w-4 h-4" />
            Blog Temático
          </button>
          <button 
            onClick={() => {
              setActiveTab('subscribe');
              setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'subscribe' ? "bg-indigo-500/10 text-indigo-400" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
            )}
          >
            <Shield className="w-4 h-4" />
            Suscripción Anónima
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-base tracking-tight text-white">Nocturnal</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 -mr-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Stream View */}
            {activeTab === 'stream' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col lg:flex-row p-6 gap-6"
              >
                
                {/* Player Section */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-2xl border border-neutral-800 flex items-center justify-center">
                    {currentVideo ? (
                       <iframe 
                        src={currentVideo.url.replace('watch?v=', 'embed/')} 
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-neutral-500 flex flex-col items-center gap-2">
                        <Monitor className="w-12 h-12 opacity-50" />
                        <p>No hay videos en cola</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-medium">{currentVideo?.title || 'Esperando transmisión'}</h2>
                        <p className="text-sm text-neutral-400 mt-1">Sincronización en tiempo real habilitada.</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                          <SkipBack className="w-4 h-4" onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))} />
                        </button>
                        <button className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors">
                          <SkipForward className="w-4 h-4" onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-neutral-800">
                      <div className="flex items-center gap-3 mb-3">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-medium">Link de Invitación Cifrado (E2EE)</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={generateEncryptedLink}
                          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors border border-neutral-700"
                        >
                          Generar Sala
                        </button>
                        {roomLink && (
                          <div className="flex-1 flex items-center gap-2 bg-black rounded-lg px-3 border border-neutral-800">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <input 
                              type="text" 
                              readOnly 
                              value={roomLink}
                              className="bg-transparent border-none outline-none flex-1 text-xs text-neutral-400 font-mono"
                            />
                            <button onClick={copyLink} className="p-1.5 hover:text-white text-neutral-500 transition-colors">
                              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div className="w-full lg:w-80 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-xl">
                  <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-medium">Sala de Chat</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center mt-10">No hay mensajes aún.</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <div className={cn("w-6 h-6 rounded-full flex-shrink-0 mt-0.5", msg.avatarColor || "bg-indigo-500")} />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium text-neutral-300">{msg.sender}</span>
                              <span className="text-[10px] text-neutral-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-sm text-neutral-200 mt-0.5 break-words">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="p-3 border-t border-neutral-800">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="w-full bg-black border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button 
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Video List View */}
            {activeTab === 'videos' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="p-8 max-w-5xl mx-auto"
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold mb-2">Cola de Videos</h1>
                  <p className="text-neutral-400">Guarda y administra tu lista de videos por link directo.</p>
                </div>

                <form onSubmit={handleAddVideo} className="mb-10 bg-neutral-900 p-5 rounded-xl border border-neutral-800">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                    Añadir Nuevo Video
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" 
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="Título (Opcional)"
                      className="bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 flex-1"
                    />
                    <input 
                      type="url" 
                      required
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="URL del video directo o YouTube"
                      className="bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 flex-[2]"
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {videos.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                      <Film className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400">No hay videos guardados.</p>
                    </div>
                  ) : (
                    videos.map((video, idx) => (
                      <div key={video.id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-xs font-mono text-neutral-500">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{video.title}</h4>
                            <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1">
                              {video.url.substring(0, 60)}... <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                             // Handle play (switch to stream)
                             setCurrentVideoIndex(idx);
                             setActiveTab('stream');
                          }}
                          className="p-2 bg-neutral-800 hover:bg-indigo-600 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Telegram Integration View */}
            {activeTab === 'telegram' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="p-8 max-w-5xl mx-auto"
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold mb-2">Integración Telegram</h1>
                  <p className="text-neutral-400">Administra el enlace de tu grupo y monitorea la actividad.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Info Panel */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800">
                      <h3 className="font-medium text-sm text-neutral-300 mb-3">Enlace del Grupo Activo</h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={telegramUrl}
                          onChange={(e) => setTelegramUrl(e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none text-neutral-300"
                        />
                        <a 
                          href={telegramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Feed */}
                  <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <h3 className="font-medium">Actividad Reciente del Bot</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {telegramFeed.length === 0 ? (
                        <p className="text-sm text-neutral-500 text-center mt-10">Sin actividad en Telegram.</p>
                      ) : (
                        telegramFeed.map((post) => (
                          <div key={post.id} className="bg-black/50 border border-neutral-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                  {post.senderName.charAt(0)}
                                </div>
                                <span className="font-medium text-sm">{post.senderName}</span>
                                <span className="text-xs text-neutral-500">@{post.senderUsername}</span>
                              </div>
                              <span className="text-[10px] text-neutral-500">{new Date(post.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                              {post.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chat View */}
            {activeTab === 'chat' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
                <h1 className="text-2xl font-semibold mb-4">Salas de Chat</h1>
                <p>Próximamente: Salas de chat temáticas usando Supabase.</p>
              </motion.div>
            )}

            {/* Blog View */}
            {activeTab === 'blog' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
                <h1 className="text-2xl font-semibold mb-4">Blog Temático</h1>
                <p>Próximamente: Artículos y comunidad.</p>
              </motion.div>
            )}

            {/* Subscribe View */}
            {activeTab === 'subscribe' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 max-w-lg mx-auto">
                <h1 className="text-2xl font-semibold mb-4">Suscripción Anónima</h1>
                <p className="text-neutral-400 mb-6">Suscríbete anónimamente para contenido exclusivo y notificaciones.</p>
                <button
                  onClick={async () => {
                     const supabase = getSupabase();
                     if (!supabase) {
                       alert("Supabase no configurado");
                       return;
                     }
                     const { data, error } = await supabase.auth.signInAnonymously();
                     if (error) alert(error.message);
                     else alert("Suscrito anónimamente!");
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Suscribirse Anónimamente
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
