import React, { useState, useRef } from "react";
import { motion, useAnimation } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Coins } from "lucide-react";
import { WinPopup } from "./WinPopup";

const SEGMENTS = {
  low: [
    { m: 1.5, color: "#3b82f6" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 0.0, color: "#475569" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.5, color: "#3b82f6" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 0.0, color: "#475569" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.5, color: "#3b82f6" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 0.0, color: "#475569" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.5, color: "#3b82f6" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 0.0, color: "#475569" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.5, color: "#3b82f6" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 0.0, color: "#475569" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
    { m: 1.2, color: "#10b981" },
  ],
  high: [
    { m: 49.5, color: "#f59e0b" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 9.9, color: "#ef4444" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
    { m: 0.0, color: "#475569" },
  ],
};

export function Wheel() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<"low" | "high">("low");

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const controls = useAnimation();
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const segments = SEGMENTS[risk];
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user || balance < betAmount) {
      alert("Connectez-vous et créditez votre compte pour jouer.");
      return;
    }
    
    subtractBalance(betAmount);
    setIsSpinning(true);
    setWinInfo(null);

    // Pick winning index
    const winIndex = Math.floor(Math.random() * numSegments);
    const winMultiplier = segments[winIndex].m;

    // Calculate rotation
    // We want the winIndex to align with the top (which is 0 degrees typically, depending on SVG start)
    // To land on index, we need to rotate backwards by index * angle
    // Add extra spins (e.g. 5 full rotations = 1800 deg)
    const extraSpins = 360 * 5;
    // Current SVG generates segments starting from top. Center of winIndex is:
    const targetAngle =
      -(winIndex * anglePerSegment + anglePerSegment / 2) + extraSpins;

    const newRotation = rotation + targetAngle - (rotation % 360);

    await controls.start({
      rotate: newRotation,
      transition: { duration: 3, ease: [0.2, 0.8, 0.2, 1] }, // Custom easeOut function
    });

    setRotation(newRotation);
    setIsSpinning(false);

    const payout = betAmount * winMultiplier;
    if (winMultiplier > 0) {
      addBalance(payout);
    }

    recordBet("Wheel", betAmount, winMultiplier, payout - betAmount);
    setWinInfo({ multiplier: winMultiplier, payout });
  };

  // Helper to generate SVG pie slices
  const createSlices = () => {
    let paths = [];
    let currentAngle = 0;

    for (let i = 0; i < numSegments; i++) {
      const segAngle = (Math.PI * 2) / numSegments;
      // Start from -PI/2 (top)
      const startAngle = currentAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      const x1 = 50 + 50 * Math.cos(startAngle);
      const y1 = 50 + 50 * Math.sin(startAngle);
      const x2 = 50 + 50 * Math.cos(endAngle);
      const y2 = 50 + 50 * Math.sin(endAngle);

      // Svg path for slice
      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 50 50 0 0 1 ${x2} ${y2}`,
        `Z`,
      ].join(" ");

      // Also need text position (middle of slice)
      const textAngle = startAngle + segAngle / 2;
      const textX = 50 + 40 * Math.cos(textAngle);
      const textY = 50 + 40 * Math.sin(textAngle);
      const textRotate = (textAngle + Math.PI / 2) * (180 / Math.PI); // rotate text to face outward

      paths.push(
        <g key={i}>
          <path
            d={pathData}
            fill={segments[i].color}
            stroke="#1A2C38"
            strokeWidth="0.5"
          />
        </g>,
      );
      currentAngle += segAngle;
    }
    return paths;
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex md:flex-row flex-col max-w-5xl rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        {/* Left Side: Controls */}
        <div className="w-full md:w-80 bg-[#162734] border border-[#233845] md:rounded-l-2xl md:rounded-r-none rounded-t-2xl flex flex-col p-6 z-10 relative">
           <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
           <div className="flex flex-col gap-6 relative z-10 w-full h-full">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label className="text-text-secondary text-[11px] uppercase font-bold tracking-widest pl-1">
                  Montant du Pari
                </label>
                <span className="text-white text-xs flex items-center gap-1 font-semibold pr-1">
                  {balance.toFixed(8)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                </span>
              </div>
              <div className="flex items-center bg-[#0d1b24] border border-[#233845] rounded-lg hover:border-[#334b5c] focus-within:border-accent transition-colors shadow-inner h-12 overflow-hidden ring-1 ring-black/20">
                <span className="pl-3 absolute flex items-center justify-center">
                  {renderCryptoIcon(activeCrypto, "w-5 h-5")}
                </span>
                <input
                  type="number"
                  value={betAmount || ""}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isSpinning}
                  className="w-full bg-transparent p-2 pl-10 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-sm"
                  step="0.00000001"
                  min="0"
                  max={balance}
                />
                <div className="flex h-full border-l border-[#233845] divide-x divide-[#233845]">
                  <button
                    onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(8))}
                    disabled={isSpinning}
                    className="px-4 hover:bg-[#233845] text-xs font-bold disabled:opacity-50 transition-colors text-slate-300"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(8))}
                    disabled={isSpinning}
                    className="px-4 hover:bg-[#233845] text-xs font-bold disabled:opacity-50 transition-colors text-slate-300"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-text-secondary text-[11px] uppercase font-bold tracking-widest pl-1">
                Risque
              </label>
              <div className="flex bg-[#0d1b24] p-1 rounded-lg border border-[#233845]">
                <button
                  onClick={() => setRisk("low")}
                  disabled={isSpinning}
                  className={cn(
                    "flex-1 py-2 rounded font-bold text-sm transition-colors",
                    risk === "low"
                      ? "bg-[#233845] text-white shadow"
                      : "bg-transparent text-text-secondary hover:text-white hover:bg-[#162734]",
                  )}
                >
                  Faible
                </button>
                <button
                  onClick={() => setRisk("high")}
                  disabled={isSpinning}
                  className={cn(
                    "flex-1 py-2 rounded font-bold text-sm transition-colors",
                    risk === "high"
                       ? "bg-[#233845] text-white shadow"
                      : "bg-transparent text-text-secondary hover:text-white hover:bg-[#162734]",
                  )}
                >
                  Élevé
                </button>
              </div>
            </div>

            <div className="flex-1"></div>

            <button
              onClick={handleSpin}
              disabled={isSpinning || balance < betAmount || betAmount <= 0}
              className="w-full py-4 rounded-lg text-[#000] font-extrabold uppercase tracking-wider bg-accent hover:bg-accent-hover disabled:bg-[#233845] disabled:text-text-secondary disabled:shadow-none transition-all shadow-[0_0_20px_rgba(0,231,1,0.2)] hover:shadow-[0_0_25px_rgba(0,231,1,0.4)] text-sm"
            >
              Jouer
            </button>
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 bg-[#0f212e] border border-l-0 border-[#233845] relative flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
          {/* Win Popup */}
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
            {/* Pointer */}
            <div className="absolute -top-4 z-20">
              <div className="w-8 h-12 bg-white rounded-b-full shadow-lg flex items-end justify-center pb-2">
                <div className="w-2 h-2 bg-[#0f172a] rounded-full"></div>
              </div>
            </div>

            {/* Wheel Center */}
            <div className="absolute inset-0 z-10 m-auto w-12 h-12 bg-[#213743] rounded-full ring-4 ring-[#0f172a] shadow-inner"></div>

            {/* Wheel SVG */}
            <motion.div
              animate={controls}
              className="w-full h-full rounded-full shadow-2xl bg-[#0f172a] border-8 border-[#213743]"
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible"
              >
                {createSlices()}
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
