import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Users, Activity, BarChart3, ArrowUpRight } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Leaderboard } from './Leaderboard';

export function Home({ setView }: { setView: (view: any) => void }) {
  const { user, balance } = useUser();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const stats = [
     { label: 'Gain le plus élevé', value: '€24,500.00', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
     { label: 'Joueurs actifs', value: '14,203', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
     { label: 'Pari Total 24h', value: '€1.2M', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
     { label: 'Mines RTP', value: '99.00%', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 min-h-[calc(100vh-80px)] overflow-x-hidden">
      
      {/* Hero Banner */}
      <div className="relative w-full h-[280px] md:h-[320px] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center px-8 md:px-16 border border-border-medium">
         {/* Background */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#1475e1] to-[#0d2b52] z-0"></div>
         
         {/* Abstract shapes */}
         <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 z-0 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
               <polygon points="0,100 100,0 100,100" fill="url(#hero-gradient)" />
               <defs>
                  <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                     <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
               </defs>
            </svg>
         </div>

         {/* Content */}
         <div className="relative z-10 max-w-xl">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
               L'expérience de jeu <br/><span className="text-yellow-400">ultime.</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">Découvrez une large sélection de jeux originaux avec les rendements les plus élevés du marché.</p>
            <button 
               onClick={() => setView('originals')}
               className="bg-white text-[#1475e1] hover:bg-gray-100 px-8 py-3.5 rounded-md font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 w-fit"
            >
               Jouer Maintenant <ArrowUpRight size={20} />
            </button>
         </div>
      </div>

      {/* Stats Grid */}
      <h2 className="text-white text-xl font-bold tracking-tight -mb-2 flex items-center gap-2 mt-4">
         <BarChart3 className="text-accent" /> Statistiques de la plateforme
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
               <div key={i} className="bg-bg-panel border border-border-medium rounded-xl p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", stat.bg)}>
                     <Icon className={stat.color} size={24} />
                  </div>
                  <div>
                     <p className="text-text-secondary text-xs uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                     <p className="text-white font-black text-xl tabular-nums">{stat.value}</p>
                  </div>
               </div>
            )
         })}
      </div>

      {/* Leaderboard Preview */}
      <div className="mt-4 flex flex-col items-center justify-center bg-bg-panel border border-border-medium rounded-xl p-8">
         <Trophy className="text-yellow-400 mb-4" size={48} />
         <h3 className="text-white font-bold text-2xl mb-2">Classement Mondial</h3>
         <p className="text-text-secondary mb-6 text-center max-w-md">Découvrez les joueurs ayant le plus grand solde et affrontez-les pour devenir le numéro 1 !</p>
         <button 
             onClick={() => setShowLeaderboard(true)}
             className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-md transition-colors"
         >
             Voir le Leaderboard
         </button>
      </div>

      {showLeaderboard && (
         <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

    </div>
  );
}
