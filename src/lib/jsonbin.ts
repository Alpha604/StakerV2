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
    const res = await fetch("/api/bin", { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn("Could not fetch bin, returning empty");
      return { users: [], globalBets: [] };
    }
    const json = await res.json();
    return json.record || { users: [], globalBets: [] };
  } catch (error) {
    console.warn("Fetch failed, returning empty data:", error);
    return { users: [], globalBets: [] };
  }
};

export const putBinData = async (data: BinData): Promise<void> => {
  try {
    const res = await fetch("/api/bin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.warn("Failed to update bin");
  } catch (error) {
    console.warn("Put failed:", error);
  }
};
