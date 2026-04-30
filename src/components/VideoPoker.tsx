import React, { useState } from "react";
import { motion } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Coins } from "lucide-react";
import { WinPopup } from "./WinPopup";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

interface Card {
  suit: string;
  rank: string;
  id: string;
}

export function VideoPoker() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cards, setCards] = useState<Card[]>([]);
  const [heldCards, setHeldCards] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [gameState, setGameState] = useState<"idle" | "dealt" | "finished">(
    "idle",
  );
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const getRandomCard = (): Card => {
    return {
      suit: SUITS[Math.floor(Math.random() * SUITS.length)],
      rank: RANKS[Math.floor(Math.random() * RANKS.length)],
      id: Math.random().toString(36).substring(7),
    };
  };

  const dealInitial = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setHeldCards([false, false, false, false, false]);

    const newCards = Array(5)
      .fill(null)
      .map(() => getRandomCard());
    setCards(newCards);
    setGameState("dealt");
  };

  const drawCards = () => {
    const finalCards = cards.map((c, i) =>
      heldCards[i] ? c : getRandomCard(),
    );
    setCards(finalCards);
    setGameState("finished");
    evaluateHand(finalCards);
  };

  const evaluateHand = (finalCards: Card[]) => {
    // Fictive simplistic evaluation logic
    // Jacks or Better logic mapping to multipliers
    const counts: Record<string, number> = {};
    finalCards.forEach((c) => (counts[c.rank] = (counts[c.rank] || 0) + 1));
    const pairs = Object.values(counts).filter((v) => v === 2).length;
    const three = Object.values(counts).filter((v) => v === 3).length;
    const four = Object.values(counts).filter((v) => v === 4).length;

    let multiplier = 0;
    if (four === 1) multiplier = 25;
    else if (three === 1 && pairs === 1)
      multiplier = 9; // Full house
    else if (three === 1) multiplier = 3;
    else if (pairs === 2) multiplier = 2;
    else if (pairs === 1) {
      // Jacks or better
      const pairRank = Object.keys(counts).find((k) => counts[k] === 2);
      if (["J", "Q", "K", "A"].includes(pairRank || "")) multiplier = 1.5;
    }

    if (multiplier > 0) {
      const payout = betAmount * multiplier;
      addBalance(payout);
      setWinInfo({ multiplier, payout });
      recordBet("VideoPoker", betAmount, multiplier, payout - betAmount);
    } else {
      recordBet("VideoPoker", betAmount, 0, -betAmount);
    }
  };

  const getRankColor = (suit: string) => {
    return ["hearts", "diamonds"].includes(suit)
      ? "text-[#ed4163]"
      : "text-gray-800";
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
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
                $ {(Math.floor(balance * 100) / 100).toFixed(2)}
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
                disabled={gameState === "dealt"}
                className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"
                step="0.01"
                min="0"
                max={balance}
              />
              <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                  disabled={gameState === "dealt"}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                  disabled={gameState === "dealt"}
                  className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={gameState === "dealt" ? drawCards : dealInitial}
            disabled={!user || (gameState !== "dealt" && (balance < betAmount || betAmount <= 0))}
            className={cn(
              "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
              (!user || (gameState !== "dealt" && (balance < betAmount || betAmount <= 0))) && "opacity-50 cursor-not-allowed"
            )}
          >
            {gameState === "dealt" ? "Piocher" : "Pari"}
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl lg:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 lg:order-2">
        <div className="h-full bg-[#0f172a] relative p-8 flex flex-col items-center justify-center min-h-[400px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="flex flex-wrap justify-center gap-4 w-full px-4">
            {cards.length === 0 ? (
              <div className="text-text-secondary font-bold text-xl uppercase tracking-widest">
                Appuyez sur Distribuer pour commencer
              </div>
            ) : (
              cards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: -50, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  onClick={() => {
                    if (gameState === "dealt") {
                      const newHeld = [...heldCards];
                      newHeld[idx] = !newHeld[idx];
                      setHeldCards(newHeld);
                    }
                  }}
                  className={cn(
                    "bg-white rounded-xl w-24 h-36 border shadow-xl flex flex-col items-center justify-center relative cursor-pointer outline outline-4 outline-offset-2 transition-all duration-200",
                    heldCards[idx]
                      ? "outline-accent -translate-y-4"
                      : "outline-transparent hover:-translate-y-1",
                  )}
                >
                  <span
                    className={cn(
                      "text-3xl font-black mb-1",
                      getRankColor(card.suit),
                    )}
                  >
                    {card.rank}
                  </span>
                  <span className={cn("text-4xl", getRankColor(card.suit))}>
                    {getSuitSymbol(card.suit)}
                  </span>

                  {heldCards[idx] && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-accent text-bg-base text-xs font-bold uppercase px-2 py-1 rounded">
                      Gardé
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {gameState === "finished" && cards.length > 0 && !winInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-[#ed4163] font-black text-2xl uppercase tracking-widest"
            >
              Rien (Perdu)
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
