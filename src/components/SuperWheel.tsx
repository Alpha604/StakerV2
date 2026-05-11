import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn, formatCurrency } from "../lib/utils";
import { Coins, ChevronDown, Zap } from "lucide-react";
import { WinPopup } from "./WinPopup";

const MULTIPLIERS = {
  10: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3],
    high: [0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 9.9],
    extreme: [0, 0, 0, 0, 0, 0, 0, 0, 0, 49.5]
  },
  20: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0.2, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 19.8],
    extreme: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99]
  },
  30: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0],
    high: [0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0, 29.7],
    extreme: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 299]
  },
  40: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [2, 0, 3, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 39.6],
    extreme: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 499]
  },
  50: {
    low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    medium: [2, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0],
    high: [0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0.2, 0, 0, 49.5],
    extreme: [0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1000]
  }
};

const getColorForMultiplier = (m: number) => {
  if (m === 0) return "#1e1e1e";
  if (m <= 0.2) return "#475569"; // slate color for sad little multipliers
  if (m <= 1.2) return "#10b981";
  if (m <= 1.5) return "#3b82f6";
  if (m <= 2) return "#8b5cf6";
  if (m <= 3) return "#d946ef";
  if (m < 10) return "#f59e0b";
  if (m < 50) return "#ef4444";
  return "#fbbf24"; // Super high multiplier color -> gold
};

export function SuperWheel() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<"low" | "medium" | "high" | "extreme">("extreme");
  const [segmentsCount, setSegmentsCount] = useState<10 | 20 | 30 | 40 | 50>(50);

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
      if (isAutoPlaying) setIsAutoPlaying(false);
      else alert("Connectez-vous et créditez votre compte pour jouer.");
      return;
    }
    
    // We set isSpinning synchronously so double calls are blocked
    setIsSpinning(true);

    const success = await subtractBalance(betAmount);
    if (!success) {
      setIsSpinning(false);
      setIsAutoPlaying(false);
      return;
    }

    setWinInfo(null);

    // Pick winning index
    const winIndex = Math.floor(Math.random() * numSegments);
    const winMultiplier = segments[winIndex].m;

    // Fast rotation for super wheel
    const extraSpins = 360 * 10; // 10 spins
    const targetAngle = -(winIndex * anglePerSegment + anglePerSegment / 2) + extraSpins;
    const newRotation = rotation + targetAngle - (rotation % 360);

    await controls.start({
      rotate: newRotation,
      transition: { duration: 4, ease: [0.1, 0.9, 0.2, 1] }, 
    });

    setRotation(newRotation);
    setIsSpinning(false);

    const payout = betAmount * winMultiplier;
    if (winMultiplier > 0) {
      addBalance(payout);
    }

    recordBet("Super Wheel", betAmount, winMultiplier, payout - betAmount);
    setWinInfo({ multiplier: winMultiplier, payout });
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isAutoPlaying && !isSpinning) {
      if (autoBetsCount === 0 || autoBetsRemaining > 0) {
        timeoutId = setTimeout(() => {
          handleSpin();
          if (autoBetsCount > 0) {
            setAutoBetsRemaining((prev) => prev - 1);
          }
        }, 800); 
      } else {
        setIsAutoPlaying(false);
      }
    }

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying, isSpinning, autoBetsRemaining, autoBetsCount, balance, betAmount, rotation]);

  const createSlices = () => {
    let paths = [];
    let currentAngle = 0;

    for (let i = 0; i < numSegments; i++) {
      const segAngle = (Math.PI * 2) / numSegments;
      const startAngle = currentAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      const x1 = 50 + 50 * Math.cos(startAngle);
      const y1 = 50 + 50 * Math.sin(startAngle);
      const x2 = 50 + 50 * Math.cos(endAngle);
      const y2 = 50 + 50 * Math.sin(endAngle);

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 50 50 0 0 1 ${x2} ${y2}`,
        `Z`,
      ].join(" ");

      paths.push(
        <g key={i}>
          <path
            d={pathData}
            fill={segments[i].color}
            stroke="#ffcc00"
            strokeWidth="0.8"
            className="drop-shadow-md"
          />
          {/* Add a subtle inner highlight to each slice */}
          <path
            d={pathData}
            fill="transparent"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
          />
          {/* Draw multiplier text inside slice if there's enough room */}
          {numSegments <= 20 && (
             <text
               x={50 + 35 * Math.cos(startAngle + segAngle / 2)}
               y={50 + 35 * Math.sin(startAngle + segAngle / 2)}
               fill="white"
               fontSize="4"
               fontWeight="bold"
               textAnchor="middle"
               dominantBaseline="central"
               transform={`rotate(${((startAngle + segAngle / 2) * 180) / Math.PI + 90}, ${50 + 35 * Math.cos(startAngle + segAngle / 2)}, ${50 + 35 * Math.sin(startAngle + segAngle / 2)})`}
             >
               {segments[i].m}x
             </text>
          )}
        </g>,
      );
      currentAngle += segAngle;
    }
    return paths;
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex md:flex-row flex-col max-w-5xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.2)] min-h-[600px] md:min-h-[500px] border border-yellow-500/30">
        <div className="w-full lg:w-[320px] shrink-0 bg-gradient-to-b from-[#1a1500] to-[#211800] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#3a2f00]">
          <div className="flex flex-col gap-4 relative w-full h-full">
            <div className="bg-[#0f0b00] rounded-full p-1 flex border border-[#3a2f00]">
              <button 
                onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("manual"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-[#3a2f00] bg-yellow-500 shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Manuel</button>
              <button 
                onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("auto"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-yellow-500 shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Auto</button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">
                  Montant de la mise
                </label>
                <span className="text-yellow-500 text-[13px] flex items-center gap-1 font-semibold">
                  $ {formatCurrency(balance )}
                </span>
              </div>
              <div className="relative flex items-center bg-[#0f0b00] rounded hover:border-yellow-600 focus-within:border-yellow-400 transition-colors border border-yellow-800/50 h-[40px] overflow-hidden">
                <span className="pl-3 absolute flex items-center justify-center text-yellow-500">
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
                <div className="flex h-full border-l border-yellow-800/50 divide-x divide-yellow-800/50">
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)}
                    disabled={isSpinning}
                    className="px-3 hover:bg-yellow-500/20 text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)}
                    disabled={isSpinning}
                    className="px-3 hover:bg-yellow-500/20 text-[13px] font-bold disabled:opacity-50 transition-colors text-white"
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1 flex items-center gap-2">
                <Zap className="text-yellow-500" size={14} /> Risque Super/Difficulté
              </label>
              <div className="flex bg-[#0f0b00] rounded border border-yellow-800/50 relative">
                <select
                  value={risk}
                  onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high" | "extreme")}
                  disabled={isSpinning || isAutoPlaying}
                  className="w-full bg-transparent text-white font-bold text-[13px] p-2.5 outline-none appearance-none cursor-pointer z-10 relative disabled:opacity-50"
                >
                  <option value="low" className="text-black">Faible</option>
                  <option value="medium" className="text-black">Moyen</option>
                  <option value="high" className="text-black">Élevé</option>
                  <option value="extreme" className="text-black">EXTRÊME ⚡</option>
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
              <div className="flex bg-[#0f0b00] rounded border border-yellow-800/50 relative">
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
                  <option value={50} className="text-black">50 (Best)</option>
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
                <div className="flex bg-[#0f0b00] rounded border border-yellow-800/50 relative">
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
                  "w-full py-3.5 rounded font-bold transition-all text-sm bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-105 text-[#1a1500] shadow-[0_0_20px_rgba(255,215,0,0.5)]",
                  (isSpinning || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed",
                )}
              >
                PARIER
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
                  "w-full py-3.5 rounded font-extrabold transition-all text-sm relative overflow-hidden",
                  isAutoPlaying 
                    ? "bg-[#ed4163] hover:bg-[#ed4163]/80 text-white shadow-[0_0_15px_rgba(237,65,99,0.3)]" 
                    : "bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-105 text-[#1a1500] shadow-[0_0_20px_rgba(255,215,0,0.5)]",
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

        <div className="flex-1 order-1 lg:order-2 flex-1 bg-gradient-to-b from-[#0f0b00] to-[black] relative flex flex-col items-center justify-center p-8 overflow-hidden z-0">
          {/* Animated Background Rays */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(255,160,0,0.15)_0%,rgba(0,0,0,0)_60%)] animate-pulse" />
          </div>
          {isSpinning && (
             <div className="absolute inset-0 pointer-events-none opacity-20 animate-spin-slow z-0" style={{ background: 'conic-gradient(from 0deg, transparent 40%, rgba(255, 215, 0, 0.4) 50%, transparent 60%)' }} />
          )}

          {/* Win Popup */}
          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center z-10">
            {/* Pointer (Arrow) */}
            <div className="absolute -top-8 z-30 flex flex-col items-center drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] filter">
              <div className="w-10 h-14 bg-gradient-to-b from-white to-yellow-300 rounded-t-sm" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
              <div className="w-5 h-5 bg-gradient-to-br from-yellow-100 to-yellow-500 rounded-full -mt-3 shadow-inner shadow-black/50 border-2 border-white/50"></div>
            </div>

            {/* Wheel Center (Hole) */}
            <div className="absolute inset-0 z-20 m-auto w-32 h-32 bg-gradient-to-b from-[#2a1d00] to-[#0a0800] rounded-full ring-[12px] ring-[#0a0800] shadow-[0_0_25px_rgba(255,215,0,0.5)] flex items-center justify-center border-4 border-yellow-600/30">
               <div className="w-20 h-20 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 rounded-full shadow-[inset_0_4px_15px_rgba(0,0,0,0.6),0_0_15px_rgba(255,200,0,0.5)] flex items-center justify-center border border-yellow-200">
                 <Zap className="text-[#1a1500]" size={36} fill="#1a1500" strokeWidth={1} />
               </div>
            </div>

            {/* Wheel SVG */}
            <motion.div
              animate={controls}
              className="w-full h-full rounded-full shadow-[0_0_80px_rgba(255,215,0,0.15)] bg-[#0f172a] border-[16px] border-[#1a1500] relative ring-4 ring-yellow-600/20"
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
