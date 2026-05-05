import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins } from "lucide-react";
import { WinPopup } from "./WinPopup";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "7️⃣"];
const PAYOUTS: Record<string, number> = {
  "🍒": 2,
  "🍋": 3,
  "🍊": 5,
  "🍇": 10,
  "🍉": 20,
  "⭐": 50,
  "7️⃣": 100,
};

export function TomeOfLife() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reels, setReels] = useState<string[][]>([
    ["🍒", "🍋", "🍊"],
    ["🍇", "🍉", "⭐"],
    ["7️⃣", "🍒", "🍋"],
  ]);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
    line?: number;
  } | null>(null);

  const spin = async () => {
    if (!user || balance < betAmount) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;
    setIsPlaying(true);
    setWinInfo(null);

    // Simulate Fake Spinning
    let spins = 0;
    const interval = setInterval(() => {
      setReels([
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
        [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ],
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
      [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        finalRow[0],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ],
      [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        finalRow[1],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ],
      [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        finalRow[2],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ],
    ];
    setReels(finalReelSet);

    setIsPlaying(false);

    if (finalRow[0] === finalRow[1] && finalRow[1] === finalRow[2]) {
      const symbol = finalRow[0];
      const multiplier = PAYOUTS[symbol] || 5;
      const payout = betAmount * multiplier;
      addBalance(payout);
      setWinInfo({ multiplier, payout, line: 1 });
      recordBet("TomeOfLife", betAmount, multiplier, payout - betAmount);
    } else {
      recordBet("TomeOfLife", betAmount, 0, -betAmount);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls Sidebar */}
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
                $ {formatCurrency(balance )}
              </span>
            </div>
            <div className="relative flex items-center bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden">
              <span className="pl-3 absolute flex items-center justify-center">
                {renderCryptoIcon(activeCrypto, "w-4 h-4")}
              </span>
              <input
                type="number"
                value={betAmount || ""}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isPlaying}
                className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"
                step="0.01"
                min="0"
                max={balance}
              />
              <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            disabled={isPlaying || !user || balance < betAmount || betAmount <= 0}
            onClick={spin}
            className={cn(
              "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
              (isPlaying || !user || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPlaying ? "En cours..." : "Pari"}
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl lg:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 lg:order-2">
        <div className="h-full bg-gradient-to-b from-[#1a0f0f] to-[#361919] relative p-8 flex flex-col items-center justify-center min-h-[500px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

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
                        winInfo?.line === 1 && sIdx === 1
                          ? "animate-pulse border-[#e0b553] shadow-[0_0_20px_rgba(224,181,83,0.8)] z-10"
                          : "",
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
