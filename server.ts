import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const PORT = 3000;

  // Enable CORS for all origins to ensure mobile/external access
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  
  app.use(express.json());

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
  });

  // API Routes
  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(url);
        
        if (response.status === 429 || response.status >= 500) {
          if (retries > 0) {
            console.warn(`Weather API error ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retries - 1, delay * 2);
          }
        }

        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (retries > 0) {
          console.warn(`Fetch error: ${error}. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    try {
      const data = await fetchWithRetry(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto`
      );
      res.json(data);
    } catch (error) {
      console.error("Server-side weather fetch error:", error);
      
      // Fallback data to prevent app failure
      const fallbackData = {
        current: {
          temperature_2m: 25,
          relative_humidity_2m: 50,
          wind_speed_10m: 10,
          precipitation: 0,
          time: new Date().toISOString()
        },
        fallback: true
      };
      
      res.json(fallbackData);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Started successfully`);
    console.log(`[SERVER] Listening on: 0.0.0.0:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Global error handler to capture 403s (must be at the end)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
    if (err.status === 403 || err.statusCode === 403) {
      console.error("403 Forbidden detected. Check Vite allowedHosts or CORS settings.");
    }
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        status: err.status || 500
      });
    }
  });
}

startServer();
