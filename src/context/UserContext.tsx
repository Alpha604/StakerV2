import React, { createContext, useContext, useState, useEffect } from "react";
import { getBinData, putBinData, BinUser, BinData } from "../lib/jsonbin";

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionBets, setSessionBets] = useState<SessionBet[]>([]);
  const [showSessionStats, setShowSessionStats] = useState(false);

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
