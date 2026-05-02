import React, { useState } from "react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { cn } from "../lib/utils";
import { WinPopup } from "./WinPopup";
import { motion, AnimatePresence } from "motion/react";
import { useSound } from "../lib/useSound";

type Difficulty = "Classique" | "Faible" | "Moyen" | "Élevé";

const PAYOUTS: Record<Difficulty, Record<number, number[]>> = {
  Classique: {
    1: [0.0, 3.8],
    2: [0.0, 1.7, 5.2],
    3: [0.0, 0.0, 2.7, 48.0],
    4: [0.0, 0.0, 1.7, 10.0, 84.0],
    5: [0.0, 0.0, 1.4, 4.0, 14.0, 390.0],
    6: [0.0, 0.0, 0.0, 3.0, 9.0, 70.0, 700.0],
    7: [0.0, 0.0, 0.0, 2.0, 7.0, 30.0, 280.0, 800.0],
    8: [0.0, 0.0, 0.0, 0.0, 6.5, 20.0, 80.0, 300.0, 900.0],
    9: [0.0, 0.0, 0.0, 0.0, 4.5, 13.0, 60.0, 200.0, 500.0, 1000.0],
    10: [0.0, 0.0, 0.0, 1.4, 2.25, 4.5, 8.0, 17.0, 50.0, 80.0, 100.0],
  },
  Faible: {
    1: [0.0, 3.8],
    2: [0.0, 1.1, 6.1],
    3: [0.0, 1.1, 1.38, 39.0],
    4: [0.0, 1.1, 1.5, 3.8, 89.0],
    5: [0.0, 0.0, 1.5, 4.8, 15.0, 150.0],
    6: [0.0, 0.0, 1.1, 2.0, 5.5, 45.0, 160.0],
    7: [0.0, 0.0, 1.1, 1.6, 4.0, 14.0, 70.0, 200.0],
    8: [0.0, 0.0, 1.1, 1.2, 2.7, 7.5, 30.0, 100.0, 250.0],
    9: [0.0, 0.0, 1.1, 1.2, 2.0, 4.4, 16.0, 50.0, 130.0, 270.0],
    10: [0.0, 0.0, 1.1, 1.0, 1.5, 2.6, 6.1, 21.0, 65.0, 130.0, 250.0],
  },
  Moyen: {
    1: [0.0, 3.8],
    2: [0.0, 0.0, 5.8],
    3: [0.0, 0.0, 2.6, 50.0],
    4: [0.0, 0.0, 1.7, 10.0, 100.0],
    5: [0.0, 0.0, 0.0, 5.0, 21.0, 220.0],
    6: [0.0, 0.0, 0.0, 2.0, 10.0, 60.0, 400.0],
    7: [0.0, 0.0, 0.0, 0.0, 8.0, 40.0, 400.0, 500.0],
    8: [0.0, 0.0, 0.0, 0.0, 4.0, 15.0, 100.0, 400.0, 700.0],
    9: [0.0, 0.0, 0.0, 0.0, 2.5, 10.0, 30.0, 150.0, 500.0, 800.0],
    10: [0.0, 0.0, 0.0, 0.0, 1.5, 5.5, 15.0, 40.0, 100.0, 250.0, 500.0],
  },
  Élevé: {
    1: [0.0, 3.8],
    2: [0.0, 0.0, 6.8],
    3: [0.0, 0.0, 0.0, 81.0],
    4: [0.0, 0.0, 0.0, 15.0, 200.0],
    5: [0.0, 0.0, 0.0, 0.0, 50.0, 800.0],
    6: [0.0, 0.0, 0.0, 0.0, 23.0, 160.0, 900.0],
    7: [0.0, 0.0, 0.0, 0.0, 4.0, 100.0, 500.0, 1000.0],
    8: [0.0, 0.0, 0.0, 0.0, 0.0, 40.0, 240.0, 700.0, 1000.0],
    9: [0.0, 0.0, 0.0, 0.0, 0.0, 20.0, 100.0, 300.0, 800.0, 1000.0],
    10: [0.0, 0.0, 0.0, 0.0, 0.0, 6.5, 50.0, 250.0, 500.0, 800.0, 1000.0],
  },
};

export function Keno() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const { playTick, playWin, playLoss, playHit, playMiss } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("Classique");
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const toggleNumber = (num: number) => {
    if (isDrawing) return;
    playTick();
    if (selected.includes(num)) {
      setSelected(selected.filter((n) => n !== num));
    } else {
      if (selected.length < 10) {
        setSelected([...selected, num]);
      }
    }
  };

  const randomSelect = () => {
    if (isDrawing) return;
    playTick();
    const newSelected: number[] = [];
    while (newSelected.length < 10) {
      const p = Math.floor(Math.random() * 40) + 1;
      if (!newSelected.includes(p)) newSelected.push(p);
    }
    setSelected(newSelected);
  };

  const clearTable = () => {
    if (isDrawing) return;
    setSelected([]);
    setDrawn([]);
    setWinInfo(null);
  };

  const currentPayouts = selected.length > 0 ? PAYOUTS[difficulty][selected.length] : [];

  const handleBet = async () => {
    if (!user || selected.length === 0 || isDrawing || balance < betAmount) return;

    const success = subtractBalance(betAmount);
    if (!success) return;

    setWinInfo(null);
    setIsDrawing(true);
    setDrawn([]);

    // Draw 10 numbers randomly
    const newDraws: number[] = [];
    while (newDraws.length < 10) {
      const r = Math.floor(Math.random() * 40) + 1;
      if (!newDraws.includes(r)) newDraws.push(r);
    }

    // Reveal one by one for animation
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 150));
      const currentDraw = newDraws[i];
      setDrawn((prev) => [...prev, currentDraw]);

      if (selected.includes(currentDraw)) {
        playHit();
      } else {
        playMiss();
      }
    }

    await new Promise((r) => setTimeout(r, 400));

    // Calculate hits
    let hits = 0;
    newDraws.forEach((d) => {
      if (selected.includes(d)) hits++;
    });

    const multiplier = PAYOUTS[difficulty][selected.length][hits] || 0;
    const payout = betAmount * multiplier;

    if (payout > 0) {
      addBalance(payout);
      setWinInfo({ multiplier, payout });
      playWin();
    } else {
      playLoss();
    }

    recordBet("Keno", betAmount, multiplier, payout - betAmount);
    setIsDrawing(false);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex flex-col lg:flex-row bg-bg-panel rounded-lg overflow-hidden shadow-2xl min-h-[600px]">
        {/* Left Side: Controls */}
        <div className="bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e] w-full lg:w-[320px] shrink-0">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-sm font-bold text-white bg-[#2f4553] rounded-full py-2 transition-colors">Manuel</button>
            <button className="flex-1 text-sm font-bold text-[#8b9ba5] hover:text-white rounded-full py-2 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Bet Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-xs font-bold"> Montant de la mise </label>
                <span className="text-[#8b9ba5] text-xs font-bold flex items-center gap-1"> $ {formatCurrency(balance || 0)} </span>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded border border-[#2f4553] p-1 transition-colors focus-within:border-border-hover">
                <div className="pl-2 pr-1 flex items-center justify-center"> {renderCryptoIcon(activeCrypto, "w-4 h-4")} </div>
                <input
                  type="number"
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-white font-bold outline-none tabular-nums text-sm px-1 py-1"
                  min="0"
                  step="0.01"
                  disabled={isDrawing}
                />
                <div className="flex items-center gap-1 pr-1 border-l border-[#2f4553] pl-2">
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"> ½ </button>
                  <div className="w-px h-3 bg-[#2f4553]"></div>
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"> 2× </button>
                </div>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[#8b9ba5] text-xs font-bold px-1"> Risque / Difficulté </label>
                <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    disabled={isDrawing}
                    className="w-full bg-[#0f212e] text-white font-bold text-sm rounded border border-[#2f4553] p-2.5 focus:border-border-hover outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b1bad3%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                >
                    {(["Classique", "Faible", "Moyen", "Élevé"] as Difficulty[]).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
              <button onClick={randomSelect} disabled={isDrawing} className="w-full py-2.5 rounded bg-[#2f4553] hover:bg-[#3d5a6c] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  Sélection aléatoire
              </button>
              <button onClick={clearTable} disabled={isDrawing} className="w-full py-2.5 rounded bg-[#2f4553] hover:bg-[#3d5a6c] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  Vider la Table
              </button>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleBet}
            disabled={isDrawing || selected.length === 0 || balance < betAmount}
            className={cn(
              "w-full py-3.5 rounded font-bold text-sm transition-all bg-[#00e676] hover:bg-[#1bc86a] text-[#0f1116]",
              (isDrawing || selected.length === 0 || balance < betAmount) && "opacity-50 cursor-not-allowed",
            )}
          >
            Pari
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 order-1 lg:order-2 bg-[#0f212e] relative p-4 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="w-full max-w-[800px] flex flex-col gap-6 relative">
            {/* Grid 8x5 */}
            <div className="grid grid-cols-8 gap-1.5 md:gap-2 lg:gap-3">
              {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
                const isSelected = selected.includes(n);
                const isDrawn = drawn.includes(n);
                const isHit = isSelected && isDrawn;
                const isMiss = !isSelected && isDrawn;

                return (
                  <button
                    key={n}
                    onClick={() => toggleNumber(n)}
                    className={cn(
                      "aspect-square rounded shadow-[0_4px_0_rgba(0,0,0,0.2)] font-bold text-xs sm:text-sm md:text-lg flex items-center justify-center transition-all relative overflow-hidden",
                      !isSelected && !isDrawn && "bg-[#2f4553] hover:bg-[#3d5a6c] text-white/80 active:translate-y-1 active:shadow-[0_0px_0_rgba(0,0,0,0)]",
                      isSelected && !isDrawn && "bg-[#8b5cf6] text-white translate-y-1 shadow-[0_0px_0_rgba(0,0,0,0)]",
                      isHit && "bg-[#8b5cf6] text-transparent translate-y-1 shadow-[0_0px_0_rgba(0,0,0,0)]",
                      isMiss && "bg-[#2f4553] text-[#e53935] translate-y-1 shadow-[0_0px_0_rgba(0,0,0,0)]",
                    )}
                  >
                    {n}
                    {/* Gem SVG for Hit */}
                    <AnimatePresence>
                      {isHit && (
                        <motion.div key="hit"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          className="absolute inset-1 sm:inset-1.5 md:inset-2 flex items-center justify-center"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 0.5, 0], scale: [1, 2, 3] }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-0 bg-[#00E701] rounded-full blur-[20px] pointer-events-none"
                          />
                          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md relative z-10">
                            <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="#00e676" stroke="#000" strokeWidth="2" strokeOpacity="0.2" />
                            <polygon points="50,15 80,35 50,45 20,35" fill="#69f0ae" opacity="0.8" />
                            <polygon points="20,35 50,45 50,85 10,70" fill="#00e676" opacity="0.5" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isHit && (
                      <div className="absolute inset-0 border-2 border-[#00e676] rounded animate-pulse pointer-events-none"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Payouts Bar */}
            <div className="min-h-[50px] mt-4 flex items-center justify-center">
                <AnimatePresence>
                    {selected.length > 0 && (
                        <motion.div key="payouts" 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col w-full bg-[#0b161f] rounded-lg p-2 gap-1 overflow-x-auto scrollbar-hide border border-[#2f4553]"
                        >
                        {/* Multipliers */}
                        <div className="flex w-full gap-1">
                            {currentPayouts.map((mult, i) => {
                            const hits = drawn.filter((n) => selected.includes(n)).length;
                            const isCurrentHit = !isDrawing && drawn.length === 10 && hits === i;

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex-1 min-w-[30px] sm:min-w-[40px] py-2 flex flex-col items-center justify-center rounded text-[10px] sm:text-xs font-bold transition-all duration-300",
                                        isCurrentHit ? "bg-[#00e676] text-[#0f1116] scale-110 shadow-[0_0_15px_rgba(0,230,118,0.5)] z-10" : mult === 0 ? "bg-[#2f4553] text-white/50" : "bg-[#2f4553] text-white"
                                    )}
                                >
                                    {mult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×
                                </div>
                            );
                            })}
                        </div>
                        {/* Match Numbers */}
                        <div className="flex w-full gap-1">
                            {currentPayouts.map((_, i) => (
                                <div key={i} className="flex-1 min-w-[30px] sm:min-w-[40px] py-1 flex items-center justify-center text-[9px] sm:text-[10px] text-[#8b9ba5] font-bold">
                                    {i}x
                                </div>
                            ))}
                        </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

