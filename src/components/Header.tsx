import React, { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../lib/utils";
import { useUser, CRYPTOS, CryptoType, renderCryptoIcon } from "../context/UserContext";
import { RankBadge } from "./RankBadge";
import { motion, useAnimation } from "motion/react";
import {
  Trophy,
  Menu,
  ChevronDown,
  Wallet,
  MessageSquare
} from "lucide-react";
import { Leaderboard } from "./Leaderboard";
import { CryptoModal } from "./CryptoModal";
import { WalletModal } from "./WalletModal";
import { LoginModal } from "./LoginModal";

export function Header({
  setView,
  toggleSidebar,
  toggleChat,
}: {
  setView: (view: any) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
}) {
  const { user, balance, setShowLogoutConfirm, activeCrypto, setActiveCrypto } = useUser() as any;
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);

  const prevBalanceRef = useRef(balance);
  const controls = useAnimation();
  const [balanceColor, setBalanceColor] = useState("text-white");

  useEffect(() => {
    if (balance > prevBalanceRef.current) {
      setBalanceColor("text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]");
      controls.start({
        scale: [1, 1.25, 1],
        transition: { duration: 0.4, type: "spring", stiffness: 300, damping: 10 }
      });
    } else if (balance < prevBalanceRef.current) {
      setBalanceColor("text-rose-400");
      controls.start({
        scale: [1, 0.9, 1],
        transition: { duration: 0.3 }
      });
    }
    
    if (balance !== prevBalanceRef.current) {
        setTimeout(() => setBalanceColor("text-white"), 800);
    }
    
    prevBalanceRef.current = balance;
  }, [balance, controls]);

  return (
    <>
      <header className="h-16 md:h-20 border-b border-border-subtle flex items-center justify-between px-4 md:px-8 bg-bg-panel sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <Menu
            className="text-text-secondary cursor-pointer hover:text-white transition-colors"
            onClick={toggleSidebar}
          />
          <div
            className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setView("home")}
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
              alt="Stake Logo" 
              className="h-6 md:h-7 brightness-[100] invert drop-shadow-md hidden sm:block"
            />
            {user && user.status !== "approved" && user.role !== "admin" && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  user.status === 'suspended' ? 'bg-[#f6c722]/20 text-[#f6c722]' :
                  user.status === 'banned' ? 'bg-red-500/20 text-red-500' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.status}
                </span>
            )}
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end sm:flex-none sm:justify-start">
            {/* Middle Container for Balance */}
            <div className="flex items-stretch h-10 shadow-md rounded sm:absolute sm:left-1/2 sm:-translate-x-1/2 mr-2 sm:mr-0 min-w-0">
              <div
                className="bg-bg-inner/80 hover:bg-bg-inner border border-transparent hover:border-border-medium pl-3 pr-2 py-2 rounded-l flex items-center gap-1 sm:gap-2 shadow-inner cursor-pointer transition-colors max-w-[120px] sm:max-w-[200px]"
                onClick={() => setShowCryptoModal(true)}
              >
                <motion.span 
                  animate={controls}
                  className={`font-bold text-sm sm:text-lg tracking-tight truncate shrink transition-colors duration-300 ${balanceColor}`}
                >
                  {formatCurrency(balance)}
                </motion.span>
                {renderCryptoIcon(activeCrypto, "w-4 h-4 sm:w-5 sm:h-5 ml-1 hidden min-[360px]:block")}
                <ChevronDown
                  size={14}
                  className={`text-text-secondary shrink-0 transition-transform hidden sm:block`}
                />
              </div>

              <button
                onClick={() => setShowWallet(true)}
                className="bg-[#1475e1] hover:bg-[#1b80f0] text-white text-sm px-3 md:px-4 rounded-r font-bold transition-colors flex items-center justify-center gap-1 sm:gap-2 border-l-0 shadow-inner"
              >
                <Wallet size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Portefeuille</span>
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 text-text-secondary shrink-0">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="hover:text-white transition-colors hidden sm:block"
                title="Classement Mondial"
              >
                <Trophy size={18} />
              </button>
              
              {user && user.permissions?.canChat !== false && (
                <button
                  onClick={toggleChat}
                  className="hover:text-white transition-colors"
                  title="Ouvrir le Chat"
                >
                  <MessageSquare size={18} />
                </button>
              )}
              
              <button className="connexion-btn ml-2 hidden sm:block" onClick={() => setShowLogoutConfirm(true)} title="Déconnexion">
                Déconnexion
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="connexion-btn"
            >
              Connexion
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
      <CryptoModal isOpen={showCryptoModal} onClose={() => setShowCryptoModal(false)} />
    </>
  );
}
