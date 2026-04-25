import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🍉', '⭐', '7️⃣'];
const PAYOUTS: Record<string, number> = {
   '🍒': 2, '🍋': 3, '🍊': 5, '🍇': 10, '🍉': 20, '⭐': 50, '7️⃣': 100
};

export function TomeOfLife() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reels, setReels] = useState<string[][]>([
     ['🍒', '🍋', '🍊'],
     ['🍇', '🍉', '⭐'],
     ['7️⃣', '🍒', '🍋']
  ]);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number, line?: number } | null>(null);

  const spin = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setWinInfo(null);

    // Simulate Fake Spinning
    let spins = 0;
    const interval = setInterval(() => {
       setReels([
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]
       ]);
       spins++;
       if (spins > 20) {
          clearInterval(interval);
          finishSpin();
       }
    }, 100);
  };

  const finishSpin = () => {
     // Final result
     const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
     const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
     const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
     
     // 20% win chance for presentation
     const isForcedWin = Math.random() > 0.8;
     
     const finalRow = isForcedWin ? [r1, r1, r1] : [r1, r2, r3];
     
     const finalReelSet = [
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], finalRow[0], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], finalRow[1], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
         [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], finalRow[2], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]
     ];
     setReels(finalReelSet);

     setIsPlaying(false);

     if (finalRow[0] === finalRow[1] && finalRow[1] === finalRow[2]) {
        const symbol = finalRow[0];
        const multiplier = PAYOUTS[symbol] || 5;
        const payout = betAmount * multiplier;
        addBalance(payout);
        setWinInfo({ multiplier, payout, line: 1 });
        recordBet('TomeOfLife', betAmount, multiplier, payout - betAmount);
     } else {
        recordBet('TomeOfLife', betAmount, 0, -betAmount);
     }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 shadow-2xl overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Pari</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded-md flex items-center focus-within:border-accent">
               <span className="pl-3 text-emerald-500"><Coins size={16} /></span>
               <input 
                 type="number"
                 value={betAmount || ''}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 disabled={isPlaying}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none disabled:opacity-50"
               />
            </div>
          </div>
          
          <button 
            disabled={isPlaying || !user}
            onClick={spin}
            className="mt-4 w-full py-4 rounded-md font-extrabold text-lg uppercase tracking-wider transition-all bg-[#e0b553] hover:bg-[#ebd281] text-[#0f172a] disabled:opacity-50"
          >
            {isPlaying ? 'Rotation...' : 'Spin'}
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl md:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 md:order-2">
        <div className="h-full bg-gradient-to-b from-[#1a0f0f] to-[#361919] relative p-8 flex flex-col items-center justify-center min-h-[500px]">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="border-8 border-[#e0b553]/80 rounded-2xl bg-black/80 p-4 shadow-[0_0_50px_rgba(224,181,83,0.3)]">
              <div className="flex gap-2 bg-[#0f0a0a] p-2 rounded-xl overflow-hidden relative">
                 
                 {/* 3 Reels */}
                 {reels.map((reel, rIdx) => (
                    <div key={rIdx} className="w-24 flex flex-col gap-2 relative">
                       {reel.map((sym, sIdx) => (
                          <div 
                             key={`${rIdx}-${sIdx}`}
                             className={cn(
                                "w-24 h-24 flex items-center justify-center text-5xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 shadow-inner",
                                winInfo?.line === 1 && sIdx === 1 ? "animate-pulse border-[#e0b553] shadow-[0_0_20px_rgba(224,181,83,0.8)] z-10" : ""
                             )}
                          >
                             {sym}
                          </div>
                       ))}
                    </div>
                 ))}

                 {/* Win Line Overlay */}
                 {winInfo?.line === 1 && (
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-[#e0b553] -translate-y-1/2 shadow-[0_0_20px_#e0b553] opacity-80 pointer-events-none z-20"></div>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
