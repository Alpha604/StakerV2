import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Coins, ChevronDown } from "lucide-react";
import { WinPopup } from "./WinPopup";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = [
  "A",
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
];

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export function Baccarat() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betChoice, setBetChoice] = useState<"player" | "banker" | "tie">(
    "player",
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);

  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const getCardValue = (rank: string) => {
    if (["10", "J", "Q", "K"].includes(rank)) return 0;
    if (rank === "A") return 1;
    return parseInt(rank);
  };

  const drawCard = (): Card => {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    return {
      suit: SUITS[Math.floor(Math.random() * SUITS.length)],
      rank,
      value: getCardValue(rank),
    };
  };

  const calculateScore = (cards: Card[]) => {
    return cards.reduce((acc, c) => acc + c.value, 0) % 10;
  };

  const startGame = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setWinInfo(null);
    setPlayerCards([]);
    setBankerCards([]);

    // Simple simulation logic (not full rules of third card drawn for simplicity here, just doing a base baccarat draw)
    setTimeout(() => {
      const p1 = drawCard();
      const p2 = drawCard();
      const b1 = drawCard();
      const b2 = drawCard();

      setPlayerCards([p1, p2]);
      setBankerCards([b1, b2]);

      const pScore = (p1.value + p2.value) % 10;
      const bScore = (b1.value + b2.value) % 10;

      let winner: "player" | "banker" | "tie" = "tie";
      if (pScore > bScore) winner = "player";
      else if (bScore > pScore) winner = "banker";

      setTimeout(() => {
        setIsPlaying(false);
        let multiplier = 0;
        if (betChoice === winner) {
          if (winner === "tie")
            multiplier = 9; // Tie pays 8:1 (plus return stake -> 9x)
          else if (winner === "banker")
            multiplier = 1.95; // Banker pays 0.95:1
          else multiplier = 2; // Player pays 1:1
        }

        if (multiplier > 0) {
          const payout = betAmount * multiplier;
          addBalance(payout);
          setWinInfo({ multiplier, payout });
          recordBet("Baccarat", betAmount, multiplier, payout - betAmount);
        } else {
          recordBet("Baccarat", betAmount, 0, -betAmount);
        }
      }, 1500);
    }, 500);
  };

  const getRankColor = (suit: string) =>
    ["hearts", "diamonds"].includes(suit) ? "text-[#ed4163]" : "text-gray-800";
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

          <div className="flex flex-col gap-1">
            <label className="text-[#8b9ba5] text-[13px] font-bold px-1">Choix</label>
            <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
              <select
                value={betChoice}
                onChange={(e) => setBetChoice(e.target.value as "player" | "banker" | "tie")}
                disabled={isPlaying}
                className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
              >
                <option value="player" className="text-black">Player (2.00x)</option>
                <option value="banker" className="text-black">Banker (1.95x)</option>
                <option value="tie" className="text-black">Tie (9.00x)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={startGame}
            disabled={isPlaying || !user || balance < betAmount || betAmount <= 0}
            className={cn(
              "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
              (isPlaying || !user || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            Pari
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

          <div className="w-full flex gap-12 justify-center items-start">
            {/* Player Side */}
            <div className="flex flex-col items-center gap-4 w-1/2">
              <h2 className="text-white font-black text-2xl tracking-widest uppercase">
                Player
              </h2>
              <div className="flex gap-2 min-h-[144px]">
                <AnimatePresence>
                  {playerCards.map((card, idx) => (
                    <motion.div
                      key={`p-${idx}`}
                      initial={{ opacity: 0, x: -50, rotate: -10 }}
                      animate={{ opacity: 1, x: 0, rotate: 0 }}
                      className="bg-white rounded-lg w-20 h-32 border shadow-lg flex flex-col items-center justify-center relative"
                    >
                      <span
                        className={cn(
                          "text-2xl font-black mb-1",
                          getRankColor(card.suit),
                        )}
                      >
                        {card.rank}
                      </span>
                      <span className={cn("text-3xl", getRankColor(card.suit))}>
                        {getSuitSymbol(card.suit)}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {playerCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 bg-bg-inner px-4 py-2 rounded-full border border-border-medium"
                >
                  <span className="text-white font-bold font-mono">
                    Score: {calculateScore(playerCards)}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Banker Side */}
            <div className="flex flex-col items-center gap-4 w-1/2">
              <h2 className="text-white font-black text-2xl tracking-widest uppercase">
                Banker
              </h2>
              <div className="flex gap-2 min-h-[144px]">
                <AnimatePresence>
                  {bankerCards.map((card, idx) => (
                    <motion.div
                      key={`b-${idx}`}
                      initial={{ opacity: 0, x: 50, rotate: 10 }}
                      animate={{ opacity: 1, x: 0, rotate: 0 }}
                      className="bg-white rounded-lg w-20 h-32 border shadow-lg flex flex-col items-center justify-center relative"
                    >
                      <span
                        className={cn(
                          "text-2xl font-black mb-1",
                          getRankColor(card.suit),
                        )}
                      >
                        {card.rank}
                      </span>
                      <span className={cn("text-3xl", getRankColor(card.suit))}>
                        {getSuitSymbol(card.suit)}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {bankerCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 bg-bg-inner px-4 py-2 rounded-full border border-border-medium"
                >
                  <span className="text-white font-bold font-mono">
                    Score: {calculateScore(bankerCards)}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {!isPlaying && playerCards.length > 0 && !winInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 text-[#ed4163] font-black text-3xl uppercase tracking-widest"
            >
              Perdu
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
