import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Target } from "lucide-react";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function Limbo() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const { playTick, playWin, playLoss } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0);
  const [resultMultiplier, setResultMultiplier] = useState<number>(1.0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const winChance = Number((99 / targetMultiplier).toFixed(2));
  const potentialWin = betAmount * targetMultiplier;
  const profitOnWin = potentialWin - betAmount;

  const handleTargetChange = (newTarget: string) => {
    const val = Number(newTarget);
    if (!isNaN(val) && val >= 1.01) {
      setTargetMultiplier(val);
    }
  };

  const handleProfitChange = (newProfit: string) => {
    const profit = Number(newProfit);
    if (!isNaN(profit) && profit >= 0) {
      setBetAmount(+(profit / (targetMultiplier - 1)).toFixed(2));
    }
  };

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRolling) {
          interval = setInterval(playTick, 100);
      }
      return () => clearInterval(interval);
  }, [isRolling, playTick]);

  // Generate a realistic crash/limbo multiplier
  const generateMultiplier = () => {
    // 1% house edge usually, formula is roughly 0.99 / random()
    const e = 100;
    const h = 1; // house edge 1%
    const rand = Math.random();
    // Simplified formula that gives massive numbers rarely, and mostly 1.xx
    const result = Math.floor((100 * e - h) / (rand * 100)) / 100;
    return Math.max(1.0, result);
  };

  const handleBet = () => {
    if (!user || balance < betAmount) return; // Add auth handler

    subtractBalance(betAmount);
    setIsRolling(true);
    setLastWin(null);
    setResultMultiplier(1.0); // Reset visual
    setWinInfo(null);

    let currentVisual = 1.0;
    const finalResult = generateMultiplier();
    
    // Animation duration shorter for smaller differences, longer for big
    const diff = finalResult - 1.0;
    const durationMs = Math.min(1500, 300 + diff * 10);
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      
      // Easing function for smoother ramp up and slow down
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      currentVisual = 1.0 + diff * easeOutQuart;

      if (progress < 1) {
        setResultMultiplier(currentVisual);
        requestAnimationFrame(animate);
      } else {
        setResultMultiplier(finalResult);
        const isWin = finalResult >= targetMultiplier;
        setLastWin(isWin);
        if(isWin) playWin(); else playLoss();
        const payout = isWin ? Math.floor(potentialWin * 100) / 100 : 0;

        if (isWin) {
          addBalance(payout);
          setTimeout(() => setWinInfo({ multiplier: targetMultiplier, payout }), 300);
        }
        recordBet(
          "Limbo",
          betAmount,
          isWin ? targetMultiplier : 0,
          payout - betAmount,
        );
        setIsRolling(false);
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex flex-col lg:flex-row bg-bg-panel rounded-lg overflow-hidden shadow-2xl min-h-[600px]">
        {/* Left Side: Controls */}
        <div className="bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e] w-full lg:w-[320px] shrink-0">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-sm font-bold text-white bg-[#2f4553] rounded-full py-2 transition-colors">Manuel</button>
            <button className="flex-1 text-sm font-bold text-[#8b9ba5] hover:text-white rounded-full py-2 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Bet Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-xs font-bold">
                  Montant de la mise
                </label>
                <span className="text-[#8b9ba5] text-xs font-bold flex items-center gap-1">
                  $ {formatCurrency(balance || 0)}
                </span>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded border border-[#2f4553] p-1 transition-colors focus-within:border-border-hover">
                <div className="pl-2 pr-1 flex items-center justify-center">
                   {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                </div>
                <input
                  type="number"
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-white font-bold outline-none tabular-nums text-sm px-1 py-1"
                  min="0"
                  step="0.01"
                  disabled={isRolling}
                />
                <div className="flex items-center gap-1 pr-1 border-l border-[#2f4553] pl-2">
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                    className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    ½
                  </button>
                  <div className="w-px h-3 bg-[#2f4553]"></div>
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                    className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            {/* Profit on Win */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-xs font-bold">
                  Bénéfice en cas de gain
                </label>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded border border-[#2f4553] p-1 transition-colors focus-within:border-border-hover">
                <div className="pl-2 pr-1 flex items-center justify-center">
                  {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                </div>
                <input
                  type="number"
                  value={profitOnWin === 0 ? "" : formatCurrency(profitOnWin)}
                  onChange={(e) => handleProfitChange(e.target.value)}
                  className="w-full bg-transparent text-white font-bold outline-none tabular-nums text-sm px-1 py-1"
                  min="0"
                  step="0.01"
                  disabled={isRolling}
                />
              </div>
            </div>

            {/* Sub Grid for Target and Chance */}
            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1.5 bg-[#0f212e] rounded p-2 border border-[#2f4553] focus-within:border-border-hover transition-colors">
                    <label className="text-[#8b9ba5] text-[10px] font-bold uppercase tracking-wider">
                        Multiplicateur Cible
                    </label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            value={targetMultiplier}
                            onChange={(e) => handleTargetChange(e.target.value)}
                            className="bg-transparent text-white font-bold w-full outline-none disabled:opacity-100 tabular-nums text-sm"
                            disabled={isRolling}
                        />
                        <span className="text-white font-bold text-sm px-1">×</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 bg-[#0f212e] rounded p-2 border border-[#2f4553] focus-within:border-border-hover transition-colors">
                    <label className="text-[#8b9ba5] text-[10px] font-bold uppercase tracking-wider">
                        Chances Cible
                    </label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            value={formatCurrency(winChance)}
                            readOnly
                            className="bg-transparent text-white font-bold w-full outline-none disabled:opacity-100 tabular-nums text-sm"
                        />
                        <span className="text-white font-bold text-sm px-1">%</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleBet}
            disabled={isRolling || balance < betAmount}
            className={cn(
              "w-full py-3.5 rounded font-bold text-sm transition-all bg-[#00e676] hover:bg-[#1bc86a] text-[#0f1116]",
              (isRolling || balance < betAmount) && "opacity-50 cursor-not-allowed",
            )}
          >
            Miser
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 order-1 lg:order-2 bg-[#0f212e] relative p-4 lg:p-12 flex flex-col items-center justify-center min-h-[400px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="flex-1 flex flex-col items-center justify-center relative w-full translate-y-[-20px]">
            {/* Main Number Display */}
            <motion.div
              key={lastWin === null ? "rolling" : "done"}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "text-[100px] lg:text-[140px] font-black tabular-nums transition-colors tracking-tighter drop-shadow-2xl leading-none flex items-center justify-center",
                lastWin === true
                  ? "text-[#00e676] drop-shadow-[0_0_40px_rgba(0,230,118,0.4)]"
                  : lastWin === false
                    ? "text-[#e53935]"
                    : "text-white",
              )}
            >
              {formatCurrency(resultMultiplier)}
              <span className="text-5xl lg:text-7xl font-bold ml-2">×</span>
            </motion.div>

            {/* Target info below */}
            <AnimatePresence>
                {!isRolling && lastWin !== null && (
                    <motion.div key="lastwin" 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={cn("mt-8 text-center font-bold px-6 py-2 rounded-lg text-sm tracking-wide", lastWin ? "text-[#00e676] bg-[#00e676]/10" : "text-[#e53935] bg-[#e53935]/10")}
                    >
                        Cible: {formatCurrency(targetMultiplier)}×
                    </motion.div>
                )}
            </AnimatePresence>
            
          </div>
        </div>
      </div>
    </div>
  );
}

