import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins, HelpCircle } from 'lucide-react';
import { WinPopup } from './WinPopup';

export function Flip() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [coinSide, setCoinSide] = useState<'heads' | 'tails' | null>(null);
  const [chosenSide, setChosenSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

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
        const result = Math.random() > 0.5 ? 'heads' : 'tails';
        setCoinSide(result);
        setIsFlipping(false);
        setIsPlaying(false);

        const isWin = result === chosenSide;
        const payout = isWin ? potentialWin : 0;
        
        if (isWin) {
           addBalance(payout);
           setWinInfo({ multiplier, payout });
        }
        
        recordBet('Flip', betAmount, isWin ? multiplier : 0, payout - betAmount);
    }, 1500); // Wait 1.5 seconds for animation
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)] flex-col gap-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Side Controls */}
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
          
          <div className="flex flex-col gap-2">
            <label className="text-text-secondary text-sm font-semibold">Prédiction</label>
            <div className="flex gap-2">
               <button 
                  onClick={() => setChosenSide('heads')}
                  disabled={isPlaying}
                  className={cn("flex-1 py-3 rounded font-bold transition-all relative overflow-hidden", chosenSide === 'heads' ? "bg-bg-inner border border-yellow-500 text-white" : "bg-bg-inner/50 border border-transparent text-text-secondary")}
               >
                  Pile <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-500"></span>
               </button>
               <button 
                  onClick={() => setChosenSide('tails')}
                  disabled={isPlaying}
                  className={cn("flex-1 py-3 rounded font-bold transition-all relative overflow-hidden", chosenSide === 'tails' ? "bg-bg-inner border border-blue-500 text-white" : "bg-bg-inner/50 border border-transparent text-text-secondary")}
               >
                  Face <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
               </button>
            </div>
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={handleBet}
            disabled={isPlaying || balance < betAmount}
            className={cn(
              "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
              "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
              (isPlaying || balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0"
            )}
          >
            Miser
          </button>
        </div>

        {/* Right Side Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative p-8 flex flex-col items-center justify-center overflow-hidden">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center perspective-[1000px]">
               {/* 3D Coin */}
               <motion.div 
                  initial={false}
                  animate={
                     isFlipping ? {
                        rotateX: [0, 720, 1440, 2160, 2880], // spin aggressively
                        y: [0, -150, 0] // jump up and down
                     } : coinSide === 'heads' ? {
                        rotateX: 0, y: 0
                     } : coinSide === 'tails' ? {
                        rotateX: 180, y: 0
                     } : {
                        rotateX: 0, y: 0
                     }
                  }
                  transition={{
                     duration: isFlipping ? 1.5 : 0.5,
                     ease: isFlipping ? "easeInOut" : "easeOut",
                     times: isFlipping ? [0, 0.5, 1] : undefined
                  }}
                  className="w-full h-full relative"
                  style={{ transformStyle: 'preserve-3d' }}
               >
                  {/* Front: HEADS (Pile - Yellow) */}
                  <div 
                     className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-yellow-600 bg-yellow-400 flex items-center justify-center shadow-xl font-black text-yellow-800 text-3xl sm:text-5xl"
                     style={{ backfaceVisibility: 'hidden', transform: 'rotateX(0deg)' }}
                  >
                     PILE
                  </div>
                  {/* Back: TAILS (Face - Blue) */}
                  <div 
                     className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-blue-600 bg-blue-400 flex items-center justify-center shadow-xl font-black text-blue-900 text-3xl sm:text-5xl"
                     style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
                  >
                     FACE
                  </div>
               </motion.div>
           </div>

           {!isFlipping && coinSide && coinSide !== chosenSide && (
              <motion.div 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className={cn("mt-8 font-black text-3xl sm:text-4xl text-[#ed4163]")}
              >
                 Perdu
              </motion.div>
           )}

        </div>
      </div>
    </div>
  );
}
