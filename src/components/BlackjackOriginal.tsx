import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins, HelpCircle } from "lucide-react";
import { WinPopup } from "./WinPopup";
import { useSound } from '../lib/useSound';

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export function BlackjackOriginal() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dealer_turn" | "finished">("idle");
  const [isDealing, setIsDealing] = useState(false);
  
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number; payout: number} | null>(null);
  const [resultMsg, setResultMsg] = useState("");

  const { playHit, playWin, playLoss } = useSound();

  const getCardValue = (rank: string) => {
    if (["10", "J", "Q", "K"].includes(rank)) return 10;
    if (rank === "A") return 11;
    return parseInt(rank);
  };

  const drawCard = (): Card => {
    const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
    return { suit: SUITS[Math.floor(Math.random() * SUITS.length)], rank, value: getCardValue(rank) };
  };

  const calculateHand = (hand: Card[]) => {
    let sum = 0;
    let aces = 0;
    hand.forEach(c => {
      sum += c.value;
      if (c.rank === 'A') aces += 1;
    });
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces -= 1;
    }
    return sum;
  };

  const startGame = async () => {
    if (!user || balance < betAmount) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;
    
    setGameState("playing");
    setIsDealing(true);
    setWinInfo(null);
    setResultMsg("");

    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    
    setTimeout(() => {
       setIsDealing(false);
       const pVal = calculateHand([p1, p2]);
       const isPbj = pVal === 21;
       const isDbj = calculateHand([d1, d2]) === 21;
       
       if (isPbj || isDbj) {
           handleGameEnd([p1, p2], [d1, d2]);
       }
    }, 1000);
  };

  const hit = () => {
    if (gameState !== "playing" || isDealing) return;
    setIsDealing(true);
    playHit();
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    setTimeout(() => {
        setIsDealing(false);
        if (calculateHand(newHand) >= 21) {
            handleGameEnd(newHand, dealerHand);
        }
    }, 500);
  };

  const stand = () => {
    if (gameState !== "playing" || isDealing) return;
    handleGameEnd(playerHand, dealerHand);
  };

  const doubleDown = async () => {
     if (gameState !== "playing" || isDealing || playerHand.length !== 2) return;
     if (balance < betAmount) return;
     const success = await subtractBalance(betAmount);
     if (!success) return;
     
     setIsDealing(true);
     playHit();
     const newHand = [...playerHand, drawCard()];
     setPlayerHand(newHand);
     setTimeout(() => {
         setIsDealing(false);
         handleGameEnd(newHand, dealerHand, true);
     }, 500);
  };

  const handleGameEnd = (pHand: Card[], dHand: Card[], isDouble: boolean = false) => {
     setGameState("dealer_turn");
     const totalBet = isDouble ? betAmount * 2 : betAmount;
     
     const pVal = calculateHand(pHand);
     let currentDHand = [...dHand];
     
     if (pVal <= 21) {
         let dVal = calculateHand(currentDHand);
         while (dVal < 17) {
            currentDHand.push(drawCard());
            dVal = calculateHand(currentDHand);
         }
     }
     setDealerHand(currentDHand);
     
     setTimeout(() => {
         const finalP = calculateHand(pHand);
         const finalD = calculateHand(currentDHand);
         const isPbj = finalP === 21 && pHand.length === 2;
         const isDbj = finalD === 21 && currentDHand.length === 2;
         
         let multiplier = 0;
         let msg = "";
         
         if (finalP > 21) {
             msg = "Bust";
             multiplier = 0;
         } else if (isPbj && isDbj) {
             msg = "Push";
             multiplier = 1;
         } else if (isPbj) {
             msg = "Blackjack!";
             multiplier = 2.5;
         } else if (isDbj) {
             msg = "Dealer Blackjack";
             multiplier = 0;
         } else if (finalD > 21) {
             msg = "Dealer Bust";
             multiplier = 2;
         } else if (finalP > finalD) {
             msg = "You Win!";
             multiplier = 2;
         } else if (finalP < finalD) {
             msg = "Dealer Wins";
             multiplier = 0;
         } else {
             msg = "Push";
             multiplier = 1;
         }
         
         setResultMsg(msg);
         if (multiplier > 0) {
             const payout = totalBet * multiplier;
             addBalance(payout);
             setWinInfo({ multiplier, payout });
             if (multiplier > 1) playWin();
             recordBet("Blackjack", totalBet, multiplier, payout - totalBet);
         } else {
             playLoss();
             recordBet("Blackjack", totalBet, 0, -totalBet);
         }
         setGameState("finished");
     }, 1000);
  };

  const getRankColor = (suit: string) => ["hearts", "diamonds"].includes(suit) ? "text-[#ed4163]" : "text-gray-800";
  const getSuitSymbol = (suit: string) => {
    switch(suit) {
      case "hearts": return "♥";
      case "diamonds": return "♦";
      case "clubs": return "♣";
      case "spades": return "♠";
      default: return "";
    }
  };

  const pVal = playerHand.length > 0 ? calculateHand(playerHand) : 0;
  const dVal = dealerHand.length > 0 ? 
      (gameState === "playing" ? getCardValue(dealerHand[0].rank) : calculateHand(dealerHand)) : 0;

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
        <div className="flex flex-col gap-4 relative w-full h-full">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
            <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors cursor-not-allowed">Auto</button>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold">Montant de la mise</label>
              <span className="text-[#8b9ba5] text-[13px] flex items-center gap-1 font-semibold">{formatCurrency(balance)}</span>
            </div>
            <div className="bg-[#0f212e] rounded flex items-center border border-[#2f4553] focus-within:border-[#557086] transition-colors p-1">
              <div className="pl-3 pr-1 text-gray-400">
                {renderCryptoIcon(activeCrypto, "w-4 h-4")}
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent p-2 text-white font-bold outline-none focus:ring-0 text-[13px]"
                disabled={gameState !== "idle" && gameState !== "finished"}
              />
              <div className="flex gap-1 pr-1">
                <button onClick={() => setBetAmount(b => b / 2)} disabled={gameState !== "idle" && gameState !== "finished"} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">½</button>
                <button onClick={() => setBetAmount(b => b * 2)} disabled={gameState !== "idle" && gameState !== "finished"} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">2×</button>
              </div>
            </div>
          </div>

          <div className="mt-2 w-full mt-auto mb-2 flex items-center justify-between px-2 text-[#8b9ba5] hover:text-white transition-colors cursor-pointer group">
             <span className="text-xs font-bold group-hover:underline">Équité certifiée</span>
             <HelpCircle size={14} className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>

          {(gameState === "idle" || gameState === "finished") ? (
             <button
                onClick={startGame}
                disabled={!user || balance < betAmount || isDealing}
                className={cn(
                  "w-full py-4 rounded font-bold transition-all text-sm uppercase",
                  "bg-[#00e701] hover:bg-[#00c701] text-black shadow-[0_4px_0_#00a800] hover:translate-y-1 hover:shadow-[0_0px_0_#00a800] active:translate-y-1 active:shadow-none",
                  (!user || balance < betAmount) && "opacity-50 cursor-not-allowed",
                  isDealing && "opacity-50 cursor-wait"
                )}
             >
                Parier
             </button>
          ) : (
             <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                    onClick={hit}
                    disabled={gameState !== "playing" || isDealing}
                    className="w-full py-4 rounded font-bold transition-all text-sm uppercase bg-[#00e701] hover:bg-[#00c701] text-black shadow-[0_4px_0_#00a800] active:translate-y-1 active:shadow-none disabled:opacity-50"
                >Hit</button>
                <button
                    onClick={stand}
                    disabled={gameState !== "playing" || isDealing}
                    className="w-full py-4 rounded font-bold transition-all text-sm uppercase bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_#991b1b] active:translate-y-1 active:shadow-none disabled:opacity-50"
                >Stand</button>
             </div>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 bg-[#0f212e] lg:rounded-r-lg lg:rounded-l-none rounded-b-lg relative overflow-hidden order-1 lg:order-2 min-h-[400px] flex flex-col items-center justify-center border border-[#2f4553]">
        <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
        
        {/* Dealer Hand Area */}
        <div className="absolute top-10 flex flex-col items-center w-full">
            <span className="text-[#8b9ba5] font-bold text-sm mb-4 uppercase tracking-widest bg-black/20 px-4 py-1 rounded-full border border-white/5">Dealer {dVal > 0 && <span>- {dVal}</span>}</span>
            <div className="flex items-center justify-center gap-3 w-full min-h-[140px]">
                {dealerHand.map((card, i) => {
                    const isHidden = gameState === "playing" && i === 1;
                    return (
                        <motion.div 
                            key={i}
                            initial={{ y: -50, opacity: 0, rotateY: 180 }}
                            animate={{ y: 0, opacity: 1, rotateY: isHidden ? 180 : 0 }}
                            className="perspective-1000"
                        >
                           <div className={cn("w-20 h-28 sm:w-24 sm:h-36 rounded-xl flex flex-col relative transition-all duration-500 preserve-3d shadow-xl border", isHidden ? "bg-gradient-to-br from-[#1bc86a] to-[#149e53] border-emerald-400" : "bg-white border-white/20")}>
                               {!isHidden && (
                                  <>
                                     <div className={cn("absolute top-2 left-2 text-lg sm:text-xl font-bold leading-none", getRankColor(card.suit))}>
                                        {card.rank}
                                     </div>
                                     <div className={cn("absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl opacity-80", getRankColor(card.suit))}>
                                        {getSuitSymbol(card.suit)}
                                     </div>
                                     <div className={cn("absolute bottom-2 right-2 text-lg sm:text-xl font-bold rotate-180 leading-none", getRankColor(card.suit))}>
                                        {card.rank}
                                     </div>
                                  </>
                               )}
                           </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
        
        {/* Result Center */}
        <AnimatePresence>
            {resultMsg && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }}
                    className={cn(
                       "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-8 py-3 rounded-xl font-black text-3xl uppercase tracking-widest shadow-2xl border backdrop-blur-sm whitespace-nowrap",
                       resultMsg.includes("Win") || resultMsg.includes("Blackjack") ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                       resultMsg.includes("Push") ? "bg-gray-500/20 text-gray-300 border-gray-500/30" : 
                       "bg-red-500/20 text-red-500 border-red-500/30"
                    )}
                >
                    {resultMsg}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Player Hand Area */}
        <div className="absolute bottom-[20%] flex flex-col items-center w-full">
            <span className="text-[#8b9ba5] font-bold text-sm mb-4 uppercase tracking-widest bg-black/20 px-4 py-1 rounded-full border border-white/5">Player {pVal > 0 && <span>- {pVal}</span>}</span>
            <div className="flex items-center justify-center gap-3 w-full min-h-[140px] relative">
               <AnimatePresence>
                {playerHand.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ y: 50, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        className={cn("w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-xl flex flex-col relative shadow-xl border-2 border-transparent", playerHand.length > 2 && i === playerHand.length -1 ? "border-emerald-400" : "")}
                    >
                         <div className={cn("absolute top-2 left-2 text-lg sm:text-xl font-bold leading-none", getRankColor(card.suit))}>
                            {card.rank}
                         </div>
                         <div className={cn("absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl opacity-80", getRankColor(card.suit))}>
                            {getSuitSymbol(card.suit)}
                         </div>
                         <div className={cn("absolute bottom-2 right-2 text-lg sm:text-xl font-bold rotate-180 leading-none", getRankColor(card.suit))}>
                            {card.rank}
                         </div>
                    </motion.div>
                ))}
               </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
}
