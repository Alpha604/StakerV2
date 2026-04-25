import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins, Flame, ChevronRight } from 'lucide-react';
import { WinPopup } from './WinPopup';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const DIFF_SETTINGS: Record<Difficulty, { cols: number, dragonsCount: number, multipliers: number[] }> = {
  easy: {
    cols: 4, dragonsCount: 1, 
    multipliers: [1.31, 1.74, 2.32, 3.10, 4.13, 5.51, 7.34, 9.79, 13.06]
  },
  medium: {
    cols: 3, dragonsCount: 1, 
    multipliers: [1.47, 2.21, 3.32, 4.98, 7.47, 11.20, 16.81, 25.21, 37.82]
  },
  hard: {
    cols: 2, dragonsCount: 1,
    multipliers: [1.96, 3.92, 7.84, 15.68, 31.36, 62.72, 125.44, 250.88, 501.76]
  },
  expert: {
    cols: 3, dragonsCount: 2,
    multipliers: [2.94, 8.82, 26.46, 79.38, 238.14, 714.42, 2143.26, 6429.78, 19289.34]
  }
};

const ROWS = 9;

export function DragonTower() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  
  const settings = DIFF_SETTINGS[difficulty];
  const COLS = settings.cols;
  
  // Grid state: 'hidden' | 'egg' | 'dragon'
  const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(Array(settings.cols).fill('hidden')));
  // Actual locations of dragons: array of indices for each row
  const [dragons, setDragons] = useState<number[][]>([]);
  const [currentRow, setCurrentRow] = useState(0); // 0 is bottom, 8 is top

  const startGame = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setIsPlaying(true);
    setWinInfo(null);
    
    // Generate dragon positions for each row
    const newDragons = Array.from({ length: ROWS }, () => {
       const rowDragons = new Set<number>();
       while(rowDragons.size < settings.dragonsCount) {
          rowDragons.add(Math.floor(Math.random() * COLS));
       }
       return Array.from(rowDragons);
    });
    setDragons(newDragons);
    
    setGrid(Array(ROWS).fill(Array(COLS).fill('hidden')));
    setCurrentRow(0);
  };

  const handleCellClick = (ri: number, ci: number) => {
     if (!isPlaying) return;
     const logicalRow = ROWS - 1 - ri;
     
     if (logicalRow !== currentRow) return;

     const isDragon = dragons[logicalRow].includes(ci);
     
     // Update grid
     const newGrid = grid.map(row => [...row]);
     newGrid[logicalRow][ci] = isDragon ? 'dragon' : 'egg';
     
     // If they missed (hit dragon), reveal other
     if (isDragon) {
        newGrid[logicalRow].forEach((_, i) => {
            if (i !== ci) newGrid[logicalRow][i] = dragons[logicalRow].includes(i) ? 'dragon' : 'egg';
        });
        setGrid(newGrid);
        setIsPlaying(false);
        recordBet('DragonTower', betAmount, 0, -betAmount);
        return;
     }

     setGrid(newGrid);
     
     if (currentRow === ROWS - 1) {
        // Won the whole tower
        setIsPlaying(false);
        const mult = settings.multipliers[ROWS - 1];
        const payout = betAmount * mult;
        addBalance(payout);
        recordBet('DragonTower', betAmount, mult, payout - betAmount);
        setWinInfo({ multiplier: mult, payout });
        
        // Reveal rest
        const fullGrid = newGrid.map((r, i) => {
           const rev = [...r];
           dragons[i].forEach(dIdx => rev[dIdx] = 'dragon');
           return rev;
        });
        setGrid(fullGrid);
     } else {
        setCurrentRow(prev => prev + 1);
     }
  };

  const handleCashout = () => {
      if (!isPlaying || currentRow === 0) return;
      setIsPlaying(false);
      const mult = settings.multipliers[currentRow - 1];
      const payout = betAmount * mult;
      addBalance(payout);
      recordBet('DragonTower', betAmount, mult, payout - betAmount);
      setWinInfo({ multiplier: mult, payout });
      
      // Reveal rest of dragons
      const newGrid = grid.map((r, i) => {
         const rev = [...r];
         dragons[i].forEach(dIdx => rev[dIdx] = 'dragon');
         return rev;
      });
      setGrid(newGrid);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)] flex-col gap-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Side */}
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
            <label className="text-text-secondary text-sm font-semibold mb-1">Difficulté</label>
            <div className="relative">
               <select 
                  value={difficulty}
                  onChange={(e) => {
                      setDifficulty(e.target.value as Difficulty);
                      // Clear grid
                      setGrid(Array(ROWS).fill(Array(DIFF_SETTINGS[e.target.value as Difficulty].cols).fill('hidden')));
                  }}
                  disabled={isPlaying}
                  className="w-full h-10 bg-bg-inner border border-border-medium px-3 text-white font-semibold outline-none focus:ring-1 focus:ring-accent rounded disabled:opacity-50 appearance-none shadow-inner text-sm capitalize"
               >
                  <option value="easy">Facile (4 cases, 1 Dragon)</option>
                  <option value="medium">Moyen (3 cases, 1 Dragon)</option>
                  <option value="hard">Difficile (2 cases, 1 Dragon)</option>
                  <option value="expert">Expert (3 cases, 2 Dragons)</option>
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                  ▼
               </div>
            </div>
          </div>
          
          <div className="flex-1"></div>

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
               disabled={currentRow === 0}
               className={cn(
                 "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#ff9800] hover:bg-[#f57c00] text-[#0f1116] shadow-[0_4px_0_#e65100]",
                 "active:translate-y-1 active:shadow-[0_0px_0_#e65100]",
                 currentRow === 0 && "opacity-50 cursor-not-allowed active:translate-y-0"
               )}
             >
               Retirer {currentRow > 0 ? `€${(betAmount * settings.multipliers[currentRow - 1]).toFixed(2)}` : ''}
             </button>
          )}
        </div>

        {/* Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative p-4 flex flex-col items-center justify-center overflow-auto">
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
           
           <div className="flex flex-col gap-2 w-full max-w-md my-4">
              {Array.from({ length: ROWS }).map((_, uiRowIndex) => {
                 const logicalRow = ROWS - 1 - uiRowIndex;
                 const isActive = isPlaying && currentRow === logicalRow;
                 const rowMulti = settings.multipliers[logicalRow];

                 return (
                    <div key={logicalRow} className="flex gap-2 w-full h-12 relative">
                        {/* Multiplier Label outside */}
                        <div className={cn(
                           "absolute -left-16 top-0 bottom-0 flex items-center justify-end pr-2 font-bold tabular-nums text-sm transition-colors",
                           logicalRow < currentRow ? "text-[#00e676]" : isActive ? "text-white" : "text-text-secondary"
                        )}>
                           {rowMulti.toFixed(2)}×
                        </div>

                        {Array.from({ length: COLS }).map((_, colIndex) => {
                           const state = grid[logicalRow][colIndex];
                           return (
                              <div
                                 key={colIndex}
                                 onClick={() => handleCellClick(uiRowIndex, colIndex)}
                                 className={cn(
                                    "flex-1 rounded-md shadow-inner flex items-center justify-center transition-all duration-300",
                                    state === 'hidden' && isActive ? "bg-[#213743] hover:bg-[#2c4755] cursor-pointer shadow-[0_4px_0_#15242d] active:shadow-[0_0px_0_#15242d] active:translate-y-1" : 
                                    state === 'hidden' ? "bg-[#15242d] cursor-default opacity-50 shadow-[0_4px_0_#0f172a]" :
                                    "cursor-default",
                                    state === 'egg' && "bg-[#ffb300] shadow-[0_0_15px_rgba(255,179,0,0.5)]",
                                    state === 'dragon' && "bg-[#ed4163]"
                                 )}
                              >
                                 <AnimatePresence>
                                     {state === 'egg' && (
                                        <motion.div 
                                          initial={{ scale: 0, rotate: -45 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          className="w-4 h-6 bg-yellow-100 rounded-[50%] shadow-sm" 
                                        />
                                     )}
                                     {state === 'dragon' && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, -10, 0] }}
                                        >
                                           <Flame className="text-[#0f1116]" size={24} />
                                        </motion.div>
                                     )}
                                 </AnimatePresence>
                              </div>
                           )
                        })}
                    </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
}
