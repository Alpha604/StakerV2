import React, { useState, useEffect } from "react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle } from "lucide-react";
import { WinPopup } from "./WinPopup";

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
interface Card { suit: Suit; rank: Rank; value: number }

const SHADOW_CHIPS = [
   { value: 0.1, color: "bg-gray-400" },
   { value: 1, color: "bg-red-500" },
   { value: 5, color: "bg-blue-500" },
   { value: 25, color: "bg-emerald-500" },
   { value: 100, color: "bg-amber-500" },
   { value: 500, color: "bg-purple-500" }
];

const DECK = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      let value = parseInt(rank);
      if (["J", "Q", "K"].includes(rank)) value = 10;
      if (rank === "A") value = 11;
      deck.push({ suit, rank, value });
    });
  });
  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
};

const getHandValue = (hand: Card[]) => {
  let value = 0;
  let aces = 0;
  hand.forEach(c => {
    value += c.value;
    if (c.rank === "A") aces++;
  });
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
};

const CardView = ({ card, hidden }: { card?: Card; hidden?: boolean }) => {
  if (hidden || !card) {
    return (
      <div className="w-12 h-16 md:w-20 md:h-28 bg-gradient-to-br from-blue-700 to-blue-900 border border-white/20 rounded shadow-2xl flex items-center justify-center">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/20 to-transparent m-1 border border-blue-400/30"></div>
      </div>
    );
  }

  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const suitIcon = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠"
  }[card.suit];

  return (
    <motion.div 
       initial={{ scale: 0, x: 50, y: -50, rotateY: 180 }}
       animate={{ scale: 1, x: 0, y: 0, rotateY: 0 }}
       transition={{ type: "spring", stiffness: 200, damping: 20 }}
       style={{ transformStyle: "preserve-3d" }}
       className="relative w-12 h-16 md:w-20 md:h-28 bg-white rounded shadow-2xl flex flex-col items-center justify-center"
    >
      <div className={cn("absolute top-1 left-1.5 md:top-1.5 md:left-2 text-[10px] md:text-sm font-bold leading-none", isRed ? "text-red-500" : "text-black")}>
        {card.rank}
      </div>
      <div className={cn("absolute top-3.5 left-1.5 md:top-5 md:left-2 text-[10px] md:text-sm", isRed ? "text-red-500" : "text-black")}>
        {suitIcon}
      </div>
      
      <div className={cn("text-2xl md:text-4xl", isRed ? "text-red-500" : "text-black")}>
        {suitIcon}
      </div>

      <div className={cn("absolute bottom-1 right-1.5 md:bottom-1.5 md:right-2 text-[10px] md:text-sm font-bold leading-none rotate-180", isRed ? "text-red-500" : "text-black")}>
        {card.rank}
      </div>
    </motion.div>
  );
};

export function Blackjack() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser() as any;
  const [selectedChipIndex, setSelectedChipIndex] = useState<number>(1);
  const [bet, setBet] = useState(0);
  
  const [stage, setStage] = useState<"BETTING" | "DEALING" | "PLAYER_TURN" | "DEALER_TURN" | "ENDED">("BETTING");
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  
  const [resultMsg, setResultMsg] = useState("");
  const [winInfo, setWinInfo] = useState<{ multiplier: number; payout: number } | null>(null);

  const placeBet = async () => {
     const chipValue = SHADOW_CHIPS[selectedChipIndex].value;
     if (balance < chipValue) return;
     if (stage !== "BETTING") return;

     const success = await subtractBalance(chipValue);
     if (success) {
        setBet(prev => prev + chipValue);
     }
  };

  const undoBet = () => {
    if (stage !== "BETTING" || bet === 0) return;
    addBalance(bet);
    setBet(0);
  };

  const startDeal = () => {
    if (bet <= 0 || stage !== "BETTING") return;
    setStage("DEALING");
    setWinInfo(null);
    
    // Shuffle 6 decks for realistic evolution behavior
    let d: Card[] = [];
    for(let i=0; i<6; i++) d = [...d, ...DECK()];
    
    // Simple mock dealing animation delays
    setTimeout(() => {
        const pHand = [d.pop()!];
        setPlayerHand([...pHand]);
        setTimeout(() => {
            const dHand = [d.pop()!];
            setDealerHand([...dHand]);
            setTimeout(() => {
                pHand.push(d.pop()!);
                setPlayerHand([...pHand]);
                setDeck(d);

                setTimeout(() => {
                   const pVal = getHandValue(pHand);
                   if (pVal === 21) {
                       handleEndGame(pHand, dHand, "BLACKJACK"); // Immediate BJ check if no dealer upcard ace (simplified logic)
                   } else {
                       setStage("PLAYER_TURN");
                   }
                }, 1000);
            }, 600);
        }, 600);
    }, 600);
  };

  const hit = () => {
     if (stage !== "PLAYER_TURN") return;
     const d = [...deck];
     const card = d.pop()!;
     const newHand = [...playerHand, card];
     
     setDeck(d);
     setPlayerHand(newHand);
     
     if (getHandValue(newHand) > 21) {
         handleEndGame(newHand, dealerHand, "BUST");
     }
  };

  const stand = () => {
     if (stage !== "PLAYER_TURN") return;
     setStage("DEALER_TURN");
     playDealer(deck, playerHand, dealerHand);
  };

  const double = async () => {
     if (stage !== "PLAYER_TURN") return;
     if (playerHand.length !== 2) return;
     
     const success = await subtractBalance(bet);
     if (!success) return;
     
     setBet(prev => prev * 2);
     
     const d = [...deck];
     const card = d.pop()!;
     const newHand = [...playerHand, card];
     
     setDeck(d);
     setPlayerHand(newHand);
     
     if (getHandValue(newHand) > 21) {
         setTimeout(() => handleEndGame(newHand, dealerHand, "BUST"), 1000);
     } else {
         setStage("DEALER_TURN");
         setTimeout(() => playDealer(d, newHand, dealerHand), 1000);
     }
  };

  const playDealer = (currentDeck: Card[], pHand: Card[], dHand: Card[]) => {
      let currentDealerHand = [...dHand];
      let d = [...currentDeck];
      
      const drawDealerCard = () => {
         setTimeout(() => {
             const card = d.pop()!;
             currentDealerHand = [...currentDealerHand, card];
             setDealerHand(currentDealerHand);
             setDeck(d);
             
             if (getHandValue(currentDealerHand) < 17) {
                 drawDealerCard();
             } else {
                 setTimeout(() => determineWinner(pHand, currentDealerHand), 1000);
             }
         }, 800);
      };
      
      drawDealerCard();
  };

  const determineWinner = (pHand: Card[], dHand: Card[]) => {
      const pVal = getHandValue(pHand);
      const dVal = getHandValue(dHand);
      
      if (dVal > 21) {
          handleEndGame(pHand, dHand, "DEALER_BUST");
      } else if (pVal > dVal) {
          handleEndGame(pHand, dHand, "WIN");
      } else if (dVal > pVal) {
          handleEndGame(pHand, dHand, "LOSE");
      } else {
          handleEndGame(pHand, dHand, "PUSH");
      }
  };

  const handleEndGame = (pHand: Card[], dHand: Card[], result: "BLACKJACK" | "WIN" | "DEALER_BUST" | "LOSE" | "BUST" | "PUSH") => {
      setStage("ENDED");
      
      let multiplier = 0;
      let payout = 0;
      let profit = 0;
      
      if (result === "BLACKJACK") {
          multiplier = 2.5; // 3:2 payout
          payout = bet * multiplier;
          profit = payout - bet;
          setResultMsg("BLACKJACK!");
      } else if (result === "WIN" || result === "DEALER_BUST") {
          multiplier = 2; // 1:1 payout
          payout = bet * multiplier;
          profit = payout - bet;
          setResultMsg("VOUS GAGNEZ!");
      } else if (result === "PUSH") {
          multiplier = 1;
          payout = bet;
          profit = 0;
          setResultMsg("ÉGALITÉ");
      } else {
          multiplier = 0;
          payout = 0;
          profit = -bet;
          setResultMsg(result === "BUST" ? "BUST" : "LE CROUPIER GAGNE");
      }
      
      if (payout > 0) {
          addBalance(payout);
          if (multiplier >= 2) {
              setWinInfo({ multiplier, payout });
          }
      }
      
      recordBet("Blackjack", bet, multiplier, profit);
      
      setTimeout(() => {
          setStage("BETTING");
          setBet(0);
          setPlayerHand([]);
          setDealerHand([]);
      }, 4000);
  };

  const pVal = getHandValue(playerHand);
  const dVal = getHandValue(dealerHand);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-80px)] bg-black relative overflow-hidden select-none font-sans">
      <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
      
      {/* EVOLUTION LIVE CASINO BACKGROUND */}
      <div 
        className="absolute inset-0 z-0 bg-black"
        style={{
           backgroundImage: 'radial-gradient(circle at 50% -20%, #173621 0%, #050a06 100%)'
        }}
      >
        {/* Table Curve */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] sm:w-[150vw] h-[60vh] bg-[#0c2e17] rounded-t-[100%] border-t-[10px] border-[#06170b] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-0">
             {/* Velvet texture overlay */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/fabric-plaid.png')] rounded-t-[100%] pointer-events-none mix-blend-overlay"></div>
             
             {/* Betting Circles / Lines */}
             <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] border border-white/5 rounded-t-[100%] flex justify-center">
                 <div className="w-[120px] h-[160px] border border-white/20 mt-4 rounded-xl flex items-center justify-center relative">
                     <span className="text-white/20 font-black tracking-widest uppercase text-sm">Place Bets</span>
                 </div>
             </div>
        </div>
      </div>

      {/* Evolution Info Overlay */}
      <div className="absolute top-4 left-4 z-40 bg-black/60 rounded-lg px-4 py-2 border border-white/10 flex items-center gap-4">
          <div className="text-white font-bold flex flex-col">
              <span className="text-xs text-white/50 uppercase tracking-widest">Table limit</span>
              <span>$1 - $10,000</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-white font-bold flex flex-col text-right">
              <span className="text-xs text-white/50 uppercase tracking-widest">Payouts</span>
              <span>BJ 3:2 • Ins 2:1</span>
          </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-40">
          
          {/* Dealer's Cards */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center">
             <div className="flex relative" style={{ perspective: "1000px" }}>
                 <AnimatePresence>
                    {dealerHand.map((card, i) => (
                        <div key={i} className="absolute inline-block z-10" style={{ transform: `translateX(${(i - (dealerHand.length-1)/2)*40}px)` }}>
                            <CardView card={card} />
                        </div>
                    ))}
                    {dealerHand.length === 1 && stage !== "ENDED" && (
                        <div className="absolute inline-block z-0" style={{ transform: `translateX(${40}px)` }}>
                            <CardView hidden />
                        </div>
                    )}
                 </AnimatePresence>
                 {/* Invisible spacing block for layout */}
                 <div className="w-[160px] h-28"></div>
             </div>
             {dealerHand.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 bg-black/80 border border-white/20 text-white font-bold px-3 py-1 rounded shadow-lg backdrop-blur-sm">
                   {dVal}
                </motion.div>
             )}
          </div>

          <AnimatePresence>
              {stage === "ENDED" && (
                 <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }} 
                     animate={{ scale: 1, opacity: 1 }} 
                     exit={{ scale: 0.5, opacity: 0 }}
                     className={cn("absolute top-[45%] left-1/2 -translate-x-1/2 font-black text-3xl px-12 py-4 rounded-lg z-50 uppercase tracking-widest border whitespace-nowrap shadow-2xl backdrop-blur-md", 
                        resultMsg.includes("GAGNE") || resultMsg.includes("BLACKJACK") ? "bg-emerald-500/30 text-emerald-400 border-emerald-500/50" : 
                        resultMsg.includes("ÉGALITÉ") ? "bg-gray-500/30 text-white border-gray-500/50" : "bg-rose-500/30 text-rose-400 border-rose-500/50"
                     )}
                 >
                     {resultMsg}
                 </motion.div>
              )}
          </AnimatePresence>

          {/* Player's Cards */}
          <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
             {pVal > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-emerald-500/90 text-white font-black text-xl px-4 py-1 rounded shadow-lg backdrop-blur-sm border border-white/20">
                   {pVal}
                </motion.div>
             )}
             <div className="flex relative items-center justify-center" style={{ perspective: "1000px" }}>
                 {/* Betting Drop interaction zone */}
                 <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <button 
                       onClick={stage === "BETTING" ? placeBet : undefined}
                       className={cn("w-28 h-40 rounded-xl cursor-pointer transition-colors focus:outline-none border-2 border-transparent", stage === "BETTING" ? "hover:border-white/30" : "")}
                       disabled={stage !== "BETTING"}
                    ></button>
                 </div>
                 
                 <AnimatePresence>
                    {playerHand.map((card, i) => (
                        <div key={i} className="absolute inline-block z-10 pointer-events-none" style={{ transform: `translateX(${(i - (playerHand.length-1)/2)*45}px) translateY(${i*5}px) rotate(${i*4 - 4}deg)` }}>
                            <CardView card={card} />
                        </div>
                    ))}
                 </AnimatePresence>

                 {playerHand.length === 0 && stage === "BETTING" && bet === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute z-0 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                       <span className="text-white/40 uppercase font-black tracking-widest text-sm animate-pulse text-center">Place Your<br/>Bets</span>
                    </motion.div>
                 )}
                 {/* The invisible box for sizing */}
                 <div className="w-[180px] h-28"></div>
             </div>

             {/* Bet Chip shown on table */}
             <AnimatePresence>
                {bet > 0 && (
                    <motion.div 
                       initial={{ opacity: 0, scale: 0 }} 
                       animate={{ opacity: 1, scale: 1 }} 
                       className="absolute bottom-[-20px] pointer-events-none z-30"
                    >
                        <div className="w-14 h-14 rounded-full bg-[#182a39] border-4 border-dashed border-white/30 flex flex-col items-center justify-center font-bold text-white shadow-2xl">
                            {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                            <span className="text-xs">{bet}</span>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
      </div>

      {/* FOOTER EVOLUTION ACTION OVERLAYS */}
      <AnimatePresence>
          {stage === "PLAYER_TURN" && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-[100px] md:bottom-28 left-1/2 -translate-x-1/2 flex gap-4 z-40">
                 <button onClick={hit} className="bg-emerald-500 hover:bg-emerald-400 text-bg-dark font-black px-6 py-4 md:px-10 rounded-full shadow-[0_5px_20px_rgba(52,211,153,0.4)] uppercase tracking-widest transition-transform hover:-translate-y-1 flex items-center gap-2">
                     <span className="text-2xl leading-none">+</span> Hit
                 </button>
                 <button onClick={stand} className="bg-rose-500 hover:bg-rose-400 text-white font-black px-6 py-4 md:px-10 rounded-full shadow-[0_5px_20px_rgba(244,63,94,0.4)] uppercase tracking-widest transition-transform hover:-translate-y-1 flex items-center gap-2">
                     <span className="text-2xl leading-none">-</span> Stand
                 </button>
                 {playerHand.length === 2 && balance >= bet && (
                     <button onClick={double} className="bg-amber-500 hover:bg-amber-400 text-bg-dark font-black px-6 py-4 md:px-10 rounded-full shadow-[0_5px_20px_rgba(245,158,11,0.4)] uppercase tracking-widest transition-transform hover:-translate-y-1 flex flex-col items-center leading-none">
                         <span>Double</span>
                         <span className="text-[10px]">2x</span>
                     </button>
                 )}
              </motion.div>
          )}
      </AnimatePresence>

      {/* FOOTER (Betting UI) */}
      <div className="absolute bottom-0 left-0 w-full min-h-[100px] bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-4 px-4 z-30">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
              
              {stage === "BETTING" && (
                  <div className="flex flex-col items-center w-full gap-4 relative -top-6">
                      
                      <div className="text-emerald-400 font-bold uppercase tracking-widest text-sm animate-pulse mb-2">
                         Place Your Bets
                      </div>

                      <div className="flex items-center justify-center gap-2">
                         {SHADOW_CHIPS.map((chip, idx) => (
                            <button
                               key={idx}
                               onClick={() => setSelectedChipIndex(idx)}
                               className={cn(
                                  "relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-sm shadow-[0_2px_10px_rgba(0,0,0,0.8)] focus:outline-none border-2 border-white/60 transition-all",
                                  chip.color,
                                  selectedChipIndex === idx ? 'scale-110 -translate-y-2 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:-translate-y-1',
                                  balance < chip.value ? 'opacity-50 grayscale cursor-not-allowed' : ''
                               )}
                            >
                               <span className="text-white drop-shadow-md">{chip.value}</span>
                            </button>
                         ))}
                      </div>
                  </div>
              )}

              {/* Balances info corner (desktop left) */}
              <div className="flex justify-between w-full md:absolute md:top-1/2 md:-translate-y-1/2 md:left-0 md:w-auto mt-auto gap-4">
                 <div className="flex flex-col">
                    <span className="text-white/50 uppercase text-[10px] tracking-widest">Balance</span>
                    <span className="text-white flex items-center gap-1 font-mono text-sm md:text-base">
                       {renderCryptoIcon(activeCrypto, "w-3.5 h-3.5")}
                       {balance.toFixed(2)}
                    </span>
                 </div>
                 <div className="flex flex-col md:hidden items-end">
                    <span className="text-white/50 uppercase text-[10px] tracking-widest">Total Bet</span>
                    <span className="text-white flex items-center gap-1 font-mono text-sm md:text-base text-emerald-400 font-bold">
                       {renderCryptoIcon(activeCrypto, "w-3.5 h-3.5")}
                       {bet.toFixed(2)}
                    </span>
                 </div>
              </div>

              {/* Actions corner (desktop right) */}
              {stage === "BETTING" && (
                  <div className="flex gap-2 w-full md:absolute md:top-1/2 md:-translate-y-1/2 md:right-0 md:w-auto justify-center md:justify-end">
                     <button 
                         onClick={undoBet}
                         disabled={bet === 0}
                         className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded disabled:opacity-30 transition-colors uppercase text-xs tracking-widest"
                     >
                        Undo
                     </button>
                     <button 
                         onClick={startDeal}
                         disabled={bet === 0}
                         className="bg-emerald-500 hover:bg-emerald-400 text-bg-darker font-black py-2 px-8 rounded shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-30 disabled:shadow-none transition-all uppercase text-sm tracking-widest"
                     >
                        Deal
                     </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
