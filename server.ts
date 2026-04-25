import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

const JSONBIN_ID = "69eb9c5436566621a8e9f358";
const JSONBIN_KEY = "$2a$10$IwjzylKTtK7iiXGJPWGTNesdMO8SzFxTZKMlJLu0/3sbpUtGr6kM.";
const JSONBIN_URL_GET = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
const JSONBIN_URL_PUT = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// API Routes
app.get("/api/bin", async (req, res) => {
  try {
    const response = await fetch(`${JSONBIN_URL_GET}/latest`, {
      headers: { "X-Master-Key": JSONBIN_KEY },
      cache: "no-store"
    });
    if (!response.ok) {
      if (response.status === 404) {
        return res.json({ record: { users: [], globalBets: [] } });
      }
      return res.status(response.status).json({ error: "Failed to fetch from JSONBin" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Bin fetch error", error);
    res.status(500).json({ error: "Internal error" });
  }
});

app.put("/api/bin", async (req, res) => {
  try {
    const response = await fetch(JSONBIN_URL_PUT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to update JSONBin" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Bin update error", error);
    res.status(500).json({ error: "Internal error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
}

startServer();
