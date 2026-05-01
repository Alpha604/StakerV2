import React, { useState } from "react";
import { useUser, CRYPTOS, CryptoType, renderCryptoIcon } from "../context/UserContext";
import {
  Trophy,
  Menu,
  ChevronDown
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
  const { user, balance, logoutUser, activeCrypto, setActiveCrypto } = useUser();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [cryptoDropdownOpen, setCryptoDropdownOpen] = useState(false);

  return (
    <>
      <header className="h-16 md:h-20 border-b border-border-subtle flex items-center justify-between px-4 md:px-8 bg-bg-panel sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-6">
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
              className="h-6 md:h-7 brightness-[100] invert drop-shadow-md"
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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Middle Container for Balance */}
            <div className="flex items-center absolute left-1/2 -translate-x-1/2">
              <div
                className="bg-bg-inner/80 hover:bg-bg-inner border border-transparent hover:border-border-medium pl-4 pr-3 py-2 rounded-l flex items-center gap-2 shadow-inner cursor-pointer transition-colors max-w-[200px] relative"
                onClick={() => setCryptoDropdownOpen(!cryptoDropdownOpen)}
              >
                <span className="font-bold text-sm tracking-tight text-white truncate shrink">
                  {parseFloat(balance.toFixed(8)).toString()}
                </span>
                {renderCryptoIcon(activeCrypto, "w-4 h-4 ml-1")}
                <ChevronDown
                  size={14}
                  className={`text-text-secondary ml-1 mt-1 shrink-0 transition-transform ${cryptoDropdownOpen ? 'rotate-180' : ''}`}
                />
                
                {cryptoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-bg-panel border border-border-medium rounded shadow-xl z-50 overflow-hidden">
                    {CRYPTOS.map(crypto => (
                      <div 
                        key={crypto.symbol}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-bg-inner transition-colors border-b border-border-subtle last:border-b-0"
                        onClick={() => setActiveCrypto(crypto)}
                      >
                         {renderCryptoIcon(crypto, "w-5 h-5")}
                         <div className="flex flex-col">
                            <span className="text-white font-bold text-sm leading-none">{crypto.symbol}</span>
                            <span className="text-text-secondary text-xs">{crypto.name}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowWallet(true)}
                className="bg-[#1475e1] hover:bg-[#1b80f0] text-white text-sm px-4 py-2 rounded-r font-bold transition-colors h-full flex items-center border-l-0 shadow-md"
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
              
              <button className="connexion-btn ml-2" onClick={logoutUser} title="Déconnexion">
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
    </>
  );
}
