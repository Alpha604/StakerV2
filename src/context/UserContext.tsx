import React, { createContext, useContext, useState, useEffect } from "react";
import { getBinData, putBinData, BinUser, BinData } from "../lib/jsonbin";

export interface CryptoType {
  symbol: string;
  name: string;
  color: string;
  icon: string | React.ReactNode;
}

export const renderCryptoIcon = (crypto: CryptoType, className: string = "w-4 h-4") => {
  if (typeof crypto.icon === 'string') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill={crypto.color}>
        <path d={crypto.icon} />
      </svg>
    );
  }
  return <div className={className} style={{color: crypto.color, display: 'flex', alignItems: 'center'}}>{crypto.icon}</div>;
};

export const CRYPTOS: CryptoType[] = [
  { 
    symbol: "BTC", 
    name: "Bitcoin", 
    color: "#f7931a", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox=".004 0 63.993 64" className="w-full h-full" style={{minWidth: '24px'}}>
        <path fill="#f7931a" d="M63.04 39.741c-4.274 17.143-21.638 27.575-38.783 23.301C7.12 58.768-3.313 41.404.962 24.262 5.234 7.117 22.597-3.317 39.737.957c17.144 4.274 27.576 21.64 23.302 38.784z"></path>
        <path fill="#fff" d="M46.11 27.441c.636-4.258-2.606-6.547-7.039-8.074l1.438-5.768-3.512-.875-1.4 5.616c-.922-.23-1.87-.447-2.812-.662l1.41-5.653-3.509-.875-1.439 5.766c-.764-.174-1.514-.346-2.242-.527l.004-.018-4.842-1.209-.934 3.75s2.605.597 2.55.634c1.422.355 1.68 1.296 1.636 2.042l-1.638 6.571c.098.025.225.061.365.117l-.37-.092-2.297 9.205c-.174.432-.615 1.08-1.609.834.035.051-2.552-.637-2.552-.637l-1.743 4.02 4.57 1.139c.85.213 1.683.436 2.502.646l-1.453 5.835 3.507.875 1.44-5.772c.957.26 1.887.5 2.797.726L27.504 50.8l3.511.875 1.453-5.823c5.987 1.133 10.49.676 12.383-4.738 1.527-4.36-.075-6.875-3.225-8.516 2.294-.531 4.022-2.04 4.483-5.157zM38.087 38.69c-1.086 4.36-8.426 2.004-10.807 1.412l1.928-7.729c2.38.594 10.011 1.77 8.88 6.317zm1.085-11.312c-.99 3.966-7.1 1.951-9.083 1.457l1.748-7.01c1.983.494 8.367 1.416 7.335 5.553z"></path>
      </svg>
    )
  },
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    color: "#627eea", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="#627eea" style={{minWidth: '24px'}}>
         <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.369 4.35zm.056-17.97v12.2l7.354-4.34L12 0zm0 12.2L4.646 7.86 12 0v12.2z" />
      </svg>
    )
  },
  { 
    symbol: "LTC", 
    name: "Litecoin", 
    color: "#fc2a02", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full" style={{minWidth: '24px'}}>
        <defs>
          <linearGradient id="a_ltc" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#ffb508"></stop>
            <stop offset="1" stopColor="#fc2a02"></stop>
          </linearGradient>
        </defs>
        <g transform="translate(-14902 -1402)">
          <circle cx="256" cy="256" r="256" fill="url(#a_ltc)" transform="translate(14902 1402)"></circle>
          <g>
            <path fill="#fff" d="m15141.51 1741.616 17.916-67.463 42.417-15.5 10.551-39.648-.36-.984-41.754 15.254 30.084-113.275h-85.319l-39.34 147.831-32.849 12L15032 1720.7l32.823-11.99-23.187 87.124h227.069l14.557-54.223h-141.752"></path>
          </g>
        </g>
      </svg>
    )
  },
  { 
    symbol: "STEEM", 
    name: "Steem", 
    color: "#195199", 
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" className="w-full h-full" style={{minWidth: '24px'}}>
        <linearGradient id="SVGID_steem" x1="11.862" x2="116.138" y1="11.862" y2="116.138" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#195199"/><stop offset="1" stopColor="#1F417E"/></linearGradient><path fill="url(#SVGID_steem)" d="M87.5 128h-47C18.1 128 0 109.9 0 87.5v-47C0 18.1 18.1 0 40.5 0h47C109.9 0 128 18.1 128 40.5v47c0 22.4-18.1 40.5-40.5 40.5z"/><g opacity=".2"><path d="M64.2 19.8c-.3 2.4-.5 4.4-.7 6.4-.9 6.7-.3 13.2 2.8 19.3 4.1 8.3 8 16.7 11.9 25.1 2.4 5.1 4.6 10.4 5.7 16 .5 2.6.3 5.1-1 7.5-3.9 6.8-9 12.5-15 17.4-.6.4-1.4.6-2.1.8 0-.7-.1-1.5.1-2.2.8-3.2 1.8-6.4 2.5-9.6.9-4.1.5-8.2-1.2-12.1-3.2-7-6.5-14-9.8-21C54.2 60.7 51 54.1 49 47c-1-3.7-1.8-7.4 0-11.1 3.1-6.5 7.9-11.4 13.7-15.5.3-.2.7-.3 1.5-.6zM35 29.7c0 .7.1 1.2 0 1.7-.5 4.1-1.1 8.2-.3 12.3.3 1.8.9 3.5 1.7 5.1 3.2 7 6.7 13.9 9.8 20.9 1.8 4 3.1 8.2 4.4 12.4.6 2 .3 4-.7 5.9-3 5.3-7.1 9.9-11.8 13.7-.4.4-1 .6-1.5.9-.1-.1-.2-.1-.4-.2.1-.6.1-1.3.3-1.9.6-2.5 1.4-5 1.9-7.6.7-3.1.4-6.3-1-9.2-2.9-6.4-5.9-12.8-8.9-19.2-2.3-4.9-4.5-9.8-5.7-15.2-.7-3.1-.3-5.9 1.3-8.5 2.4-4.1 5.6-7.4 9.4-10.2.3-.3.8-.5 1.5-.9zM94.1 30.1c-.1 1.3-.3 2.5-.4 3.8-.5 3.6-.8 7.3.2 10.9.8 2.7 2 5.4 3.2 8 3.4 7.5 7 14.9 10.3 22.5 1.1 2.5 1.7 5.3 2.2 8 .2 1.3 0 2.9-.6 4.1-2.9 5.8-7.2 10.4-12.3 14.5-.4.3-.9.5-1.7.9.1-.9.1-1.5.3-2.1.7-3 1.5-6 2.1-9 .6-2.8 0-5.6-1.2-8.2-3-6.4-6-12.8-9-19.3-2.3-4.9-4.4-9.8-5.6-15.1-.7-3.1-.1-5.9 1.5-8.5 2.4-3.9 5.6-7.2 9.3-9.9.4-.3.9-.5 1.3-.7.2-.1.3 0 .4.1z"/></g><path fill="#fff" d="M62.2 17.8c-.3 2.4-.5 4.4-.7 6.4-.9 6.7-.3 13.2 2.8 19.3 4.1 8.3 8 16.7 11.9 25.1 2.4 5.1 4.6 10.4 5.7 16 .5 2.6.3 5.1-1 7.5-3.9 6.8-9 12.5-15 17.4-.6.4-1.4.6-2.1.8 0-.7-.1-1.5.1-2.2.8-3.2 1.8-6.4 2.5-9.6.9-4.1.5-8.2-1.2-12.1-3.2-7-6.5-14-9.8-21C52.2 58.7 49 52.1 47 45c-1-3.7-1.8-7.4 0-11.1 3.1-6.5 7.9-11.4 13.7-15.5.3-.2.7-.3 1.5-.6zM33 27.7c0 .7.1 1.2 0 1.7-.5 4.1-1.1 8.2-.3 12.3.3 1.8.9 3.5 1.7 5.1 3.2 7 6.7 13.9 9.8 20.9 1.8 4 3.1 8.2 4.4 12.4.6 2 .3 4-.7 5.9-3 5.3-7.1 9.9-11.8 13.7-.4.4-1 .6-1.5.9-.1-.1-.2-.1-.4-.2.1-.6.1-1.3.3-1.9.6-2.5 1.4-5 1.9-7.6.7-3.1.4-6.3-1-9.2-2.9-6.4-5.9-12.8-8.9-19.2-2.3-4.9-4.5-9.8-5.7-15.2-.7-3.1-.3-5.9 1.3-8.5 2.4-4.1 5.6-7.4 9.4-10.2.3-.3.8-.5 1.5-.9zM92.1 28.1c-.1 1.3-.3 2.5-.4 3.8-.5 3.6-.8 7.3.2 10.9.8 2.7 2 5.4 3.2 8 3.4 7.5 7 14.9 10.3 22.5 1.1 2.5 1.7 5.3 2.2 8 .2 1.3 0 2.9-.6 4.1-2.9 5.8-7.2 10.4-12.3 14.5-.4.3-.9.5-1.7.9.1-.9.1-1.5.3-2.1.7-3 1.5-6 2.1-9 .6-2.8 0-5.6-1.2-8.2-3-6.4-6-12.8-9-19.3-2.3-4.9-4.4-9.8-5.6-15.1-.7-3.1-.1-5.9 1.5-8.5 2.4-3.9 5.6-7.2 9.3-9.9.4-.3.9-.5 1.3-.7.2-.1.3 0 .4.1z"/></svg>
    )
  }
];

export interface CustomUser {
  id: string; // we'll just use username as id now
  username: string;
  balance: number;
  vault: number;
  totalWagered?: number;
  totalWon?: number;
}

interface SessionBet {
  game: string;
  wagered: number;
  multiplier: number;
  payout: number;
  profit: number;
  timestamp: number;
}

interface UserContextType {
  user: CustomUser | null;
  loading: boolean;
  balance: number;
  vault: number;
  login: (
    username: string,
    password?: string,
    isRegister?: boolean,
  ) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  addBalance: (amount: number) => Promise<void>;
  subtractBalance: (amount: number) => Promise<boolean>;
  setBalanceExact: (amount: number) => Promise<void>;
  transferToVault: (amount: number) => Promise<boolean>;
  transferFromVault: (amount: number) => Promise<boolean>;
  recordBet: (
    game: string,
    betAmount: number,
    multiplier: number,
    profit: number,
  ) => Promise<void>;
  sessionBets: SessionBet[];
  resetSession: () => void;
  showSessionStats: boolean;
  setShowSessionStats: (show: boolean) => void;
  activeCrypto: CryptoType;
  setActiveCrypto: (c: CryptoType) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionBets, setSessionBets] = useState<SessionBet[]>([]);
  const [showSessionStats, setShowSessionStats] = useState(false);
  const [activeCrypto, setActiveCrypto] = useState<CryptoType>(CRYPTOS[0]);

  const balance = user?.balance || 0;
  const vault = user?.vault || 0;

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem("stake_user_session");
      const savedBets = localStorage.getItem("stake_session_bets");

      if (savedBets) {
        try {
          setSessionBets(JSON.parse(savedBets));
        } catch (e) {}
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as CustomUser;
          // Refresh user data from bin
          const data = await getBinData();
          const binUser = data.users?.find(
            (u) => u.username === parsedUser.username,
          );
          if (binUser) {
            const updatedUser = {
              id: binUser.username,
              username: binUser.username,
              balance: binUser.balance || 0,
              vault: binUser.vault || 0,
              totalWagered: binUser.totalWagered || 0,
              totalWon: binUser.totalWon || 0,
            };
            setUser(updatedUser);
            localStorage.setItem(
              "stake_user_session",
              JSON.stringify(updatedUser),
            );
          } else {
            // User not found in db anymore
            localStorage.removeItem("stake_user_session");
            setUser(null);
          }
        } catch (e) {
          console.error("Session error", e);
        }
      }
      setLoading(false);
    };
    initializeSession();
  }, []);

  const syncUserToBin = async (updatedUser: CustomUser) => {
    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    }).catch(console.error);

    // Also sync to our robust local fallback
    const allUsersStr = localStorage.getItem("stake_all_users") || "{}";
    const allUsers = JSON.parse(allUsersStr);
    if (allUsers[updatedUser.username]) {
      allUsers[updatedUser.username] = {
        ...allUsers[updatedUser.username],
        ...updatedUser,
      };
      localStorage.setItem("stake_all_users", JSON.stringify(allUsers));
    }
  };

  const login = async (
    username: string,
    password?: string,
    isRegister?: boolean,
  ) => {
    if (username.length < 3) return false;

    // Always create a generic user first via local
    const localUser: CustomUser = {
      id: username,
      username: username,
      balance: isRegister ? 100 : 0, // give some initial balance
      vault: 1000,
      totalWagered: 0,
      totalWon: 0,
    };

    try {
      if (isRegister) {
        const res = await fetch("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          const data = await res.json();
          localUser.balance = data.user?.balance ?? 100;
          localUser.vault = data.user?.vault ?? 1000;
        } else if (res.status === 400 || res.status === 401) {
          return false;
        } else {
          throw new Error("API not ok");
        }
      } else {
        const res = await fetch("/api/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          const data = await res.json();
          localUser.balance = data.user?.balance ?? 0;
          localUser.vault = data.user?.vault ?? 1000;
          localUser.totalWagered = data.user?.totalWagered ?? 0;
          localUser.totalWon = data.user?.totalWon ?? 0;
        } else if (res.status === 400 || res.status === 401) {
          return false;
        } else {
          throw new Error("API not ok");
        }
      }
    } catch (e) {
      console.warn("API Error, utilizing local storage user base");
      const allUsersStr = localStorage.getItem("stake_all_users") || "{}";
      const allUsers = JSON.parse(allUsersStr);

      if (isRegister) {
        if (allUsers[username]) {
          return false; // user exists
        }
        allUsers[username] = { ...localUser, password }; // storing pw just locally for simple match
        localStorage.setItem("stake_all_users", JSON.stringify(allUsers));
      } else {
        const found = allUsers[username];
        if (!found) {
          // Auto register the user if they don't exist in local storage to make demo smooth
          allUsers[username] = { ...localUser, password };
          localStorage.setItem("stake_all_users", JSON.stringify(allUsers));
        } else if (found.password !== password && password !== "") {
          return false;
        } else {
          localUser.balance = found.balance;
          localUser.vault = found.vault;
          localUser.totalWagered = found.totalWagered;
          localUser.totalWon = found.totalWon;
        }
      }
    }

    setUser(localUser);
    localStorage.setItem("stake_user_session", JSON.stringify(localUser));
    return true;
  };

  const logoutUser = async () => {
    setUser(null);
    localStorage.removeItem("stake_user_session");
  };

  const addBalance = async (amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, balance: prev.balance + amount };
      localStorage.setItem("stake_user_session", JSON.stringify(next));
      syncUserToBin(next);
      return next;
    });
  };

  const subtractBalance = async (amount: number) => {
    return new Promise<boolean>((resolve) => {
      setUser((prev) => {
        if (!prev || prev.balance < amount) {
          resolve(false);
          return prev;
        }
        const next = { ...prev, balance: prev.balance - amount };
        localStorage.setItem("stake_user_session", JSON.stringify(next));
        syncUserToBin(next);
        resolve(true);
        return next;
      });
    });
  };

  const setBalanceExact = async (amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, balance: amount };
      localStorage.setItem("stake_user_session", JSON.stringify(next));
      syncUserToBin(next);
      return next;
    });
  };

  const transferToVault = async (amount: number) => {
    return new Promise<boolean>((resolve) => {
      setUser((prev) => {
        if (!prev || prev.balance < amount || amount <= 0) {
          resolve(false);
          return prev;
        }
        const next = {
          ...prev,
          balance: prev.balance - amount,
          vault: (prev.vault || 0) + amount,
        };
        localStorage.setItem("stake_user_session", JSON.stringify(next));
        syncUserToBin(next);
        resolve(true);
        return next;
      });
    });
  };

  const transferFromVault = async (amount: number) => {
    return new Promise<boolean>((resolve) => {
      setUser((prev) => {
        if (!prev || (prev.vault || 0) < amount || amount <= 0) {
          resolve(false);
          return prev;
        }
        const next = {
          ...prev,
          balance: prev.balance + amount,
          vault: (prev.vault || 0) - amount,
        };
        localStorage.setItem("stake_user_session", JSON.stringify(next));
        syncUserToBin(next);
        resolve(true);
        return next;
      });
    });
  };

  const recordBet = async (
    game: string,
    betAmount: number,
    multiplier: number,
    passedProfit: number,
  ) => {
    const safeBetAmount =
      typeof betAmount === "number" && !isNaN(betAmount) ? betAmount : 0;
    const safeProfit =
      typeof passedProfit === "number" && !isNaN(passedProfit)
        ? passedProfit
        : 0;
    const actualPayout = safeProfit + safeBetAmount;

    setUser((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        totalWagered: (prev.totalWagered || 0) + safeBetAmount,
        totalWon: (prev.totalWon || 0) + actualPayout,
      };
      localStorage.setItem("stake_user_session", JSON.stringify(next));
      syncUserToBin(next);
      return next;
    });

    setSessionBets((prev) => {
      const newBets = [
        ...prev,
        {
          game,
          wagered: safeBetAmount,
          multiplier: multiplier,
          payout: actualPayout,
          profit: safeProfit,
          timestamp: Date.now(),
        },
      ];
      localStorage.setItem("stake_session_bets", JSON.stringify(newBets));
      return newBets;
    });
  };

  const resetSession = () => {
    setSessionBets([]);
    localStorage.removeItem("stake_session_bets");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        balance,
        vault,
        login,
        logoutUser,
        addBalance,
        subtractBalance,
        setBalanceExact,
        transferToVault,
        transferFromVault,
        recordBet,
        sessionBets,
        resetSession,
        showSessionStats,
        setShowSessionStats,
        activeCrypto,
        setActiveCrypto,
      }}
    >
      {!loading ? (
        children
      ) : (
        <div className="h-screen w-screen flex items-center justify-center bg-bg-base text-accent">
          <div className="animate-spin text-4xl">💰</div>
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
