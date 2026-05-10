import { ISSPosition, Astronaut } from "../../lib/types";
import { ISSMap } from "./ISSMap";
import { RefreshCw, Users, Navigation, Zap, Globe } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

interface ISSPanelProps {
  current: ISSPosition | null;
  history: ISSPosition[];
  astronauts: Astronaut[];
  isError?: boolean;
  onRefresh: () => void;
}

export function ISSPanel({ current, history, astronauts, isError, onRefresh }: ISSPanelProps) {
  if (!current && isError) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center font-mono text-center space-y-4">
        <div className="text-red-500 animate-pulse uppercase tracking-[0.2em] font-bold">Telemetry Link Severed</div>
        <p className="text-[10px] text-slate-500 max-w-xs uppercase leading-relaxed">
          Ground station relay timeout. Remote server is unreachable or configuration is invalid.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-800 text-white text-[10px] tracking-widest uppercase font-bold hover:bg-slate-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!current) return <div className="h-[400px] flex items-center justify-center font-mono text-cyan-accent animate-pulse uppercase tracking-widest">Initialising Telemetry...</div>;

  return (
    <div id="iss-panel" className="space-y-6 transition-colors duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-1 h-6 bg-cyan-accent rounded-full"></div>
           <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            ISS Live Tracker
          </h2>
        </div>
        <button 
          onClick={onRefresh}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400"
          title="Manual Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-slate overflow-hidden relative shadow-lg dark:shadow-2xl transition-colors duration-500">
             <ISSMap current={current} history={history} />
             <div className="absolute top-4 left-4 z-[999] pointer-events-none">
                <div className="bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md border border-border-light dark:border-border-slate p-3 rounded shadow-xl transition-colors duration-500">
                   <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Sector</div>
                   <div className="text-xs font-mono text-cyan-600 dark:text-cyan-accent font-bold mt-0.5">{current.locationName || "High Seas"}</div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic font-mono opacity-80">Alt: ~418 km</div>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="LATITUDE" 
              value={current.latitude.toFixed(4)} 
              icon={<Navigation size={14} />}
            />
            <StatCard 
              label="LONGITUDE" 
              value={current.longitude.toFixed(4)} 
              icon={<Navigation size={14} className="rotate-90" />}
            />
            <StatCard 
              label="VELOCITY" 
              value={`${(current.speed || 27600).toFixed(0)} KM/H`} 
              icon={<Zap size={14} className="text-yellow-500" />}
            />
            <StatCard 
              label="SAMPLES" 
              value={`${history.length}`} 
              icon={<RefreshCw size={14} />}
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-card-dark rounded-xl p-0 border border-border-light dark:border-border-slate h-full flex flex-col shadow-lg dark:shadow-xl overflow-hidden transition-colors duration-500">
            <div className="p-4 border-b border-border-light dark:border-border-slate bg-black/[0.02] dark:bg-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-cyan-accent" /> Personnel in Orbit
              </h3>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-accent px-2 py-0.5 bg-cyan-accent/10 rounded-full border border-cyan-accent/20">
                {astronauts.length} ACTIVE
              </span>
            </div>
            
            <ul className="flex-1 space-y-0 overflow-y-auto max-h-[450px] divide-y divide-border-light dark:divide-border-slate">
              {astronauts.map((astro, i) => (
                <motion.li 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="p-4 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors flex justify-between items-center group cursor-default"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-accent transition-colors">{astro.name}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter mt-0.5">{astro.craft} • MISSION SPECIALIST</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                </motion.li>
              ))}
            </ul>
            <div className="p-3 bg-black/[0.02] dark:bg-white/5 text-[9px] font-mono text-center text-slate-500 border-t border-border-light dark:border-border-slate italic">
              Live updates via Open Notify API
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, className }: { label: string; value: string; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-slate hover:border-cyan-accent/30 transition-all group shadow-sm dark:shadow-none ${className || ""}`}>
      <div className="text-slate-500 text-[10px] font-bold tracking-widest flex items-center gap-2 mb-2 uppercase">
        <span className="text-cyan-accent opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{value}</div>
    </div>
  );
}
