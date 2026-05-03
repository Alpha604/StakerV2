import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

const app = express();
const PORT = 3000;

app.use(express.json());

const BIN_ID = "69eb9c5436566621a8e9f358";
const MASTER_KEY = "$2a$10$IwjzylKTtK7iiXGJPWGTNesdMO8SzFxTZKMlJLu0/3sbpUtGr6kM.";
const JSONBIN_URL_GET = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
const JSONBIN_URL_PUT = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let cachedBinData: { users: any[], globalBets: any[] } = { users: [], globalBets: [] };
let isBinFetched = false;
let flushTimeout: any = null;

async function fetchBinInitial() {
  try {
    const res = await fetch(JSONBIN_URL_GET, {
      headers: {
        Accept: "application/json",
        "X-Master-Key": MASTER_KEY
      }
    });
    if (res.ok) {
      const json = await res.json();
      cachedBinData = json.record || { users: [], globalBets: [] };
      isBinFetched = true;
    } else {
       console.error("Failed to fetch initial bin data. Status:", res.status);
    }
  } catch (error: any) {
    console.error("Initial bin fetch error", error);
  }
}

function scheduleFlush() {
  if (flushTimeout || !isBinFetched) return;
  flushTimeout = setTimeout(async () => {
    try {
      await fetch(JSONBIN_URL_PUT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": MASTER_KEY
        },
        body: JSON.stringify(cachedBinData),
      });
    } catch (error) {
      console.error("Bin update error", error);
    } finally {
      flushTimeout = null;
    }
  }, 5000); // Flush every 5s max to JSONBin
}

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/") && !isBinFetched) {
    await fetchBinInitial();
  }
  next();
});

// API Routes
app.get("/api/bin", (req, res) => {
  res.json({ record: cachedBinData });
});

app.put("/api/bin", (req, res) => {
  if (req.body && typeof req.body === "object") {
    cachedBinData = req.body;
    scheduleFlush();
  }
  res.json({ success: true });
});

app.post("/api/user/sync", (req, res) => {
  const { username, balance, vault, totalWagered, totalWon } = req.body;
  const user = cachedBinData.users.find(u => u.username === username);
  if (user) {
    if (balance !== undefined) user.balance = balance;
    if (vault !== undefined) user.vault = vault;
    if (totalWagered !== undefined) user.totalWagered = totalWagered;
    if (totalWon !== undefined) user.totalWon = totalWon;
    scheduleFlush();
  }
  res.json({ success: true });
});

app.get("/api/user/status", (req, res) => {
  const username = req.query.username as string;
  const user = cachedBinData.users.find(u => u.username === username);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.post("/api/user/register", (req, res) => {
  const { username, password } = req.body;
  if (cachedBinData.users.some(u => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const newUser = {
    username,
    password,
    balance: 0,
    vault: 1000,
    totalWagered: 0,
    totalWon: 0
  };
  cachedBinData.users.push(newUser);
  scheduleFlush();
  res.json({ success: true, user: newUser });
});

app.post("/api/user/login", (req, res) => {
  const { username, password } = req.body;
  let user = cachedBinData.users.find(u => u.username === username);
  
  if (!user) {
    if ((username === "romeo" && password === "romeo123") || 
        (username === "Mimi" && password === "mimi123") || 
        (username === "AdminFDJS" && password === "admin123")) {
        user = {
          username,
          password,
          balance: 1000000,
          vault: 0,
          totalWagered: 0,
          totalWon: 0,
          role: "admin",
          status: "approved",
          id: username,
          lastOnline: Date.now()
        };
        cachedBinData.users.push(user);
        scheduleFlush();
    } else {
        return res.status(401).json({ error: "Invalid credentials" });
    }
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  if (user) {
    if ((username === "romeo" || username === "Mimi" || username === "AdminFDJS") && user.role !== "admin") {
      user.role = "admin";
      user.status = "approved";
      scheduleFlush();
    }
    user.lastOnline = Date.now();
  }

  res.json({ success: true, user });
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
