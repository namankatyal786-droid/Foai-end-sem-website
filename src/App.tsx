/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { ISSPanel } from "./components/ISS/ISSPanel";
import { NewsPanel } from "./components/News/NewsPanel";
import { DashCharts } from "./components/Charts/DashCharts";
import { Chatbot } from "./components/Chat/Chatbot";
import { ThemeToggle } from "./components/ThemeToggle";
import { Rocket, Satellite, Newspaper, BarChart3, Globe } from "lucide-react";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import React from "react";

type Tab = "tracker" | "news" | "analytics";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("tracker");
  const { 
    issHistory, 
    currentPos, 
    astronauts, 
    news, 
    isLoadingNews, 
    fetchNews,
    fetchISS,
    fetchAstronauts,
    lastFetch,
    isError
  } = useDashboardData();

  const handleRefreshTracker = () => {
    fetchISS();
    fetchAstronauts();
  };

  const dashboardContext = {
    iss: { current: currentPos, history: issHistory, astronauts },
    news
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-slate-600 dark:text-slate-300 font-sans transition-colors duration-500 flex flex-col">
      <Toaster position="top-right" richColors />
      
      {/* Top Navigation */}
      <nav className="h-16 border-b border-border-main px-4 md:px-8 flex items-center justify-between bg-card-main dark:bg-card-main z-50 shrink-0 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 dark:bg-cyan-600 rounded flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Rocket size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-title dark:text-text-title hidden sm:inline">
            STELLARIS <span className="text-cyan-600 text-xs font-mono">DASHBOARD</span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 h-full">
          <NavButton 
            active={activeTab === "tracker"} 
            onClick={() => setActiveTab("tracker")}
            icon={<Satellite size={16} />}
            label="TRACKER"
          />
          <NavButton 
            active={activeTab === "news"} 
            onClick={() => setActiveTab("news")}
            icon={<Newspaper size={16} />}
            label="NEWS"
          />
          <NavButton 
            active={activeTab === "analytics"} 
            onClick={() => setActiveTab("analytics")}
            icon={<BarChart3 size={16} />}
            label="ANALYTICS"
          />
          <div className="w-[1px] h-8 bg-border-main mx-2"></div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "tracker" && (
              <ISSPanel 
                current={currentPos} 
                history={issHistory} 
                astronauts={astronauts} 
                isError={isError}
                onRefresh={handleRefreshTracker} 
              />
            )}
            {activeTab === "news" && (
              <NewsPanel 
                articles={news} 
                isLoading={isLoadingNews} 
                onRefresh={fetchNews} 
              />
            )}
            {activeTab === "analytics" && (
              <div className="space-y-8 transition-colors duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-text-title">System Analytics</h2>
                </div>
                <DashCharts issHistory={issHistory} news={news} />
                <div className="bg-card-main border border-border-main rounded-xl p-6 flex items-start gap-4 shadow-sm transition-colors duration-500">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Globe className="text-blue-500 shrink-0" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-600 uppercase text-sm tracking-wide">Live Context Awareness</h4>
                    <p className="text-xs text-text-main mt-1 leading-relaxed">
                      Dashboard telemetry is synchronized every 15 seconds. The Astra AI Assistant utilizes this active data stream for real-time mission analysis and queries.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Bar */}
      <footer className="h-14 border-t border-border-main px-4 md:px-8 flex items-center justify-between bg-card-main text-[10px] font-mono shrink-0 transition-colors duration-500">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide py-2">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase">Velocity</span>
            <span className="text-text-title font-bold">~27,612 km/h</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase">Path Points</span>
            <span className="text-text-title font-bold tracking-widest">{issHistory.length}/30</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase">Sync Status</span>
            <span className="text-green-600 uppercase font-bold">LIVE FEED ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4 whitespace-nowrap ml-4">
           <div className="text-right hidden sm:block">
              <span className="text-slate-500 uppercase">Last Sync</span>
              <div className="text-text-main">{lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'N/A'}</div>
           </div>
           <button 
             onClick={() => fetchNews()}
             className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded uppercase text-[9px] tracking-widest transition-colors shadow-lg shadow-cyan-900/20"
           >
            Manual Sync
           </button>
        </div>
      </footer>

      <Chatbot context={dashboardContext} />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 h-full text-[11px] font-mono font-bold tracking-widest transition-all border-b-2 duration-300 ${
        active 
          ? "border-cyan-accent text-cyan-accent bg-cyan-accent/5" 
          : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

