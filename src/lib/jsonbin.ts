export type UserRank = "None" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Champion" | "Grand Champion" | "Supersonic Legend";

export interface BinUser {
  username: string;
  password?: string;
  balance: number;
  vault?: number;
  rank?: UserRank;
  totalWagered: number;
  totalWon: number;
  role?: "admin" | "user";
  status?: "pending" | "approved" | "suspended" | "banned";
  lastOnline?: number;
  suspensionEndsAt?: number;
  permissions?: {
    canDeposit?: boolean;
    canWithdraw?: boolean;
    blockedGames?: Record<string, boolean>;
  };
}

export interface GlobalBet {
  id: string;
  user: string;
  game: string;
  wagered: number;
  multiplier: number;
  payout: number;
  profit: number;
  timestamp: number;
}

export interface BinData {
  users: BinUser[];
  globalBets: GlobalBet[];
}

const BIN_ID = "69eb9c5436566621a8e9f358";
const MASTER_KEY = "$2a$10$IwjzylKTtK7iiXGJPWGTNesdMO8SzFxTZKMlJLu0/3sbpUtGr6kM.";
const JSONBIN_URL_GET = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
const JSONBIN_URL_PUT = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let cachedBinData: BinData | null = null;
let flushTimeout: any = null;

let isFetching = false;
let fetchPromise: Promise<BinData> | null = null;

export const getBinData = async (forceRefetch = false): Promise<BinData> => {
  if (cachedBinData && !forceRefetch) return cachedBinData;
  if (isFetching && fetchPromise) return fetchPromise;

  isFetching = true;
  fetchPromise = (async () => {
    try {
      // D'abord on essaie notre propre backend si dispo (AI Studio ou VPS)
      const resServer = await fetch("/api/bin", { cache: "no-store", headers: { Accept: "application/json" } });
      let dataStr = await resServer.text();
      
      // Si on est sur Cloudflare Pages (serveur statique) le text() retournera l'index.html car il y a un fallback react-router,
      // on détecte donc si ça ressemble à de l'HTML (donc pas de backend)
      if (resServer.ok && !dataStr.trim().startsWith("<")) {
          const json = JSON.parse(dataStr);
          cachedBinData = json.record || { users: [], globalBets: [] };
          isFetching = false;
          return cachedBinData as BinData;
      }
    } catch (e) {
      // Backend not available mapping
    }

    // Le backend n'a pas répondu ou a renvoyé du HTML, on passe en mode direct
    try {
      const res = await fetch(JSONBIN_URL_GET, { 
        headers: { Accept: "application/json", "X-Master-Key": MASTER_KEY } 
      });
      if (!res.ok) {
        console.warn("Could not fetch bin directly, returning empty");
        isFetching = false;
        return { users: [], globalBets: [] };
      }
      const json = await res.json();
      cachedBinData = json.record || { users: [], globalBets: [] };
      isFetching = false;
      return cachedBinData as BinData;
    } catch (error) {
      console.warn("Fetch failed, returning empty data:", error);
      isFetching = false;
      return { users: [], globalBets: [] };
    }
  })();
  
  return fetchPromise;
};

export const putBinData = async (data: BinData, instant = false): Promise<void> => {
  cachedBinData = data;
  
  if (instant) {
    if (flushTimeout) {
       clearTimeout(flushTimeout);
       flushTimeout = null;
    }
    await performPut(data);
    return;
  }
  
  if (flushTimeout) return;
  flushTimeout = setTimeout(async () => {
    await performPut(data);
    flushTimeout = null;
  }, 5000); // 5s debounce for direct client put
};

async function performPut(data: BinData) {
  try {
    // Try Server API first
    const resServer = await fetch("/api/bin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const dataStr = await resServer.text();
    if (resServer.ok && !dataStr.trim().startsWith("<")) {
       return; // OK
    }
  } catch(e) { }
  
  // Fallback to direct call
  try {
    const res = await fetch(JSONBIN_URL_PUT, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.warn("Failed to update bin directly");
  } catch (error) {
    console.warn("Put failed:", error);
  }
}

