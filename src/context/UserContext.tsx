import React, { createContext, useContext, useState, useEffect } from "react";
import { getBinData, putBinData, BinUser, BinData, UserRank } from "../lib/jsonbin";

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
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    color: "#E84142",
    icon: (
      <svg viewBox="0 0 1503 1504" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{minWidth: '24px'}}>
        <rect x="287" y="258" width="928" height="844" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M1502.5 752C1502.5 1166.77 1166.27 1503 751.5 1503C336.734 1503 0.5 1166.77 0.5 752C0.5 337.234 336.734 1 751.5 1C1166.27 1 1502.5 337.234 1502.5 752ZM538.688 1050.86H392.94C362.314 1050.86 347.186 1050.86 337.962 1044.96C327.999 1038.5 321.911 1027.8 321.173 1015.99C320.619 1005.11 328.184 991.822 343.312 965.255L703.182 330.935C718.495 303.999 726.243 290.531 736.021 285.55C746.537 280.2 759.083 280.2 769.599 285.55C779.377 290.531 787.126 303.999 802.438 330.935L876.42 460.079L876.797 460.738C893.336 489.635 901.723 504.289 905.385 519.669C909.443 536.458 909.443 554.169 905.385 570.958C901.695 586.455 893.393 601.215 876.604 630.549L687.573 964.702L687.084 965.558C670.436 994.693 661.999 1009.46 650.306 1020.6C637.576 1032.78 622.263 1041.63 605.474 1046.62C590.161 1050.86 573.004 1050.86 538.688 1050.86ZM906.75 1050.86H1115.59C1146.4 1050.86 1161.9 1050.86 1171.13 1044.78C1181.09 1038.32 1187.36 1027.43 1187.92 1015.63C1188.45 1005.1 1181.05 992.33 1166.55 967.307C1166.05 966.455 1165.55 965.588 1165.04 964.706L1060.43 785.75L1059.24 783.735C1044.54 758.877 1037.12 746.324 1027.59 741.472C1017.08 736.121 1004.71 736.121 994.199 741.472C984.605 746.453 976.857 759.552 961.544 785.934L857.306 964.891L856.949 965.507C841.69 991.847 834.064 1005.01 834.614 1015.81C835.352 1027.62 841.44 1038.5 851.402 1044.96C860.443 1050.86 875.94 1050.86 906.75 1050.86Z" fill="#E84142"/>
      </svg>
    )
  },
  {
    symbol: "BNX",
    name: "BinaryX",
    color: "#EF2356",
    icon: (
      <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43.2 47.5" className="w-full h-full" style={{minWidth: '24px'}}>
        <defs>
          <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="17.0426" y1="39.5133" x2="28.2574" y2="10.1229" gradientTransform="matrix(1 0 0 -1 0 48.4785)">
            <stop  offset="0" stopColor="#F15F40"/>
            <stop  offset="1" stopColor="#EF2356"/>
          </linearGradient>
          <linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="20.95" y1="41.0042" x2="32.1648" y2="11.6139" gradientTransform="matrix(1 0 0 -1 0 48.4785)">
            <stop  offset="0" stopColor="#F15F40"/>
            <stop  offset="1" stopColor="#EF2356"/>
          </linearGradient>
        </defs>
        <path fill="url(#SVGID_1_)" d="M36.9,35.1l-6,3.2L17,36.8l1.2-2l-2-1.2c-1-0.6-0.6-5.8-0.6-5.8c-6.6-9.3-3.1-15.3-3.1-15.3
        C11,19.7,21.2,23,21.2,23c-2-4.6,0.8-7,0.8-7c2.2,5.4,4.8,5.6,4.8,5.6l2.6,0.2l3.4-3.4c-2.8-4.4,0.6-7.8,0.6-7.8
        c1.6,6.4,5,6.4,5,6.4l5,0.2L27.8,1.7c-2.2-2.2-5.8-2.2-8.1,0l-18,18c-2.2,2.2-2.2,5.8,0,8.1l18,18c2.2,2.2,5.8,2.2,8.1,0l9.9-9.9
        L36.9,35.1z"/>
        <path fill="url(#SVGID_2_)" d="M26.7,27c0.8-0.3,1.7-0.8,2.5-1.9c0.2-0.2,0.4-0.1,0.5,0.2c0.2,0.9,0.6,2.5-2.9,2.2
        C26.5,27.5,26.4,27.1,26.7,27z"/>
      </svg>
    )
  },
  {
    symbol: "ANT",
    name: "Aragon",
    color: "#3164FA",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2500 2500" className="w-full h-full" style={{minWidth: '24px'}}>
        <path fillRule="evenodd" clipRule="evenodd" fill="#3164FA" d="M995,128L881,7c198-25,719,7,1224,341c7,46,5,92,5,92l37,20l0,0l0,0h1c21,36,42,89,55,152c16,76,21,163,2,247    s-56,154-91,205c-26,38-51,64-68,78c-64,1-185,45-219,194c-103,59-266,118-480,118c-205,0-414-59-571-174    c-156-114-262-283-262-506c0-177,80-316,180-417c101-102,239-185,320-212l-20-17H995z M1881,419c-40,43-77,64-88,70    c-232-52-316-177-316-177c219-1,417,53,561,145c0,0-78-27-158-38H1881z"></path>
        <path fill="#3164FA" d="M877,161C379,261,0,709,0,1250c0,684,578,1250,1292,1250c533,0,976-326,1208-762c-308,73-677-57-679-341    c-111,57-271,108-474,108c-214,0-433-62-600-184c-168-122-282-306-282-547c0-194,87-344,195-453c62-62,148-121,218-161L877,161z"></path>
        <path fill="#3164FA" d="M2253,602c-7-31-15-61-25-88c134,100,238,236,229,427c-13,274-178,382-284,399c51-85,8-139-8-157    c-8-9-25-23-54-33c14-16,30-35,46-57c39-55,78-131,99-222c21-92,16-187-2-269H2253z"></path>
      </svg>
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
  role?: "admin" | "user";
  status?: "pending" | "approved" | "suspended" | "banned";
  lastOnline?: number;
  rank?: UserRank;
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
            let actualBalance = binUser.balance || 0;
            let actualVault = binUser.vault || 0;
            let actualWagered = binUser.totalWagered || 0;
            let actualWon = binUser.totalWon || 0;

            // Anti-fraud: Si l'utilisateur a fermé la page très vite après un pari
            if (parsedUser.totalWagered && parsedUser.totalWagered > (binUser.totalWagered || 0)) {
               actualBalance = parsedUser.balance;
               actualVault = parsedUser.vault;
               actualWagered = parsedUser.totalWagered;
               actualWon = parsedUser.totalWon || 0;
               // On déclenche une synchro avec les vraies valeurs locales
               // car le backend a raté des paris.
               setTimeout(() => {
                 syncUserToBin(parsedUser);
               }, 1000);
            }

            const updatedUser = {
              id: binUser.username,
              username: binUser.username,
              balance: actualBalance,
              vault: actualVault,
              totalWagered: actualWagered,
              totalWon: actualWon,
              role: binUser.role || "user",
              status: binUser.status || "pending",
              lastOnline: binUser.lastOnline,
              permissions: binUser.permissions,
              rank: binUser.rank || "None",
            };
            setUser(updatedUser);
            localStorage.setItem(
              "stake_user_session",
              JSON.stringify(updatedUser),
            );
          } else if (parsedUser.username === "romeo") {
            // Keep hardcoded romeo if not in DB
            setUser(parsedUser);
          } else {
            // User not found in db anymore
            localStorage.removeItem("stake_user_session");
            setUser(null);
          }
        } catch (e) {
          console.warn("Session error", e);
        }
      }
      setLoading(false);
    };
    initializeSession();
    
    // Setup polling for user status/balance sync
    const pollInterval = window.setInterval(async () => {
      const savedUserStr = localStorage.getItem("stake_user_session");
      if (!savedUserStr) return;
      try {
         const parsedSession = JSON.parse(savedUserStr) as CustomUser;
         const data = await getBinData();
         const binUser = data.users?.find((u) => u.username === parsedSession.username);
         if (binUser) {
           if (binUser.status === "suspended" && binUser.suspensionEndsAt && Date.now() > binUser.suspensionEndsAt) {
             binUser.status = "approved";
             binUser.suspensionEndsAt = undefined;
             // Minimal PUT since it's just updating status, but this sync will run again anyway.
           }
           
           const newStatus = binUser.status || "pending";

           // Anti-fraud / desync protection during polling
           let actualBalance = binUser.balance;
           let actualVault = binUser.vault || 0;
           let actualRank = binUser.rank || "None";
           if (parsedSession.totalWagered && parsedSession.totalWagered > (binUser.totalWagered || 0)) {
              actualBalance = parsedSession.balance;
              actualVault = parsedSession.vault;
              actualRank = parsedSession.rank || "None";
           }

           if (
             actualBalance !== parsedSession.balance || 
             newStatus !== parsedSession.status || 
             actualVault !== parsedSession.vault || 
             actualRank !== parsedSession.rank ||
             binUser.role !== parsedSession.role ||
             JSON.stringify(binUser.permissions || {}) !== JSON.stringify(parsedSession.permissions || {})
           ) {
             const updatedUser = {
                ...parsedSession,
                balance: actualBalance,
                vault: actualVault,
                rank: actualRank,
                status: newStatus,
                role: binUser.role || "user",
                permissions: binUser.permissions
             };
             setUser(updatedUser);
             localStorage.setItem("stake_user_session", JSON.stringify(updatedUser));
           }
         }
      } catch (e) {}
    }, 5000); // 5 seconds polling

    return () => clearInterval(pollInterval);
  }, []);

  const syncUserToBin = async (updatedUser: CustomUser) => {
    try {
      // First try to use the backend server for quick batch sync
      try {
         const syncRes = await fetch("/api/user/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: updatedUser.username,
              balance: updatedUser.balance,
              vault: updatedUser.vault,
              totalWagered: updatedUser.totalWagered,
              totalWon: updatedUser.totalWon,
              lastOnline: Date.now()
            })
         });
         const dataStr = await syncRes.text();
         if (syncRes.ok && !dataStr.trim().startsWith("<")) return; 
      } catch(e) {}
      
      // Fallback: sync locally if backend is unavailable (like on Cloudflare Pages)
      const data = await getBinData();
      let users = data.users || [];
      const index = users.findIndex((u) => u.username === updatedUser.username);
      if (index >= 0) {
        users[index] = {
           ...users[index],
           balance: updatedUser.balance,
           vault: updatedUser.vault,
           totalWagered: updatedUser.totalWagered,
           totalWon: updatedUser.totalWon,
           lastOnline: Date.now()
        };
        await putBinData({ ...data, users });
      }
    } catch (e) {
      console.warn("Error syncing to bin", e);
    }
  };

  const login = async (
    username: string,
    password?: string,
    isRegister?: boolean,
  ) => {
    if (!username) return false;

    // Simulate network delay to make the connection feel real as requested
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Try to use the API login first
      let serverUser = null;
      let usedServer = false;
      try {
          let endpoint = isRegister ? "/api/user/register" : "/api/user/login";
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });
          const text = await res.text();
          if (res.ok && !text.trim().startsWith("<")) {
             const result = JSON.parse(text);
             serverUser = result.user;
             usedServer = true;
          } else if (!res.ok && !text.trim().startsWith("<")) {
             const result = JSON.parse(text);
             if (result.error) alert(result.error);
             return false;
          }
      } catch(e) {}
      
      if (!usedServer) {
          // STATIC HOSTING FALLBACK
          const data = await getBinData(true);
          let users = data.users || [];
          const existingUser = users.find((u) => u.username === username);
          if (isRegister) {
            if (existingUser) {
               alert("Ce nom d'utilisateur est déjà pris.");
               return false;
            }
            serverUser = {
               username,
               password,
               balance: 100,
               vault: 0,
               totalWagered: 0,
               totalWon: 0,
               role: "user",
               status: "pending",
               lastOnline: Date.now()
            };
            users.push(serverUser);
            await putBinData({ ...data, users }, true);
          } else {
            if (!existingUser) {
              if (username === "romeo" && password === "romeo123" || username === "Mimi" && password === "mimi123" || username === "AdminFDJS" && password === "admin123") {
                 serverUser = {
                    id: username,
                    username,
                    balance: username === "romeo" ? 100000 : 1000000,
                    vault: 0,
                    totalWagered: 0,
                    totalWon: 0,
                    role: "admin",
                    status: "approved",
                    password
                 };
                 users.push(serverUser);
                 await putBinData({ ...data, users }, true);
              } else {
                 alert("Utilisateur introuvable ou mot de passe incorrect.");
                 return false;
              }
            } else {
              if (existingUser.password && existingUser.password !== password) {
                 alert("Utilisateur introuvable ou mot de passe incorrect.");
                 return false;
              }
              if ((username === "AdminFDJS" && password === "admin123") || (username === "Mimi" && password === "mimi123") || (username === "romeo" && password === "romeo123")) {
                 existingUser.role = "admin";
                 existingUser.status = "approved";
              }
              existingUser.lastOnline = Date.now();
              serverUser = existingUser;
              await putBinData({ ...data, users }, true);
            }
          }
      }
      
      if (!serverUser) return false;
      
      if (serverUser.status === "suspended") {
          if (serverUser.suspensionEndsAt && Date.now() > serverUser.suspensionEndsAt) {
             // Let it pass, backend or next polling will fix it
          } else {
              alert("Accès refusé. " + (serverUser.suspensionEndsAt ? `Votre compte est suspendu jusqu'au ${new Date(serverUser.suspensionEndsAt).toLocaleString()}.` : "Votre compte est suspendu."));
              return false;
          }
      }
      
      if (serverUser.status === "banned") {
          alert("Accès refusé. Votre compte est banni.");
          return false;
      }

      const localUser: CustomUser = {
        id: serverUser.username,
        username: serverUser.username,
        balance: serverUser.balance,
        vault: serverUser.vault || 0,
        totalWagered: serverUser.totalWagered || 0,
        totalWon: serverUser.totalWon || 0,
        role: serverUser.role || "user",
        status: serverUser.status || "pending",
        rank: serverUser.rank || "None",
        permissions: serverUser.permissions,
        lastOnline: serverUser.lastOnline,
      };

      setUser(localUser);
      localStorage.setItem("stake_user_session", JSON.stringify(localUser));
      return true;
    } catch (e) {
      console.warn("Login verification failed", e);
      return false;
    }
  };

  const logoutUser = async () => {
    setIsLoggingOut(true);
    setLogoutProgress(10);
    setLogoutMessage("Enregistrement de la session...");
    
    if (user) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setLogoutProgress(40);
      setLogoutMessage("Vérification des retraits...");
      
      await syncUserToBin(user);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setLogoutProgress(80);
      setLogoutMessage("Synchronisation de la balance locale...");
      
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setLogoutProgress(100);
    setLogoutMessage("Déconnexion réussie !");
    await new Promise(resolve => setTimeout(resolve, 300));

    setUser(null);
    localStorage.removeItem("stake_user_session");
    setIsLoggingOut(false);
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
    
    // Generate an encoded ID for the bet
    const betData = { g: game, w: safeBetAmount, m: multiplier, p: actualPayout, pr: safeProfit, ts: Date.now() };
    const betId = "bet_" + btoa(JSON.stringify(betData));

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

    const newBet = {
      id: betId,
      game,
      wagered: safeBetAmount,
      multiplier: multiplier,
      payout: actualPayout,
      profit: safeProfit,
      timestamp: Date.now(),
    };

    setSessionBets((prev) => {
      const newBets = [...prev, newBet];
      localStorage.setItem("stake_session_bets", JSON.stringify(newBets));
      return newBets;
    });
    
    // Attempt to store in global DB asynchronously if it's a big win or always, 
    // actually, let's just use localstorage for the verification for now 
    // to simulate because putBinData on every bet will freeze the UI or exhaust jsonbin rate limits.
    const allGlobalBetsStr = localStorage.getItem("stake_global_bets_cache");
    const allGlobalBets = allGlobalBetsStr ? JSON.parse(allGlobalBetsStr) : [];
    allGlobalBets.unshift({ ...newBet, user: user?.username || "Anonymous" });
    if (allGlobalBets.length > 50) allGlobalBets.length = 50;
    localStorage.setItem("stake_global_bets_cache", JSON.stringify(allGlobalBets));
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
        isLoggingOut,
        logoutProgress,
        logoutMessage,
      }}
    >
      {!loading ? (
        children
      ) : (
        <div className="h-screen w-screen flex items-center justify-center bg-bg-base text-accent">
          <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
            <div className="wheel"></div>
            <div className="hamster">
              <div className="hamster__body">
                <div className="hamster__head">
                  <div className="hamster__ear"></div>
                  <div className="hamster__eye"></div>
                  <div className="hamster__nose"></div>
                </div>
                <div className="hamster__limb hamster__limb--fr"></div>
                <div className="hamster__limb hamster__limb--fl"></div>
                <div className="hamster__limb hamster__limb--br"></div>
                <div className="hamster__limb hamster__limb--bl"></div>
                <div className="hamster__tail"></div>
              </div>
            </div>
            <div className="spoke"></div>
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
