import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

const ROWS_OPTIONS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const RISK_OPTIONS = ["Low", "Medium", "High"];

// simplified multipliers for diff rows and risks
const getMultipliers = (rows: number, risk: string) => {
    // simplified lookup
    if (rows === 16 && risk === "High") return [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
    if (rows === 16 && risk === "Low") return [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16];
    if (rows === 8 && risk === "High") return [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29];
    if (rows === 8 && risk === "Low") return [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6];

    // generic fallback logic
    const mid = Math.floor(rows/2);
    const m = [];
    for(let i=0; i<=rows; i++) {
        const dist = Math.abs(i - mid);
        const factor = Math.pow(dist, risk === "High" ? 2.5 : 1.5);
        let val = risk === "High" ? 0.2 : 0.5;
        if (dist > 0) val = val + factor * (risk === "High" ? 0.5 : 0.2);
        m.push(Number(val.toFixed(1)));
    }
    return m;
};

type Ball = {
  id: number;
  path: number[];
  finalIndex: number;
};

export function Plinko() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const { playTick, playWin, playLoss } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [balls, setBalls] = useState<Ball[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState("High");

  const MULTIPLIERS = getMultipliers(rows, risk);

  const handleDrop = () => {
    if (!user || balance < betAmount) return;

    subtractBalance(betAmount);
    setWinInfo(null);
    playTick();

    let currentIndex = 0;
    const path: number[] = [currentIndex];

    // Generate path based on rows
    for (let i = 0; i < rows; i++) {
      // 50% chance left or right
      const direction = Math.random() > 0.5 ? 1 : 0;
      currentIndex += direction;
      path.push(currentIndex);
    }

    const finalIndex = currentIndex;
    const mult = MULTIPLIERS[finalIndex];

    const newBall: Ball = {
      id: Date.now() + Math.random(),
      path,
      finalIndex,
    };

    setBalls((prev) => [...prev, newBall]);

    const animDurationMs = 1500 + rows * 80;

    // Simulate bouncing sound
    const pegsToHit = rows;
    for(let i=0; i<pegsToHit; i++) {
        setTimeout(playTick, (animDurationMs / pegsToHit) * i);
    }

    // Cleanup and payout after animation
    setTimeout(() => {
      const payout = betAmount * mult;
      if (mult > 0) {
        addBalance(payout);
      }
      if (mult >= 1) playWin(); else playLoss();

      recordBet("Plinko", betAmount, mult, payout - betAmount);

      setWinInfo({ multiplier: mult, payout });
      setBalls((prev) => prev.filter((b) => b.id !== newBall.id));
    }, animDurationMs);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex md:flex-row flex-col max-w-[1200px] rounded-2xl overflow-hidden shadow-2xl min-h-[600px]">
        {/* Left Side: Controls */}
        <div className="w-full md:w-80 bg-[#162734] border border-[#233845] md:rounded-l-2xl md:rounded-r-none rounded-t-2xl flex flex-col p-6 z-10 relative order-2 md:order-1">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="flex flex-col gap-6 relative z-10 w-full h-full">
          <div className="bg-[#0d1b24] rounded-lg p-1 flex border border-[#233845]">
            <button className="flex-1 text-sm font-bold text-white bg-[#233845] rounded shadow py-2 transition-colors">Manuel</button>
            <button className="flex-1 text-sm font-bold text-text-secondary hover:text-white rounded py-2 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Bet Amount */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-1">
                <span>Montant du Pari</span>
                <span className="text-white text-xs flex items-center gap-1 font-semibold pr-1">
                  {balance.toFixed(8)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                </span>
              </div>
              <div className="relative flex items-center bg-[#0d1b24] border border-[#233845] rounded-lg hover:border-[#334b5c] transition-colors focus-within:border-accent ring-1 ring-black/20 h-12 overflow-hidden">
                <span className="pl-3 absolute flex items-center justify-center">
                  {renderCryptoIcon(activeCrypto, "w-5 h-5")}
                </span>
                <input
                  type="number"
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent p-2 pl-10 text-white font-bold outline-none focus:ring-0 text-sm"
                  min="0"
                  step="0.00000001"
                />
                <div className="flex items-center h-full border-l border-[#233845] divide-x divide-[#233845]">
                  <button onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(8))} className="px-4 hover:bg-[#233845] text-xs font-bold transition-colors text-slate-300 h-full"> ½ </button>
                  <button onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(8))} className="px-4 hover:bg-[#233845] text-xs font-bold transition-colors text-slate-300 h-full"> 2× </button>
                </div>
              </div>
            </div>
            
            {/* Risk Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-[11px] uppercase font-bold tracking-widest pl-1"> Risque </label>
                <div className="relative">
                  <select 
                      value={risk}
                      onChange={(e) => setRisk(e.target.value)}
                      className="w-full h-12 bg-[#0d1b24] text-white font-bold text-sm rounded-lg border border-[#233845] px-4 ring-1 ring-black/20 hover:border-[#334b5c] focus:border-accent outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                  >
                      {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                </div>
            </div>

            {/* Rows Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-[11px] uppercase font-bold tracking-widest pl-1"> Lignes </label>
                <div className="relative">
                  <select 
                      value={rows}
                      onChange={(e) => setRows(Number(e.target.value))}
                      className="w-full h-12 bg-[#0d1b24] text-white font-bold text-sm rounded-lg border border-[#233845] px-4 ring-1 ring-black/20 hover:border-[#334b5c] focus:border-accent outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                  >
                      {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">▼</div>
                </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleDrop}
            disabled={balance < betAmount || betAmount <= 0}
            className="w-full py-4 rounded-lg text-[#000] font-extrabold uppercase tracking-wider bg-accent hover:bg-accent-hover disabled:bg-[#233845] disabled:text-text-secondary disabled:shadow-none transition-all shadow-[0_0_20px_rgba(0,231,1,0.2)] hover:shadow-[0_0_25px_rgba(0,231,1,0.4)] text-sm"
          >
            Jouer
          </button>
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 bg-[#0f212e] md:rounded-r-2xl md:rounded-bl-none rounded-b-2xl flex flex-col items-center justify-center order-1 md:order-2 border border-l-0 border-[#233845] p-4 lg:p-12 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="relative w-full max-w-[800px] flex-1 flex flex-col items-center justify-end" ref={containerRef}>
            {/* Draw Pegs */}
            <div className="absolute top-0 left-0 w-full h-[90%] flex flex-col justify-between pt-4 pb-8 border-b-2 border-transparent">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center w-full relative h-[10px]">
                  {Array.from({ length: rowIndex + 3 }).map((_, colIndex) => (
                    <div key={colIndex} className="w-1.5 h-1.5 lg:w-2.5 lg:h-2.5 bg-[#2f4553] rounded-full shadow-inner" style={{ margin: `0 calc(100% / ${rows*2.4})` }} />
                  ))}
                </div>
              ))}
            </div>

            {/* Draw Multipliers (Buckets) */}
            <div className="w-[100%] flex justify-between absolute bottom-0 gap-[1px] lg:gap-1">
              {MULTIPLIERS.map((mult, idx) => {
                  const isHigh = mult >= 10;
                  const isMid = mult >= 2 && mult < 10;
                  const colorClass = isHigh ? "bg-[#e53935]" : isMid ? "bg-[#ff9800]" : "bg-[#ffb300]";
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-sm text-[8px] lg:text-xs font-black py-1.5 lg:py-2 text-[#0f1116] shadow-[0_3px_0_rgba(0,0,0,0.2)] lg:shadow-[0_4px_0_rgba(0,0,0,0.2)]",
                        colorClass
                      )}
                    >
                      {mult}
                    </div>
                  );
              })}
            </div>

            {/* Animated Balls */}
            {balls.map((ball) => {
              const keyframesX = ball.path.map((pos, i) => {
                const rowCenter = (i + 2) / 2;
                const offset = pos - rowCenter;
                return `calc(50% + ${offset * (100/(rows + 2))}%)`; // purely percentage based mapping
              });

              // Tweaked Y to stop perfectly over the bucket
              const keyframesY = ball.path.map((_, i) => `${(i / rows) * 94}%`);

              return (
                <motion.div
                  key={ball.id}
                  className="absolute top-4 w-3 h-3 lg:w-5 lg:h-5 bg-[#e53935] rounded-full shadow-[0_0_15px_rgba(229,57,53,0.8),inset_0_-2px_4px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] z-20 border border-white/20"
                  style={{ transform: "translate(-50%, -50%)" }}
                  initial={{ left: "50%", top: "0%" }}
                  animate={{
                    left: keyframesX,
                    top: keyframesY,
                  }}
                  transition={{ duration: (1.5 + rows*0.06), ease: "linear" }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
