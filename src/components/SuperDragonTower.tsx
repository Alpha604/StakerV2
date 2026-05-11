import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins, Flame, Skull, ChevronDown, Zap } from "lucide-react";
import { WinPopup } from "./WinPopup";

const calculateMultipliers = (cols: number, dragonsCount: number, rows: number) => {
  const safe = cols - dragonsCount;
  if (safe <= 0) return Array(rows).fill(1);
  const p = safe / cols;
  return Array.from({ length: rows }, (_, r) => {
    return parseFloat(((1 / Math.pow(p, r + 1)) * 0.99).toFixed(2));
  });
};

export function SuperDragonTower() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [cols, setCols] = useState(5);
  const [dragonsCount, setDragonsCount] = useState(2);
  const [rows, setRows] = useState(10);
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  const [isPlaying, setIsPlaying] = useState(false);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  // Dynamic multipliers based on current settings
  const multipliers = calculateMultipliers(cols, dragonsCount, rows);

  // Grid state: 'hidden' | 'egg' | 'dragon'
  const [grid, setGrid] = useState<string[][]>(
    Array(rows).fill(Array(cols).fill("hidden")),
  );
  // Actual locations of dragons: array of indices for each row
  const [dragons, setDragons] = useState<number[][]>([]);
  const [currentRow, setCurrentRow] = useState(0); // 0 is bottom

  // Auto bet state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Update grid dimensions when settings change
  useEffect(() => {
    if (!isPlaying) {
      const maxDragons = Math.max(1, cols - 1);
      if (dragonsCount > maxDragons) {
        setDragonsCount(maxDragons);
      }
      setGrid(Array.from({ length: rows }, () => Array(cols).fill("hidden")));
      setCurrentRow(0);
    }
  }, [cols, rows, dragonsCount, isPlaying]);

  const startGame = async () => {
    if (!user || balance < betAmount) {
      alert("Connectez-vous et créditez votre compte pour jouer.");
      return;
    }
    const success = await subtractBalance(betAmount);
    if (!success) return;
    setIsPlaying(true);
    setWinInfo(null);

    // Generate dragon positions for each row
    const newDragons = Array.from({ length: rows }, () => {
      const rowDragons = new Set<number>();
      while (rowDragons.size < dragonsCount) {
        rowDragons.add(Math.floor(Math.random() * cols));
      }
      return Array.from(rowDragons);
    });
    setDragons(newDragons);
    setGrid(Array.from({ length: rows }, () => Array(cols).fill("hidden")));
    setCurrentRow(0);
  };

  const handleCellClick = (ri: number, ci: number) => {
    if (!isPlaying) return;
    const logicalRow = rows - 1 - ri;

    if (logicalRow !== currentRow) return;
    
    // Prevent double clicks by checking if any cell in the row is already revealed
    if (grid[logicalRow].some(cell => cell !== "hidden")) return;

    const isDragon = dragons[logicalRow].includes(ci);

    // Update grid
    const newGrid = grid.map((r) => [...r]);
    newGrid[logicalRow][ci] = isDragon ? "dragon" : "egg";

    // If they hit dragon
    if (isDragon) {
      newGrid[logicalRow].forEach((_, i) => {
        if (i !== ci)
          newGrid[logicalRow][i] = dragons[logicalRow].includes(i) ? "dragon" : "egg";
      });
      setGrid(newGrid);
      setIsPlaying(false);
      recordBet("SuperDragonTower", betAmount, 0, -betAmount);
      return;
    }

    setGrid(newGrid);

    if (currentRow === rows - 1) {
      // Won the whole tower
      setIsPlaying(false);
      const mult = multipliers[rows - 1];
      const payout = betAmount * mult;
      addBalance(payout);
      recordBet("SuperDragonTower", betAmount, mult, payout - betAmount);
      setWinInfo({ multiplier: mult, payout });

      // Reveal rest
      const fullGrid = newGrid.map((r, i) => {
        const rev = [...r];
        dragons[i].forEach((dIdx) => (rev[dIdx] = "dragon"));
        return rev;
      });
      setGrid(fullGrid);
    } else {
      setCurrentRow((prev) => prev + 1);
    }
  };

  const handleCashout = () => {
    if (!isPlaying || currentRow === 0) return;
    setIsPlaying(false);
    const mult = multipliers[currentRow - 1];
    const payout = betAmount * mult;
    addBalance(payout);
    recordBet("SuperDragonTower", betAmount, mult, payout - betAmount);
    setWinInfo({ multiplier: mult, payout });

    // Reveal rest of dragons
    const newGrid = grid.map((r, i) => {
      const rev = [...r];
      dragons[i].forEach((dIdx) => (rev[dIdx] = "dragon"));
      return rev;
    });
    setGrid(newGrid);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)] flex-col gap-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-[#080a10] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,50,50,0.15)] min-h-[700px] border border-red-900/30">
        
        {/* Settings Panel */}
        <div className="w-full lg:w-[320px] shrink-0 bg-gradient-to-b from-[#110505] to-[#1c0808] border-r border-[#3a0b0b] p-4 flex flex-col gap-4 z-10 relative order-2 lg:order-1">
          <div className="bg-[#050202] rounded-full p-1 flex border border-[#3a0b0b]">
            <button 
              onClick={() => !isPlaying && setMode("manual")}
              className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-white bg-gradient-to-r from-red-800 to-red-600 shadow-sm" : "text-red-900/60 hover:text-white")}
            >
              Manuel
            </button>
            <button 
              onClick={() => !isPlaying && setMode("auto")}
              className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-gradient-to-r from-red-800 to-red-600 shadow-sm" : "text-red-900/60 hover:text-white")}
            >
              Auto
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold">Montant de la mise</label>
              <span className="text-red-500 text-[13px] flex items-center gap-1 font-semibold">
                $ {formatCurrency(balance)}
              </span>
            </div>
            <div className="relative flex items-center bg-[#050202] rounded hover:border-red-600 focus-within:border-red-500 transition-colors border border-[#3a0b0b] h-[40px] overflow-hidden">
              <span className="pl-3 absolute flex items-center justify-center text-red-500">
                {renderCryptoIcon(activeCrypto, "w-4 h-4")}
              </span>
              <input
                type="number"
                value={betAmount || ""}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isPlaying}
                className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"
                step="0.01"
                min="0"
                max={balance}
              />
              <div className="flex h-full border-l border-[#3a0b0b] divide-x divide-[#3a0b0b]">
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-red-900/30 text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >½</button>
                <button
                  onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                  disabled={isPlaying}
                  className="px-3 hover:bg-red-900/30 text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                >2×</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">Colones</label>
              <div className="flex bg-[#050202] rounded border border-[#3a0b0b] relative">
                <select
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  {[2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white z-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">Dragons</label>
              <div className="flex bg-[#050202] rounded border border-[#3a0b0b] relative">
                <select
                  value={dragonsCount}
                  onChange={(e) => setDragonsCount(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  {Array.from({length: cols - 1}, (_, i) => i + 1).map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white z-0" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#8b9ba5] text-[13px] font-bold px-1">Lignes</label>
            <div className="flex bg-[#050202] rounded border border-[#3a0b0b] relative">
              <select
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                disabled={isPlaying}
                className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
              >
                {[5,6,7,8,9,10,12,15,20].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white z-0" />
            </div>
          </div>

          <div className="flex-1"></div>

          {!isPlaying ? (
            <button
              onClick={startGame}
              disabled={balance < betAmount || betAmount <= 0}
              className={cn(
                "w-full py-4 rounded font-black text-sm uppercase tracking-wider transition-all bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]",
                (balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed shadow-none"
              )}
            >
              Miser
            </button>
          ) : (
            <button
              onClick={handleCashout}
              disabled={currentRow === 0}
              className={cn(
                "w-full py-4 rounded font-black text-sm uppercase tracking-wider transition-all bg-gradient-to-r from-[#00e676] to-[#00b25c] hover:brightness-110 text-white shadow-[0_0_20px_rgba(0,230,118,0.4)]",
                currentRow === 0 && "opacity-50 cursor-not-allowed shadow-none"
              )}
            >
              Retirer {currentRow > 0 ? `€${(betAmount * multipliers[currentRow - 1]).toFixed(2)}` : ""}
            </button>
          )}
        </div>

        {/* Game Canvas */}
        <div className="flex-1 bg-gradient-to-b from-[#080a10] to-[#12080a] relative overflow-hidden order-1 lg:order-2 p-4 lg:p-8 flex flex-col items-center justify-center min-h-[600px] overflow-y-auto">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          {/* Background FX */}
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "url('https://cdn.phototourl.com/free/2026-05-09-3653812e-e002-4f06-af39-f370dfef6e0b.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#080a10] to-transparent pointer-events-none z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,50,50,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0 mix-blend-screen" />

          <div className="flex flex-col-reverse gap-[6px] lg:gap-2 w-full max-w-2xl my-auto z-10 relative px-12 md:px-16" style={{ height: 'fit-content' }}>
            {Array.from({ length: rows }).map((_, logicalRow) => {
              const isActive = isPlaying && currentRow === logicalRow;
              const rowMulti = multipliers[logicalRow];

              return (
                <div key={logicalRow} className="flex gap-[6px] lg:gap-2 w-full relative" style={{ height: Math.max(30, 500 / rows) + 'px' }}>
                  {/* Multiplier Label outside */}
                  <div className={cn(
                    "absolute -left-12 md:-left-16 top-0 bottom-0 flex items-center justify-end font-black tabular-nums transition-colors",
                    rows > 10 ? "text-[10px] md:text-[12px]" : "text-xs md:text-sm",
                    logicalRow < currentRow ? "text-[#00e676] drop-shadow-[0_0_5px_rgba(0,230,118,0.6)]" : isActive ? "text-white scale-110 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" : "text-[#4a1c1c]"
                  )}>
                    {formatCurrency(rowMulti)}×
                  </div>

                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const uiRowIndex = rows - 1 - logicalRow;
                    const gridRow = grid[logicalRow] || [];
                    const state = gridRow[colIndex] || "hidden";

                    return (
                      <div
                        key={colIndex}
                        onClick={() => handleCellClick(uiRowIndex, colIndex)}
                        className={cn(
                          "flex-1 rounded shadow-inner flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                          state === "hidden" && isActive
                            ? "bg-[#1f0a0a] hover:bg-[#3d1313] border border-red-500/30 cursor-pointer shadow-[0_4px_0_#0f0505] active:shadow-[0_0px_0_#0f0505] active:translate-y-1"
                            : state === "hidden"
                              ? "bg-[#110505] cursor-default opacity-60 border border-transparent shadow-[0_2px_0_#0a0303]"
                              : "cursor-default border-transparent",
                          state === "egg" && "bg-gradient-to-b from-amber-400 to-yellow-600 shadow-[0_0_15px_rgba(255,179,0,0.4)]",
                          state === "dragon" && "bg-gradient-to-b from-red-600 to-red-900",
                        )}
                      >
                        {state === "hidden" && isActive && (
                           <div className="absolute inset-0 bg-white/5 animate-pulse" />
                        )}
                        <AnimatePresence>
                          {state === "egg" && (
                            <motion.div key="egg"
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="text-white flex items-center justify-center w-full h-full drop-shadow-md"
                            >
                              <div className="w-1/2 h-2/3 bg-gradient-to-b from-yellow-100 to-amber-200 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[inset_-2px_-5px_10px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
                                 <div className="w-full h-full opacity-30" style={{ background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.8) 55%, transparent 60%)' }} />
                              </div>
                            </motion.div>
                          )}
                          {state === "dragon" && (
                            <motion.div key="dragon"
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, -10, 0] }}
                              className="w-full h-full flex items-center justify-center relative"
                            >
                              <div className="absolute inset-0 bg-black/20" />
                              <Skull className="text-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10" style={{ width: rows > 10 ? '50%' : '60%', height: rows > 10 ? '50%' : '60%' }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
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
