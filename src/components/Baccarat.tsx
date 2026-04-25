import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card { suit: string; rank: string; value: number }

export function Baccarat() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betChoice, setBetChoice] = useState<'player' | 'banker' | 'tie'>('player');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const getCardValue = (rank: string) => {
     if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
     if (rank === 'A') return 1;
     return parseInt(rank);
  };

  const drawCard = (): Card => {
     const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
     return {
        suit: SUITS[Math.floor(Math.random() * SUITS.length)],
        rank,
        value: getCardValue(rank)
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

       let winner: 'player' | 'banker' | 'tie' = 'tie';
       if (pScore > bScore) winner = 'player';
       else if (bScore > pScore) winner = 'banker';

       setTimeout(() => {
          setIsPlaying(false);
          let multiplier = 0;
          if (betChoice === winner) {
             if (winner === 'tie') multiplier = 9; // Tie pays 8:1 (plus return stake -> 9x)
             else if (winner === 'banker') multiplier = 1.95; // Banker pays 0.95:1
             else multiplier = 2; // Player pays 1:1
          }

          if (multiplier > 0) {
             const payout = betAmount * multiplier;
             addBalance(payout);
             setWinInfo({ multiplier, payout });
             recordBet('Baccarat', betAmount, multiplier, payout - betAmount);
          } else {
             recordBet('Baccarat', betAmount, 0, -betAmount);
          }
       }, 1500);
    }, 500);
  };

  const getRankColor = (suit: string) => ['hearts', 'diamonds'].includes(suit) ? 'text-[#ed4163]' : 'text-gray-800';
  const getSuitSymbol = (suit: string) => {
     switch(suit) {
        case 'hearts': return '♥'; case 'diamonds': return '♦'; case 'clubs': return '♣'; case 'spades': return '♠';
        default: return '';
     }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 shadow-2xl overflow-hidden">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Pari</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded-md flex items-center focus-within:border-accent">
               <span className="pl-3 text-emerald-500"><Coins size={16} /></span>
               <input 
                 type="number"
                 value={betAmount || ''}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none"
               />
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Choix</span>
             <div className="flex flex-col gap-2">
                {(['player', 'banker', 'tie'] as const).map(choice => (
                   <button
                      key={choice}
                      onClick={() => setBetChoice(choice)}
                      className={cn(
                         "py-3 rounded text-sm font-bold uppercase transition-all border",
                         betChoice === choice ? "bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(20,117,225,0.2)]" : "bg-bg-inner border-border-medium text-text-secondary hover:text-white"
                      )}
                   >
                      {choice === 'player' ? 'Player (2.00x)' : choice === 'banker' ? 'Banker (1.95x)' : 'Tie (9.00x)'}
                   </button>
                ))}
             </div>
          </div>
          
          <button 
            disabled={isPlaying || !user}
            onClick={startGame}
            className="mt-2 w-full py-4 rounded-md font-extrabold text-lg uppercase tracking-wider transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f172a] disabled:opacity-50"
          >
            Parier
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl md:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 md:order-2">
        <div className="h-full bg-[#0f172a] relative p-8 flex flex-col items-center justify-center min-h-[400px]">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="w-full flex gap-12 justify-center items-start">
              {/* Player Side */}
              <div className="flex flex-col items-center gap-4 w-1/2">
                 <h2 className="text-white font-black text-2xl tracking-widest uppercase">Player</h2>
                 <div className="flex gap-2 min-h-[144px]">
                    <AnimatePresence>
                       {playerCards.map((card, idx) => (
                          <motion.div 
                             key={`p-${idx}`}
                             initial={{ opacity: 0, x: -50, rotate: -10 }}
                             animate={{ opacity: 1, x: 0, rotate: 0 }}
                             className="bg-white rounded-lg w-20 h-32 border shadow-lg flex flex-col items-center justify-center relative"
                          >
                             <span className={cn("text-2xl font-black mb-1", getRankColor(card.suit))}>{card.rank}</span>
                             <span className={cn("text-3xl", getRankColor(card.suit))}>{getSuitSymbol(card.suit)}</span>
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
                 {playerCards.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 bg-bg-inner px-4 py-2 rounded-full border border-border-medium">
                       <span className="text-white font-bold font-mono">Score: {calculateScore(playerCards)}</span>
                    </motion.div>
                 )}
              </div>

              {/* Banker Side */}
              <div className="flex flex-col items-center gap-4 w-1/2">
                 <h2 className="text-white font-black text-2xl tracking-widest uppercase">Banker</h2>
                 <div className="flex gap-2 min-h-[144px]">
                    <AnimatePresence>
                       {bankerCards.map((card, idx) => (
                          <motion.div 
                             key={`b-${idx}`}
                             initial={{ opacity: 0, x: 50, rotate: 10 }}
                             animate={{ opacity: 1, x: 0, rotate: 0 }}
                             className="bg-white rounded-lg w-20 h-32 border shadow-lg flex flex-col items-center justify-center relative"
                          >
                             <span className={cn("text-2xl font-black mb-1", getRankColor(card.suit))}>{card.rank}</span>
                             <span className={cn("text-3xl", getRankColor(card.suit))}>{getSuitSymbol(card.suit)}</span>
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
                 {bankerCards.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 bg-bg-inner px-4 py-2 rounded-full border border-border-medium">
                       <span className="text-white font-bold font-mono">Score: {calculateScore(bankerCards)}</span>
                    </motion.div>
                 )}
              </div>
           </div>

           {!isPlaying && playerCards.length > 0 && !winInfo && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 text-[#ed4163] font-black text-3xl uppercase tracking-widest">
                 Perdu
              </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
