import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins, Flame, ChevronRight } from "lucide-react";
import { WinPopup } from "./WinPopup";

type Difficulty = "easy" | "medium" | "hard" | "expert";

const DIFF_SETTINGS: Record<
  Difficulty,
  { cols: number; dragonsCount: number; multipliers: number[] }
> = {
  easy: {
    cols: 4,
    dragonsCount: 1,
    multipliers: [1.31, 1.74, 2.32, 3.1, 4.13, 5.51, 7.34, 9.79, 13.06],
  },
  medium: {
    cols: 3,
    dragonsCount: 1,
    multipliers: [1.47, 2.21, 3.32, 4.98, 7.47, 11.2, 16.81, 25.21, 37.82],
  },
  hard: {
    cols: 2,
    dragonsCount: 1,
    multipliers: [
      1.96, 3.92, 7.84, 15.68, 31.36, 62.72, 125.44, 250.88, 501.76,
    ],
  },
  expert: {
    cols: 3,
    dragonsCount: 2,
    multipliers: [
      2.94, 8.82, 26.46, 79.38, 238.14, 714.42, 2143.26, 6429.78, 19289.34,
    ],
  },
};

const ROWS = 9;

export function DragonTower() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isPlaying, setIsPlaying] = useState(false);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const settings = DIFF_SETTINGS[difficulty];
  const COLS = settings.cols;

  // Grid state: 'hidden' | 'egg' | 'dragon'
  const [grid, setGrid] = useState<string[][]>(
    Array(ROWS).fill(Array(settings.cols).fill("hidden")),
  );
  // Actual locations of dragons: array of indices for each row
  const [dragons, setDragons] = useState<number[][]>([]);
  const [currentRow, setCurrentRow] = useState(0); // 0 is bottom, 8 is top

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
    const newDragons = Array.from({ length: ROWS }, () => {
      const rowDragons = new Set<number>();
      while (rowDragons.size < settings.dragonsCount) {
        rowDragons.add(Math.floor(Math.random() * COLS));
      }
      return Array.from(rowDragons);
    });
    setDragons(newDragons);

    setGrid(Array(ROWS).fill(Array(COLS).fill("hidden")));
    setCurrentRow(0);
  };

  const handleCellClick = (ri: number, ci: number) => {
    if (!isPlaying) return;
    const logicalRow = ROWS - 1 - ri;

    if (logicalRow !== currentRow) return;

    const isDragon = dragons[logicalRow].includes(ci);

    // Update grid
    const newGrid = grid.map((row) => [...row]);
    newGrid[logicalRow][ci] = isDragon ? "dragon" : "egg";

    // If they missed (hit dragon), reveal other
    if (isDragon) {
      newGrid[logicalRow].forEach((_, i) => {
        if (i !== ci)
          newGrid[logicalRow][i] = dragons[logicalRow].includes(i)
            ? "dragon"
            : "egg";
      });
      setGrid(newGrid);
      setIsPlaying(false);
      recordBet("DragonTower", betAmount, 0, -betAmount);
      return;
    }

    setGrid(newGrid);

    if (currentRow === ROWS - 1) {
      // Won the whole tower
      setIsPlaying(false);
      const mult = settings.multipliers[ROWS - 1];
      const payout = betAmount * mult;
      addBalance(payout);
      recordBet("DragonTower", betAmount, mult, payout - betAmount);
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
    const mult = settings.multipliers[currentRow - 1];
    const payout = betAmount * mult;
    addBalance(payout);
    recordBet("DragonTower", betAmount, mult, payout - betAmount);
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
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)] flex-col gap-8">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Side */}
        <div className="lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
            <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors">Auto</button>
          </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">
                  Montant de la mise
                </label>
                <span className="text-[#8b9ba5] text-[13px] flex items-center gap-1 font-semibold">
                  $ {formatCurrency(balance )}
                </span>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden">
                <span className="pl-3 absolute flex items-center justify-center">
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
                <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                    disabled={isPlaying}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                    disabled={isPlaying}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">
                Difficulté
              </label>
              <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as Difficulty);
                    // Clear grid
                    setGrid(
                      Array(ROWS).fill(
                        Array(
                          DIFF_SETTINGS[e.target.value as Difficulty].cols,
                        ).fill("hidden"),
                      ),
                    );
                  }}
                  disabled={isPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  <option value="easy" className="text-black">Facile (4 cases, 1 Dragon)</option>
                  <option value="medium" className="text-black">Moyen (3 cases, 1 Dragon)</option>
                  <option value="hard" className="text-black">Difficile (2 cases, 1 Dragon)</option>
                  <option value="expert" className="text-black">Expert (3 cases, 2 Dragons)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
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
                "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black text-[#0f1116] shadow-[0_4px_0_#00a84b]",
                "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
                balance < betAmount &&
                  "opacity-50 cursor-not-allowed active:translate-y-0",
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
                currentRow === 0 &&
                  "opacity-50 cursor-not-allowed active:translate-y-0",
              )}
            >
              Retirer{" "}
              {currentRow > 0
                ? `€${(betAmount * settings.multipliers[currentRow - 1]).toFixed(2)}`
                : ""}
            </button>
          )}
        </div>

        {/* Game Canvas */}
        <div className="flex-1 bg-[#0f172a] rounded-b-2xl lg:rounded-r-2xl border border-l-0 border-[#233845] relative overflow-hidden order-1 lg:order-2 p-4 flex flex-col items-center justify-center min-h-[500px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          {/* Crypto Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             {renderCryptoIcon(activeCrypto, "w-64 h-64")}
          </div>

          <div className="flex flex-col gap-2 w-full max-w-md my-4 z-10 relative">
            {Array.from({ length: ROWS }).map((_, uiRowIndex) => {
              const logicalRow = ROWS - 1 - uiRowIndex;
              const isActive = isPlaying && currentRow === logicalRow;
              const rowMulti = settings.multipliers[logicalRow];

              return (
                <div
                  key={logicalRow}
                  className="flex gap-2 w-full h-12 relative"
                >
                  {/* Multiplier Label outside */}
                  <div
                    className={cn(
                      "absolute -left-16 top-0 bottom-0 flex items-center justify-end pr-2 font-bold tabular-nums text-sm transition-colors",
                      logicalRow < currentRow
                        ? "text-[#00e676]"
                        : isActive
                          ? "text-white"
                          : "text-[#8b9ba5]",
                    )}
                  >
                    {formatCurrency(rowMulti)}×
                  </div>

                  {Array.from({ length: COLS }).map((_, colIndex) => {
                    const state = grid[logicalRow][colIndex];
                    return (
                      <div
                        key={colIndex}
                        onClick={() => handleCellClick(uiRowIndex, colIndex)}
                        className={cn(
                          "flex-1 rounded-md shadow-inner flex items-center justify-center transition-all duration-300",
                          state === "hidden" && isActive
                            ? "bg-[#213743] hover:bg-[#2c4755] cursor-pointer shadow-[0_4px_0_#15242d] active:shadow-[0_0px_0_#15242d] active:translate-y-1"
                            : state === "hidden"
                              ? "bg-[#15242d] cursor-default opacity-50 shadow-[0_4px_0_#0f172a]"
                              : "cursor-default",
                          state === "egg" &&
                            "bg-[#ffb300] shadow-[0_0_15px_rgba(255,179,0,0.5)]",
                          state === "dragon" && "bg-[#ed4163]",
                        )}
                      >
                        <AnimatePresence>
                          {state === "egg" && (
                            <motion.div key="egg"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="text-white flex items-center justify-center w-full h-full"
                            >
                              <svg viewBox="0 0 100 120" className="w-6 h-8 drop-shadow-[0_0_8px_rgba(255,100,0,0.8)]">
                                <defs>
                                  <radialGradient id="eggGrad" cx="30%" cy="30%" r="70%">
                                    <stop offset="0%" stopColor="#4a5568" />
                                    <stop offset="100%" stopColor="#1a202c" />
                                  </radialGradient>
                                  <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                  </filter>
                                </defs>
                                <ellipse cx="50" cy="60" rx="40" ry="55" fill="url(#eggGrad)" />
                                {/* Glowing Cracks */}
                                <g filter="url(#glow)">
                                  <path d="M 40 10 Q 50 30 30 50 T 50 80 Q 60 100 40 110" fill="transparent" stroke="#ff6b00" strokeWidth="3" strokeLinecap="round" />
                                  <path d="M 60 20 Q 70 40 50 60 T 70 90" fill="transparent" stroke="#ff4500" strokeWidth="2.5" strokeLinecap="round" />
                                  <path d="M 50 40 Q 60 50 45 70" fill="transparent" stroke="#ffae00" strokeWidth="2" strokeLinecap="round" />
                                </g>
                              </svg>
                            </motion.div>
                          )}
                          {state === "dragon" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, -10, 10, -10, 0],
                              }}
                            >
                              <Flame className="text-[#0f1116]" size={24} />
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
