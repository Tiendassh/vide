'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, MessageSquare, Monitor, Film, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';

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

const NavItem = ({ id, icon: Icon, label, activeTab, onClick }: { 
  id: 'stream' | 'videos' | 'chat', 
  icon: any, 
  label: string, 
  activeTab: string, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full font-medium text-sm",
      activeTab === id 
        ? "bg-white/10 text-white shadow-lg" 
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon size={20} className={cn(activeTab === id ? "text-indigo-400" : "text-slate-500")} />
    <span>{label}</span>
  </button>
);

export default function RedesignedDashboard() {
  const [activeTab, setActiveTab] = useState<'stream' | 'videos' | 'chat'>('stream');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<BotVideo[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const handleTabChange = (tab: 'stream' | 'videos' | 'chat') => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };
  
  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchData]);

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#12121a] border-r border-white/5 p-6 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Monitor size={22} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Nocturnal</span>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem id="stream" icon={Film} label="Live Stream" activeTab={activeTab} onClick={() => handleTabChange('stream')} />
          <NavItem id="videos" icon={Play} label="Library" activeTab={activeTab} onClick={() => handleTabChange('videos')} />
          <NavItem id="chat" icon={MessageSquare} label="Community Chat" activeTab={activeTab} onClick={() => handleTabChange('chat')} />
        </nav>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0f] p-10">
        <header className="flex justify-between items-center mb-10">
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Monitor size={24} />
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight capitalize text-white">
            {activeTab === 'stream' ? 'Live Stream' : activeTab === 'videos' ? 'Video Library' : 'Live Chat'}
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : (
              <>
                {activeTab === 'videos' && (
                  <div className="grid gap-4">
                    {videos.map(video => (
                      <GlassCard 
                        key={video.id} 
                        className="p-6 flex items-center gap-5"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                          <Play size={28} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{video.title}</h3>
                          <p className="text-slate-400 text-sm">{video.author || 'Unknown Author'}</p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
                
                {activeTab === 'stream' && (
                  <GlassCard className="aspect-video flex flex-col items-center justify-center gap-4">
                    <Film size={48} className="text-slate-600" />
                    <p className="text-slate-400 text-lg font-medium">Stream offline</p>
                  </GlassCard>
                )}
              </>
            )}
          </div>

          <GlassCard className="h-[600px] flex flex-col p-8" hover={false}>
            <h2 className="font-bold mb-6 flex items-center gap-2 text-lg text-white">
              <MessageSquare size={20} className="text-indigo-400" /> Live Chat
            </h2>
            <div className="flex-1 overflow-y-auto space-y-5 pr-2">
              <AnimatePresence>
                {chatMessages.map(msg => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm p-4 rounded-xl bg-white/5"
                  >
                    <span className={cn("font-bold", msg.avatarColor === 'bg-emerald-600' ? 'text-emerald-400' : 'text-indigo-400')}>
                      {msg.sender}: 
                    </span>
                    <span className="ml-2 text-slate-300">{msg.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
