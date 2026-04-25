import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { LogIn, LogOut, Trophy, Menu, Bell, Search, ChevronDown, Wallet as WalletIcon, X } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { WalletModal } from './WalletModal';
import { LoginModal } from './LoginModal';

export function Header({ setView, toggleSidebar }: { setView: (view: any) => void, toggleSidebar: () => void }) {
  const { user, balance, logoutUser } = useUser();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="h-20 border-b border-border-medium flex items-center justify-between px-4 md:px-8 bg-bg-panel sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-6">
          <Menu className="text-text-secondary cursor-pointer hover:text-white transition-colors" onClick={toggleSidebar} />
          <div 
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            onClick={() => setView('home')}
          >
            <span className="text-2xl font-black italic tracking-tighter text-white font-sans drop-shadow-md">Stake</span>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Wallet Group */}
            <div className="flex items-center gap-2">
               <div 
                 onClick={() => setShowWallet(true)}
                 className="bg-bg-inner/80 hover:bg-bg-inner border border-border-medium pl-4 pr-3 py-2.5 rounded flex items-center gap-3 shadow-inner cursor-pointer transition-colors max-w-[200px]"
               >
                 <span className="font-bold text-sm tracking-tight text-white truncate shrink">
                   {Math.floor(balance).toLocaleString('en-US')}
                 </span>
                 <span className="text-emerald-500 font-bold font-mono text-[10px] leading-none bg-emerald-500/20 w-4 h-4 flex items-center justify-center rounded-full shrink-0">T</span>
                 <ChevronDown size={14} className="text-text-secondary ml-1 shrink-0" />
               </div>
               
               <button 
                 onClick={() => setShowWallet(true)}
                 className="bg-[#1475e1] hover:bg-[#1b80f0] text-white text-sm px-5 py-2.5 rounded font-bold shadow-md transition-colors h-full flex items-center"
               >
                 Portefeuille
               </button>
            </div>
            
            <div className="hidden md:flex items-center gap-5 text-text-secondary ml-4">
               <Search size={18} className="hover:text-white transition-colors cursor-pointer" />
               <button onClick={() => setShowLeaderboard(true)} className="hover:text-white transition-colors">
                 <Trophy size={18} />
               </button>
               <Bell size={18} className="hover:text-white transition-colors cursor-pointer" />
            </div>

            <div className="flex items-center ml-2 border border-border-medium rounded hover:border-text-secondary transition-colors group relative cursor-pointer">
              <div className="w-9 h-9 bg-border-medium overflow-hidden rounded flex items-center justify-center text-xs font-bold text-white bg-indigo-500">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-panel border border-border-medium rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                 <button onClick={logoutUser} className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-2 text-red-400 font-medium">
                   <LogOut size={16} /> Logout
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogin(true)}
              className="text-white hover:text-accent font-bold text-sm transition-colors"
            >
              Se Connecter
            </button>
          </div>
        )}
      </header>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      {showLeaderboard && user && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </>
  );
}
