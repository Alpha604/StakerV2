const BIN_ID = "69eb9c5436566621a8e9f358";
const MASTER_KEY = "$2a$10$IwjzylKTtK7iiXGJPWGTNesdMO8SzFxTZKMlJLu0/3sbpUtGr6kM.";
export const JSONBIN_URL_GET = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
export const JSONBIN_URL_PUT = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

export const getBinData = async (): Promise<BinData> => {
  try {
    const res = await fetch(JSONBIN_URL_GET, {
      cache: "no-store",
      headers: { 
        Accept: "application/json",
        "X-Master-Key": MASTER_KEY 
      },
    });
    if (!res.ok) {
      console.warn("Could not fetch bin, returning empty");
      return { users: [], globalBets: [] };
    }
    const json = await res.json();
    return json.record || { users: [], globalBets: [] };
  } catch (error) {
    console.error(error);
    return { users: [], globalBets: [] };
  }
};

export const putBinData = async (data: BinData): Promise<void> => {
  try {
    const res = await fetch(JSONBIN_URL_PUT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error("Failed to update bin");
    }
  } catch (error) {
    console.error(error);
  }
};
