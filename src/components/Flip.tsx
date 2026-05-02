import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Coins, HelpCircle } from "lucide-react";
import { WinPopup } from "./WinPopup";

export function Flip() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);

  const [coinSide, setCoinSide] = useState<"heads" | "tails" | null>(null);
  const [chosenSide, setChosenSide] = useState<"heads" | "tails">("heads");
  const [isFlipping, setIsFlipping] = useState(false);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const multiplier = 1.98;
  const potentialWin = betAmount * multiplier;

  const handleBet = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setIsFlipping(true);
    setCoinSide(null);
    setWinInfo(null);

    // Animate flip
    setTimeout(() => {
      const result = Math.random() > 0.5 ? "heads" : "tails";
      setCoinSide(result);
      setIsFlipping(false);
      setIsPlaying(false);

      const isWin = result === chosenSide;
      const payout = isWin ? Math.floor(potentialWin * 100) / 100 : 0;

      if (isWin) {
        addBalance(payout);
        setWinInfo({ multiplier, payout });
      }

      recordBet("Flip", betAmount, isWin ? multiplier : 0, payout - betAmount);
    }, 1500); // Wait 1.5 seconds for animation
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)] flex-col gap-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Side Controls */}
        <div className="lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
            <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-1 mt-4">
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

          <div className="flex flex-col gap-2">
            <label className="text-[#8b9ba5] text-sm font-semibold">
              Prédiction
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setChosenSide("heads")}
                disabled={isPlaying}
                className={cn(
                  "flex-1 py-3 rounded font-bold transition-all relative overflow-hidden",
                  chosenSide === "heads"
                    ? "bg-bg-inner border border-yellow-500 text-white"
                    : "bg-bg-inner/50 border border-transparent text-[#8b9ba5]",
                )}
              >
                Pile{" "}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500"></span>
              </button>
              <button
                onClick={() => setChosenSide("tails")}
                disabled={isPlaying}
                className={cn(
                  "flex-1 py-3 rounded font-bold transition-all relative overflow-hidden",
                  chosenSide === "tails"
                    ? "bg-bg-inner border border-blue-500 text-white"
                    : "bg-bg-inner/50 border border-transparent text-[#8b9ba5]",
                )}
              >
                Face{" "}
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
              </button>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleBet}
            disabled={isPlaying || balance < betAmount}
            className={cn(
              "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black text-[#0f1116] shadow-[0_4px_0_#00a84b]",
              "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
              (isPlaying || balance < betAmount) &&
                "opacity-50 cursor-not-allowed active:translate-y-0",
            )}
          >
            Miser
          </button>
        </div>

        {/* Right Side Game Canvas */}
        <div className="md:col-span-9 bg-[#0f212e] relative p-8 flex flex-col items-center justify-center overflow-hidden">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center perspective-[1000px]">
            {/* 3D Coin */}
            <motion.div
              initial={false}
              animate={
                isFlipping
                  ? {
                      rotateX: [0, 720, 1440, 2160, 2880], // spin aggressively
                      y: [0, -150, 0], // jump up and down
                    }
                  : coinSide === "heads"
                    ? {
                        rotateX: 0,
                        y: 0,
                      }
                    : coinSide === "tails"
                      ? {
                          rotateX: 180,
                          y: 0,
                        }
                      : {
                          rotateX: 0,
                          y: 0,
                        }
              }
              transition={{
                duration: isFlipping ? 1.5 : 0.5,
                ease: isFlipping ? "easeInOut" : "easeOut",
                times: isFlipping ? [0, 0.5, 1] : undefined,
              }}
              className="w-full h-full relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front: HEADS (Pile - Yellow) */}
              <div
                className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-yellow-600 bg-yellow-400 flex items-center justify-center shadow-xl font-black text-yellow-800 text-3xl sm:text-5xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateX(0deg)",
                }}
              >
                PILE
              </div>
              {/* Back: TAILS (Face - Blue) */}
              <div
                className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-blue-600 bg-blue-400 flex items-center justify-center shadow-xl font-black text-blue-900 text-3xl sm:text-5xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateX(180deg)",
                }}
              >
                FACE
              </div>
            </motion.div>
          </div>

          {!isFlipping && coinSide && coinSide !== chosenSide && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-8 font-black text-3xl sm:text-4xl text-[#ed4163]",
              )}
            >
              Perdu
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
