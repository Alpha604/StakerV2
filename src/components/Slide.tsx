import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

export function Slide() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMulti, setCurrentMulti] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const controls = useAnimation();
  const animationRef = useRef<number>();

  const startGame = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setCrashPoint(null);
    setCurrentMulti(1.00);
    setWinInfo(null);

    // Generate random crash point (house edge 1%)
    const e = 2 ** 32;
    const h = crypto.getRandomValues(new Uint32Array(1))[0];
    const generated = Math.max(1.00, Math.floor((100 * e - h) / (e - h)) / 100);
    
    // Animate
    let start = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = (now - start) / 1000;
      const nextMulti = Math.pow(Math.E, 0.2 * elapsed);
      
      if (nextMulti >= generated) {
         setCurrentMulti(generated);
         endGame(generated);
         return;
      }
      
      setCurrentMulti(nextMulti);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const endGame = (finalMulti: number) => {
    setIsPlaying(false);
    setCrashPoint(finalMulti);
    
    const isWin = finalMulti >= targetMultiplier;
    if (isWin) {
       const payout = betAmount * targetMultiplier;
       addBalance(payout);
       setWinInfo({ multiplier: targetMultiplier, payout });
       recordBet('Slide', betAmount, targetMultiplier, payout - betAmount);
    } else {
       recordBet('Slide', betAmount, 0, -betAmount);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 shadow-2xl overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Pari</span>
               <span>€{(betAmount).toFixed(2)}</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded-md flex items-center hover:border-text-secondary transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
               <span className="pl-3 text-emerald-500"><Coins size={16} /></span>
               <input 
                 type="number"
                 value={betAmount || ''}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none"
               />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Objectif Multiplicateur</span>
             </div>
             <div className="relative bg-bg-inner border border-border-medium rounded-md flex items-center hover:border-text-secondary transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
               <input 
                 type="number"
                 value={targetMultiplier || ''}
                 onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none"
                 step="0.01" min="1.01"
               />
               <span className="pr-4 text-text-secondary font-bold">×</span>
             </div>
          </div>
          
          <button 
            disabled={isPlaying || !user}
            onClick={startGame}
            className="mt-4 w-full py-4 rounded-md font-extrabold text-lg uppercase tracking-wider transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,230,118,0.4)] hover:shadow-[0_0_25px_rgba(0,230,118,0.6)]"
          >
            {isPlaying ? 'Tirage en cours...' : 'Parier'}
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl md:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 md:order-2">
        <div className="h-full bg-[#0f172a] relative p-8 flex flex-col items-center justify-center min-h-[400px]">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           {/* Slide Track Line */}
           <div className="absolute top-1/2 left-0 w-full h-1 bg-border-medium/30 -translate-y-1/2 overflow-hidden flex items-center"></div>
           
           <div className="flex gap-4 items-center z-10 w-full h-32 relative justify-center overflow-hidden max-w-full">
              {/* Animating Multipliers (Slide layout) */}
              <motion.div 
                 className="flex gap-4 items-center pl-[50%]"
                 animate={{ x: isPlaying ? '-80%' : 0 }}
                 transition={{ ease: "linear", duration: isPlaying ? 5 : 0 }}
              >
                 <div className="w-32 h-32 rounded-xl bg-bg-panel/50 border border-border-medium flex items-center justify-center">
                    <span className="text-text-secondary font-bold text-xl">1.00×</span>
                 </div>
                 <div className="w-48 h-32 rounded-xl bg-bg-panel border-2 border-accent flex items-center justify-center flex-col shadow-[0_0_30px_rgba(20,117,225,0.2)] z-10">
                    <span className={cn(
                       "font-black text-5xl font-mono",
                       crashPoint && crashPoint < targetMultiplier ? "text-[#ed4163]" : "text-white"
                    )}>
                       {currentMulti.toFixed(2)}×
                    </span>
                    {crashPoint && (
                       <span className={cn(
                          "uppercase font-bold tracking-widest text-sm mt-2",
                          crashPoint >= targetMultiplier ? "text-[#00e676]" : "text-[#ed4163]"
                       )}>
                          {crashPoint >= targetMultiplier ? 'Succès !' : 'Perdu'}
                       </span>
                    )}
                 </div>
                 <div className="w-32 h-32 rounded-xl bg-bg-panel/50 border border-border-medium flex items-center justify-center">
                    <span className="text-text-secondary font-bold text-xl">{(currentMulti + 1).toFixed(2)}×</span>
                 </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}
