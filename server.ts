import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), "db.json");

let cachedBinData: { users: any[], globalBets: any[] } = { users: [], globalBets: [] };
let isBinFetched = false;
let flushTimeout: any = null;

async function fetchBinInitial() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    cachedBinData = JSON.parse(data);
    isBinFetched = true;
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.error("Initial bin fetch error", error);
    }
    isBinFetched = true;
  }
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(async () => {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(cachedBinData, null, 2), "utf-8");
    } catch (error) {
      console.error("Bin update error", error);
    } finally {
      flushTimeout = null;
    }
  }, 1000); // lower wait for better reliability
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
  const user = cachedBinData.users.find(u => u.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
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
