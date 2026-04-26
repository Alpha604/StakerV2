import React, { useState } from 'react';
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Moles() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [molesCount, setMolesCount] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Game state
  const [board, setBoard] = useState<{isMole: boolean, revealed: boolean}[]>(Array(25).fill({isMole: false, revealed: false}));
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const start = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;

    // Generate board
    const newBoard = Array(25).fill({ isMole: false, revealed: false });
    let molesPlaced = 0;
    while (molesPlaced < molesCount) {
       const idx = Math.floor(Math.random() * 25);
       if (!newBoard[idx].isMole) {
          newBoard[idx] = { isMole: true, revealed: false };
          molesPlaced++;
       }
    }

    setBoard(newBoard);
    setIsPlaying(true);
    setGameOver(false);
    setRevealedCount(0);
    setWinInfo(null);
  };

  const calculateMultiplier = (cleared: number, totalMoles: number) => {
    // Basic combination calculation for simplified multiplier
    const totalTiles = 25;
    let prob = 1;
    for (let i = 0; i < cleared; i++) {
        prob *= (totalTiles - totalMoles - i) / (totalTiles - i);
    }
    return prob > 0 ? (0.99 / prob) : 0; 
  };

  const currentMultiplier = revealedCount > 0 ? calculateMultiplier(revealedCount, molesCount) : 1;
  const nextMultiplier = calculateMultiplier(revealedCount + 1, molesCount);
  const currentProfit = betAmount * currentMultiplier;

  const handleClick = (idx: number) => {
     if (!isPlaying || gameOver || board[idx].revealed) return;

     const newBoard = [...board];
     newBoard[idx] = { ...newBoard[idx], revealed: true };
     setBoard(newBoard);

     if (newBoard[idx].isMole) {
         // Boom! You hit a mole (bomb)
         setGameOver(true);
         setIsPlaying(false);
         recordBet('Moles', betAmount, 0, -betAmount);

         // Reveal all
         setBoard(newBoard.map(b => ({ ...b, revealed: true })));
     } else {
         // Safe!
         setRevealedCount(r => r + 1);
         
         const newRevealedCount = revealedCount + 1;
         if (newRevealedCount === 25 - molesCount) {
             // Won the game!
             const multi = calculateMultiplier(newRevealedCount, molesCount);
             cashout(multi);
         }
     }
  };

  const cashout = (forcedMulti?: number) => {
      if (!isPlaying || gameOver) return;
      const multi = forcedMulti || currentMultiplier;
      const payout = betAmount * multi;
      
      addBalance(payout);
      setWinInfo({ multiplier: multi, payout });
      recordBet('Moles', betAmount, multi, payout - betAmount);
      
      setGameOver(true);
      setIsPlaying(false);
      setBoard(board.map(b => ({ ...b, revealed: true })));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 bg-bg-panel border border-border-medium rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 p-4 gap-4">
         
         <div className="flex bg-bg-inner p-1 rounded-full w-fit mb-2 border border-border-medium">
            <button className="px-6 py-1.5 rounded-full text-sm font-bold bg-border-medium text-white shadow-sm">Manuel</button>
            <button className="px-6 py-1.5 rounded-full text-sm font-bold text-text-secondary hover:text-white transition-colors">Auto</button>
         </div>

         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Montant du Pari</span>
               <span>{betAmount > 0 ? betAmount.toFixed(2) : '0.00'}</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded flex items-center hover:border-text-secondary transition-colors focus-within:border-accent">
               <span className="pl-3 text-[#f7931a] flex items-center justify-center">{renderCryptoIcon(activeCrypto, "w-5 h-5")}</span>
               <input 
                 type="number"
                 value={betAmount || ''}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 disabled={isPlaying}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none"
               />
               <div className="pr-1 flex gap-1">
                   <button onClick={() => setBetAmount(b => b/2)} className="bg-bg-panel hover:bg-border-subtle p-1.5 rounded font-bold text-xs" disabled={isPlaying}>1/2</button>
                   <button onClick={() => setBetAmount(b => b*2)} className="bg-bg-panel hover:bg-border-subtle p-1.5 rounded font-bold text-xs" disabled={isPlaying}>2x</button>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Taupes</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded flex items-center hover:border-text-secondary transition-colors">
               <select 
                 value={molesCount}
                 onChange={(e) => setMolesCount(Number(e.target.value))}
                 disabled={isPlaying}
                 className="w-full bg-transparent text-white font-bold p-3 outline-none appearance-none"
               >
                   {[...Array(24)].map((_, i) => (
                       <option key={i+1} value={i+1}>{i+1}</option>
                   ))}
               </select>
            </div>
         </div>

         {isPlaying ? (
             <button 
                onClick={() => cashout()}
                disabled={revealedCount === 0 || gameOver}
                className="w-full py-3.5 mt-2 rounded text-white font-black text-lg bg-[#2f4553] hover:bg-[#3d5a6c] transition-colors shadow disabled:opacity-50"
             >
                Retirer
             </button>
         ) : (
             <button 
                onClick={start}
                disabled={!user || balance < betAmount}
                className="w-full py-3.5 mt-2 rounded text-[#0f172a] font-black text-lg bg-accent hover:bg-accent-hover transition-colors shadow disabled:opacity-50"
             >
                Pari
             </button>
         )}

         <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Profit total ({revealedCount > 0 ? currentMultiplier.toFixed(2) : '1.00'}x)</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded flex items-center">
               <span className="pl-3 text-[#f7931a] flex items-center justify-center">{renderCryptoIcon(activeCrypto, "w-5 h-5")}</span>
               <input 
                 readOnly
                 value={currentProfit.toFixed(8)}
                 className="w-full bg-transparent text-white font-mono p-3 outline-none opacity-50"
               />
            </div>
         </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-[#0f212e] rounded-b-xl md:rounded-r-xl border border-border-medium relative overflow-hidden order-1 md:order-2 p-8 flex flex-col items-center justify-center min-h-[500px]">
          {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
          
          <div className="grid grid-cols-5 gap-3 max-w-[400px] w-full">
              {board.map((tile, idx) => (
                  <div 
                      key={idx} 
                      onClick={() => handleClick(idx)}
                      className={cn(
                          "aspect-square rounded-full transition-all duration-300 relative group",
                          tile.revealed 
                            ? "bg-[#213743]" 
                            : isPlaying 
                              ? "bg-[#2f4553] hover:bg-[#3d5a6c] hover:-translate-y-1 shadow-lg cursor-pointer" 
                              : "bg-[#2f4553] opacity-60"
                      )}
                      style={{
                          transformStyle: 'preserve-3d',
                          perspective: '1000px'
                      }}
                  >
                      <div className={cn(
                          "absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300 pointer-events-none",
                          tile.revealed ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      )}>
                          {tile.revealed && (
                             tile.isMole 
                               ? <span className="text-4xl filter drop-shadow">🐭</span> 
                               : <span className="text-4xl filter drop-shadow opacity-50">💎</span>
                          )}
                      </div>
                  </div>
              ))}
          </div>
          
      </div>
    </div>
  );
}
