import React, { useState, useEffect } from "react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { Coins, AlertCircle } from "lucide-react";
import { WinPopup } from "./WinPopup";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export function Slots() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<string[][]>([
    ["🍒", "🍋", "🍇"],
    ["🍇", "🍒", "🍋"],
    ["🍋", "🍇", "🍒"],
  ]);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🎰"];

  const spin = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;
    if (isSpinning) return;

    const success = await subtractBalance(betAmount);
    if (!success) return;

    setIsSpinning(true);
    setWinInfo(null);

    // Simulate spinning
    let currentReels = [...reels];
    const spinInterval = setInterval(() => {
      currentReels = currentReels.map((col) => [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      setReels(currentReels);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);

      const finalReels = [
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
        [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ],
      ];

      // Let's force a slightly higher win chance for fun (10% chance to force middle row match)
      if (Math.random() < 0.1) {
        const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        finalReels[0][1] = winSymbol;
        finalReels[1][1] = winSymbol;
        finalReels[2][1] = winSymbol;
      }

      setReels(finalReels);
      setIsSpinning(false);
      checkWin(finalReels);
    }, 2000);
  };

  const checkWin = (finalReels: string[][]) => {
    // Very simple win check: middle row all same
    let multiplier = 0;
    if (
      finalReels[0][1] === finalReels[1][1] &&
      finalReels[1][1] === finalReels[2][1]
    ) {
      const sym = finalReels[0][1];
      if (sym === "🎰") multiplier = 50;
      else if (sym === "7️⃣") multiplier = 20;
      else if (sym === "💎") multiplier = 10;
      else multiplier = 5;
    }

    const payout = betAmount * multiplier;
    if (multiplier > 0) {
      addBalance(payout);
      setWinInfo({ multiplier, payout });
    }
    recordBet("Slots", betAmount, multiplier, payout - betAmount);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 bg-[#162734] border border-[#233845] md:rounded-l-2xl md:rounded-r-none rounded-t-2xl flex flex-col h-fit order-2 md:order-1 z-10 p-6 relative">
         <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
         <div className="flex flex-col gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-1">
              <span>Montant du Pari</span>
              <span className="text-white text-xs flex items-center gap-1">
                {balance.toFixed(8)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
              </span>
            </div>
            <div className="relative flex items-center bg-[#0d1b24] border border-[#233845] rounded-lg hover:border-[#334b5c] transition-colors focus-within:border-accent ring-1 ring-black/20 h-12 overflow-hidden">
               <span className="pl-3 absolute flex items-center justify-center">
                 {renderCryptoIcon(activeCrypto, "w-5 h-5")}
               </span>
              <input
                type="number"
                value={betAmount || ""}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isSpinning}
                className="w-full bg-transparent text-white font-bold p-2 pl-10 outline-none focus:ring-0 disabled:opacity-50 text-sm"
              />
              <div className="flex h-full border-l border-[#233845] divide-x divide-[#233845]">
                <button
                  onClick={() => setBetAmount((b) => b / 2)}
                  className="px-4 hover:bg-[#233845] text-xs font-bold disabled:opacity-50 transition-colors text-slate-300"
                  disabled={isSpinning}
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((b) => b * 2)}
                  className="px-4 hover:bg-[#233845] text-xs font-bold disabled:opacity-50 transition-colors text-slate-300"
                  disabled={isSpinning}
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={spin}
            disabled={!user || balance < betAmount || isSpinning || betAmount <= 0}
            className="w-full py-4 mt-2 rounded-lg text-[#000] font-extrabold text-sm uppercase tracking-wider bg-accent hover:bg-accent-hover transition-all shadow-[0_0_20px_rgba(0,231,1,0.2)] disabled:opacity-30 disabled:shadow-none disabled:bg-[#233845] disabled:text-text-secondary disabled:cursor-not-allowed"
          >
            {isSpinning ? "En cours..." : "Jouer"}
          </button>

          <div className="mt-4 bg-[#0d1b24] p-4 border border-[#233845] rounded-lg text-xs text-text-secondary flex gap-3 shadow-inner">
            <AlertCircle size={18} className="shrink-0 text-accent/80" />
            <p className="leading-relaxed">
              Jeu de machine à sous exclusif. Tentez d'aligner 3 symboles identiques sur la ligne du centre.
            </p>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-[#0f212e] rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none border border-l-0 border-[#233845] relative overflow-hidden order-1 md:order-2 p-8 flex flex-col items-center justify-center min-h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
        {winInfo && (
          <WinPopup
            multiplier={winInfo.multiplier}
            payout={winInfo.payout}
            onClose={() => setWinInfo(null)}
          />
        )}

        <div className="bg-[#162734] p-8 rounded-2xl border border-[#233845] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
          {/* Payline indicator */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-accent/30 shadow-[0_0_15px_rgba(0,231,1,0.5)] -translate-y-1/2 z-0 pointer-events-none rounded-full"></div>

          <div className="flex gap-4 md:gap-6 relative z-10">
            {reels.map((col, colIdx) => (
              <div
                key={colIdx}
                className="bg-[#0f212e] border border-[#233845] rounded-xl flex flex-col items-center p-4 gap-4 overflow-hidden w-24 md:w-32 h-64 md:h-72 relative shadow-inner"
              >
                {/* Gradient fades for top and bottom of reels */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0f212e] to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f212e] to-transparent z-10 pointer-events-none" />
                
                <AnimatePresence mode="popLayout">
                  {col.map((sym, rowIdx) => (
                    <motion.div
                      key={`${colIdx}-${rowIdx}-${sym}-${isSpinning}`}
                      initial={{ y: isSpinning ? -80 : 0, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 80, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "linear" }}
                      className={cn(
                        "text-5xl md:text-6xl filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center h-1/3",
                        rowIdx === 1 ? "scale-110 md:scale-125 z-0" : "opacity-40 scale-75",
                      )}
                    >
                      {sym}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-text-secondary font-bold">
          <p className="text-xs uppercase tracking-widest text-[#334b5c] mb-4">Tableau des gains (Ligne du Centre)</p>
          <div className="flex flex-wrap gap-3 justify-center text-xs md:text-sm">
            <span className="bg-[#162734] px-4 py-2 rounded-lg border border-[#233845] flex items-center gap-2 shadow-sm">
              <span className="text-xl drop-shadow">🎰</span> <span className="text-[#00e701] font-black">50x</span>
            </span>
            <span className="bg-[#162734] px-4 py-2 rounded-lg border border-[#233845] flex items-center gap-2 shadow-sm">
              <span className="text-xl drop-shadow">7️⃣</span> <span className="text-white font-black">20x</span>
            </span>
            <span className="bg-[#162734] px-4 py-2 rounded-lg border border-[#233845] flex items-center gap-2 shadow-sm">
              <span className="text-xl drop-shadow">💎</span> <span className="text-white font-black">10x</span>
            </span>
            <span className="bg-[#162734] px-4 py-2 rounded-lg border border-[#233845] flex items-center gap-2 shadow-sm">
              <span className="text-xl drop-shadow">🍒</span> <span className="text-white font-black">5x</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
