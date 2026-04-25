import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Target, Info } from 'lucide-react';
import { GameInfoModal } from './GameInfoModal';

export function Originals({ setView }: { setView: (view: any) => void }) {
  const [infoModalGame, setInfoModalGame] = useState<any>(null);

  const games = [
    { 
      name: "MINES", players: "3 521", bg: "from-[#2094f3] to-[#0c439c]", action: () => setView('mines'),
      img: "/mines.png"
    },
    { 
      name: "DICE", players: "2 608", bg: "from-[#ba54e5] to-[#7b2cbf]", action: () => setView('dice'),
      img: "/dice.png"
    },
    { 
      name: "PLINKO", players: "1 573", bg: "from-[#ff4081] to-[#e91e63]", action: () => setView('plinko'),
      img: "/plinko.png"
    },
    { 
      name: "LIMBO", players: "2 226", bg: "from-[#ffb300] to-[#fb8c00]", action: () => setView('limbo'),
      img: "/limbo.png"
    },
    { 
      name: "BLACKJACK", players: "1 215", bg: "from-[#ef5350] to-[#c62828]", action: () => alert('This game is coming soon!'),
      img: "/blackjack.png"
    },
    { 
      name: "CRASH", players: "1 419", bg: "from-[#29b6f6] to-[#0277bd]", action: () => setView('crash'),
      img: "/crash.png"
    },
    { 
      name: "DRAGON TOWER", players: "656", bg: "from-[#ffa726] to-[#e65100]", action: () => setView('dragon-tower'),
      img: "/dragon-tower.png"
    },
    { 
      name: "HILO", players: "566", bg: "from-[#00e676] to-[#009624]", action: () => setView('hilo'),
      img: "/hilo.png"
    },
    { 
      name: "WHEEL", players: "291", bg: "from-[#ffca28] to-[#ef6c00]", action: () => setView('wheel'),
      img: "/wheel.png"
    },
    { 
      name: "FLIP", players: "303", bg: "from-[#66bb6a] to-[#2e7d32]", action: () => setView('flip'),
      img: "/flip.png"
    },
    { 
      name: "ROULETTE", players: "160", bg: "from-[#00c853] to-[#00796b]", action: () => setView('roulette'),
      img: "/roulette.png"
    }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 min-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
             <Target size={20} className="text-accent" />
         </div>
         <h2 className="text-white text-xl font-bold tracking-tight">Stake Originals</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
        {games.map((g) => (
          <div key={g.name} className="flex flex-col gap-2 group cursor-pointer" onClick={() => g.action ? g.action() : alert('This game is coming soon!')}>
            <div className={cn(
               "aspect-[3/4] w-full rounded-xl overflow-hidden relative shadow-[0_10px_20px_rgba(0,0,0,0.2)] transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-0",
               "bg-gradient-to-br", g.bg
            )}>
               {/* Custom Art Illustration */}
               <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
                 {g.img && <img src={g.img} alt={g.name} className="w-full h-full object-cover" />}
               </div>

               {/* Text area at the bottom */}
               <div className="absolute bottom-4 inset-x-0 flex flex-col items-center justify-end z-10 space-y-1">
                  <h3 className="font-extrabold text-white text-xl tracking-wide leading-none drop-shadow-md">{g.name}</h3>
                  <span className="text-[10px] text-white/80 font-bold tracking-[0.2em] uppercase drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Stake Originals</span>
               </div>
               
               {/* Overlay gradient on hover */}
               <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none mix-blend-overlay"></div>

               {/* Info button */}
               <button 
                  onClick={(e) => { e.stopPropagation(); setInfoModalGame(g.name.toLowerCase().replace(/ /g, '-')); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-20"
               >
                  <Info size={16} />
               </button>
            </div>

            {/* Players footer */}
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                  <span className="text-xs font-bold text-white tracking-tight">{g.players}</span>
               </div>
               <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">Joueurs</span>
            </div>
          </div>
        ))}
      </div>

      <GameInfoModal 
         isOpen={infoModalGame !== null} 
         onClose={() => setInfoModalGame(null)} 
         gameId={infoModalGame} 
      />
    </div>
  );
}
