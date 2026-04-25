import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface Card {
  suit: string;
  rank: string;
  id: string;
}

export function VideoPoker() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cards, setCards] = useState<Card[]>([]);
  const [heldCards, setHeldCards] = useState<boolean[]>([false, false, false, false, false]);
  const [gameState, setGameState] = useState<'idle' | 'dealt' | 'finished'>('idle');
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const getRandomCard = (): Card => {
    return {
      suit: SUITS[Math.floor(Math.random() * SUITS.length)],
      rank: RANKS[Math.floor(Math.random() * RANKS.length)],
      id: Math.random().toString(36).substring(7)
    };
  };

  const dealInitial = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setHeldCards([false, false, false, false, false]);
    
    const newCards = Array(5).fill(null).map(() => getRandomCard());
    setCards(newCards);
    setGameState('dealt');
  };

  const drawCards = () => {
    const finalCards = cards.map((c, i) => heldCards[i] ? c : getRandomCard());
    setCards(finalCards);
    setGameState('finished');
    evaluateHand(finalCards);
  };

  const evaluateHand = (finalCards: Card[]) => {
    // Fictive simplistic evaluation logic
    // Jacks or Better logic mapping to multipliers
    const counts: Record<string, number> = {};
    finalCards.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    const pairs = Object.values(counts).filter(v => v === 2).length;
    const three = Object.values(counts).filter(v => v === 3).length;
    const four = Object.values(counts).filter(v => v === 4).length;
    
    let multiplier = 0;
    if (four === 1) multiplier = 25;
    else if (three === 1 && pairs === 1) multiplier = 9; // Full house
    else if (three === 1) multiplier = 3;
    else if (pairs === 2) multiplier = 2;
    else if (pairs === 1) {
       // Jacks or better
       const pairRank = Object.keys(counts).find(k => counts[k] === 2);
       if (['J', 'Q', 'K', 'A'].includes(pairRank || '')) multiplier = 1.5;
    }

    if (multiplier > 0) {
       const payout = betAmount * multiplier;
       addBalance(payout);
       setWinInfo({ multiplier, payout });
       recordBet('VideoPoker', betAmount, multiplier, payout - betAmount);
    } else {
       recordBet('VideoPoker', betAmount, 0, -betAmount);
    }
  };

  const getRankColor = (suit: string) => {
     return ['hearts', 'diamonds'].includes(suit) ? 'text-[#ed4163]' : 'text-gray-800';
  };

  const getSuitSymbol = (suit: string) => {
     switch(suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
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
               <span>€{(betAmount).toFixed(2)}</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded-md flex items-center hover:border-text-secondary transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
               <span className="pl-3 text-emerald-500"><Coins size={16} /></span>
               <input 
                 type="number"
                 value={betAmount || ''}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 disabled={gameState === 'dealt'}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none disabled:opacity-50"
               />
            </div>
          </div>
          
          <button 
            disabled={!user}
            onClick={gameState === 'dealt' ? drawCards : dealInitial}
            className="mt-4 w-full py-4 rounded-md font-extrabold text-lg uppercase tracking-wider transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,230,118,0.4)]"
          >
            {gameState === 'dealt' ? 'Piocher (Draw)' : 'Distribuer (Deal)'}
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="flex-1 rounded-b-xl md:rounded-r-xl border border-t-0 md:border-t md:border-l-0 border-border-subtle overflow-hidden order-1 md:order-2">
        <div className="h-full bg-[#0f172a] relative p-8 flex flex-col items-center justify-center min-h-[400px]">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
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
                          if (gameState === 'dealt') {
                             const newHeld = [...heldCards];
                             newHeld[idx] = !newHeld[idx];
                             setHeldCards(newHeld);
                          }
                       }}
                       className={cn(
                          "bg-white rounded-xl w-24 h-36 border shadow-xl flex flex-col items-center justify-center relative cursor-pointer outline outline-4 outline-offset-2 transition-all duration-200",
                          heldCards[idx] ? "outline-accent -translate-y-4" : "outline-transparent hover:-translate-y-1"
                       )}
                    >
                       <span className={cn("text-3xl font-black mb-1", getRankColor(card.suit))}>{card.rank}</span>
                       <span className={cn("text-4xl", getRankColor(card.suit))}>{getSuitSymbol(card.suit)}</span>
                       
                       {heldCards[idx] && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-accent text-bg-base text-xs font-bold uppercase px-2 py-1 rounded">
                             Gardé
                          </div>
                       )}
                    </motion.div>
                 ))
              )}
           </div>
           
           {gameState === 'finished' && cards.length > 0 && !winInfo && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 text-[#ed4163] font-black text-2xl uppercase tracking-widest">
                 Rien (Perdu)
              </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
