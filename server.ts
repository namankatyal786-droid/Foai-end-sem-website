import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const trimKey = (key: string | undefined) => key?.trim();

const GNEWS_API_KEY = trimKey(process.env.GNEWS_API_KEY);
const HF_TOKEN = trimKey(process.env.HF_TOKEN);

if (!GNEWS_API_KEY) {
  console.warn("⚠️  GNEWS_API_KEY MISSING: Dashboard news will default to archival telemetry.");
}
if (!HF_TOKEN) {
  console.warn("⚠️  HF_TOKEN MISSING: Mission Control AI processing will be offline.");
}

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "uplink active", timestamp: Date.now() });
});

// In-memory caches
const newsCache = new Map<string, { data: any; timestamp: number }>();
const issCache = { data: null as any, timestamp: 0 };
const astroCache = { data: null as any, timestamp: 0 };

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for news
const ISS_CACHE_DURATION = 10 * 1000;  // 10 seconds for ISS
const ASTRO_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for Astros

app.get("/api/news", async (req, res) => {
  const { category = 'space', query = '' } = req.query;
  const cacheKey = `${category}-${query}`;

  const mockData = {
    articles: [
      {
        title: "Mission Update: ISS Continues Global Research Feed",
        source: { name: "Stellaris Command" },
        publishedAt: new Date().toISOString(),
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
        description: "The orbital laboratory maintains its strictly scheduled telemetry broadcast for all ground stations.",
        url: "#"
      },
      {
        title: "Deep Space Relay Connectivity Optimized",
        source: { name: "Astra News" },
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
        description: "New protocols have been implemented to ensure robust data transfer across planetary distances.",
        url: "#"
      }
    ]
  };

  if (!GNEWS_API_KEY || GNEWS_API_KEY === "MY_GNEWS_API_KEY") {
    return res.json(mockData);
  }

  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    const q = query || category || 'space station';
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(String(q))}&lang=en&max=10&token=${GNEWS_API_KEY}`
    );
    
    if (response.status === 403 || response.status === 429) {
      return res.json(mockData);
    }

    if (!response.ok) throw new Error(`GNews Error ${response.status}`);
    const data = await response.json() as any;
    newsCache.set(cacheKey, { data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.error("News error:", error);
    res.json(mockData);
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, context } = req.body;

  if (!HF_TOKEN || HF_TOKEN === "MY_HF_TOKEN") {
    return res.status(401).json({ error: "HF_TOKEN missing" });
  }

  const systemPrompt = `You are ASTRA, the AI mission assistant built into the Stellaris Dashboard — a live ISS tracking and space news web application.

STRICT RULES — FOLLOW THESE WITHOUT EXCEPTION:
1. You ONLY answer questions about the Stellaris Dashboard, its features, and the live data it displays.
2. You have access to REAL-TIME DASHBOARD DATA provided below. Use it to answer questions about the ISS position, crew, speed, and current news.
3. If a user asks ANYTHING unrelated to the dashboard, space station, crew, or space news displayed on this website, respond ONLY with: "I'm ASTRA, the Stellaris Dashboard assistant. I can only help with information displayed on this dashboard — ISS tracking, crew data, and space news feeds. Please ask me about those topics!"
4. NEVER answer general knowledge questions, coding questions, math, or anything outside the dashboard scope.
5. Keep responses concise (2-4 sentences max) and use a professional, slightly futuristic mission-control tone.

ABOUT THIS WEBSITE (Stellaris Dashboard):
- A real-time ISS (International Space Station) tracking dashboard
- Features: Live ISS map tracker, crew manifest, space news feed, analytics charts
- Tabs: TRACKER (live ISS map + crew), NEWS (space news articles), ANALYTICS (charts & graphs)
- Has a dark/light theme toggle
- Data refreshes every 15 seconds for ISS position
- Built with React, uses Leaflet maps, and Recharts for analytics

CURRENT LIVE DASHBOARD DATA:
${JSON.stringify(context, null, 2)}`;

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          model: "Qwen/Qwen3-0.6B:featherless-ai",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API error:", response.status, errorText);
      throw new Error(`AI relay failure: ${response.status}`);
    }
    const result = await response.json() as any;
    res.json(result);
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "AI communication failure" });
  }
});

app.get("/api/iss", async (req, res) => {
  if (issCache.data && Date.now() - issCache.timestamp < ISS_CACHE_DURATION) {
    return res.json(issCache.data);
  }

  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!response.ok) throw new Error("ISS tracking lost");
    const data = await response.json() as any;
    
    // Reverse Geocode on server to avoid CORS/User-Agent issues
    let locationName = "Over Ocean";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for geocoding

      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${data.latitude}&longitude=${data.longitude}&localityLanguage=en`,
        { 
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = await geoRes.json() as any;
        locationName = geoData.city || geoData.principalSubdivision || geoData.countryName || geoData.locality || "Over Ocean";
      }
    } catch (e) {
      // Quiet fail to maintain telemetry flow speed
      locationName = "Uplink Active: Position Verified";
    }

    const transformedData = {
      timestamp: data.timestamp,
      iss_position: { 
        latitude: String(data.latitude), 
        longitude: String(data.longitude) 
      },
      locationName,
      message: "success"
    };

    issCache.data = transformedData;
    issCache.timestamp = Date.now();
    res.json(transformedData);
  } catch (error) {
    console.warn("ISS fallback engaged");
    const fallback = {
      timestamp: Math.floor(Date.now() / 1000),
      iss_position: { latitude: "51.5074", longitude: "-0.1278" },
      locationName: "Safe Mode: London Sector",
      message: "success",
      fallback: true
    };
    res.json(fallback);
  }
});

app.get("/api/astros", async (req, res) => {
  if (astroCache.data && Date.now() - astroCache.timestamp < ASTRO_CACHE_DURATION) {
    return res.json(astroCache.data);
  }

  try {
    const response = await fetch("https://api.open-notify.org/astros.json");
    if (!response.ok) throw new Error("Astro feed error");
    const data = await response.json() as any;
    astroCache.data = data;
    astroCache.timestamp = Date.now();
    res.json(data);
  } catch (error) {
    const mockCrew = {
      people: [
        { name: "Oleg Kononenko", craft: "ISS" },
        { name: "Nikolai Chub", craft: "ISS" },
        { name: "Matthew Dominick", craft: "ISS" },
        { name: "Michael Barratt", craft: "ISS" }
      ],
      number: 4,
      message: "success"
    };
    res.json(mockCrew);
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ 
    error: "Coordinate Not Found", 
    path: req.originalUrl,
    hint: "The relay station is active but this specific telemetry channel is undefined."
  });
});

// Export the Express app for serverless usage
export default app;

// Use dynamic serve logic for Vite/Production
// Only run when executed directly (not when imported by Netlify/Vercel functions)
const isServerless = !!(process.env.NETLIFY || process.env.VERCEL);

if (!isServerless) {
  (async () => {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })();
}
