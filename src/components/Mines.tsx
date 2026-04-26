import React, { useState, useEffect } from "react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { Bomb } from "lucide-react";
import { cn } from "../lib/utils";
import { WinPopup } from "./WinPopup";
import { motion, AnimatePresence } from "motion/react";

type CellState = "hidden" | "picked_gem" | "picked_bomb" | "revealed_gem" | "revealed_bomb";

const playSound = (type: "gem" | "bomb" | "cashout", pitchShift: number = 0) => {
  try {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "gem") {
      const baseFreq = 440 + (pitchShift * 30); // Pitch goes up with each gem
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * 2,
        audioCtx.currentTime + 0.1,
      );
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.02); 
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === "bomb") {
      osc.type = "square";
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        20,
        audioCtx.currentTime + 0.3,
      );
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === "cashout") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); // E5
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
    }
  } catch (e) {
    console.warn("Audio play restricted", e);
  }
};

export function Mines() {
  const { user, balance, activeCrypto, addBalance, subtractBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [grid, setGrid] = useState<CellState[]>(Array(25).fill("hidden"));
  const [mineLocations, setMineLocations] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const calculateMultiplier = (mines: number, revealed: number) => {
    if (revealed === 0) return 1.0;

    let prob = 1;
    for (let i = 0; i < revealed; i++) {
        prob *= (25 - mines - i) / (25 - i);
    }
    // House edge of ~1%
    const expectedMult = (1 / prob) * 0.99;
    return Number(expectedMult.toFixed(2));
  };

  const currentMultiplier = calculateMultiplier(minesCount, revealedCount);
  const potentialWin = betAmount * currentMultiplier;
  const nextMultiplier = calculateMultiplier(minesCount, revealedCount + 1);

  const startGame = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour jouer!");
      return;
    }
    if (betAmount <= 0) return;

    const success = await subtractBalance(betAmount);
    if (success) {
      setIsPlaying(true);
      setCrashed(false);
      setWinInfo(null);
      setGrid(Array(25).fill("hidden"));
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

    playSound("cashout");
    setIsPlaying(false);
    await addBalance(potentialWin);
    await recordBet(
      "Mines",
      betAmount,
      currentMultiplier,
      potentialWin - betAmount,
    );

    setWinInfo({ multiplier: currentMultiplier, payout: potentialWin });
    revealAll();
  };

  const revealAll = () => {
    setGrid(prev => prev.map((cell, i) => {
      if (cell !== "hidden") return cell;
      return mineLocations.has(i) ? "revealed_bomb" : "revealed_gem";
    }));
  };

  const pickRandom = () => {
    if (!isPlaying || crashed) return;
    const hiddenIndexes = grid
      .map((cell, i) => (cell === "hidden" ? i : -1))
      .filter((i) => i !== -1);
    if (hiddenIndexes.length > 0) {
      const randomIndex =
        hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];
      handleCellClick(randomIndex);
    }
  };

  const handleCellClick = async (index: number) => {
    if (!isPlaying || crashed || grid[index] !== "hidden") return;

    const newGrid = [...grid];

    if (mineLocations.has(index)) {
      playSound("bomb");
      newGrid[index] = "picked_bomb";
      setGrid(newGrid);
      setCrashed(true);
      setIsPlaying(false);
      
      setTimeout(() => {
        setGrid(prev => prev.map((c, i) => {
          if (c !== "hidden" && c !== "picked_bomb") return c;
          if (i === index) return "picked_bomb";
          return mineLocations.has(i) ? "revealed_bomb" : "revealed_gem";
        }));
      }, 500);

      await recordBet("Mines", betAmount, 0, -betAmount);
    } else {
      playSound("gem", revealedCount);
      newGrid[index] = "picked_gem";
      setGrid(newGrid);
      const newRevealed = revealedCount + 1;
      setRevealedCount(newRevealed);

      if (newRevealed === 25 - minesCount) {
        // Force cashout
        playSound("cashout");
        setIsPlaying(false);
        const finalMult = calculateMultiplier(minesCount, newRevealed);
        const finalWin = betAmount * finalMult;
        await addBalance(finalWin);
        await recordBet("Mines", betAmount, finalMult, finalWin - betAmount);
        setWinInfo({ multiplier: finalMult, payout: finalWin });
        setTimeout(() => revealAll(), 500);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 max-w-[1200px] mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
        <div className="w-full md:w-80 bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 overflow-hidden z-10 shadow-2xl">
          <div className="p-4 flex flex-col gap-5 bg-bg-panel pt-6">
            <div className="flex flex-col gap-1.5 relative z-10">
              <div className="flex justify-between items-center opacity-80">
                <label className="text-text-secondary text-xs uppercase tracking-wider font-semibold">
                  Montant du Pari
                </label>
                <span className="text-white text-xs flex items-center gap-1">
                  {balance.toFixed(8)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                </span>
              </div>
              <div className="flex items-center bg-[#0f172a] border border-border-medium rounded hover:border-text-secondary focus-within:border-accent transition-colors shadow-inner h-11">
                <span className="pl-3 absolute flex items-center justify-center">
                  {renderCryptoIcon(activeCrypto, "w-5 h-5")}
                </span>
                <input
                  type="number"
                  value={betAmount || ""}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full bg-transparent p-2 pl-10 text-white font-medium outline-none focus:ring-1 focus:ring-transparent disabled:opacity-50 text-sm"
                  step="0.00000001"
                  min="0.00000001"
                  max={balance}
                />
                <div className="flex h-full border-l border-border-medium divide-x divide-border-medium">
                  <button
                    onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(8))}
                    disabled={isPlaying}
                    className="px-3 hover:bg-border-subtle text-xs font-semibold disabled:opacity-50 transition-colors text-slate-300"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(8))}
                    disabled={isPlaying}
                    className="px-3 hover:bg-border-subtle text-xs font-semibold disabled:opacity-50 transition-colors text-slate-300 rounded-r"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative z-10">
              <label className="text-text-secondary text-xs uppercase tracking-wider font-semibold opacity-80">
                Mines
              </label>
              <div className="relative">
                <select
                  value={minesCount}
                  onChange={(e) => setMinesCount(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full h-11 bg-[#0f172a] border border-border-medium px-3 text-white font-medium outline-none hover:border-text-secondary focus:border-accent rounded disabled:opacity-50 appearance-none shadow-inner text-sm transition-colors cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 24].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                  ▼
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 relative z-10 w-full mt-2">
              {isPlaying ? (
                <>
                  <button
                    onClick={pickRandom}
                    className="w-full py-3 rounded text-text-secondary bg-[#2f4553] hover:bg-[#3d5565] border-none font-bold text-sm mb-2 transition-colors cursor-pointer"
                  >
                    Séléction Aléatoire
                  </button>
                  <button
                    onClick={cashout}
                    disabled={revealedCount === 0}
                    className="w-full py-3.5 rounded text-[#000] bg-[#00E701] hover:bg-[#1FFF20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-between px-4"
                  >
                    <span className="font-bold text-sm drop-shadow-sm">Retrait</span>
                    {revealedCount > 0 && (
                      <span className="font-bold text-sm flex items-center gap-1 drop-shadow-sm">
                        {potentialWin.toFixed(8)} {renderCryptoIcon(activeCrypto, "w-4 h-4")}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={startGame}
                  disabled={isPlaying || betAmount > balance || betAmount <= 0}
                  className="w-full py-3.5 rounded text-[#000] font-bold bg-[#00E701] hover:bg-[#1FFF20] disabled:bg-[#2f4553] disabled:text-text-secondary transition-colors shadow-lg text-sm drop-shadow-sm"
                >
                  Parier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 bg-bg-inner rounded-b-xl md:rounded-r-xl md:rounded-bl-none flex flex-col items-center justify-center order-1 md:order-2 border border-border-subtle p-4 md:p-16 relative overflow-hidden">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          {/* Top Info Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center justify-between w-full max-w-lg px-6 gap-2">
            <div className="flex flex-col bg-bg-panel/80 rounded-lg px-4 py-1.5 flex-1 border border-border-subtle shadow text-center justify-center">
               <span className="text-text-secondary text-[10px] uppercase font-bold">Mines</span>
               <span className="text-white text-sm font-bold">{minesCount}</span>
            </div>
            
            {isPlaying && (
              <div className="flex flex-col bg-[#2f4553] rounded-lg px-4 py-1.5 flex-1 border border-border-subtle shadow text-center justify-center relative overflow-hidden">
                 <motion.div
                   key={nextMultiplier}
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="flex flex-col"
                 >
                   <span className="text-text-secondary text-[10px] uppercase font-bold text-white">Prochain</span>
                   <span className="text-[#00E701] text-sm font-bold">{nextMultiplier.toFixed(2)}×</span>
                 </motion.div>
              </div>
            )}

            <div className="flex flex-col bg-bg-panel/80 rounded-lg px-4 py-1.5 flex-1 border border-border-subtle shadow text-center justify-center">
               <span className="text-text-secondary text-[10px] uppercase font-bold">Gemmes restantes</span>
               <span className="text-white text-sm font-bold">{(25 - minesCount) - revealedCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[450px] aspect-square mt-[60px] md:mt-10" style={{ perspective: '1000px' }}>
            {grid.map((cell, i) => {
              return (
                <motion.button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  disabled={!isPlaying || crashed || cell !== "hidden"}
                  animate={{
                     rotateY: cell !== "hidden" ? 180 : 0,
                  }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                  className={cn(
                    "w-full h-full rounded-lg flex items-center justify-center relative transform-style-3d",
                    (cell === "hidden" && isPlaying)
                      ? "bg-[#2f4553] hover:-translate-y-1 hover:bg-[#3d5565] cursor-pointer shadow-[0_4px_0_#213743] hover:shadow-[0_6px_0_#213743] active:shadow-[0_0px_0_#213743] active:translate-y-1"
                      : "bg-transparent shadow-none",
                    (!isPlaying && cell === "hidden") && "opacity-80 cursor-default bg-[#213743] shadow-[0_4px_0_#15242d]",
                  )}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 backface-hidden flex items-center justify-center">
                    {/* Front of card (hidden state) */}
                  </div>

                  <div className="absolute inset-0 backface-hidden bg-[#0f172a] shadow-inner border border-white/5 rounded-lg flex items-center justify-center overflow-hidden" style={{ transform: "rotateY(180deg)" }}>
                    <AnimatePresence>
                      {(cell === "picked_gem" || cell === "revealed_gem") && (
                        <motion.div
                          initial={cell === "picked_gem" ? { scale: 0 } : { opacity: 0 }}
                          animate={cell === "picked_gem" ? { scale: 1 } : { opacity: 0.4 }}
                          transition={cell === "picked_gem" ? { type: "spring", stiffness: 400, damping: 15, delay: 0.1 } : { duration: 0.3 }}
                          className="w-full h-full flex items-center justify-center relative"
                        >
                          {cell === "picked_gem" && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 0.4, 0], scale: [1, 1.5, 2] }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="absolute inset-0 bg-[#00E701] rounded-full blur-[20px] pointer-events-none"
                            />
                          )}
                          <svg
                            viewBox="0 0 512 512"
                            className={cn(
                              "w-3/5 h-3/5 drop-shadow-md relative z-10",
                              cell === "revealed_gem" && "opacity-40 grayscale"
                            )}
                          >
                            <path d="M256 0L493.597 131.6L256 512L18.4026 131.6L256 0Z" fill="#00E701" />
                            <path d="M256 0V512L18.4026 131.6L256 0Z" fill="#00C001" />
                            <path d="M256 0L493.597 131.6L256 186.2V0Z" fill="#1FFF20" opacity="0.6" />
                            <path d="M256 0V186.2L18.4026 131.6L256 0Z" fill="#00FF01" opacity="0.4" />
                          </svg>
                        </motion.div>
                      )}
                      {(cell === "picked_bomb" || cell === "revealed_bomb") && (
                        <motion.div
                          initial={cell === "picked_bomb" ? { scale: 0 } : { opacity: 0 }}
                          animate={cell === "picked_bomb" ? { scale: [1, 1.2, 1] } : { opacity: 0.5 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="w-full h-full flex items-center justify-center relative"
                        >
                          {cell === "picked_bomb" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-red-500 rounded-full blur-[20px] pointer-events-none"
                            />
                          )}
                          <Bomb
                            size={40}
                            className={cn(
                              "drop-shadow-[0_0_10px_rgba(237,65,99,0.5)] relative z-10",
                              cell === "revealed_bomb" ? "text-text-secondary opacity-50" : "text-[#ed4163]"
                            )}
                            fill={cell === "revealed_bomb" ? "#94a3b8" : "#ed4163"}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

