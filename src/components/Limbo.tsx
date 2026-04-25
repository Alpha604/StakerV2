import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins, Target } from 'lucide-react';
import { WinPopup } from './WinPopup';

export function Limbo() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.00);
  const [resultMultiplier, setResultMultiplier] = useState<number>(1.00);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const winChance = Number((99 / targetMultiplier).toFixed(2));
  const potentialWin = betAmount * targetMultiplier;

  // Generate a realistic crash/limbo multiplier
  const generateMultiplier = () => {
    // 1% house edge usually, formula is roughly 0.99 / random()
    const e = 100;
    const h = 1; // house edge 1%
    const rand = Math.random();
    // Simplified formula that gives massive numbers rarely, and mostly 1.xx
    const result = Math.floor((100 * e - h) / (rand * 100)) / 100;
    return Math.max(1.00, result);
  };

  const handleBet = () => {
    if (!user || balance < betAmount) return; // Add auth handler
    
    subtractBalance(betAmount);
    setIsRolling(true);
    setLastWin(null);
    setResultMultiplier(1.00); // Reset visual
    setWinInfo(null);

    let currentVisual = 1.00;
    const finalResult = generateMultiplier();
    
    // Animate the rolling numbers up to final
    const interval = setInterval(() => {
       const step = (finalResult - currentVisual) * 0.3; // ease out
       currentVisual += step;
       
       if (Math.abs(finalResult - currentVisual) < 0.05 || currentVisual >= finalResult) { // End condition
         clearInterval(interval);
         setResultMultiplier(finalResult);
         
         const isWin = finalResult >= targetMultiplier;
         setLastWin(isWin);
         const payout = isWin ? potentialWin : 0;
         
         if (isWin) {
           addBalance(payout);
           setWinInfo({ multiplier: targetMultiplier, payout });
         }
         recordBet(
           'Limbo',
           betAmount,
           isWin ? targetMultiplier : 0,
           payout - betAmount
         );
         setIsRolling(false);
       } else {
         setResultMultiplier(currentVisual);
       }
    }, 50);
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
                disabled={isRolling}
              />
              <div className="flex items-center gap-1 pr-1">
                <button onClick={() => setBetAmount(prev => +(prev / 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">½</button>
                <button onClick={() => setBetAmount(prev => +(prev * 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">2×</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-text-secondary text-sm font-semibold">Multiplicateur cible</label>
            </div>
            <div className="relative flex items-center bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover">
              <input 
                type="number"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-bold outline-none tabular-nums pl-3"
                min="1.01"
                step="0.01"
                disabled={isRolling}
              />
              <div className="pr-3 text-text-secondary font-bold">×</div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={handleBet}
            disabled={isRolling || balance < betAmount}
            className={cn(
              "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
              "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
              (isRolling || balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-[0_4px_0_#00a84b]"
            )}
          >
            Miser
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative flex flex-col p-4 md:p-12 overflow-hidden justify-center items-center">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="flex-1 flex flex-col items-center justify-center relative w-full">
              
              {/* Main Number Display */}
              <motion.div 
                 key={lastWin === null ? 'rolling' : 'done'}
                 initial={{ scale: 0.8, opacity: 0.5 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className={cn(
                    "text-6xl md:text-9xl font-black tabular-nums transition-colors duration-300 drop-shadow-2xl",
                    lastWin === true ? "text-[#00e676]" : 
                    lastWin === false ? "text-[#ed4163]" : "text-white"
                 )}
              >
                 {resultMultiplier.toFixed(2)}<span className="text-4xl md:text-6xl text-white/50">×</span>
              </motion.div>

              {/* Target info below */}
              <div className="mt-8 text-center text-text-secondary text-lg font-bold flex items-center justify-center gap-4 bg-[#213743] px-6 py-3 rounded-full shadow-inner z-10">
                 <div className="flex items-center gap-2">
                    <Target size={20} className="text-[#ff9800]" />
                    <span>Cible: <span className="text-white">{targetMultiplier.toFixed(2)}×</span></span>
                 </div>
              </div>

              {/* Bottom Info Blocks */}
              <div className="w-full max-w-lg bg-[#213743] rounded-lg p-2 md:p-4 grid grid-cols-2 gap-2 md:gap-4 mt-auto absolute bottom-4 md:bottom-12 z-10">
                 <div className="bg-[#0f172a] rounded p-3 flex flex-col items-center text-center">
                    <span className="text-text-secondary text-xs md:text-sm font-semibold mb-1">Chances de gain</span>
                    <span className="text-white font-bold text-lg md:text-xl tabular-nums">{winChance}%</span>
                 </div>
                 <div className="bg-[#0f172a] rounded p-3 flex flex-col items-center text-center border-b-2 border-[#00e676]">
                    <span className="text-text-secondary text-xs md:text-sm font-semibold mb-1 text-[#00e676]">Gain potentiel</span>
                    <span className="text-[#00e676] font-bold text-lg md:text-xl tabular-nums">€{potentialWin.toFixed(2)}</span>
                 </div>
              </div>

           </div>

        </div>
      </div>
    </div>
  );
}
