import React, { useState } from 'react';
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';

const MULTIPLIERS = {
   easy: [1.1, 1.25, 1.45, 1.7, 2.0, 2.4, 2.9, 3.5, 4.3, 5.3],
   medium: [1.15, 1.37, 1.64, 2.00, 2.46, 3.05, 3.8, 4.8, 6.1, 7.8],
   hard: [1.3, 1.75, 2.4, 3.5, 5.0, 7.5, 11.5, 18.0, 28.0, 45.0],
};

const SURVIVAL_RATES = {
   easy: 0.88,
   medium: 0.80,
   hard: 0.65,
};

export function Chicken() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0); // 0 = start line
  const [crushedAt, setCrushedAt] = useState<number | null>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  const [carAnimInfo, setCarAnimInfo] = useState<{ lane: number, id: number } | null>(null);

  const start = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;
    setIsPlaying(true);
    setStep(0);
    setCrushedAt(null);
    setWinInfo(null);
  };

  const currentMultipliers = MULTIPLIERS[difficulty];
  const nextMultiplier = currentMultipliers[step];
  const currentMultiplier = step > 0 ? currentMultipliers[step - 1] : 1;
  const currentProfit = step > 0 ? betAmount * currentMultiplier : 0;

  const handleAllez = () => {
    if (!isPlaying || crushedAt !== null) return;
    
    // Check survival
    const survived = Math.random() < SURVIVAL_RATES[difficulty];

    if (survived) {
       setStep(s => s + 1);
       if (step + 1 >= currentMultipliers.length) {
          // Finished the road!
          const maxMulti = currentMultipliers[currentMultipliers.length - 1];
          cashout(maxMulti);
       }
    } else {
       // Crushed
       setCrushedAt(step + 1);
       setCarAnimInfo({ lane: step + 1, id: Date.now() });
       setTimeout(() => {
           setIsPlaying(false);
           recordBet('Chicken', betAmount, 0, -betAmount);
       }, 1000);
    }
  };

  const cashout = (forcedMulti?: number) => {
    if (!isPlaying || crushedAt !== null) return;
    const multi = forcedMulti || currentMultiplier;
    if (multi > 1 || forcedMulti) {
       const payout = betAmount * multi;
       addBalance(payout);
       setWinInfo({ multiplier: multi, payout });
       recordBet('Chicken', betAmount, multi, payout - betAmount);
    }
    setIsPlaying(false);
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
               <span>Difficulté</span>
            </div>
            <div className="relative bg-bg-inner border border-border-medium rounded hover:border-text-secondary transition-colors">
               <select 
                 value={difficulty}
                 onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                 disabled={isPlaying}
                 className="w-full bg-transparent text-white font-bold p-3 outline-none appearance-none"
               >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
               </select>
            </div>
         </div>

         {isPlaying ? (
            <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => cashout()}
                  disabled={step === 0 || crushedAt !== null}
                  className="flex-1 py-3.5 rounded text-white font-black text-lg bg-[#2f4553] hover:bg-[#3d5a6c] transition-colors shadow disabled:opacity-50"
                >
                  Retrait
                </button>
                <button 
                  onClick={handleAllez}
                  disabled={crushedAt !== null}
                  className="flex-1 py-3.5 rounded text-[#0f172a] font-black text-lg bg-accent hover:bg-accent-hover transition-colors shadow disabled:opacity-50"
                >
                  Allez
                </button>
            </div>
         ) : (
             <button 
                onClick={start}
                disabled={!user || balance < betAmount}
                className="w-full py-3.5 mt-2 rounded text-[#0f172a] font-black text-lg bg-accent hover:bg-accent-hover transition-colors shadow disabled:opacity-50"
             >
                Jouer
             </button>
         )}

         <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
               <span>Profit total ({step > 0 ? currentMultiplier.toFixed(2) : '1.00'}x)</span>
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
      <div className="flex-1 bg-[#0f212e] rounded-b-xl md:rounded-r-xl border border-border-medium relative overflow-hidden order-1 md:order-2 p-8 flex flex-col justify-end min-h-[500px]">
          {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
          
          <div className="flex-1 w-full bg-[#1a2c38] rounded-xl overflow-hidden shadow-inner flex flex-col relative">
             {/* Lanes */}
             <div className="flex flex-1 h-full items-end pb-8 pl-12 overflow-x-auto scrollbar-hide">
                 
                 {/* Start point */}
                 <div className="flex flex-col items-center justify-end h-full w-24 shrink-0 relative mr-4">
                     <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-20 bg-bg-panel border-2 border-border-medium rounded flex flex-col justify-around p-1">
                         <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto"></div>
                         <div className="w-3 h-3 rounded-full bg-[#2f4553] mx-auto"></div>
                     </div>
                     <div className="w-full h-12 border-t-4 border-dashed border-white/20 mt-auto flex items-center justify-center">
                         {step === 0 && crushedAt === null && (
                            <motion.div layoutId="chicken" className="text-4xl filter drop-shadow z-20">🐔</motion.div>
                         )}
                     </div>
                 </div>

                 {currentMultipliers.map((multi, idx) => {
                     const laneNum = idx + 1;
                     const isCurrent = step === laneNum;
                     const isCrushedHere = crushedAt === laneNum;
                     const passed = step >= laneNum;
                     
                     return (
                         <div key={idx} className="flex flex-col items-center justify-end h-full w-24 shrink-0 relative border-l border-white/5">
                             {/* Car animation if crushed here */}
                             {isCrushedHere && carAnimInfo?.lane === laneNum && (
                                 <motion.div 
                                    initial={{ y: -300 }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeIn' }}
                                    className="absolute bottom-12 z-30 text-5xl"
                                 >
                                     🚓
                                 </motion.div>
                             )}

                             {/* Road markings */}
                             <div className="absolute inset-0 flex flex-col items-center justify-evenly pointer-events-none opacity-20">
                                <div className="h-4 w-1 bg-white rounded-full"></div>
                                <div className="h-4 w-1 bg-white rounded-full"></div>
                                <div className="h-4 w-1 bg-white rounded-full"></div>
                                <div className="h-4 w-1 bg-white rounded-full"></div>
                                <div className="h-4 w-1 bg-white rounded-full"></div>
                             </div>

                             <div className="w-full h-12 flex items-center justify-center relative mt-auto z-10">
                                 {isCurrent && crushedAt === null && (
                                     <motion.div layoutId="chicken" className="text-4xl filter drop-shadow z-20">🐔</motion.div>
                                 )}
                                 {isCrushedHere && (
                                     <div className="text-4xl filter drop-shadow z-10 opacity-70 scale-y-50 mt-4">🐔</div>
                                 )}
                             </div>
                             
                             <div className={cn(
                                 "w-20 py-2 rounded-full mt-4 text-center text-sm font-bold shadow-sm transition-colors relative z-20",
                                 passed && crushedAt === null ? "bg-accent text-[#0f172a]" : 
                                 isCrushedHere ? "bg-[#ed4163] text-white" : "bg-[#2f4553] text-white/80"
                             )}>
                                 {multi.toFixed(2)}x
                             </div>
                         </div>
                     );
                 })}
             </div>
          </div>
      </div>
    </div>
  );
}
