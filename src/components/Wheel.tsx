import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins, ChevronDown } from "lucide-react";
import { WinPopup } from "./WinPopup";

const MULTIPLIERS = {
  10: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3],
    high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 9.9],
  },
  20: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19.8],
  },
  30: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0],
    high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29.7],
  },
  40: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [2, 0, 3, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39.6],
  },
  50: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [2, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49.5],
  }
};

const getColorForMultiplier = (m: number) => {
  if (m === 0) return "#475569";
  if (m <= 1.2) return "#10b981";
  if (m <= 1.5) return "#3b82f6";
  if (m <= 2) return "#8b5cf6";
  if (m <= 3) return "#d946ef";
  if (m < 10) return "#f59e0b";
  return "#ef4444";
};

export function Wheel() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [segmentsCount, setSegmentsCount] = useState<10 | 20 | 30 | 40 | 50>(10);

  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoBetsCount, setAutoBetsCount] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState<number>(0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const controls = useAnimation();
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);

  const segmentsMultipliers = MULTIPLIERS[segmentsCount][risk];
  const segments = segmentsMultipliers.map(m => ({ m, color: getColorForMultiplier(m) }));
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!user || balance < betAmount) {
      alert("Connectez-vous et créditez votre compte pour jouer.");
      return;
    }
    
    const success = await subtractBalance(betAmount);
    if (!success) return;
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

  // Auto Play Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const playAutoRound = async () => {
      // 1. Check conditions
      if (betAmount > balance) {
        setIsAutoPlaying(false);
        return;
      }
      
      const success = await subtractBalance(betAmount);
      if (!success) {
        setIsAutoPlaying(false);
        return;
      }

      setIsSpinning(true);
      setWinInfo(null);

      // Pick winning index
      const winIndex = Math.floor(Math.random() * numSegments);
      const winMultiplier = segments[winIndex].m;

      const extraSpins = 360 * 5;
      const targetAngle = -(winIndex * anglePerSegment + anglePerSegment / 2) + extraSpins;
      const newRotation = rotation + targetAngle - (rotation % 360);

      await controls.start({
        rotate: newRotation,
        transition: { duration: 3, ease: [0.2, 0.8, 0.2, 1] },
      });

      setRotation(newRotation);
      setIsSpinning(false);

      const payout = betAmount * winMultiplier;
      if (winMultiplier > 0) {
        addBalance(payout);
      }

      recordBet("Wheel", betAmount, winMultiplier, payout - betAmount);
      setWinInfo({ multiplier: winMultiplier, payout });

      if (autoBetsCount > 0) {
        setAutoBetsRemaining(prev => {
           const next = prev - 1;
           if (next <= 0) setIsAutoPlaying(false);
           return next;
        });
      }
    };

    if (isAutoPlaying && !isSpinning) {
      if (autoBetsCount === 0 || autoBetsRemaining > 0) {
        timeoutId = setTimeout(() => {
          playAutoRound();
        }, 800); // Wait between spins
      }
    }

    return () => clearTimeout(timeoutId);
  }, [isAutoPlaying, isSpinning, autoBetsRemaining, autoBetsCount, betAmount, balance]);

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
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">
            <div className="bg-[#0f212e] rounded-full p-1 flex">
              <button 
                onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("manual"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Manuel</button>
              <button 
                onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("auto"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Auto</button>
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
                  disabled={isSpinning}
                  className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"
                  step="0.01"
                  min="0"
                  max={balance}
                />
                <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                    disabled={isSpinning}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                    disabled={isSpinning}
                    className="px-3 hover:bg-[#2f4553] text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">
                Risque / Difficulté
              </label>
              <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
                <select
                  value={risk}
                  onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high")}
                  disabled={isSpinning || isAutoPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  <option value="low" className="text-black">Faible</option>
                  <option value="medium" className="text-black">Moyen</option>
                  <option value="high" className="text-black">Élevé</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">
                Segments
              </label>
              <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
                <select
                  value={segmentsCount}
                  onChange={(e) => setSegmentsCount(Number(e.target.value) as 10 | 20 | 30 | 40 | 50)}
                  disabled={isSpinning || isAutoPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  <option value={10} className="text-black">10</option>
                  <option value={20} className="text-black">20</option>
                  <option value={30} className="text-black">30</option>
                  <option value={40} className="text-black">40</option>
                  <option value={50} className="text-black">50</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {mode === "auto" && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[#8b9ba5] text-[13px] font-bold px-1">
                  Nombre de paris (0 = infini)
                </label>
                <div className="flex bg-[#0f212e] rounded border border-[#2f4553] relative">
                  <input
                    type="number"
                    value={autoBetsCount}
                    onChange={(e) => setAutoBetsCount(Number(e.target.value))}
                    disabled={isAutoPlaying || isSpinning}
                    className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none disabled:opacity-50"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="flex-1"></div>

            {mode === "manual" ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning || balance < betAmount || betAmount <= 0}
                className={cn(
                  "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                  (isSpinning || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed",
                )}
              >
                Pari
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isAutoPlaying) {
                    setIsAutoPlaying(false);
                  } else {
                    setIsAutoPlaying(true);
                    setAutoBetsRemaining(autoBetsCount);
                  }
                }}
                disabled={!isAutoPlaying && (balance < betAmount || betAmount <= 0)}
                className={cn(
                  "w-full py-3.5 rounded font-extrabold transition-all text-sm relative overflow-hidden shadow-[0_0_15px_rgba(27,200,106,0.3)]",
                  isAutoPlaying 
                    ? "bg-[#ed4163] hover:bg-[#ed4163]/80 text-white shadow-[0_0_15px_rgba(237,65,99,0.3)]" 
                    : "bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                  (!isAutoPlaying && (balance < betAmount || betAmount <= 0)) && "opacity-50 cursor-not-allowed shadow-none"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  {isAutoPlaying ? (
                    <>
                      <div className="w-2 h-2 rounded-sm bg-white animate-pulse" />
                      Arrêter l'Autobet
                    </>
                  ) : (
                    <>
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-1" />
                      Démarrer Autobet
                    </>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 order-1 lg:order-2 flex-1 bg-[#0f212e] border border-l-0 border-[#233845] relative flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
          {/* Win Popup */}
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
            {/* Pointer (Arrow) */}
            <div className="absolute -top-6 z-20 flex flex-col items-center drop-shadow-xl">
              <div className="w-6 h-8 bg-white rounded-t-sm" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
              <div className="w-3 h-3 bg-white rounded-full -mt-2 shadow-inner"></div>
            </div>

            {/* Wheel Center (Hole) */}
            <div className="absolute inset-0 z-10 m-auto w-24 h-24 bg-[#213743] rounded-full ring-8 ring-[#0f172a] shadow-inner flex items-center justify-center">
               <div className="w-12 h-12 bg-[#0f172a] rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>
            </div>

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
