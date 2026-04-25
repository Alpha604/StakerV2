export const JSONBIN_URL_GET = `/api/bin`;
export const JSONBIN_URL_PUT = `/api/bin`;

export interface BinUser {
  username: string;
  password?: string;
  balance: number;
  vault?: number;
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
      cache: "no-store",
      headers: { Accept: "application/json" },
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
