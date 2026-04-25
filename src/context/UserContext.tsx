import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBinData, putBinData, BinUser, BinData } from '../lib/jsonbin';

export interface CustomUser {
  id: string; // we'll just use username as id now
  username: string;
  balance: number;
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
  login: (username: string, password?: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  addBalance: (amount: number) => Promise<void>;
  subtractBalance: (amount: number) => Promise<boolean>;
  setBalanceExact: (amount: number) => Promise<void>;
  recordBet: (game: string, betAmount: number, multiplier: number, profit: number) => Promise<void>;
  sessionBets: SessionBet[];
  resetSession: () => void;
  showSessionStats: boolean;
  setShowSessionStats: (show: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [sessionBets, setSessionBets] = useState<SessionBet[]>([]);
  const [showSessionStats, setShowSessionStats] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      const savedUser = localStorage.getItem('stake_user_session');
      const savedBets = localStorage.getItem('stake_session_bets');
      
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
          const binUser = data.users?.find(u => u.username === parsedUser.username);
          if (binUser) {
            const updatedUser = {
              id: binUser.username,
              username: binUser.username,
              balance: binUser.balance,
              totalWagered: binUser.totalWagered || 0,
              totalWon: binUser.totalWon || 0
            };
            setUser(updatedUser);
            setBalance(updatedUser.balance);
            localStorage.setItem('stake_user_session', JSON.stringify(updatedUser));
          } else {
            // User not found in db anymore
            localStorage.removeItem('stake_user_session');
            setUser(null);
            setBalance(0);
          }
        } catch (e) {
          console.error('Session error', e);
        }
      }
      setLoading(false);
    };
    initializeSession();
  }, []);

  const syncUserToBin = async (updatedUser: CustomUser) => {
    // We do not wait for this to finish to keep UI fast
    getBinData().then(data => {
      if (!data.users) data.users = [];
      const userIndex = data.users.findIndex(u => u.username === updatedUser.username);
      if (userIndex >= 0) {
        data.users[userIndex].balance = updatedUser.balance;
        data.users[userIndex].totalWagered = updatedUser.totalWagered || 0;
        data.users[userIndex].totalWon = updatedUser.totalWon || 0;
      }
      putBinData(data);
    });
  };

  const saveUserLocal = (updatedUser: CustomUser) => {
    setUser(updatedUser);
    setBalance(updatedUser.balance);
    localStorage.setItem('stake_user_session', JSON.stringify(updatedUser));
    syncUserToBin(updatedUser);
  };

  const login = async (username: string, password?: string) => {
    if (username.length < 3) return false;
    
    // Fetch from JsonBin
    const data = await getBinData();
    if (!data.users) data.users = [];
    
    let binUser = data.users.find(u => u.username === username);
    
    if (binUser) {
      // Check password
      if (binUser.password !== password) {
        return false; // Wrong password
      }
    } else {
      // Register new user
      binUser = {
        username,
        password,
        balance: 1000,
        totalWagered: 0,
        totalWon: 0
      };
      data.users.push(binUser);
      await putBinData(data);
    }

    const localUser: CustomUser = {
      id: binUser.username,
      username: binUser.username,
      balance: binUser.balance,
      totalWagered: binUser.totalWagered,
      totalWon: binUser.totalWon,
    };
    
    setUser(localUser);
    setBalance(localUser.balance);
    localStorage.setItem('stake_user_session', JSON.stringify(localUser));
    return true;
  };

  const logoutUser = async () => {
    setUser(null);
    setBalance(0);
    localStorage.removeItem('stake_user_session');
  };

  const addBalance = async (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: user.balance + amount };
    saveUserLocal(updated);
  };

  const subtractBalance = async (amount: number) => {
    if (!user) return false;
    if (balance < amount) return false;
    
    const updated = { ...user, balance: user.balance - amount };
    saveUserLocal(updated);
    return true;
  };

  const setBalanceExact = async (amount: number) => {
    if (!user) return;
    const updated = { ...user, balance: amount };
    saveUserLocal(updated);
  };

  const recordBet = async (game: string, betAmount: number, multiplier: number, passedProfit: number) => {
    if (!user) return;
    
    const safeBetAmount = typeof betAmount === 'number' && !isNaN(betAmount) ? betAmount : 0;
    const safeProfit = typeof passedProfit === 'number' && !isNaN(passedProfit) ? passedProfit : 0;
    const actualPayout = safeProfit + safeBetAmount;

    // Update global stat
    const updatedUser = { 
       ...user, 
       totalWagered: (user.totalWagered || 0) + safeBetAmount,
       totalWon: (user.totalWon || 0) + actualPayout
    };
    saveUserLocal(updatedUser);

    setSessionBets(prev => {
      const newBets = [...prev, {
        game,
        wagered: safeBetAmount,
        multiplier: multiplier,
        payout: actualPayout,
        profit: safeProfit,
        timestamp: Date.now()
      }];
      localStorage.setItem('stake_session_bets', JSON.stringify(newBets));
      return newBets;
    });
  };

  const resetSession = () => {
    setSessionBets([]);
    localStorage.removeItem('stake_session_bets');
  };

  return (
    <UserContext.Provider value={{ user, loading, balance, login, logoutUser, addBalance, subtractBalance, setBalanceExact, recordBet, sessionBets, resetSession, showSessionStats, setShowSessionStats }}>
      {!loading ? children : <div className="h-screen w-screen flex items-center justify-center bg-bg-base text-accent"><div className="animate-spin text-4xl">💰</div></div>}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
