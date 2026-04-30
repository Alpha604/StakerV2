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
        <div className="w-full md:w-[320px] bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">
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
                  $ {(Math.floor(balance * 100) / 100).toFixed(2)}
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
                Mines
              </label>
              <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
                <select
                  value={minesCount}
                  onChange={(e) => setMinesCount(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 24].map((n) => (
                    <option key={n} value={n} className="text-black">
                      {n}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex-1"></div>

            {isPlaying ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={pickRandom}
                  className="w-full py-3 rounded text-white bg-[#2f4553] hover:bg-[#3d5a6a] font-bold text-[13px] transition-colors"
                >
                  Sélection aléatoire
                </button>
                <button
                  onClick={cashout}
                  disabled={revealedCount === 0}
                  className={cn(
                    "w-full py-3.5 rounded font-bold transition-all text-sm flex justify-center items-center gap-2",
                    revealedCount === 0 
                      ? "bg-[#1bc86a]/40 text-black/50 cursor-not-allowed" 
                      : "bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black"
                  )}
                >
                  <span>Retrait</span>
                  {revealedCount > 0 && (
                    <span className="flex items-center gap-1">
                      {(Math.floor(potentialWin * 100) / 100).toFixed(2)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={startGame}
                disabled={isPlaying || betAmount > balance || betAmount <= 0}
                className={cn(
                  "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                  (isPlaying || betAmount > balance || betAmount <= 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                Pari
              </button>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 bg-[#0f212e] md:rounded-r-2xl md:rounded-bl-none rounded-b-2xl flex flex-col items-center justify-center order-1 md:order-2 border border-l-0 border-[#233845] p-4 md:p-16 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          {/* Top Info Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center w-full max-w-lg px-4 gap-3 justify-center z-10 transition-all">
            <div className="flex flex-col bg-[#162734] rounded-lg px-4 py-2 border border-[#233845] shadow text-center justify-center min-w-[120px]">
               <span className="text-text-secondary text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Mines</span>
               <span className="text-white text-sm font-bold leading-none">{minesCount}</span>
            </div>
            
            {isPlaying && (
              <div className="flex flex-col bg-[#233845] rounded-lg px-4 py-2 border border-[#334b5c] shadow-[0_0_15px_rgba(0,231,1,0.1)] text-center justify-center relative overflow-hidden min-w-[120px]">
                 <motion.div
                   key={nextMultiplier}
                   initial={{ y: 15, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="flex flex-col"
                 >
                   <span className="text-[10px] uppercase font-extrabold text-white tracking-widest leading-none mb-1">Prochain</span>
                   <span className="text-[#00e701] text-sm font-black drop-shadow-[0_0_5px_rgba(0,231,1,0.3)] leading-none">{nextMultiplier.toFixed(2)}×</span>
                 </motion.div>
              </div>
            )}

            <div className="flex flex-col bg-[#162734] rounded-lg px-4 py-2 border border-[#233845] shadow text-center justify-center min-w-[120px]">
               <span className="text-text-secondary text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Gemmes</span>
               <span className="text-white text-sm font-bold leading-none">{(25 - minesCount) - revealedCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[450px] aspect-square mt-[80px] md:mt-10" style={{ perspective: '1000px' }}>
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
                          key="gem"
                          initial={cell === "picked_gem" ? { scale: 0 } : { opacity: 0 }}
                          animate={cell === "picked_gem" ? { scale: 1 } : { opacity: 0.4 }}
                          transition={cell === "picked_gem" ? { type: "spring", stiffness: 400, damping: 15, delay: 0.1 } : { duration: 0.3 }}
                          className="w-full h-full flex items-center justify-center relative"
                        >
                          {cell === "picked_gem" && (
                            <motion.div
                              key="gem-effect"
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
                          key="bomb"
                          initial={cell === "picked_bomb" ? { scale: 0 } : { opacity: 0 }}
                          animate={cell === "picked_bomb" ? { scale: [1, 1.2, 1] } : { opacity: 0.5 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          className="w-full h-full flex items-center justify-center relative"
                        >
                          {cell === "picked_bomb" && (
                            <motion.div
                              key="bomb-effect"
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

