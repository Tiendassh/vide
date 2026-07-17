'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, MessageSquare, Monitor, Film
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BotVideo {
  id: string;
  title: string;
  url: string;
  author?: string;
}

interface LiveChatMessage {
  id: string;
  sender: string;
  text: string;
  avatarColor: string;
}

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: { id: 'stream' | 'videos' | 'chat', icon: any, label: string, activeTab: string, setActiveTab: (tab: 'stream' | 'videos' | 'chat') => void }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full",
      activeTab === id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

export default function RedesignedDashboard() {
  const [activeTab, setActiveTab] = useState<'stream' | 'videos' | 'chat'>('stream');
  const [videos, setVideos] = useState<BotVideo[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    try {
      const res = await fetch(`${window.location.origin}/api/videos`);
      if (!res.ok) throw new Error('Error al cargar datos');
      const data = await res.json();
      setVideos(data.videos || []);
      setChatMessages(data.chatMessages || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Monitor size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Dashboard</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem id="stream" icon={Film} label="Stream" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="videos" icon={Play} label="Videos" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem id="chat" icon={MessageSquare} label="Chat" activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'videos' && (
              <div className="grid gap-4">
                {videos.map(video => (
                  <div key={video.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-4 hover:border-indigo-500/50 transition-colors">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                      <Play size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{video.title}</h3>
                      <p className="text-slate-400 text-sm">{video.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'stream' && (
              <div className="bg-slate-900 aspect-video rounded-3xl border border-slate-800 flex items-center justify-center">
                <p className="text-slate-500 text-lg">El reproductor se mostrará aquí</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 h-fit">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={18} /> Chat en Vivo
            </h2>
            <div className="h-96 overflow-y-auto space-y-4">
              {chatMessages.map(msg => (
                <div key={msg.id} className="text-sm">
                  <span className={cn("font-bold", msg.avatarColor === 'bg-emerald-600' ? 'text-emerald-400' : 'text-indigo-400')}>
                    {msg.sender}: 
                  </span>
                  <span className="ml-2 text-slate-300">{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
