import React from 'react';
import { cn } from '../lib/utils';
import { Home, Trophy, Swords, Zap, Wallet, Menu, Activity } from 'lucide-react';
import { useUser } from '../context/UserContext';

export function Sidebar({ view, setView }: { view: string, setView: (v: string) => void }) {
  const { showSessionStats, setShowSessionStats } = useUser();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-80px)] bg-bg-panel border-r border-border-medium sticky top-20 left-0 overflow-y-auto z-40">
       <div className="p-4 flex flex-col gap-2">
         <button 
           onClick={() => setView('home')}
           className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors", view === 'home' ? 'bg-bg-inner text-white' : 'text-text-secondary hover:bg-bg-inner hover:text-white')}
         >
           <Home size={18} />
           Accueil
         </button>
         <button 
           onClick={() => setView('originals')}
           className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors", view === 'originals' ? 'bg-bg-inner text-white' : 'text-text-secondary hover:bg-bg-inner hover:text-white')}
         >
           <Zap size={18} />
           Stake Originals
         </button>
         <div className="h-px w-full bg-border-medium my-2"></div>
         <button 
           onClick={() => setView('stats')}
           className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors", view === 'stats' ? 'bg-bg-inner text-white' : 'text-text-secondary hover:bg-bg-inner hover:text-white')}
         >
           <Trophy size={18} />
           Statistiques globales
         </button>
         <button 
           onClick={() => setShowSessionStats(!showSessionStats)}
           className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md font-bold transition-colors", showSessionStats ? 'bg-bg-inner text-emerald-500' : 'text-text-secondary hover:bg-bg-inner hover:text-white')}
         >
           <Activity size={18} />
           Live Session Stats
         </button>
       </div>
    </aside>
  );
}
