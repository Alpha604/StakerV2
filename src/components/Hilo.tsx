import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { WinPopup } from './WinPopup';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

const getCardValue = (rank: string) => {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank);
};

const getRandomCard = () => {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { rank, suit, value: getCardValue(rank) };
};

export function Hilo() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [currentCard, setCurrentCard] = useState(getRandomCard());
  const [history, setHistory] = useState<typeof currentCard[]>([]);
  const [multiplier, setMultiplier] = useState(1.0);
  
  const [higherMulti, setHigherMulti] = useState(0);
  const [lowerMulti, setLowerMulti] = useState(0);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const calculateOdds = (cardVal: number) => {
     // A: 1, K: 13
     // Chances of higher: (13 - cardVal) / 13
     // Chances of lower: (cardVal - 1) / 13
     const cardsHigher = 13 - cardVal;
     const cardsLower = cardVal - 1;
     
     // Base formula with house edge
     const pBase = 0.96; 
     
     if (cardsHigher === 0) setHigherMulti(0);
     else setHigherMulti(parseFloat(((13 / cardsHigher) * pBase).toFixed(2)));
     
     if (cardsLower === 0) setLowerMulti(0);
     else setLowerMulti(parseFloat(((13 / cardsLower) * pBase).toFixed(2)));
  };

  useEffect(() => {
     calculateOdds(currentCard.value);
  }, [currentCard]);

  const startGame = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setWinInfo(null);
    const firstCard = getRandomCard();
    setCurrentCard(firstCard);
    setHistory([firstCard]);
    setMultiplier(1.0);
  };

  const handleGuess = (guess: 'higher' | 'lower' | 'skip') => {
     if (!isPlaying) return;
     
     const nextCard = getRandomCard();
     // Determine win/loss. (Wait, Stake Hilo has 'skip' or 'same' is a win for higher/lower in some versions, or 'same' is a loss? 
     // Usually King 'higher' is disabled. If same rank, depends on the rule. Let's make same rank a push/win for 'skip' only, or 'same' is loss).
     // Let's just do if same card value, the player loses.
     let isWin = false;
     if (guess === 'skip') {
         // skip just draws another card
         setCurrentCard(nextCard);
         setHistory(prev => [...prev, nextCard]);
         return;
     }

     if (guess === 'higher' && nextCard.value > currentCard.value) isWin = true;
     if (guess === 'lower' && nextCard.value < currentCard.value) isWin = true;

     setCurrentCard(nextCard);
     setHistory(prev => [...prev, nextCard]);

     if (isWin) {
         const moveMulti = guess === 'higher' ? higherMulti : lowerMulti;
         setMultiplier(prev => parseFloat((prev * moveMulti).toFixed(2)));
     } else {
         // Loss
         setIsPlaying(false);
         recordBet('Hilo', betAmount, 0, -betAmount);
     }
  };

  const handleCashout = () => {
     if (!isPlaying) return;
     setIsPlaying(false);
     const payout = betAmount * multiplier;
     addBalance(payout);
     recordBet('Hilo', betAmount, multiplier, payout - betAmount);
     setWinInfo({ multiplier, payout });
  };

  const potentialWin = betAmount * multiplier;

  const renderCard = (card: { rank: string, suit: string }, animate=false) => {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    return (
      <motion.div 
         initial={animate ? { scale: 0.8, x: 50, opacity: 0 } : false}
         animate={animate ? { scale: 1, x: 0, opacity: 1 } : false}
         className="w-32 h-44 bg-white rounded-xl shadow-2xl flex flex-col justify-between p-3 relative border-2 border-slate-200"
      >
         <div className={cn("text-2xl font-bold leading-none", isRed ? "text-red-500" : "text-slate-800")}>
            {card.rank}
         </div>
         <div className="absolute inset-0 flex items-center justify-center">
             <span className={cn("text-5xl", isRed ? "text-red-500" : "text-slate-800")}>
                {card.suit === 'hearts' && '♥'}
                {card.suit === 'diamonds' && '♦'}
                {card.suit === 'clubs' && '♣'}
                {card.suit === 'spades' && '♠'}
             </span>
         </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)] flex-col gap-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Controls */}
        <div className="md:col-span-3 bg-[#213743] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-medium z-10 relative">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-text-secondary text-sm font-semibold">Montant</label>
            </div>
            <div className="relative flex items-center bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <Coins size={16} className="text-text-secondary" />
              </div>
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-bold outline-none tabular-nums"
                min="0" step="0.01" disabled={isPlaying}
              />
            </div>
          </div>

          <div className="flex-1 border border-border-medium rounded-lg bg-bg-inner p-3 flex flex-col justify-center">
             <div className="flex justify-between text-sm mb-1">
                 <span className="text-text-secondary">Multiplier</span>
                 <span className="text-white font-bold">{multiplier.toFixed(2)}×</span>
             </div>
             <div className="flex justify-between text-sm">
                 <span className="text-text-secondary">Profit</span>
                 <span className="text-[#00e676] font-bold">€{(potentialWin - betAmount).toFixed(2)}</span>
             </div>
          </div>

          {!isPlaying ? (
             <button 
               onClick={startGame}
               disabled={balance < betAmount}
               className={cn(
                 "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
                 "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
                 (balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0"
               )}
             >
               Miser
             </button>
          ) : (
             <button 
               onClick={handleCashout}
               className="w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#ff9800] hover:bg-[#f57c00] text-[#0f1116] shadow-[0_4px_0_#e65100] active:translate-y-1 active:shadow-[0_0px_0_#e65100]"
             >
               Retirer €{potentialWin.toFixed(2)}
             </button>
          )}
        </div>

        {/* Game Stage */}
        <div className="md:col-span-9 bg-[#0f172a] relative p-8 flex flex-col items-center justify-center">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="flex items-center gap-8 relative z-10 w-full justify-center">
              
              {/* Higher Button */}
              <button 
                 onClick={() => handleGuess('higher')}
                 disabled={!isPlaying || higherMulti === 0}
                 className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                  <div className="w-20 py-2 bg-[#213743] border border-border-medium rounded text-center transition-colors group-hover:bg-[#2c4755]">
                      <span className="font-bold text-white tabular-nums">{higherMulti.toFixed(2)}×</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-bg-panel shadow-lg flex flex-col items-center justify-center border border-[#00e676]/30 text-[#00e676] transition-transform group-hover:scale-105 group-active:scale-95 group-active:bg-[#00e676] group-active:text-[#0f172a]">
                      <ChevronUp size={32} />
                  </div>
              </button>

              {/* Current Card */}
              <AnimatePresence mode="popLayout">
                 <div className="relative z-20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                     {renderCard(currentCard, isPlaying)}
                 </div>
              </AnimatePresence>

              {/* Lower Button */}
              <button 
                 onClick={() => handleGuess('lower')}
                 disabled={!isPlaying || lowerMulti === 0}
                 className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                  <div className="w-20 py-2 bg-[#213743] border border-border-medium rounded text-center transition-colors group-hover:bg-[#2c4755]">
                      <span className="font-bold text-white tabular-nums">{lowerMulti.toFixed(2)}×</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-bg-panel shadow-lg flex flex-col items-center justify-center border border-[#ed4163]/30 text-[#ed4163] transition-transform group-hover:scale-105 group-active:scale-95 group-active:bg-[#ed4163] group-active:text-[#0f172a]">
                      <ChevronDown size={32} />
                  </div>
              </button>

           </div>

           {/* History Mini Cards */}
           <div className="absolute bottom-4 left-0 w-full px-8 flex justify-end gap-2 overflow-x-auto opacity-50">
               {history.slice(0, -1).map((c, i) => (
                  <div key={i} className="w-8 h-12 bg-white rounded shadow-sm flex items-center justify-center border border-slate-300">
                     <span className={cn("text-xs font-bold", (c.suit === 'hearts' || c.suit === 'diamonds') ? "text-red-500" : "text-slate-800")}>
                        {c.rank}
                     </span>
                  </div>
               ))}
           </div>
        </div>
      </div>
    </div>
  );
}
