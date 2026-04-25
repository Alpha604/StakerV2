import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

const MULTIPLIERS = [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
const ROWS = 16;

type Ball = {
  id: number;
  path: number[];
  finalIndex: number;
};

export function Plinko() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [balls, setBalls] = useState<Ball[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  
  const handleDrop = () => {
    if (!user || balance < betAmount) return;
    
    subtractBalance(betAmount);
    setWinInfo(null);
    
    let currentIndex = 0;
    const path: number[] = [currentIndex];
    
    // Generate path (16 rows)
    for (let i = 0; i < ROWS; i++) {
       // 50% chance left or right
       const direction = Math.random() > 0.5 ? 1 : 0;
       currentIndex += direction;
       path.push(currentIndex);
    }
    
    const finalIndex = currentIndex;
    const mult = MULTIPLIERS[finalIndex];
    
    const newBall: Ball = {
       id: Date.now() + Math.random(),
       path,
       finalIndex
    };
    
    setBalls(prev => [...prev, newBall]);
    
    // Cleanup and payout after animation
    setTimeout(() => {
       const payout = betAmount * mult;
       if (mult > 0) {
          addBalance(payout);
       }
       recordBet(
         'Plinko',
         betAmount,
         mult,
         payout - betAmount
       );
       
       setWinInfo({ multiplier: mult, payout });
       setBalls(prev => prev.filter(b => b.id !== newBall.id));
    }, 2800); // Animation duration
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        
        {/* Left Side: Controls */}
        <div className="md:col-span-3 bg-[#213743] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-medium z-10 relative">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-text-secondary text-sm font-semibold">Montant de la mise</label>
              <span className="text-text-secondary text-sm">€{(balance || 0).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <Coins size={16} className="text-text-secondary" />
              </div>
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-bold outline-none tabular-nums"
                min="0"
                step="0.01"
              />
              <div className="flex items-center gap-1 pr-1">
                <button onClick={() => setBetAmount(prev => +(prev / 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">½</button>
                <button onClick={() => setBetAmount(prev => +(prev * 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">2×</button>
              </div>
            </div>
          </div>
          
          <div className="flex-1"></div>

          <button 
            onClick={handleDrop}
            disabled={balance < betAmount}
            className={cn(
              "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
              "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
              (balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-[0_4px_0_#00a84b]"
            )}
          >
            Jouer
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative flex flex-col p-4 md:p-12 overflow-hidden justify-center items-center">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="relative w-full max-w-[600px] aspect-[4/3] flex flex-col items-center justify-end" ref={containerRef}>
              
              {/* Draw Pegs */}
              <div className="absolute top-0 left-0 w-full h-[85%] flex flex-col justify-between pt-8">
                 {Array.from({ length: ROWS }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center w-full relative">
                       {Array.from({ length: rowIndex + 3 }).map((_, colIndex) => (
                          <div 
                             key={colIndex} 
                             className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mx-2 sm:mx-3 shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                          />
                       ))}
                    </div>
                 ))}
              </div>

              {/* Draw Multipliers (Buckets) */}
              <div className="w-[105%] flex justify-between absolute bottom-0 gap-0.5 sm:gap-1">
                 {MULTIPLIERS.map((mult, idx) => (
                    <div 
                       key={idx} 
                       className={cn(
                          "flex-1 flex items-center justify-center rounded text-[8px] sm:text-[10px] sm:font-bold py-1.5 sm:py-2 text-black shadow-[0_2px_0_rgba(0,0,0,0.2)]",
                          mult > 10 ? "bg-[#e53935]" : mult > 2 ? "bg-[#ff9800]" : "bg-[#ffb300]"
                       )}
                    >
                       {mult}
                    </div>
                 ))}
              </div>

              {/* Animated Balls */}
              {balls.map(ball => {
                 // Calculate keyframes based on path
                 // x positions offset based on path
                 const keyframesX = ball.path.map((pos, i) => {
                    const rowCenter = (i + 2) / 2; // Approximate expected center
                    const offset = pos - rowCenter;
                    return `calc(50% + ${offset * 20}px)`; // tweak pixels to match spacing
                 });

                 // Simple vertical drop
                 const keyframesY = ball.path.map((_, i) => `${(i / ROWS) * 85}%`);

                 return (
                    <motion.div
                       key={ball.id}
                       className="absolute top-8 w-3 h-3 bg-[#e53935] rounded-full shadow-[0_0_10px_#e53935] z-20"
                       style={{ transform: "translate(-50%, -50%)" }}
                       initial={{ left: '50%', top: '0%' }}
                       animate={{ 
                          left: keyframesX,
                          top: keyframesY
                       }}
                       transition={{ duration: 2.5, ease: "linear" }}
                    />
                 );
              })}

           </div>
           
        </div>
      </div>
    </div>
  );
}
