export interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
  locationName?: string;
}

export interface Astronaut {
  name: string;
  craft: string;
}

export interface NewsArticle {
  title: string;
  source: { name: string };
  publishedAt: string;
  image: string | null;
  description: string | null;
  url: string;
  category?: string;
}

export interface DashboardContext {
  iss: {
    current: ISSPosition | null;
    history: ISSPosition[];
    astronauts: Astronaut[];
  };
  news: NewsArticle[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
