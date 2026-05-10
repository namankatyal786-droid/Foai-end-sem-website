import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Trash2, Bot, Loader2 } from "lucide-react";
import { ChatMessage, DashboardContext } from "../../lib/types";
import { motion, AnimatePresence } from "motion/react";

interface ChatbotProps {
  context: DashboardContext;
}

export function Chatbot({ context }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("chat_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages.slice(-30)));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const lastMsgs = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...lastMsgs, { role: 'user', content: input }],
          context: {
            iss_metrics: {
              latitude: context.iss.current?.latitude,
              longitude: context.iss.current?.longitude,
              velocity: context.iss.current?.speed || 27600,
              location: context.iss.current?.locationName || "Orbital Sector"
            },
            personnel: context.iss.astronauts.map(a => `${a.name} (${a.craft})`),
            broadcast_feed: context.news.map(n => ({
              headline: n.title,
              summary: n.description,
              source: n.source.name,
              time: n.publishedAt
            })),
            data_points: context.iss.history.length
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "Signal lost. Unable to process query at this time.";
      // Strip any <think>...</think> tags from model output
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat bot error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "⚠️ Communication relay interrupted. The AI uplink is temporarily offline. Please try again shortly.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("chat_history");
  };

  return (
    <div id="chatbot-wrapper" className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 transition-colors duration-500">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-72 sm:w-80 h-96 bg-card-main border border-border-main rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-500"
          >
            {/* Header */}
            <div className="p-3 bg-black/[0.02] dark:bg-white/5 border-b border-border-main flex justify-between items-center transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-accent animate-pulse"></div>
                <span className="text-[10px] font-bold text-text-title uppercase tracking-widest">Astra Assistant</span>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChat} title="Clear relay history">
                   <Trash2 size={12} className="text-slate-400 dark:text-slate-500 hover:text-text-title transition-colors" />
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X size={14} className="text-slate-400 dark:text-slate-500 hover:text-text-title transition-colors" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4 scroll-smooth transition-colors duration-500">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 dark:text-slate-600 mt-10 space-y-2">
                  <Bot size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] uppercase font-mono tracking-widest">Awaiting Command...</p>
                  <p className="text-[9px] lowercase italic px-4">Inquire regarding ISS vector, personnel, or recent stellar broadcasts.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 bg-cyan-600 dark:bg-cyan-accent rounded-full flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold">AI</div>
                  )}
                  <div className={`max-w-[85%] p-2 rounded-lg text-[11px] font-sans leading-relaxed transition-all duration-300 ${
                    msg.role === 'user' 
                      ? 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 border border-border-light dark:border-border-slate rounded-tr-none' 
                      : 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-100 border border-cyan-500/20 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-5 h-5 bg-cyan-600 dark:bg-cyan-accent rounded-full flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold">...</div>
                  <div className="text-slate-400 dark:text-slate-500 italic text-[10px] mt-1 font-mono uppercase tracking-tighter">Astra is processing...</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border-main bg-black/[0.02] dark:bg-black/20 transition-colors">
              <div className="relative">
                <input
                  type="text"
                  placeholder="QUERY MISSION CONTROL..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-bg-main border border-border-main rounded px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-text-title outline-none focus:border-cyan-600 dark:focus:border-cyan-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                <button 
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-cyan-600 dark:text-cyan-500 hover:text-text-title disabled:opacity-30 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        id="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-cyan-600 dark:bg-cyan-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-cyan-900/10 dark:shadow-cyan-900/40"
      >
        <MessageSquare size={24} />
      </button>
    </div>
  );
}
