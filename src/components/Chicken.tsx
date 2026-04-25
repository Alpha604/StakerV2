import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { cn } from "../lib/utils";
import { WinPopup } from "./WinPopup";
import { motion, AnimatePresence } from "motion/react";
import { Coins, Skull } from "lucide-react";

type CellState = "HIDDEN" | "CHICKEN" | "BONE";

export function Chicken() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [bonesCount, setBonesCount] = useState<number>(5);

  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill("HIDDEN"));
  const [bonesLocations, setBonesLocations] = useState<Set<number>>(new Set());
  const [chickensFound, setChickensFound] = useState(0);

  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const calculateMultiplier = (found: number, maxChickens: number) => {
    if (found === 0) return 1.0;
    // Rough estimation formula similar to mines
    let multi = 1;
    for (let i = 0; i < found; i++) {
      multi *= 25 / (25 - bonesCount - i);
    }
    return parseFloat((multi * 0.99).toFixed(2));
  };

  const nextMultiplier = calculateMultiplier(
    chickensFound + 1,
    25 - bonesCount,
  );
  const currentMultiplier = calculateMultiplier(chickensFound, 25 - bonesCount);

  const startGame = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;

    const success = await subtractBalance(betAmount);
    if (!success) return;

    setWinInfo(null);
    setGrid(Array(25).fill("HIDDEN"));
    setChickensFound(0);
    setIsPlaying(true);

    // Plant bones
    const locations = new Set<number>();
    while (locations.size < bonesCount) {
      locations.add(Math.floor(Math.random() * 25));
    }
    setBonesLocations(locations);
  };

  const handleCellClick = (index: number) => {
    if (!isPlaying || grid[index] !== "HIDDEN") return;

    const newGrid = [...grid];
    if (bonesLocations.has(index)) {
      // Boom
      newGrid[index] = "BONE";
      setGrid(newGrid);
      endGame(false);
      revealAll(newGrid);
    } else {
      // Chicken
      newGrid[index] = "CHICKEN";
      setGrid(newGrid);
      setChickensFound((prev) => prev + 1);
      const maxChickens = 25 - bonesCount;
      if (chickensFound + 1 === maxChickens) {
        endGame(true, chickensFound + 1);
      }
    }
  };

  const cashout = () => {
    if (!isPlaying || chickensFound === 0) return;
    endGame(true, chickensFound);
  };

  const endGame = (win: boolean, foundPieces = 0) => {
    setIsPlaying(false);
    const multi = win ? calculateMultiplier(foundPieces, 25 - bonesCount) : 0;
    const payout = betAmount * multi;

    if (win && payout > 0) {
      addBalance(payout);
      setWinInfo({ multiplier: multi, payout });
    }
    revealAll();
    recordBet("Chicken", betAmount, multi, payout - betAmount);
  };

  const revealAll = (currentGrid = grid) => {
    const revealed = currentGrid.map((cell, i) => {
      if (cell !== "HIDDEN") return cell;
      return bonesLocations.has(i) ? "BONE" : "CHICKEN";
    });
    setGrid(revealed);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
      {/* Controls */}
      <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 z-10 p-4 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-wider">
            <span>Pari</span>
            <span>€{betAmount.toFixed(2)}</span>
          </div>
          <div className="relative bg-bg-inner border border-border-medium rounded flex items-center hover:border-text-secondary transition-colors focus-within:border-accent">
            <span className="pl-3 text-emerald-500">
              <Coins size={16} />
            </span>
            <input
              type="number"
              value={betAmount || ""}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              disabled={isPlaying}
              className="w-full bg-transparent text-white font-mono p-3 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Bones (Os)
          </label>
          <select
            value={bonesCount}
            onChange={(e) => setBonesCount(Number(e.target.value))}
            disabled={isPlaying}
            className="w-full bg-bg-inner border border-border-medium rounded p-3 text-white font-bold outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {!isPlaying ? (
          <button
            onClick={startGame}
            disabled={!user || balance < betAmount}
            className="w-full py-4 mt-2 rounded text-[#0f172a] font-extrabold text-lg uppercase bg-[#00e676] hover:bg-[#00c853] transition-colors shadow"
          >
            Jouer
          </button>
        ) : (
          <button
            onClick={cashout}
            disabled={chickensFound === 0}
            className="w-full py-4 mt-2 flex flex-col items-center justify-center rounded text-white font-bold text-lg bg-[#1475e1] hover:bg-[#1b80f0] transition-colors shadow disabled:opacity-50"
          >
            <span className="leading-tight">Cashout</span>
            {chickensFound > 0 && (
              <span className="text-sm leading-tight opacity-80">
                €{(betAmount * currentMultiplier).toFixed(2)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 bg-[#0f172a] rounded-b-xl md:rounded-r-xl border border-border-subtle relative overflow-hidden order-1 md:order-2 p-4 flex flex-col items-center justify-center min-h-[500px]">
        {winInfo && (
          <WinPopup
            multiplier={winInfo.multiplier}
            payout={winInfo.payout}
            onClose={() => setWinInfo(null)}
          />
        )}

        <div className="grid grid-cols-5 gap-2 w-full max-w-[500px] aspect-square p-4 bg-bg-panel/50 rounded-xl border border-border-medium shadow-2xl">
          {grid.map((cell, i) => (
            <button
              key={i}
              disabled={!isPlaying || cell !== "HIDDEN"}
              onClick={() => handleCellClick(i)}
              className={cn(
                "w-full h-full rounded-md flex items-center justify-center transition-all relative overflow-hidden",
                cell === "HIDDEN"
                  ? "bg-[#213743] hover:bg-[#2c4755] cursor-pointer"
                  : "bg-[#111c22] pointer-events-none opacity-80 border border-border-medium/30",
                !isPlaying &&
                  cell === "HIDDEN" &&
                  "opacity-50 cursor-not-allowed", // Initial state before playing
              )}
            >
              {cell === "HIDDEN" && isPlaying && (
                <div className="absolute inset-x-0 bottom-0 border-b-4 border-[#1a2c38] pointer-events-none rounded-b-md"></div>
              )}

              {cell === "CHICKEN" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                >
                  🍗
                </motion.div>
              )}
              {cell === "BONE" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl text-red-500 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                >
                  <Skull size={40} />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <div className="absolute top-4 right-4 bg-bg-panel/80 backdrop-blur px-4 py-2 rounded-lg border border-border-medium shadow-lg font-mono font-bold text-white flex gap-4">
          <div className="flex flex-col items-center">
            <span className="text-xs text-text-secondary uppercase">
              Suivant
            </span>
            <span className="text-accent">{nextMultiplier}×</span>
          </div>
        </div>
      </div>
    </div>
  );
}
