import React, { useState, useEffect } from "react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { Coins, AlertCircle } from "lucide-react";
import { WinPopup } from "./WinPopup";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export function Slots() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
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
      <div className="w-full md:w-80 bg-bg-panel border border-border-medium rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 p-4 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
            <span>Pari</span>
            <span>€{betAmount.toFixed(2)}</span>
          </div>
          <div className="relative bg-bg-inner border border-border-medium rounded flex items-center hover:border-text-secondary transition-colors focus-within:border-accent">
            <span className="pl-3 text-emerald-500 flex items-center justify-center">{renderCryptoIcon(activeCrypto, "w-5 h-5")}</span>
            <input
              type="number"
              value={betAmount || ""}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={isSpinning}
              className="w-full bg-transparent text-white font-mono p-3 outline-none"
            />
            <div className="pr-1 flex gap-1">
              <button
                onClick={() => setBetAmount((b) => b / 2)}
                className="bg-bg-panel hover:bg-border-subtle p-1.5 rounded font-bold text-xs"
                disabled={isSpinning}
              >
                1/2
              </button>
              <button
                onClick={() => setBetAmount((b) => b * 2)}
                className="bg-bg-panel hover:bg-border-subtle p-1.5 rounded font-bold text-xs"
                disabled={isSpinning}
              >
                2x
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={!user || balance < betAmount || isSpinning}
          className="w-full py-3.5 mt-2 rounded text-[#0f172a] font-black text-lg uppercase tracking-wider bg-accent hover:bg-accent-hover transition-colors shadow disabled:opacity-30 disabled:bg-bg-inner disabled:text-text-secondary"
        >
          {isSpinning ? "En cours..." : "Spin"}
        </button>

        <div className="mt-4 bg-bg-inner p-4 border border-border-medium rounded-lg text-xs text-text-secondary flex gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <p>
            Jeu de machine à sous générique pour "Uniquement sur Stake". Tentez
            d'aligner 3 symboles sur la ligne centrale.
          </p>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-[#1a2c38] rounded-b-xl md:rounded-r-xl border border-border-medium relative overflow-hidden order-1 md:order-2 p-8 flex flex-col items-center justify-center min-h-[500px]">
        {winInfo && (
          <WinPopup
            multiplier={winInfo.multiplier}
            payout={winInfo.payout}
            onClose={() => setWinInfo(null)}
          />
        )}

        <div className="bg-[#0f172a] p-8 rounded-2xl border-4 border-[#2f4553] shadow-2xl relative">
          {/* Payline indicator */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-accent/50 -translate-y-1/2 z-0 pointer-events-none"></div>

          <div className="flex gap-4 relative z-10">
            {reels.map((col, colIdx) => (
              <div
                key={colIdx}
                className="bg-[#1a2c38] border-2 border-[#304554] rounded-xl flex flex-col items-center p-4 gap-4 overflow-hidden w-24 h-64 relative"
              >
                <AnimatePresence mode="popLayout">
                  {col.map((sym, rowIdx) => (
                    <motion.div
                      key={`${colIdx}-${rowIdx}-${sym}-${isSpinning}`}
                      initial={{ y: isSpinning ? -50 : 0, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className={cn(
                        "text-4xl filter drop-shadow-md",
                        rowIdx === 1 ? "scale-125 my-4" : "opacity-50",
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

        <div className="mt-8 text-center text-text-secondary font-bold">
          <p className="text-xl mb-2">Tableau des gains (Ligne du centre) :</p>
          <div className="flex gap-4 justify-center text-sm">
            <span className="bg-bg-panel px-3 py-1 rounded border border-border-medium">
              🎰 50x
            </span>
            <span className="bg-bg-panel px-3 py-1 rounded border border-border-medium">
              7️⃣ 20x
            </span>
            <span className="bg-bg-panel px-3 py-1 rounded border border-border-medium">
              💎 10x
            </span>
            <span className="bg-bg-panel px-3 py-1 rounded border border-border-medium">
              🍒 5x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
