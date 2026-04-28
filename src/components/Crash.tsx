import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "motion/react";
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { cn } from "../lib/utils";
import { Coins, Target } from "lucide-react";

export function Crash() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet  } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<number>(2.0);

  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed">(
    "idle",
  );
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number>(1.0);

  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Math logic for crash curve
  // multiplier = e^(rt)
  const growthRate = 0.06;

  const generateCrashPoint = () => {
    const e = 100;
    const h = 4; // 4% house edge
    const rand = Math.random();
    const result = Math.floor((100 * e - h) / (rand * 100)) / 100;
    return Math.max(1.0, result);
  };

  const handleBet = () => {
    if (!user || balance < betAmount) {
      alert("Connectez-vous et créditez votre compte pour jouer.");
      return;
    }
    subtractBalance(betAmount);
    setHasBet(true);
    setCashedOut(false);
    setWinAmount(0);
    // Start sequence
    startSequence();
  };

  const handleCashout = () => {
    if (gameState === "playing" && hasBet && !cashedOut) {
      setCashedOut(true);
      const payout = betAmount * multiplier;
      setWinAmount(payout);
      addBalance(payout);
      recordBet("Crash", betAmount, multiplier, payout - betAmount);
    }
  };

  const startSequence = () => {
    setGameState("playing");
    setMultiplier(1.0);
    const point = generateCrashPoint();
    setCrashPoint(point);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMulti = Math.pow(Math.E, growthRate * elapsed);

      if (currentMulti >= point) {
        // Crash!
        setMultiplier(point);
        setGameState("crashed");

        if (hasBet && !cashedOut) {
          // Lost
          recordBet("Crash", betAmount, 0, -betAmount);
        }

        setTimeout(() => {
          setGameState("idle");
          setHasBet(false);
          setCashedOut(false);
          setMultiplier(1.0);
        }, 3000);
        return;
      }

      setMultiplier(currentMulti);

      // Handle Auto Cashout
      if (hasBet && !cashedOut && currentMulti >= autoCashout) {
        handleCashout();
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = "#1a2c38";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i += 50) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
    }
    for (let i = 0; i < height; i += 50) {
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
    }
    ctx.stroke();

    // Draw curve
    if (gameState === "idle") return;

    ctx.beginPath();
    ctx.moveTo(0, height);

    // Simulate curve progress
    const points = 100;
    const currentMaxTime = Math.log(multiplier) / growthRate || 0.1;

    for (let i = 0; i <= points; i++) {
      const t = (i / points) * currentMaxTime;
      const yMulti = Math.pow(Math.E, growthRate * t);

      // Map to canvas. x = time, y = multi
      const x = (i / points) * (width * 0.8); // Curve takes up 80% of width max
      // Map Y so that current multiplier is always near the top
      const targetYScale = multiplier > 2 ? multiplier : 2;
      const y = height - ((yMulti - 1) / (targetYScale - 1)) * (height * 0.8);

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = gameState === "crashed" ? "#ed4163" : "#00e676";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(width * 0.8, height);
    ctx.lineTo(0, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (gameState === "crashed") {
      gradient.addColorStop(0, "rgba(237, 65, 99, 0.5)");
      gradient.addColorStop(1, "rgba(237, 65, 99, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 230, 118, 0.5)");
      gradient.addColorStop(1, "rgba(0, 230, 118, 0)");
    }
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [multiplier, gameState]);

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex md:flex-row flex-col max-w-[1200px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[600px]">
        {/* Left Side: Controls */}
        <div className="w-full md:w-80 bg-[#162734] border border-[#233845] md:rounded-l-2xl md:rounded-r-none rounded-t-2xl flex flex-col p-6 z-10 relative order-2 md:order-1">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="flex flex-col gap-6 relative z-10 w-full h-full">
            <div className="bg-[#0d1b24] rounded-lg p-1 flex border border-[#233845]">
              <button className="flex-1 text-sm font-bold text-white bg-[#233845] rounded shadow py-2 transition-colors">Manuel</button>
              <button className="flex-1 text-sm font-bold text-text-secondary hover:text-white rounded py-2 transition-colors">Auto</button>
            </div>

            <div className="flex flex-col gap-5">
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
                    disabled={gameState !== "idle" && hasBet}
                  />
                  <div className="flex items-center h-full border-l border-[#233845] divide-x divide-[#233845]">
                    <button onClick={() => setBetAmount((prev) => +(prev / 2).toFixed(8))} className="px-4 hover:bg-[#233845] text-xs font-bold transition-colors text-slate-300 h-full" disabled={gameState !== "idle" && hasBet}> ½ </button>
                    <button onClick={() => setBetAmount((prev) => +(prev * 2).toFixed(8))} className="px-4 hover:bg-[#233845] text-xs font-bold transition-colors text-slate-300 h-full" disabled={gameState !== "idle" && hasBet}> 2× </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-1">
                  <label>Auto Cashout</label>
                </div>
                <div className="relative flex items-center bg-[#0d1b24] border border-[#233845] rounded-lg hover:border-[#334b5c] transition-colors focus-within:border-accent ring-1 ring-black/20 h-12 overflow-hidden">
                  <input
                    type="number"
                    value={autoCashout}
                    onChange={(e) =>
                      setAutoCashout(Math.max(1.01, Number(e.target.value)))
                    }
                    className="w-full bg-transparent p-2 pl-4 text-white font-bold outline-none focus:ring-0 text-sm"
                    min="1.01"
                    step="0.01"
                    disabled={gameState !== "idle" && hasBet}
                  />
                  <div className="pr-4 text-text-secondary font-bold text-sm pointer-events-none">×</div>
                </div>
              </div>
            </div>

            <div className="flex-1"></div>

            {gameState === "idle" || !hasBet ? (
              <button
                onClick={handleBet}
                disabled={gameState === "playing" || balance < betAmount || betAmount <= 0}
                className={cn(
                  "w-full py-4 rounded-lg text-[#000] font-extrabold uppercase tracking-wider bg-accent hover:bg-accent-hover disabled:bg-[#233845] disabled:text-text-secondary disabled:shadow-none transition-all shadow-[0_0_20px_rgba(0,231,1,0.2)] hover:shadow-[0_0_25px_rgba(0,231,1,0.4)] text-sm",
                )}
              >
                {gameState === "playing" ? "En cours..." : "Jouer"}
              </button>
            ) : (
              <button
                onClick={handleCashout}
                disabled={cashedOut || gameState === "crashed"}
                className={cn(
                  "w-full py-4 rounded-lg font-extrabold uppercase tracking-wider transition-all text-sm",
                  cashedOut || gameState === "crashed"
                    ? "bg-[#233845] text-text-secondary shadow-none cursor-not-allowed"
                    : "bg-[#00e701] text-[#000] hover:bg-[#1fff20] shadow-[0_0_20px_rgba(0,231,1,0.4)]"
                )}
              >
                {cashedOut
                  ? "Retiré !"
                  : `Retrait`}
                {!cashedOut && (
                  <span className="ml-2 bg-black/10 px-2 py-0.5 rounded backdrop-blur-sm">
                    {(betAmount * multiplier).toFixed(8)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 bg-[#0f212e] md:rounded-r-2xl md:rounded-bl-none rounded-b-2xl relative flex flex-col overflow-hidden border border-l-0 border-[#233845] order-1 md:order-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                "text-6xl md:text-8xl font-black tabular-nums transition-colors drop-shadow-2xl",
                gameState === "crashed" ? "text-[#ed4163]" : "text-white",
              )}
            >
              {multiplier.toFixed(2)}
              <span className="text-4xl text-white/50">×</span>
            </motion.div>

            {gameState === "crashed" && (
              <div className="mt-4 text-[#ed4163] font-bold text-xl uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm animate-pulse">
                Crashed
              </div>
            )}
            {cashedOut && gameState !== "crashed" && (
              <div className="mt-4 text-[#00e676] font-bold text-xl uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm">
                Gagné ! +€{winAmount.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
