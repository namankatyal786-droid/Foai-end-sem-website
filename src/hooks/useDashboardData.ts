import { useState, useEffect, useCallback, useRef } from 'react';
import { ISSPosition, Astronaut, NewsArticle } from '../lib/types';
import { calculateDistance, calculateSpeed } from '../lib/utils';
import { toast } from 'sonner';

export function useDashboardData() {
  const [issHistory, setIssHistory] = useState<ISSPosition[]>([]);
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isError, setIsError] = useState(false);

  const isFetchingNews = useRef(false);

  const hasEverFetchedISS = useRef(false);

  const fetchISS = useCallback(async () => {
    try {
      const res = await fetch('/api/iss');
      if (!res.ok) throw new Error("ISS Relay Offline");
      const data = await res.json();
      
      const lat = parseFloat(data.iss_position.latitude);
      const lon = parseFloat(data.iss_position.longitude);

      const newPos: ISSPosition = {
        latitude: lat,
        longitude: lon,
        timestamp: data.timestamp,
        locationName: data.locationName || "Deep Space",
      };

      setIssHistory(prev => {
        const history = [...prev];
        if (history.length > 0) {
          const last = history[history.length - 1];
          const dist = calculateDistance(last.latitude, last.longitude, newPos.latitude, newPos.longitude);
          const timeDiff = newPos.timestamp - last.timestamp;
          newPos.speed = calculateSpeed(dist, timeDiff);
        }
        
        const newHistory = [...history, newPos];
        return newHistory.slice(-30);
      });
      
      hasEverFetchedISS.current = true;
      setIsError(false);
    } catch (error) {
      console.error('ISS fetch failed:', error);
      if (!hasEverFetchedISS.current) {
        setIsError(true);
      }
    }
  }, []);

  const fetchAstronauts = useCallback(async () => {
    try {
      const res = await fetch('/api/astros');
      if (!res.ok) throw new Error("Astro Relay Offline");
      const data = await res.json();
      setAstronauts(data.people || []);
    } catch (error) {
      console.error('Astros fetch failed:', error);
    }
  }, []);

  const fetchNews = useCallback(async (category = 'space', query = '', retryCount = 0) => {
    // Prevent fetching if already loading
    if (isFetchingNews.current) return;
    
    isFetchingNews.current = true;
    setIsLoadingNews(true);
    try {
      const res = await fetch(`/api/news?category=${category}&query=${query}`);
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data && data.articles) {
        const taggedArticles = data.articles.map((a: any) => ({ ...a, category }));
        setNews(taggedArticles);
        setLastFetch(Date.now());
      } else {
        throw new Error("Invalid broadcast format");
      }
    } catch (error) {
      console.error('Relay error:', error);
      if (retryCount < 2) {
        console.log(`Retrying news fetch... attempt ${retryCount + 1}`);
        // Reset ref for retry
        isFetchingNews.current = false;
        setTimeout(() => fetchNews(category, query, retryCount + 1), 3000);
      } else {
        toast.error('Mission Telemetry Error: News relay unreachable. Ground control attempting reconnect.');
      }
    } finally {
      setIsLoadingNews(false);
      isFetchingNews.current = false;
    }
  }, []); // Stable identity

  useEffect(() => {
    fetchISS();
    fetchAstronauts();
    // Initial news fetch
    fetchNews();

    const issInterval = setInterval(fetchISS, 15000);
    return () => clearInterval(issInterval);
  }, [fetchISS, fetchAstronauts, fetchNews]);

  return {
    issHistory,
    currentPos: issHistory[issHistory.length - 1] || null,
    astronauts,
    news,
    isLoadingNews,
    fetchNews,
    fetchISS,
    fetchAstronauts,
    lastFetch,
    isError
  };
}
