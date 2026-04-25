import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import {
  LogIn,
  LogOut,
  Trophy,
  Menu,
  Bell,
  Search,
  ChevronDown,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";
import { Leaderboard } from "./Leaderboard";
import { WalletModal } from "./WalletModal";
import { LoginModal } from "./LoginModal";

export function Header({
  setView,
  toggleSidebar,
}: {
  setView: (view: any) => void;
  toggleSidebar: () => void;
}) {
  const { user, balance, logoutUser } = useUser();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="h-16 md:h-20 border-b border-border-subtle flex items-center justify-between px-4 md:px-8 bg-bg-panel sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-6">
          <Menu
            className="text-text-secondary cursor-pointer hover:text-white transition-colors"
            onClick={toggleSidebar}
          />
          <div
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setView("home")}
          >
            {/* Real stake logo placeholder, or styled text */}
            <svg
              viewBox="0 0 100 30"
              className="h-8 fill-white hidden sm:block"
            >
              <text
                x="0"
                y="24"
                fontFamily="sans-serif"
                fontSize="26"
                fontWeight="bold"
                fontStyle="italic"
                letterSpacing="-1"
              >
                Stake
              </text>
            </svg>
            <span className="text-xl md:text-2xl font-black italic tracking-tighter text-white font-sans drop-shadow-md sm:hidden">
              Stake
            </span>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4">
            {/* Middle Container for Balance */}
            <div className="flex items-center absolute left-1/2 -translate-x-1/2">
              <div
                onClick={() => setShowWallet(true)}
                className="bg-bg-inner/80 hover:bg-bg-inner border border-transparent hover:border-border-medium pl-4 pr-3 py-2 rounded-l flex items-center gap-2 shadow-inner cursor-pointer transition-colors max-w-[200px]"
              >
                <span className="font-bold text-sm tracking-tight text-white truncate shrink">
                  {balance.toFixed(8)}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-[#f7931a] ml-1"
                >
                  <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.036-1.24 15.525.362 9.095 1.964 2.667 8.475-1.243 14.905.36c6.428 1.602 10.336 8.112 8.732 14.545zM12.012 3.6A8.406 8.406 0 0 0 3.6 12a8.406 8.406 0 0 0 8.412 8.41A8.406 8.406 0 0 0 20.424 12c0-4.646-3.766-8.41-8.412-8.4zM9.46 6.32l.711 2.85-1.424-.356.356 1.425zm1.5 5.92-.09.349-1.393-.348-.356-1.425 1.436.358c2.203.55 3.33-1.077 1.258-1.595-1-.25-1.745.244-1.258-1.705l-1.082-.27.356-1.424 1.393.348c2.316.578 3.568-.783 1.278-1.354-2.29-.572-3.153-1.643-2.072-5.968l1.424.356-.71 2.846c2.89.722 4.137 2.15 3.321 5.412-.816 3.262-3.328 3.57-5.992 2.906l-.75 3.003-1.424-.356z" />
                </svg>
                <ChevronDown
                  size={14}
                  className="text-text-secondary ml-1 mt-1 shrink-0"
                />
              </div>

              <button
                onClick={() => setShowWallet(true)}
                className="bg-[#1475e1] hover:bg-[#1b80f0] text-white text-sm px-4 py-2 rounded-r font-bold transition-colors h-full flex items-center border-l-0"
              >
                Portefeuille
              </button>
            </div>

            <div className="hidden md:flex items-center gap-6 text-text-secondary">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="hover:text-white transition-colors"
                title="Classement Mondial"
              >
                <Trophy size={18} />
              </button>
              <Search
                size={18}
                className="hover:text-white transition-colors cursor-pointer"
                title="Rechercher"
              />
              <div className="relative group cursor-pointer hover:text-white transition-colors">
                <UserIcon size={18} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-panel border border-border-medium rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-3 border-b border-border-subtle text-white font-bold">
                    {user.username}
                  </div>
                  <button
                    onClick={logoutUser}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-red-500 font-bold text-sm"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              </div>
              <Bell
                size={18}
                className="hover:text-white transition-colors cursor-pointer"
                title="Notifications"
              />
              <MessageSquare
                size={18}
                className="hover:text-white transition-colors cursor-pointer"
                title="Chat"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-[#1475e1] hover:bg-[#1b80f0] text-white text-sm px-6 py-2 rounded font-bold transition-colors"
            >
              Connexion / Inscription
            </button>
          </div>
        )}
      </header>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      {showLeaderboard && user && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
}
