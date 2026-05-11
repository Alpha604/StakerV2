import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { useUser, UserRank } from "../context/UserContext";
import { User, Shield, Activity, DollarSign, Wallet, ShieldCheck, Gamepad2, Award } from "lucide-react";
import { cn } from "../lib/utils";
import { RankBadge } from "./RankBadge";

const getRankProgress = (wagered: number): { currentRank: UserRank; nextRank: UserRank | null; progress: number; needed: number } => {
  const thresholds = [
    { rank: "None" as UserRank, req: 0 },
    { rank: "Bronze" as UserRank, req: 10000 },
    { rank: "Silver" as UserRank, req: 50000 },
    { rank: "Gold" as UserRank, req: 100000 },
    { rank: "Platinum" as UserRank, req: 250000 },
    { rank: "Diamond" as UserRank, req: 1000000 },
    { rank: "Champion" as UserRank, req: 5000000 },
  ];

  let currentRank = thresholds[0];
  let nextRank = thresholds[1];

  for (let i = 0; i < thresholds.length; i++) {
    if (wagered >= thresholds[i].req) {
      currentRank = thresholds[i];
      nextRank = thresholds[i + 1] || null;
    } else {
      break;
    }
  }

  if (!nextRank) {
    return { currentRank: currentRank.rank, nextRank: null, progress: 100, needed: 0 };
  }

  const rankRange = nextRank.req - currentRank.req;
  const rankProgress = wagered - currentRank.req;
  const percentage = (rankProgress / rankRange) * 100;

  return {
    currentRank: currentRank.rank,
    nextRank: nextRank.rank,
    progress: Math.min(100, Math.max(0, percentage)),
    needed: nextRank.req - wagered
  };
};

export function Profile() {
  const { user, balance, vault, totalWagered, totalWon } = useUser() as any; // typing workaround if needed

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#8b9ba5] text-lg font-bold flex flex-col items-center gap-4">
          <User size={48} className="opacity-50" />
          Veuillez vous connecter pour voir votre profil.
        </div>
      </div>
    );
  }

  const { currentRank, nextRank, progress, needed } = getRankProgress(user.totalWagered || 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full text-white animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="text-blue-500" size={32} />
          Mon Profil
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6 text-center relative overflow-hidden group">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-blue-500 mb-4 uppercase border-4 border-[#0f212e] shadow-[0_0_0_2px_rgba(59,130,246,0.3)] z-10 relative">
              {user.username.substring(0, 2)}
            </div>
            
            <h2 className="text-2xl font-bold mb-1 relative z-10 flex flex-col items-center gap-2">
              {user.username}
              <RankBadge rank={user.rank} className="mt-1 h-12 md:h-16 drop-shadow-lg" />
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
               <span className={cn(
                 "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                 user.status === 'approved' ? 'bg-[#1bc86a]/10 text-[#1bc86a] border-[#1bc86a]/20' : 
                 user.status === 'suspended' ? 'bg-[#f6c722]/10 text-[#f6c722] border-[#f6c722]/20' :
                 user.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                 'bg-gray-500/10 text-gray-400 border-gray-500/20'
               )}>
                 {user.status || 'pending'}
               </span>
               <span className={cn(
                 "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                 user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
               )}>
                 {user.role || 'user'}
               </span>
            </div>

            <div className="w-full h-px bg-[#2f4553] mb-6 relative z-10"></div>

            <div className="flex flex-col gap-3 text-left relative z-10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b9ba5] flex items-center gap-2"><Activity size={16}/> Statut</span>
                <span className="font-bold text-[#1bc86a]">En ligne</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b9ba5] flex items-center gap-2"><ShieldCheck size={16}/> Compte</span>
                <span className="font-bold">Standard</span>
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
          </div>
        </div>

        {/* Right Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#8b9ba5] font-bold mb-2">
                <Wallet size={20} className="text-[#1bc86a]" />
                Solde Actuel
              </div>
              <div className="text-3xl font-mono font-bold text-white tracking-tight">
                {typeof balance === 'number' ? formatCurrency(balance) : "0.00"}$
              </div>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#8b9ba5] font-bold mb-2">
                <Shield size={20} className="text-amber-500" />
                Coffre
              </div>
              <div className="text-3xl font-mono font-bold text-white tracking-tight">
                {typeof vault === 'number' ? formatCurrency(vault) : "0.00"}$
              </div>
            </div>
          </div>

          <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="text-blue-500" /> Club VIP progression
              </h3>
              {nextRank && (
                <div className="text-xs font-bold text-[#8b9ba5] bg-[#2f4553]/50 px-3 py-1 rounded-full">
                  Rang ciblé: <span className="text-white">{nextRank}</span>
                </div>
              )}
            </div>
            
            <div className="w-full bg-[#1A2C38] h-4 rounded-full overflow-hidden mb-3 border border-[#2f4553]/50 shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm font-bold">
              <span className="text-blue-400">{progress.toFixed(2)}%</span>
              <span className="text-[#8b9ba5]">
                {nextRank ? `Encore ${formatCurrency(needed)}$ pour ${nextRank}` : 'Rang Maximum Atteint !'}
              </span>
            </div>
          </div>

          <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Gamepad2 className="text-purple-500" /> Statistiques de Jeu
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#2f4553]/20 rounded-lg border border-[#2f4553]">
                  <div className="text-[#8b9ba5] text-sm font-bold mb-1">Total Misé</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                    {typeof user.totalWagered === 'number' ? formatCurrency(user.totalWagered) : "0.00"}$
                  </div>
                </div>
                <div className="p-4 bg-[#2f4553]/20 rounded-lg border border-[#2f4553]">
                  <div className="text-[#8b9ba5] text-sm font-bold mb-1">Total Gagné</div>
                  <div className="text-2xl font-mono font-bold text-purple-400">
                    {typeof user.totalWon === 'number' ? formatCurrency(user.totalWon) : "0.00"}$
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
