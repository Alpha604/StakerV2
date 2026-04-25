import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Target, Info } from 'lucide-react';
import { GameInfoModal } from './GameInfoModal';

export function Originals({ setView }: { setView: (view: any) => void }) {
  const [infoModalGame, setInfoModalGame] = useState<any>(null);

  const games = [
    { 
      name: "MINES", players: "3 521", bg: "from-[#2094f3] to-[#0c439c]", action: () => setView('mines'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[130%] h-[130%] drop-shadow-2xl translate-y-[-10%] translate-x-[-5%] overflow-visible">
           <circle cx="50" cy="50" r="35" fill="#00c853" opacity="0.1" filter="blur(15px)"/>
           {/* Red explosion starburst behind bomb */}
           <polygon points="25,5 28,15 38,12 32,20 40,28 30,28 25,38 20,28 10,28 18,20 12,12 22,15" fill="#e53935" />
           {/* Black Bomb */}
           <circle cx="25" cy="22" r="14" fill="#111" />
           <path d="M 18 16 A 8 8 0 0 1 28 12 A 12 12 0 0 0 15 22 Z" fill="#444" />
           {/* Fuse */}
           <path d="M 28 8 Q 35 -2 42 5" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
           
           {/* Gem */}
           <g transform="translate(15, 10)">
             {/* Left side */}
             <polygon points="50,20 80,45 50,85" fill="#00e676" />
             {/* Right side */}
             <polygon points="50,20 80,45 50,85" fill="#00c853" transform="scale(-1, 1) translate(-100, 0)" />
             {/* Top caps */}
             <polygon points="50,20 30,20 20,45 50,35" fill="#69f0ae" />
             <polygon points="50,20 70,20 80,45 50,35" fill="#00a844" />
             {/* Bottom reflection */}
             <polygon points="50,35 20,45 50,85" fill="#00c853" />
             <polygon points="50,35 80,45 50,85" fill="#008c3a" />
             {/* Top flat */}
             <polygon points="30,20 70,20 60,35 40,35" fill="#b9f6ca" />
             <polygon points="20,45 40,35 50,35 50,85" fill="#00e676" />
           </g>
        </svg>
      )
    },
    { 
      name: "DICE", players: "2 608", bg: "from-[#ba54e5] to-[#7b2cbf]", action: () => setView('dice'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-2xl translate-y-[-10%] overflow-visible">
           <circle cx="50" cy="50" r="38" fill="#111" opacity="0.3" />
           <circle cx="50" cy="50" r="35" fill="#00e676" opacity="0.15" />
           
           {/* Pink/Red Die */}
           <g transform="translate(45, 30) rotate(15)">
             {/* Base block */}
             <path d="M 0 15 L 25 0 L 50 15 L 50 40 L 25 55 L 0 40 Z" fill="#d81b60" />
             <path d="M 0 15 L 25 30 L 50 15 L 25 0 Z" fill="#ff4081" />
             <path d="M 25 30 L 50 15 L 50 40 L 25 55 Z" fill="#c2185b" />
             <path d="M 0 15 L 25 30 L 25 55 L 0 40 Z" fill="#e91e63" />
             {/* Dots top */}
             <circle cx="15" cy="15" r="3" fill="#fff" />
             <circle cx="35" cy="15" r="3" fill="#fff" />
             {/* Dots Right */}
             <circle cx="35" cy="30" r="2.5" fill="#fff" />
             <circle cx="43" cy="27" r="2.5" fill="#fff" />
             <circle cx="39" cy="36" r="2.5" fill="#fff" />
             {/* Dots Left */}
             <circle cx="12" cy="30" r="3" fill="#fff" />
             <circle cx="12" cy="40" r="3" fill="#fff" />
           </g>

           {/* White Die */}
           <g transform="translate(15, 10) rotate(-10) scale(1.1)">
             <path d="M 0 20 L 25 5 L 50 20 L 50 45 L 25 60 L 0 45 Z" fill="#cfd8dc" />
             <path d="M 0 20 L 25 35 L 50 20 L 25 5 Z" fill="#fff" />
             <path d="M 25 35 L 50 20 L 50 45 L 25 60 Z" fill="#b0bec5" />
             <path d="M 0 20 L 25 35 L 25 60 L 0 45 Z" fill="#eceff1" />
             {/* Dots top */}
             <circle cx="25" cy="20" r="3.5" fill="#111" />
             <circle cx="15" cy="25" r="3.5" fill="#111" />
             <circle cx="35" cy="15" r="3.5" fill="#111" />
             {/* Dots left */}
             <circle cx="12" cy="40" r="3.5" fill="#111" />
             {/* Dots right */}
             <circle cx="35" cy="35" r="3" fill="#111" />
             <circle cx="43" cy="30" r="3" fill="#111" />
             <circle cx="35" cy="45" r="3" fill="#111" />
             <circle cx="42" cy="40" r="3" fill="#111" />
           </g>
        </svg>
      )
    },
    { 
      name: "PLINKO", players: "1 573", bg: "from-[#ff4081] to-[#e91e63]", action: () => setView('plinko'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[110%] h-[110%] drop-shadow-xl translate-y-[-5%] overflow-visible">
           <circle cx="50" cy="50" r="45" fill="#fff" opacity="0.05" />
           {/* Dots */}
           {[...Array(6)].map((_, r) => 
             [...Array(r + 1)].map((_, c) => (
                <circle key={`${r}-${c}`} cx={50 - (r * 8) + (c * 16)} cy={20 + (r * 12)} r="3" fill="#fff" />
             ))
           )}
           {/* Dropping Coin */}
           <circle cx="35" cy="40" r="8" fill="#fbc02d" />
           <circle cx="35" cy="40" r="6" fill="#ffea00" />
           <circle cx="35" cy="40" r="3" fill="#fbc02d" opacity="0.5" />
           
           {/* Overlay Tag */}
           <rect x="-10" y="5" width="75" height="25" rx="4" fill="#ffc107" transform="rotate(-15)" shadow="10" />
           <rect x="-10" y="5" width="75" height="12" rx="4" fill="#ffe082" transform="rotate(-15)" opacity="0.5" />
           <text x="5" y="24" fill="#d84315" fontSize="16" fontWeight="900" transform="rotate(-15)">10000×</text>
        </svg>
      )
    },
    { 
      name: "LIMBO", players: "2 226", bg: "from-[#ffb300] to-[#fb8c00]", action: () => setView('limbo'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[125%] h-[125%] drop-shadow-2xl translate-y-[-10%] translate-x-[-10%] overflow-visible">
           <path d="M -20 120 C 20 100, 45 40, 110 -10 L 120 -10 L 120 120 Z" fill="#ffecb3" opacity="0.2" />
           <path d="M -20 120 C 20 100, 45 40, 110 -10" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" opacity="0.5" />
           
           <g transform="rotate(-35 60 40) translate(25, 20)">
             <path d="M 0 10 L 10 0 L 80 0 L 80 40 L 70 50 L 0 50 Z" fill="#eceff1" />
             <path d="M 10 0 L 80 0 L 80 40 L 10 40 Z" fill="#fff" />
             <path d="M 0 10 L 10 0 L 10 40 L 0 50 Z" fill="#e0e0e0" />
             <text x="45" y="27" fill="#fb8c00" fontSize="20" fontWeight="900" textAnchor="middle">900×</text>
           </g>
        </svg>
      )
    },
    { 
      name: "BLACKJACK", players: "1 215", bg: "from-[#ef5350] to-[#c62828]", action: () => alert('This game is coming soon!'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-2xl translate-y-[-10%] overflow-visible">
           <rect x="50" y="-10" width="40" height="60" rx="4" fill="#1e88e5" transform="rotate(30 70 20)" />
           <rect x="52" y="-8" width="36" height="56" rx="2" fill="none" stroke="#64b5f6" strokeWidth="1" transform="rotate(30 70 20)" />
           <text x="65" y="25" fill="#fff" fontSize="12" fontWeight="900" transform="rotate(-60 70 20) translate(-35, 90)">Stake</text>
           
           <rect x="15" y="20" width="40" height="60" rx="4" fill="#1e88e5" transform="rotate(-20 35 50)" />
           <rect x="17" y="22" width="36" height="56" rx="2" fill="none" stroke="#64b5f6" strokeWidth="1" transform="rotate(-20 35 50)" />
           <text x="35" y="50" fill="#fff" fontSize="12" fontWeight="900" transform="rotate(-110 35 50) translate(-50, 45)">Stake</text>
           
           <rect x="35" y="30" width="45" height="65" rx="4" fill="#fff" transform="rotate(10 60 60)" />
           <text x="45" y="48" fill="#d32f2f" fontSize="22" fontWeight="bold" transform="rotate(10 60 60)">A</text>
           <polygon points="65,55 72,67 65,79 58,67" fill="#d32f2f" transform="rotate(10 60 60) scale(0.8) translate(15,-10)"/>
        </svg>
      )
    },
    { 
      name: "CRASH", players: "1 419", bg: "from-[#29b6f6] to-[#0277bd]", action: () => setView('crash'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[130%] h-[130%] drop-shadow-2xl translate-y-[10%] translate-x-[-10%] overflow-visible">
           <path d="M -20 100 Q 40 90 90 -20" fill="none" stroke="#ffca28" strokeWidth="25" strokeLinecap="round" />
           <path d="M -20 100 Q 40 90 90 -20" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
           
           {/* Trail fades */}
           <path d="M -20 100 Q 40 90 90 -20" fill="none" stroke="#ffeb3b" strokeWidth="15" strokeLinecap="round" opacity="0.6"/>
           
           <circle cx="88" cy="-18" r="14" fill="#fff" />
           <circle cx="88" cy="-18" r="10" fill="#ffeb3b" />
        </svg>
      )
    },
    { 
      name: "DRAGON TOWER", players: "656", bg: "from-[#ffa726] to-[#e65100]", action: () => setView('dragon-tower'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[110%] h-[110%] drop-shadow-2xl translate-y-[-5%] overflow-visible">
           {/* Dragon outline/eggs shape */}
           <path d="M 20 80 Q 20 20 50 10 Q 80 20 80 80 Q 50 100 20 80" fill="#fbe9e7" />
           <path d="M 25 75 Q 25 25 50 15 Q 75 25 75 75 Q 50 90 25 75" fill="#fff" />
           
           {/* Inner egg scales / flames */}
           <path d="M 35 90 Q 50 50 65 90" fill="#ff7043" />
           <path d="M 45 92 Q 50 70 55 92" fill="#d84315" />
           
           {/* Dragon head silhouette */}
           <circle cx="50" cy="40" r="18" fill="#d84315" />
           <path d="M 35 40 Q 50 20 65 40 L 50 60 Z" fill="#ffca28" />
           <path d="M 40 30 L 45 15 L 50 25 L 55 15 L 60 30" fill="#d84315" />
        </svg>
      )
    },
    { 
      name: "HILO", players: "566", bg: "from-[#00e676] to-[#009624]", action: () => setView('hilo'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-2xl translate-y-[-5%] translate-x-[5%] overflow-visible">
           {/* Back card */}
           <rect x="25" y="20" width="55" height="80" rx="6" fill="#fff" transform="rotate(-5 50 50)" opacity="0.6"/>
           <text x="35" y="45" fill="#000" fontSize="20" fontWeight="bold" transform="rotate(-5 50 50)" opacity="0.4">J</text>

           {/* Front card */}
           <rect x="30" y="30" width="60" height="85" rx="6" fill="#fff" transform="rotate(15 60 70)" shadow="10" />
           <text x="45" y="55" fill="#d32f2f" fontSize="24" fontWeight="bold" transform="rotate(15 60 70)">A</text>
           <polygon points="65,60 75,76 65,92 55,76" fill="#d32f2f" transform="rotate(15 60 70) scale(0.9) translate(10,-5)"/>

           {/* High/Low Switch Bar on Left */}
           <rect x="-10" y="25" width="22" height="60" rx="11" fill="#000" opacity="0.2" />
           
           <rect x="-10" y="25" width="22" height="30" rx="11" fill="#29b6f6" />
           <text x="-7" y="42" fill="#fff" fontSize="7" fontWeight="bold" transform="translate(8, 0) rotate(-90)">HIGH</text>
           <circle cx="1" cy="30" r="4" fill="#fff" opacity="0.8"/>
           
           <rect x="-10" y="55" width="22" height="30" rx="11" fill="#e53935" />
           <text x="-7" y="77" fill="#fff" fontSize="7" fontWeight="bold" transform="translate(8, 0) rotate(-90)">LOW</text>
           <circle cx="1" cy="80" r="4" fill="#fff" opacity="0.8"/>
        </svg>
      )
    },
    { 
      name: "WHEEL", players: "291", bg: "from-[#ffca28] to-[#ef6c00]", action: () => setView('wheel'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[125%] h-[125%] drop-shadow-2xl translate-y-[15%] overflow-visible">
           <circle cx="50" cy="50" r="45" fill="#fff" />
           {/* Wheel Segments */}
           <path d="M 50 5 L 94 40 A 45 45 0 0 0 50 5 Z" fill="#ff1744" />
           <path d="M 50 50 L 94 40 A 45 45 0 0 1 75 88 Z" fill="#00e676" />
           <path d="M 50 50 L 75 88 A 45 45 0 0 1 15 78 Z" fill="#29b6f6" />
           <path d="M 50 50 L 15 78 A 45 45 0 0 1 20 15 Z" fill="#fbc02d" />
           <path d="M 50 50 L 20 15 A 45 45 0 0 1 50 5 Z" fill="#00c853" />
           
           {/* Inner wheel */}
           <circle cx="50" cy="50" r="35" fill="#ffca28" stroke="#fff" strokeWidth="8"/>
           
           {/* Picker */}
           <path d="M 40 -10 L 60 -10 L 50 15 Z" fill="#d50000" />
           <circle cx="50" cy="-3" r="5" fill="#fff" />
        </svg>
      )
    },
    { 
      name: "FLIP", players: "303", bg: "from-[#66bb6a] to-[#2e7d32]", action: () => setView('flip'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-2xl translate-y-[5%] overflow-visible">
           <ellipse cx="50" cy="15" rx="35" ry="15" fill="#1e88e5" />
           <path d="M 15 15 L 15 35 Q 50 55 85 35 L 85 15 Z" fill="#1565c0" />
           <path d="M 25 25 Q 50 40 75 25" fill="none" stroke="#90caf9" strokeWidth="2" opacity="0.5"/>
           
           <ellipse cx="50" cy="65" rx="45" ry="18" fill="#fff" />
           <ellipse cx="50" cy="65" rx="35" ry="12" fill="#ffb300" />
           <path d="M 15 65 L 15 85 Q 50 105 85 85 L 85 65 Z" fill="#ffa000" />
           <path d="M 5 65 L 5 85 Q 50 115 95 85 L 95 65 Z" fill="#fff" opacity="0.3" />
        </svg>
      )
    },
    { 
      name: "ROULETTE", players: "160", bg: "from-[#00c853] to-[#00796b]", action: () => setView('roulette'),
      art: () => (
        <svg viewBox="0 0 100 100" className="w-[140%] h-[140%] drop-shadow-2xl translate-x-[-15%] translate-y-[0%] overflow-visible">
           {/* Wheel Top Left */}
           <g transform="translate(-10, -30) scale(1.1)">
             <circle cx="40" cy="40" r="40" fill="#213743" stroke="#111" strokeWidth="6"/>
             {/* Wheel alternating sections */}
             <path d="M 40 0 A 40 40 0 0 1 80 40 L 40 40 Z" fill="#d32f2f" />
             <path d="M 80 40 A 40 40 0 0 1 40 80 L 40 40 Z" fill="#111" />
             <path d="M 40 80 A 40 40 0 0 1 0 40 L 40 40 Z" fill="#d32f2f" />
             <path d="M 0 40 A 40 40 0 0 1 40 0 L 40 40 Z" fill="#111" />
             <circle cx="40" cy="40" r="25" fill="#37474f" />
             <path d="M 40 15 L 40 30 M 15 40 L 30 40 L 40 40 M 65 40 L 50 40 M 40 65 L 40 50" stroke="#ffeb3b" strokeWidth="4" />
             <circle cx="40" cy="40" r="8" fill="#fbc02d" />
           </g>
           
           {/* Betting Board Grid Bottom Right */}
           <g transform="rotate(-5 50 50) translate(25, 45) scale(1.1)">
             {/* 0 Box */}
             <rect x="-15" y="0" width="15" height="45" fill="#4caf50" rx="2" stroke="#111" strokeWidth="1"/>
             <text x="-7.5" y="25" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">0</text>
             
             {/* Number Grid 3x3 */}
             <rect x="0" y="0" width="15" height="15" fill="#d32f2f" stroke="#111" strokeWidth="1"/>
             <text x="7.5" y="10" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">3</text>
             
             <rect x="0" y="15" width="15" height="15" fill="#212121" stroke="#111" strokeWidth="1"/>
             <text x="7.5" y="25" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">2</text>
             
             <rect x="0" y="30" width="15" height="15" fill="#d32f2f" stroke="#111" strokeWidth="1"/>
             <text x="7.5" y="40" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">1</text>

             <rect x="15" y="0" width="15" height="15" fill="#212121" stroke="#111" strokeWidth="1"/>
             <text x="22.5" y="10" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">6</text>
             
             <rect x="15" y="15" width="15" height="15" fill="#d32f2f" stroke="#111" strokeWidth="1"/>
             <text x="22.5" y="25" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">5</text>
             
             <rect x="15" y="30" width="15" height="15" fill="#212121" stroke="#111" strokeWidth="1"/>
             <text x="22.5" y="40" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">4</text>

             <rect x="30" y="0" width="15" height="15" fill="#d32f2f" stroke="#111" strokeWidth="1"/>
             <text x="37.5" y="10" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">9</text>
             
             <rect x="30" y="15" width="15" height="15" fill="#212121" stroke="#111" strokeWidth="1"/>
             <text x="37.5" y="25" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">8</text>
             
             <rect x="30" y="30" width="15" height="15" fill="#d32f2f" stroke="#111" strokeWidth="1"/>
             <text x="37.5" y="40" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">7</text>
             
             <rect x="-15" y="45" width="60" height="10" fill="#388e3c" stroke="#111" strokeWidth="1" rx="1"/>
             <text x="15" y="53" fill="#fff" fontSize="6" opacity="0.8" fontWeight="bold" textAnchor="middle">1st 12</text>
           </g>
           
           {/* Casino Chip placed on board */}
           <circle cx="65" cy="55" r="8" fill="#e53935" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" />
           <circle cx="65" cy="55" r="4" fill="#fff" />
        </svg>
      )
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
                 <g.art />
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
