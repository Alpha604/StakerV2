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
    <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full grid grid-cols-1 lg:grid-cols-[320px_1fr] bg-bg-panel rounded-lg overflow-hidden shadow-2xl min-h-[600px]">
        
        {/* Left Side: Controls */}
        <div className="bg-bg-panel lg:bg-[#213743] p-4 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-border-medium z-10">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-sm font-bold text-white bg-[#2f4553] rounded-full py-2 transition-colors">Manuel</button>
            <button className="flex-1 text-sm font-bold text-text-secondary hover:text-white rounded-full py-2 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Bet Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-text-secondary text-xs font-bold"> Montant de la mise </label>
                <span className="text-text-secondary text-xs font-bold flex items-center gap-1"> $ {(balance || 0).toFixed(2)} </span>
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
                />
                <div className="flex items-center gap-1 pr-1 border-l border-[#2f4553] pl-2">
                  <button onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(2))} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"> ½ </button>
                  <div className="w-px h-3 bg-[#2f4553]"></div>
                  <button onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(2))} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors"> 2× </button>
                </div>
              </div>
            </div>
            
            {/* Risk Selection */}
            <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-bold px-1"> Risque </label>
                <select 
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    className="w-full bg-[#0f212e] text-white font-bold text-sm rounded border border-[#2f4553] p-2.5 focus:border-border-hover outline-none transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b1bad3%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                >
                    {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            {/* Rows Selection */}
            <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary text-xs font-bold px-1"> Lignes </label>
                <select 
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full bg-[#0f212e] text-white font-bold text-sm rounded border border-[#2f4553] p-2.5 focus:border-border-hover outline-none transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b1bad3%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                >
                    {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleDrop}
            disabled={balance < betAmount}
            className={cn(
              "w-full py-3.5 rounded font-bold text-sm transition-all bg-[#00e676] hover:bg-[#1bc86a] text-[#0f1116]",
              balance < betAmount && "opacity-50 cursor-not-allowed",
            )}
          >
            Jouer
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="bg-[#0f212e] relative p-4 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
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
