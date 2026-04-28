import React, { useState } from "react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { Coins } from "lucide-react";
import { WinPopup } from "./WinPopup";

// Simple Blackjack placeholder for now, allowing user to play basic blackjack
// In a full game, deck generation and suit/value logic is more complex.

const STAKECASINO_CHIP = <Coins size={20} className="text-emerald-500" />;

export function Blackjack() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameStage, setGameStage] = useState<
    "IDLE" | "PLAYING" | "DEALER_TURN" | "ENDED"
  >("IDLE");

  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const drawCard = () => Math.floor(Math.random() * 10) + 2; // Returns 2 to 11

  // Simplified Hand Total (Does not handle Aces perfectly for simplicity in initial version, consider 11 or 1 appropriately)
  const getHandTotal = (hand: number[]) => {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
      if (card === 11) aces++;
      total += card;
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  };

  const startGame = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;

    setWinInfo(null);
    setMessage("");

    const initialPlayer = [drawCard(), drawCard()];
    const initialDealer = [drawCard(), drawCard()];

    setPlayerHand(initialPlayer);
    setDealerHand(initialDealer);
    setGameStage("PLAYING");

    if (getHandTotal(initialPlayer) === 21) {
      // Blackjack!
      handleEnd(initialPlayer, initialDealer, true);
    }
  };

  const hit = () => {
    if (gameStage !== "PLAYING") return;
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);

    if (getHandTotal(newHand) > 21) {
      handleEnd(newHand, dealerHand); // Bust
    } else if (getHandTotal(newHand) === 21) {
      stand(newHand, dealerHand); // Auto stand on 21
    }
  };

  const stand = (pHand = playerHand, dHand = dealerHand) => {
    if (gameStage !== "PLAYING") return;
    setGameStage("DEALER_TURN");
    // Dealer logic directly
    let currentDealer = [...dHand];
    while (getHandTotal(currentDealer) < 17) {
      currentDealer.push(drawCard());
    }
    setDealerHand(currentDealer);
    handleEnd(pHand, currentDealer);
  };

  const handleEnd = (
    finalPlayerHand: number[],
    finalDealerHand: number[],
    isBlackjack = false,
  ) => {
    setGameStage("ENDED");
    const pTotal = getHandTotal(finalPlayerHand);
    const dTotal = getHandTotal(finalDealerHand);

    let multiplier = 0;
    let resultMsg = "";

    if (pTotal > 21) {
      resultMsg = "Busted! Dealer Wins.";
      multiplier = 0;
    } else if (dTotal > 21) {
      resultMsg = "Dealer Busted! You Win.";
      multiplier = isBlackjack ? 2.5 : 2;
    } else if (pTotal > dTotal) {
      resultMsg = "You Win!";
      multiplier = isBlackjack ? 2.5 : 2;
    } else if (dTotal > pTotal) {
      resultMsg = "Dealer Wins.";
      multiplier = 0;
    } else {
      resultMsg = "Push (Tie).";
      multiplier = 1;
    }

    setMessage(`${resultMsg} (${pTotal} vs ${dTotal})`);
    const payout = betAmount * multiplier;

    if (payout > 0) {
      addBalance(payout);
    }

    if (multiplier > 1) {
      setWinInfo({ multiplier, payout });
    }

    recordBet("Blackjack", betAmount, multiplier, payout - betAmount);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls Sidebar */}
      <div className="w-full md:w-[320px] bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e]">
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
                {(balance).toFixed(8)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
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
                disabled={gameStage !== "IDLE" && gameStage !== "ENDED"}
                className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"
                step="0.00000001"
                min="0"
                max={balance}
              />
              <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                <button
                  onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(8))}
                  disabled={gameStage !== "IDLE" && gameStage !== "ENDED"}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(8))}
                  disabled={gameStage !== "IDLE" && gameStage !== "ENDED"}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          {gameStage === "IDLE" || gameStage === "ENDED" ? (
            <button
              onClick={startGame}
              disabled={!user || balance < betAmount || betAmount <= 0}
              className={cn(
                "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                (!user || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              Pari
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={hit}
                className="w-full bg-[#3d5a6a] hover:bg-[#557086] text-white py-3 font-bold rounded transition-colors text-sm"
              >
                Tirer
              </button>
              <button
                onClick={() => stand()}
                className="w-full bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black py-3 font-bold rounded transition-colors text-sm"
              >
                Rester
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 bg-[#1a2c38] rounded-b-xl md:rounded-r-xl border border-border-subtle relative overflow-hidden order-1 md:order-2 p-8 flex flex-col justify-between min-h-[500px]">
        {winInfo && (
          <WinPopup
            multiplier={winInfo.multiplier}
            payout={winInfo.payout}
            onClose={() => setWinInfo(null)}
          />
        )}

        {/* Dealer Area */}
        <div className="flex flex-col items-center">
          <span className="text-text-secondary font-bold mb-4">
            Croupier{" "}
            {gameStage === "PLAYING" && dealerHand.length > 0
              ? `(?)`
              : `(${getHandTotal(dealerHand)})`}
          </span>
          <div className="flex gap-2 justify-center h-32">
            {dealerHand.map((card, i) => (
              <motion.div
                key={`dealer-${i}`}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-24 h-36 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center p-2 relative"
              >
                {gameStage === "PLAYING" && i === 1 ? (
                  <div className="w-full h-full bg-[#ed4163] rounded border-2 border-white flex justify-center items-center">
                    <span className="text-white text-3xl font-black">?</span>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "text-3xl font-black",
                      card === 11 ? "text-red-500" : "text-black",
                    )}
                  >
                    {card === 11 ? "A" : card}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center Message */}
        {message && gameStage === "ENDED" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-black/60 px-6 py-3 rounded-xl backdrop-blur font-black text-2xl text-white whitespace-nowrap z-20"
          >
            {message}
          </motion.div>
        )}

        {/* Player Area */}
        <div className="flex flex-col items-center">
          <div className="flex gap-2 justify-center h-32">
            {playerHand.map((card, i) => (
              <motion.div
                key={`player-${i}`}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-24 h-36 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center p-2 relative"
              >
                <span
                  className={cn(
                    "text-3xl font-black",
                    card === 11 ? "text-red-500" : "text-black",
                  )}
                >
                  {card === 11 ? "A" : card}
                </span>
              </motion.div>
            ))}
          </div>
          <span className="text-white font-bold mt-4 text-xl">
            Vous ({getHandTotal(playerHand)})
          </span>
        </div>
      </div>
    </div>
  );
}
