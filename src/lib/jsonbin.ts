export const JSONBIN_ID = "69eb9c5436566621a8e9f358";
export const JSONBIN_KEY = "$2a$10$IwjzylKTtK7iiXGJPWGTNesdMO8SzFxTZKMlJLu0/3sbpUtGr6kM.";
export const JSONBIN_URL_GET = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`;
export const JSONBIN_URL_PUT = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

export interface BinUser {
  username: string;
  password?: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
}

export interface BinData {
  users: BinUser[];
  globalBets: any[];
}

export const getBinData = async (): Promise<BinData> => {
  try {
    const res = await fetch(JSONBIN_URL_GET, {
      headers: { "X-Master-Key": JSONBIN_KEY },
      cache: "no-store"
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
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      console.error("Failed to update bin");
    }
  } catch (error) {
    console.error(error);
  }
};
