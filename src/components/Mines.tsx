import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Bomb, Gem, Coins, Hand } from 'lucide-react';
import { cn } from '../lib/utils';
import { WinPopup } from './WinPopup';
import { motion, AnimatePresence } from 'motion/react';

type CellState = 'hidden' | 'gem' | 'bomb';

const playSound = (type: 'gem' | 'bomb' | 'cashout') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (type === 'gem') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4 Very mellow
            osc.frequency.exponentialRampToValueAtTime(329.63, audioCtx.currentTime + 0.05); // E4
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.02); // Super soft
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'bomb') {
            osc.type = 'sine'; // Muffled thud
            osc.frequency.setValueAtTime(80, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'cashout') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(196.00, audioCtx.currentTime); // G3
            osc.frequency.setValueAtTime(261.63, audioCtx.currentTime + 0.1); // C4
            osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.2); // E4
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.5);
        }
    } catch(e) {
        console.warn('Audio play restricted', e);
    }
};


export function Mines() {
  const { user, balance, addBalance, subtractBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill('hidden'));
  const [mineLocations, setMineLocations] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  
  const calculateMultiplier = (mines: number, revealed: number) => {
    if (revealed === 0) return 1.00;
    const baseMult = 1 + (mines * 0.1);
    return Number(Math.pow(baseMult, revealed).toFixed(2));
  };

  const currentMultiplier = calculateMultiplier(minesCount, revealedCount);
  const potentialWin = betAmount * currentMultiplier;

  const startGame = async () => {
    if (!user) {
       alert("Please log in to play!");
       return;
    }
    if (betAmount <= 0) return;
    
    // Check if we generated enough balance
    const success = await subtractBalance(betAmount);
    if (success) {
      setIsPlaying(true);
      setCrashed(false);
      setWinInfo(null);
      setGrid(Array(25).fill('hidden'));
      setRevealedCount(0);
      
      const newMines = new Set<number>();
      while (newMines.size < minesCount) {
        newMines.add(Math.floor(Math.random() * 25));
      }
      setMineLocations(newMines);
    }
  };

  const cashout = async () => {
    if (!isPlaying || crashed || revealedCount === 0) return;
    
    playSound('cashout');
    setIsPlaying(false);
    await addBalance(potentialWin);
    await recordBet('Mines', betAmount, currentMultiplier, potentialWin - betAmount);
    
    setWinInfo({ multiplier: currentMultiplier, payout: potentialWin });
    revealAll();
  };

  const revealAll = () => {
    const newGrid = grid.map((_, i) => mineLocations.has(i) ? 'bomb' : 'gem');
    setGrid(newGrid);
  };

  const pickRandom = () => {
     if (!isPlaying || crashed) return;
     const hiddenIndexes = grid.map((cell, i) => cell === 'hidden' ? i : -1).filter(i => i !== -1);
     if (hiddenIndexes.length > 0) {
        const randomIndex = hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];
        handleCellClick(randomIndex);
     }
  };

  const handleCellClick = async (index: number) => {
    if (!isPlaying || crashed || grid[index] !== 'hidden') return;

    const newGrid = [...grid];
    
    if (mineLocations.has(index)) {
      playSound('bomb');
      newGrid[index] = 'bomb';
      setGrid(newGrid);
      setCrashed(true);
      setIsPlaying(false);
      revealAll();
      
      await recordBet('Mines', betAmount, 0, -betAmount);
    } else {
      playSound('gem');
      newGrid[index] = 'gem';
      setGrid(newGrid);
      setRevealedCount(prev => prev + 1);
      
      if (revealedCount + 1 === 25 - minesCount) {
        // Force cashout
        playSound('cashout');
        setIsPlaying(false);
        const finalMult = calculateMultiplier(minesCount, revealedCount + 1);
        const finalWin = betAmount * finalMult;
        await addBalance(finalWin);
        await recordBet('Mines', betAmount, finalMult, finalWin - betAmount);
        setWinInfo({ multiplier: finalMult, payout: finalWin });
        revealAll();
      }
    }
  };

  return (
    <>
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      
      <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 overflow-hidden z-10 shadow-2xl">
        
        {/* Tabs style from screenshot */}
        <div className="flex p-4 pb-0">
          <div className="bg-bg-inner flex w-full p-1 rounded-full border border-border-medium shadow-inner">
             <button className="flex-1 py-1.5 bg-border-medium rounded-full text-white text-sm font-bold shadow text-center">
                Manuel
             </button>
             <button className="flex-1 py-1.5 text-text-secondary hover:text-white text-sm font-bold transition-colors text-center">
                Auto
             </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 relative z-10">
            <div className="flex justify-between items-center opacity-80">
               <label className="text-text-secondary text-xs uppercase tracking-wider font-semibold">Montant du Pari</label>
               <span className="text-white text-xs">{balance.toFixed(2)} $US</span>
            </div>
            <div className="flex items-center bg-bg-inner border border-border-medium rounded shadow-inner h-10">
              <span className="pl-3 absolute">
                 <span className="text-emerald-500 font-bold font-mono text-sm leading-none bg-emerald-500/20 w-4 h-4 flex items-center justify-center rounded-full">T</span>
              </span>
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isPlaying}
                className="w-full bg-transparent p-2 pl-9 text-white font-mono outline-none focus:ring-1 focus:ring-accent transition-shadow disabled:opacity-50 text-sm"
                step="0.01"
                min="0.01"
                max={balance}
              />
              <div className="flex h-full border-l border-border-medium divide-x divide-border-medium">
                 <button 
                  onClick={() => setBetAmount(prev => prev / 2)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-border-subtle text-xs font-semibold disabled:opacity-50 transition-colors text-slate-300"
                >
                  ½
                </button>
                <button 
                  onClick={() => setBetAmount(prev => prev * 2)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-border-subtle text-xs font-semibold disabled:opacity-50 transition-colors text-slate-300 rounded-r"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative z-10">
            <label className="text-text-secondary text-xs uppercase tracking-wider font-semibold opacity-80">Mines</label>
            <div className="relative">
              <select 
                value={minesCount}
                onChange={(e) => setMinesCount(Number(e.target.value))}
                disabled={isPlaying}
                className="w-full h-10 bg-bg-inner border border-border-medium px-3 text-white font-mono outline-none focus:ring-1 focus:ring-accent rounded disabled:opacity-50 appearance-none shadow-inner text-sm"
              >
                {[1, 3, 5, 10, 24].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                 ▼
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2 relative z-10 w-full">
             {isPlaying ? (
                <>
                   <button 
                    onClick={pickRandom}
                    className="w-full py-3 rounded text-text-secondary bg-border-medium hover:bg-border-subtle hover:text-white transition-colors border border-border-medium font-semibold shadow text-sm mb-2"
                   >
                     Sélection aléatoire
                   </button>
                   <button 
                    onClick={cashout}
                    disabled={revealedCount === 0}
                    className="w-full py-3 rounded text-white bg-accent hover:bg-accent-hover disabled:bg-bg-inner disabled:text-text-secondary disabled:border disabled:border-border-medium transition-colors shadow flex items-center justify-between px-4"
                  >
                    <span className="font-semibold text-sm">Retrait</span>
                    {revealedCount > 0 && <span className="font-mono font-bold">${potentialWin.toFixed(2)}</span>}
                  </button>
                </>
             ) : (
                <button 
                  onClick={startGame}
                  disabled={isPlaying || betAmount > balance || betAmount <= 0}
                  className="w-full py-3 rounded text-white font-semibold bg-accent hover:bg-accent-hover disabled:opacity-30 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                >
                  Pari
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-bg-inner rounded-b-xl md:rounded-r-xl md:rounded-bl-none flex flex-col items-center justify-center order-1 md:order-2 border border-border-subtle p-8 md:p-16 relative">
      
         {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}

         {/* Top Info Bar matching screenshot with Next Multiplier preview */}
        {isPlaying && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="text-white text-sm font-bold bg-border-medium px-4 py-1.5 rounded-full shadow">
                 Prochain : {(calculateMultiplier(minesCount, revealedCount + 1)).toFixed(2)}×
              </span>
           </div>
        )}
        
        {/* The Grid matching Stake styles */}
        <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[500px] aspect-square">
          {grid.map((cell, i) => {
            const isLatest = isPlaying && cell !== 'hidden' && revealedCount > 0; // rough approximation for animation trigger
            
            return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              disabled={!isPlaying || crashed || cell !== 'hidden'}
              className={cn(
                "w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden group shadow-md",
                cell === 'hidden' ? "bg-[#213743] hover:-translate-y-[2px] hover:bg-[#2c4755] cursor-pointer shadow-[0_4px_0_#15242d] active:shadow-[0_0px_0_#15242d] active:translate-y-1" : 
                "bg-[#0f172a] shadow-none",
                !isPlaying && cell === 'hidden' && "opacity-80 hover:-translate-y-0 cursor-default shadow-[0_4px_0_#15242d]"
              )}
            >
              <div className={cn(
                "absolute inset-0 transition-opacity duration-300 flex items-center justify-center",
                cell === 'hidden' ? "opacity-0 group-hover:bg-white/5" : "opacity-100"
              )}>
                 <AnimatePresence>
                 {cell === 'gem' && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -45, y: 20 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="w-full h-full flex items-center justify-center relative"
                    >
                       <motion.div 
                         initial={{ opacity: 0, scale: 0 }}
                         animate={{ opacity: [0, 0.5, 0], scale: [1, 2, 3] }}
                         transition={{ duration: 0.5, ease: "easeOut" }}
                         className="absolute inset-0 bg-[#00E701] rounded-full blur-[20px] pointer-events-none"
                       />
                       {/* SVG matching the gem from screenshot 3 */}
                       <svg width="60%" height="60%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                          <path d="M256 0L493.597 131.6L256 512L18.4026 131.6L256 0Z" fill="#00E701"/>
                          <path d="M256 0V512L18.4026 131.6L256 0Z" fill="#00C001"/>
                          <path d="M256 0L493.597 131.6L256 186.2V0Z" fill="#1FFF20" opacity="0.6"/>
                          <path d="M256 0V186.2L18.4026 131.6L256 0Z" fill="#00FF01" opacity="0.4"/>
                       </svg>
                    </motion.div>
                 )}
                 {cell === 'bomb' && (
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.4 }}
                     >
                        <Bomb size={48} className="text-[#ed4163] drop-shadow-[0_0_15px_rgba(237,65,99,0.5)]" fill="#ed4163" />
                     </motion.div>
                 )}
                 </AnimatePresence>
              </div>
            </button>
            )
          })}
        </div>
      </div>
    </div>
    
    </>
  );
}
