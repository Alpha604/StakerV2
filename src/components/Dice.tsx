import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

export function Dice() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [condition, setCondition] = useState<'over' | 'under'>('over');
  const [target, setTarget] = useState<number>(50.50);
  const [rollResult, setRollResult] = useState<number | null>(50.00);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const winChance = condition === 'over' ? 100 - target : target;
  const multiplier = Number((99 / winChance).toFixed(4));
  const potentialWin = betAmount * multiplier;

  const handleRoll = () => {
    if (!user || balance < betAmount) return; // Add proper auth/balance notifications in real app
    
    subtractBalance(betAmount);
    setIsRolling(true);
    setLastWin(null);
    setWinInfo(null);

    // Simulate animation delay
    setTimeout(() => {
      const result = Number((Math.random() * 100).toFixed(2));
      setRollResult(result);
      
      let isWin = false;
      if (condition === 'over' && result > target) isWin = true;
      if (condition === 'under' && result < target) isWin = true;

      setLastWin(isWin);
      
      const payout = isWin ? potentialWin : 0;
      if (isWin) {
        addBalance(payout);
        setWinInfo({ multiplier, payout });
      }
      recordBet(
         'Dice',
         betAmount,
         isWin ? multiplier : 0,
         payout - betAmount
      );
      
      setIsRolling(false);
    }, 400); // Fast roll
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        
        {/* Left Side: Controls */}
        <div className="md:col-span-3 bg-[#213743] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-medium z-10 relative">
          {/* Bet Amount */}
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

          <div className="flex-1"></div>

          {/* Bet Button */}
          <button 
            onClick={handleRoll}
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
        <div className="md:col-span-9 bg-[#0f172a] relative flex flex-col p-4 md:p-12 overflow-hidden">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Dice Track */}
              <div className="w-full max-w-2xl relative h-3 bg-bg-panel rounded-full overflow-hidden flex shadow-inner">
                 <div 
                    className="h-full transition-all duration-300 relative" 
                    style={{ 
                       width: condition === 'over' ? `${target}%` : `${100 - target}%`,
                       backgroundColor: condition === 'over' ? '#e53935' : '#00e676',
                       marginLeft: condition === 'under' ? `${target}%` : '0%'
                    }} 
                 />
                 <div 
                    className="h-full absolute top-0 transition-all duration-300"
                    style={{ 
                       width: condition === 'over' ? `${100 - target}%` : `${target}%`,
                       backgroundColor: condition === 'over' ? '#00e676' : '#e53935',
                       left: condition === 'over' ? `${target}%` : '0%'
                    }}
                 />
              </div>

              {/* Slider thumb */}
              <div className="w-full max-w-2xl relative mt-2 mb-12">
                 <input 
                    type="range"
                    min="2"
                    max="98"
                    step="0.01"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    disabled={isRolling}
                    className="w-full absolute -top-8 opacity-0 cursor-pointer h-12 z-20"
                 />
                 {/* Visual Handle */}
                 <div 
                    className="w-8 h-8 bg-white border-[6px] border-[#213743] rounded-full absolute -top-[21px] -translate-x-1/2 flex items-center justify-center shadow-lg pointer-events-none transition-all duration-75"
                    style={{ left: `${target}%` }}
                 >
                    <div className="text-[10px] font-black text-[#213743] absolute -top-10 bg-white px-2 py-1 rounded shadow-md after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-l-4 after:border-r-4 after:border-t-4 after:border-solid after:border-l-transparent after:border-r-transparent after:border-t-white">
                       {target.toFixed(2)}
                    </div>
                 </div>

                 {/* Roll Result Marker */}
                 {rollResult !== null && (
                    <motion.div 
                       initial={{ scale: 0, y: 20 }}
                       animate={{ 
                          scale: 1, 
                          y: 0, 
                          x: '-50%',
                          left: `${rollResult}%` 
                       }}
                       transition={{ type: "spring", stiffness: 300, damping: 20 }}
                       className={cn(
                          "absolute -top-[30px] font-black text-xl md:text-3xl px-4 py-2 rounded-lg shadow-2xl z-30 transition-colors",
                          lastWin === true ? "text-[#00e676] drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]" : 
                          lastWin === false ? "text-[#ed4163]" : "text-white"
                       )}
                    >
                       {rollResult.toFixed(2)}
                    </motion.div>
                 )}
              </div>

              {/* Bottom Info Blocks */}
              <div className="w-full max-w-2xl bg-[#213743] rounded-lg p-2 md:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-8">
                 <div className="bg-[#0f172a] rounded p-2 flex flex-col">
                    <span className="text-text-secondary text-xs font-semibold">Multiplicateur</span>
                    <input 
                       type="text" 
                       value={multiplier.toFixed(4) + "×"}
                       readOnly
                       className="bg-transparent text-white font-bold text-lg outline-none w-full tabular-nums"
                    />
                 </div>
                 <div className="bg-[#0f172a] rounded p-2 flex flex-col">
                    <span className="text-text-secondary text-xs font-semibold">Roll Over</span>
                    <div className="flex gap-2">
                       <button onClick={() => setCondition(condition === 'over' ? 'under' : 'over')} className="bg-[#2c4755] hover:bg-[#345464] p-1 rounded transition-colors text-white">
                          ↺
                       </button>
                       <input 
                          type="text" 
                          value={target.toFixed(2)}
                          readOnly
                          className="bg-transparent text-white font-bold text-lg outline-none w-full tabular-nums"
                       />
                    </div>
                 </div>
                 <div className="bg-[#0f172a] rounded p-2 flex flex-col">
                    <span className="text-text-secondary text-xs font-semibold">Chances de gain</span>
                    <input 
                       type="text" 
                       value={winChance.toFixed(2) + "%"}
                       readOnly
                       className="bg-transparent text-white font-bold text-lg outline-none w-full tabular-nums"
                    />
                 </div>
                 <div className="bg-[#0f172a] rounded p-2 border border-[#00e676]/30 flex flex-col">
                    <span className="text-text-secondary text-xs font-semibold text-[#00e676]">Gain potentiel</span>
                    <input 
                       type="text" 
                       value={"€ " + potentialWin.toFixed(2)}
                       readOnly
                       className="bg-transparent text-[#00e676] font-bold text-lg outline-none w-full tabular-nums"
                    />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
