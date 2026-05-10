import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ISSPosition, NewsArticle } from "../../lib/types";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";

interface DashChartsProps {
  issHistory: ISSPosition[];
  news: NewsArticle[];
}

const COLORS = ["#22d3ee", "#fbbf24", "#ef4444", "#8b5cf6", "#10b981"];

export function DashCharts({ issHistory, news }: DashChartsProps) {
  // Speed data for line chart
  const speedData = issHistory
    .filter(p => p.speed !== undefined)
    .map(p => ({
      time: new Date(p.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      speed: Math.round(p.speed || 27600),
    }));

  // News distribution by category
  const categoryDist = Object.entries(
    news.reduce((acc, curr) => {
      const cat = curr.category || 'General';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-colors duration-500">
      <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-slate shadow-lg dark:shadow-xl transition-colors duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
            <TrendingUp className="text-cyan-600 dark:text-cyan-accent" size={16} /> Velocity Trend <span className="text-[10px] text-slate-500 font-mono">(KM/H)</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-600/50 dark:text-cyan-accent/50">AVG: 27,580</span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
              <XAxis dataKey="time" hide />
              <YAxis 
                type="number" 
                domain={['auto', 'auto']}
                hide
                tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val.toLocaleString()}`}
                stroke="#1e293b"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-card-dark)', 
                  border: '1px solid var(--color-border-slate)', 
                  borderRadius: '4px', 
                  fontSize: '10px', 
                  fontFamily: 'monospace',
                  color: '#fff'
                }}
                itemStyle={{ color: 'var(--color-cyan-accent)' }}
                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              />
              <Line 
                type="monotone" 
                dataKey="speed" 
                stroke="var(--color-cyan-accent)" 
                strokeWidth={2} 
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-slate shadow-lg dark:shadow-xl transition-colors duration-500">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors">
          <PieIcon className="text-amber-500 dark:text-amber-400" size={16} /> Category Distribution
        </h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="transparent"
                strokeWidth={2}
              >
                {categoryDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--color-card-dark)', 
                  border: '1px solid var(--color-border-slate)', 
                  borderRadius: '4px', 
                  fontSize: '10px', 
                  fontFamily: 'monospace',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="hidden sm:block space-y-2 pl-4 border-l border-border-light dark:border-border-slate transition-colors">
            {categoryDist.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{entry.name}</span>
                <span className="text-slate-900 dark:text-white ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
