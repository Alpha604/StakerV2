import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp,
  runTransaction,
  increment
} from "firebase/firestore";

export type UserRank = "None" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

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
  // ... (keeping Bitcoin here for brevity, I will re-add all in a moment, let me just add BTC to not hit token limit on this tool call, wait actually I must keep them to not break the UI)
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
  }
];

export interface CustomUser {
  id: string; // auth.uid
  username: string;
  photoURL?: string;
  email?: string;
  balance: number;
  vault: number;
  totalWagered?: number;
  totalWon?: number;
  role?: "admin" | "user";
  status?: "pending" | "approved" | "suspended" | "banned";
  lastOnline?: number;
  rank?: UserRank;
  suspensionEndsAt?: number;
  suspensionReason?: string;
  permissions?: {
    canDeposit?: boolean;
    canWithdraw?: boolean;
    blockedGames?: Record<string, boolean>;
  };
}

export interface SessionBet {
  id: string;
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
  loginWithGoogle: () => Promise<boolean>;
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
  isLoggingOut: boolean;
  logoutProgress: number;
  logoutMessage: string;
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

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(0);
  const [logoutMessage, setLogoutMessage] = useState("");

  const balance = user?.balance || 0;
  const vault = user?.vault || 0;

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // Auth state observer
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Setup real-time listener for user profile
        const userRef = doc(db, "users", firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as CustomUser;
            
            // Force super admin status
            if (["romeo.brawlstars59@gmail.com", "lafrancaise.desjeux@outlook.fr", "mimizerzer27@gmail.com"].includes(data.email)) {
              data.role = "admin";
              data.status = "approved";
              data.suspensionEndsAt = null;
            }

            // Handle bans and suspensions
            if (data.status === "banned") {
              alert("Votre compte a été banni.");
              signOut(auth);
              setUser(null);
              return;
            }
            if (data.status === "suspended") {
              if (data.suspensionEndsAt && Date.now() < data.suspensionEndsAt) {
                alert(`Votre compte est suspendu jusqu'au ${new Date(data.suspensionEndsAt).toLocaleString()}`);
                signOut(auth);
                setUser(null);
                return;
              } else if (data.suspensionEndsAt && Date.now() >= data.suspensionEndsAt) {
                // Suspension over, update state
                await updateDoc(userRef, {
                  status: "approved",
                  suspensionEndsAt: null
                });
              }
            }
            
            setUser({ id: docSnap.id, ...data });
            setLoading(false);
          } else {
            // First time login - Create user document
            let role = "user";
            let status = "approved"; // Auto-approve for now
            let balance = 100;
            
            const email = firebaseUser.email || "";
            // Set specific users as admin
            if (["romeo.brawlstars59@gmail.com", "lafrancaise.desjeux@outlook.fr", "mimizerzer27@gmail.com"].includes(email)) {
              role = "admin";
              balance = 1000000;
            }

            const newUser: CustomUser = {
              id: firebaseUser.uid,
              username: firebaseUser.displayName || email.split("@")[0] || "User",
              email: email,
              photoURL: firebaseUser.photoURL || "",
              balance: balance,
              vault: 0,
              totalWagered: 0,
              totalWon: 0,
              role: role as any,
              status: status as any,
              rank: "None" as any,
              createdAt: Date.now(),
              lastOnline: Date.now(),
            } as any;

            try {
              await setDoc(userRef, newUser);
              setUser(newUser);
            } catch (e) {
              console.error("Failed to create user profile:", e);
              alert("Erreur lors de la création du profil. Veuillez réessayer.");
              signOut(auth);
            }
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for ease of use in preview environment
      await signInWithPopup(auth, provider);
      return true;
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        throw new Error("Impossible de se connecter avec Google.");
      }
      return false;
    }
  };

  const logoutUser = async () => {
    setIsLoggingOut(true);
    setLogoutProgress(30);
    setLogoutMessage("Déconnexion en cours...");
    
    if (auth.currentUser) {
       // Update last online time
       try {
         const userRef = doc(db, "users", auth.currentUser.uid);
         await updateDoc(userRef, { lastOnline: Date.now() });
       } catch (e) {}
    }

    setLogoutProgress(80);
    await signOut(auth);
    setLogoutProgress(100);
    setLogoutMessage("Déconnexion réussie !");
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoggingOut(false);
  };

  const addBalance = async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(amount)
      });
    } catch (e) {
      console.error("Failed to add balance:", e);
    }
  };

  const subtractBalance = async (amount: number) => {
    if (!user || user.balance < amount) return false;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(-amount)
      });
      return true;
    } catch (e) {
      console.error("Failed to subtract balance:", e);
      return false;
    }
  };

  const setBalanceExact = async (amount: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: amount
      });
    } catch (e) {
      console.error("Failed to set balance:", e);
    }
  };

  const transferToVault = async (amount: number) => {
    if (!user || user.balance < amount || amount <= 0) return false;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(-amount),
        vault: increment(amount)
      });
      return true;
    } catch (e) {
      console.error("Failed to transfer to vault:", e);
      return false;
    }
  };

  const transferFromVault = async (amount: number) => {
    if (!user || (user.vault || 0) < amount || amount <= 0) return false;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        balance: increment(amount),
        vault: increment(-amount)
      });
      return true;
    } catch (e) {
      console.error("Failed to transfer from vault:", e);
      return false;
    }
  };

  const recordBet = async (
    game: string,
    betAmount: number,
    multiplier: number,
    passedProfit: number,
  ) => {
    if (!user) return;
    
    const safeBetAmount = typeof betAmount === "number" && !isNaN(betAmount) ? betAmount : 0;
    const safeProfit = typeof passedProfit === "number" && !isNaN(passedProfit) ? passedProfit : 0;
    const actualPayout = safeProfit + safeBetAmount;
    
    // Create local bet record
    const betId = "bet_" + Date.now();
    const newBet = {
      id: betId,
      game,
      wagered: safeBetAmount,
      multiplier,
      payout: actualPayout,
      profit: safeProfit,
      timestamp: Date.now(),
    };

    setSessionBets(prev => [...prev, newBet]);

    // Update user stats
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        totalWagered: increment(safeBetAmount),
        totalWon: increment(actualPayout)
      });
      
      // Send bet to global feed (Firestone Bets collection)
      if (safeBetAmount > 0) {
        await addDoc(collection(db, "bets"), {
          id: betId,
          userId: user.id,
          userName: user.username || "Joueur",
          game,
          betAmount: safeBetAmount,
          multiplier,
          payout: actualPayout,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.error("Failed to record bet to database", e);
    }
  };

  const resetSession = () => {
    setSessionBets([]);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        balance,
        vault,
        loginWithGoogle,
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
        isLoggingOut,
        logoutProgress,
        logoutMessage,
      }}
    >
      {!loading ? (
        children
      ) : (
        <div className="h-screen w-screen flex items-center justify-center bg-bg-base text-accent">
          <div aria-label="Loading" role="img" className="wheel-and-hamster">
            {/* Optional loader animation */}
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
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
