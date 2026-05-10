import { NewsArticle } from "../../lib/types";
import { Search, RefreshCw, ExternalLink, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface NewsPanelProps {
  articles: NewsArticle[];
  isLoading: boolean;
  onRefresh: (category?: string, query?: string) => void;
}

export function NewsPanel({ articles, isLoading, onRefresh }: NewsPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("space");

  const categories = ["space", "astronomy", "nasa", "spacex", "universe"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onRefresh(activeCategory, search);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    onRefresh(cat, search);
  };

  return (
    <div id="news-panel" className="space-y-6 transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
           <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Stellar Wire
          </h2>
        </div>
        
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="FILTER SYSTEM BROADCASTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-slate rounded text-[10px] uppercase font-mono tracking-widest focus:border-cyan-600 dark:focus:border-cyan-accent outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
          />
        </form>

        <button 
          onClick={() => onRefresh(activeCategory, search)}
          disabled={isLoading}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 text-slate-400"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border-light dark:border-border-slate">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-1.5 h-full text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeCategory === cat 
                ? "border-cyan-600 dark:border-cyan-accent text-cyan-600 dark:text-cyan-accent bg-cyan-accent/5" 
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <NewsSkeleton key={i} />)
          ) : articles.length > 0 ? (
            articles.map((article, i) => (
              <div key={article.url + i}>
                <NewsCard article={article} index={i} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center font-mono text-[11px] text-slate-500 uppercase tracking-widest">
              No relay data found. Recalibrate search parameters.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const NewsCard = ({ article, index }: { article: NewsArticle; index: number }) => {
  const formattedDate = React.useMemo(() => {
    try {
      return format(new Date(article.publishedAt), "yyyy-MM-dd • HH:mm");
    } catch (e) {
      return "0000-00-00 • 00:00";
    }
  }, [article.publishedAt]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white dark:bg-card-dark border border-border-light dark:border-border-slate rounded-lg overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-600 transition-all h-full shadow-sm dark:shadow-none"
    >
      <div className="relative h-40 overflow-hidden bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-slate">
        {article.image ? (
          <img 
            src={article.image} 
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100 dark:opacity-80 dark:group-hover:opacity-100"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300 dark:text-slate-700 font-mono text-[10px]">NO_IMAGE_DATA</div>
        )}
        <div className="absolute top-2 right-2 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-sm border border-border-light dark:border-border-slate px-2 py-0.5 rounded text-[8px] font-mono text-cyan-600 dark:text-cyan-accent uppercase">
          {article.source.name}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-accent/70 uppercase tracking-tighter mb-2">
           {formattedDate} UTC
        </div>
        
        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-accent transition-colors">
          {article.title}
        </h3>
        
        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mb-4 flex-1">
          {article.description}
        </p>
        
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center border-t border-border-light dark:border-border-slate pt-3 gap-2 text-[10px] font-mono font-black text-cyan-600 dark:text-cyan-accent hover:text-slate-900 dark:hover:text-white transition-colors mt-auto tracking-[0.2em] uppercase"
        >
          Access Data Pool <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
};

function NewsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-800" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  );
}
