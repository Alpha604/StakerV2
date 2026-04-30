import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { cn } from "../lib/utils";
import { Coins, RotateCcw, Dices } from "lucide-react";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function Dice() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const { playTick, playWin, playLoss } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [condition, setCondition] = useState<"over" | "under">("over");
  const [target, setTarget] = useState<number>(50.5);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const winChance = condition === "over" ? 100 - target : target;
  const multiplier = Number((99 / winChance).toFixed(4));
  const potentialWin = betAmount * multiplier;
  const profitOnWin = potentialWin - betAmount;

  // Sync betAmount when changing profit and vice-versa
  const handleProfitChange = (newProfit: string) => {
    const profit = Number(newProfit);
    if (!isNaN(profit) && profit >= 0) {
      setBetAmount(+(profit / (multiplier - 1)).toFixed(2));
    }
  };

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRolling) {
          interval = setInterval(playTick, 150);
      }
      return () => clearInterval(interval);
  }, [isRolling, playTick]);

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
      if (condition === "over" && result >= target) isWin = true;
      if (condition === "under" && result <= target) isWin = true;

      setLastWin(isWin);
      if (isWin) playWin(); else playLoss();

      const payout = isWin ? Math.floor(potentialWin * 100) / 100 : 0;
      if (isWin) {
        addBalance(payout);
        setTimeout(() => setWinInfo({ multiplier, payout }), 500); // slight delay for popup
      }
      recordBet("Dice", betAmount, isWin ? multiplier : 0, payout - betAmount);

      setIsRolling(false);
    }, 600); // Wait bit longer for animation
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex lg:flex-row flex-col max-w-[1200px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[600px]">
        
        {/* Left Side: Controls */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">
            <div className="bg-[#0f212e] rounded-full p-1 flex">
              <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
              <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors">Auto</button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">
                  Montant de la mise
                </label>
                <span className="text-[#8b9ba5] text-[13px] flex items-center gap-1 font-semibold">
                  $ {(Math.floor(balance * 100) / 100).toFixed(2)}
                </span>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden">
                <span className="pl-3 absolute flex items-center justify-center">
                   {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                </span>
                <input
                  type="number"
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 text-[13px]"
                  min="0"
                  step="0.01"
                  disabled={isRolling}
                />
                <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white" disabled={isRolling}
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white" disabled={isRolling}
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">Bénéfice (Gain)</label>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden">
                <span className="pl-3 absolute flex items-center justify-center">
                  {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                </span>
                <input
                  type="number"
                  value={profitOnWin === 0 ? "" : profitOnWin.toFixed(8)}
                  onChange={(e) => handleProfitChange(e.target.value)}
                  className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 text-[13px]"
                  min="0"
                  step="0.01"
                  disabled={isRolling}
                />
              </div>
            </div>

            <div className="flex-1"></div>

            <button
              onClick={handleRoll}
              disabled={isRolling || balance < betAmount || betAmount <= 0}
              className={cn(
                "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                (isRolling || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed",
              )}
            >
              Pari
            </button>
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 bg-[#0f212e] lg:rounded-r-2xl lg:rounded-bl-none rounded-b-2xl relative p-4 lg:p-12 flex flex-col items-center justify-center border border-l-0 border-[#233845] order-1 lg:order-2 min-h-[400px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="w-full max-w-2xl relative flex flex-col items-center">
            
            {/* The Big Number Display */}
            <div className="h-28 flex items-center justify-center mb-8 w-full relative">
               <AnimatePresence>
                  {isRolling ? (
                    <motion.div
                      key="rolling-dice"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        rotate: [0, 90, 180, 270, 360],
                        y: [0, -20, 0, -10, 0]
                      }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="text-[#00e676] drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]"
                    >
                      <Dices size={80} strokeWidth={1.5} />
                    </motion.div>
                  ) : rollResult !== null ? (
                    <motion.div
                      key={rollResult + Date.now()}
                      initial={{ scale: 0.5, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={cn(
                        "text-7xl font-black tabular-nums transition-colors tracking-tighter drop-shadow-lg",
                        lastWin === true ? "text-[#00e676] drop-shadow-[0_0_30px_rgba(0,230,118,0.4)]" : "text-[#ed4163]"
                      )}
                    >
                      {rollResult.toFixed(2)}
                    </motion.div>
                  ) : (
                    <div className="text-7xl font-black tabular-nums tracking-tighter text-white opacity-10">
                      00.00
                    </div>
                  )}
               </AnimatePresence>
            </div>

            {/* Slider container */}
            <div className="w-full bg-[#162734] border border-[#233845] rounded-xl p-6 lg:p-8 relative shadow-lg mb-8">
               
               {/* 0, 25, 50, 75, 100 markers */}
               <div className="flex justify-between w-full mb-3 text-[10px] font-bold text-text-secondary px-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
               </div>

               {/* Track */}
               <div className="relative w-full h-3.5 bg-[#0d1b24] rounded-full flex items-center shadow-inner">
                  {/* Fill Logic for colors */}
                  <div
                    className="absolute h-full rounded-full transition-all duration-300 pointer-events-none"
                    style={{
                      left: condition === "over" ? `${target}%` : "0%",
                      right: condition === "over" ? "0%" : `${100 - target}%`,
                      backgroundColor: condition === "over" ? "#00e676" : "#00e676",
                    }}
                  />
                  <div
                    className="absolute h-full rounded-full transition-all duration-300 pointer-events-none"
                    style={{
                      left: condition === "under" ? `${target}%` : "0%",
                      right: condition === "under" ? "0%" : `${100 - target}%`,
                      backgroundColor: condition === "under" ? "#ed4163" : "#ed4163",
                    }}
                  />

                  {/* Previous Roll Marker on track */}
                  {rollResult !== null && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute w-2 h-5 bg-white rounded-full z-10 -translate-x-1/2 drop-shadow-md border border-[#0f212e] pointer-events-none"
                        style={{ left: `${rollResult}%` }}
                    />
                  )}
               </div>

               {/* Range Input Overlay */}
               <input
                 type="range"
                 min="2"
                 max="98"
                 step="0.01"
                 value={target}
                 onChange={(e) => setTarget(Number(e.target.value))}
                 disabled={isRolling}
                 className="absolute inset-x-6 lg:inset-x-8 bottom-[42px] cursor-pointer opacity-0 h-10 z-20 w-[calc(100%-48px)] lg:w-[calc(100%-64px)]"
               />

               {/* Custom Thumb Element */}
               <div
                 className="absolute bottom-[36.5px] w-8 h-8 z-10 -translate-x-1/2 cursor-pointer pointer-events-none"
                 style={{ left: `calc(48px + (100% - 96px) * (${target - 2} / 96))` }} // Adjusted based on padding, but simpler approach:
               >
                 <div
                   className="absolute pointer-events-none"
                   style={{ left: `calc(${target}% + ${24 - target * 0.48}px)` }} // Tailwind slider thumb trick or just use pure absolute left.
                 />
                 {/* Visual Handle mapped directly to % */}
               </div>
               
               {/* Visual Handle absolute positioned over the track */}
               <div 
                 className="absolute bottom-[44px] -translate-x-1/2 w-8 h-8 bg-white rounded-lg shadow-md z-10 pointer-events-none flex items-center justify-center border border-gray-200"
                 style={{ left: `calc(1.5rem + (100% - 3rem) * (${target} / 100))` }}
               >
                 <div className="w-3 h-1.5 flex gap-[3px] justify-center">
                    <div className="w-[3px] h-[12px] bg-[#9ba7b5] rounded-full" />
                    <div className="w-[3px] h-[12px] bg-[#9ba7b5] rounded-full" />
                 </div>
                 {/* Floating Label */}
                 <div className={cn(
                    "absolute -top-10 text-xs font-bold py-1 px-2 rounded-md shadow-lg truncate text-white pointer-events-none after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-l-4 after:border-r-4 after:border-t-4 after:border-solid after:border-l-transparent after:border-r-transparent",
                    condition === "over" ? "bg-[#00e676] after:border-t-[#00e676] text-[#0f212e]" : "bg-[#00e676] after:border-t-[#00e676] text-[#0f212e]"
                  )}>
                    {target.toFixed(2)}
                 </div>
               </div>

            </div>

            {/* Bottom 4 Inputs */}
            <div className="w-full bg-[#162734] border border-[#233845] rounded-lg p-3 lg:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 relative overflow-hidden shadow-lg">
              
              {/* Multiplier */}
              <div className="bg-[#0d1b24] rounded-lg flex flex-col p-2 border border-[#233845] focus-within:border-accent transition-colors">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-1">
                  Multiplicateur
                </span>
                <div className="flex items-center">
                    <input
                      type="number"
                      value={multiplier.toFixed(4)}
                      readOnly
                      className="bg-transparent text-white font-bold text-sm w-full outline-none disabled:opacity-100 tabular-nums"
                    />
                    <span className="text-white font-bold text-sm px-1">×</span>
                </div>
              </div>

              {/* Roll Over/Under Toggle */}
              <div className="bg-[#0d1b24] rounded-lg flex flex-col p-2 border border-[#233845] focus-within:border-accent transition-colors relative">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-1">
                  {condition === "over" ? "Roll Over" : "Roll Under"}
                </span>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={target.toFixed(2)}
                    readOnly
                    className="bg-transparent text-white font-bold text-sm w-full outline-none disabled:opacity-100 tabular-nums"
                  />
                  <button
                    onClick={() => setCondition(condition === "over" ? "under" : "over")}
                    className="w-6 h-6 rounded flex items-center justify-center bg-[#233845] hover:bg-[#334b5c] transition-colors text-white shadow-sm"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Win Chance */}
              <div className="bg-[#0d1b24] rounded-lg flex flex-col p-2 border border-[#233845] focus-within:border-accent transition-colors">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-1">
                  Chances
                </span>
                <div className="flex items-center">
                   <input
                     type="number"
                     value={winChance.toFixed(2)}
                     readOnly
                     className="bg-transparent text-white font-bold text-sm w-full outline-none disabled:opacity-100 tabular-nums"
                   />
                   <span className="text-white font-bold text-sm px-1">%</span>
                </div>
              </div>

              {/* Payout/Profit Potential */}
              <div className="bg-[#0d1b24] rounded-lg flex flex-col p-2 border border-[#233845]">
                <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-1 text-[#00e676]">
                  Gain potentiel
                </span>
                <div className="flex items-center">
                   <div className="pr-1 flex items-center justify-center">
                     {renderCryptoIcon(activeCrypto, "w-3.5 h-3.5")}
                   </div>
                   <input
                     type="number"
                     value={potentialWin.toFixed(2)}
                     readOnly
                     className="bg-transparent text-[#00e676] font-bold text-sm w-full outline-none tabular-nums truncate"
                   />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

