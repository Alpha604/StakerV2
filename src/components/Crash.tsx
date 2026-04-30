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

  const [isAutoCashoutEnabled, setIsAutoCashoutEnabled] = useState(false);

  const stateRef = useRef({
    hasBet: false,
    cashedOut: false,
    autoCashout: 2.0,
    isAutoCashoutEnabled: false,
    betAmount: 10,
  });

  useEffect(() => {
    stateRef.current.autoCashout = autoCashout;
    stateRef.current.isAutoCashoutEnabled = isAutoCashoutEnabled;
    stateRef.current.betAmount = betAmount;
  }, [autoCashout, isAutoCashoutEnabled, betAmount]);

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
    stateRef.current.hasBet = true;
    stateRef.current.cashedOut = false;
    setWinAmount(0);
    // Start sequence
    startSequence();
  };

  const handleCashout = (forcedMultiplier?: number) => {
    if (gameState === "playing" && stateRef.current.hasBet && !stateRef.current.cashedOut) {
      setCashedOut(true);
      stateRef.current.cashedOut = true;
      const m = forcedMultiplier || multiplier;
      const payout = betAmount * m;
      setWinAmount(payout);
      addBalance(payout);
      recordBet("Crash", betAmount, m, payout - betAmount);
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
      const { isAutoCashoutEnabled, hasBet, cashedOut, autoCashout, betAmount } = stateRef.current;

      // Handle Auto Cashout AT exact multiplier
      if (isAutoCashoutEnabled && hasBet && !cashedOut && currentMulti >= autoCashout) {
        if (autoCashout <= point) {
           setCashedOut(true);
           stateRef.current.cashedOut = true;
           const payout = betAmount * autoCashout;
           setWinAmount(payout);
           addBalance(payout);
           recordBet("Crash", betAmount, autoCashout, payout - betAmount);
        }
      }

      if (currentMulti >= point) {
        // Crash!
        setMultiplier(point);
        setGameState("crashed");

        if (stateRef.current.hasBet && !stateRef.current.cashedOut) {
          // Lost
          recordBet("Crash", stateRef.current.betAmount, 0, -stateRef.current.betAmount);
        }

        setTimeout(() => {
          setGameState("idle");
          setHasBet(false);
          setCashedOut(false);
          stateRef.current.hasBet = false;
          stateRef.current.cashedOut = false;
          setMultiplier(1.0);
        }, 3000);
        return;
      }

      setMultiplier(currentMulti);
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

    // Draw ball at the end
    if (multiplier >= 1) {
      const targetYScaleLast = multiplier > 2 ? multiplier : 2;
      const lastX = width * 0.8;
      const lastY = height - ((multiplier - 1) / (targetYScaleLast - 1)) * (height * 0.8);
      
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = gameState === "crashed" ? "#ed4163" : "#00e676";
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }

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
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
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
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 text-[13px]"
                  min="0"
                  step="0.01"
                  disabled={gameState !== "idle" && hasBet}
                />
                <div className="flex h-full border-l border-[#2f4553] divide-x divide-[#2f4553]">
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)} className="px-3 hover:bg-[#2f4553] text-[13px] font-bold transition-colors text-white" disabled={gameState !== "idle" && hasBet}> ½ </button>
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)} className="px-3 hover:bg-[#2f4553] text-[13px] font-bold transition-colors text-white" disabled={gameState !== "idle" && hasBet}> 2× </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">Auto Cashout</label>
                <button 
                  onClick={() => setIsAutoCashoutEnabled(!isAutoCashoutEnabled)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    isAutoCashoutEnabled ? "bg-[#00e676]" : "bg-[#2f4553]"
                  )}
                >
                  <div className={cn(
                    "absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full transition-all",
                    isAutoCashoutEnabled && "transform translate-x-4"
                  )} />
                </button>
              </div>
              <div className={cn(
                  "relative flex items-center bg-[#0f212e] rounded border border-[#2f4553] h-[40px] overflow-hidden transition-colors",
                  isAutoCashoutEnabled ? "hover:border-[#334b5c] focus-within:border-[#557086]" : "opacity-50"
              )}>
                <input
                  type="number"
                  value={autoCashout}
                  onChange={(e) =>
                    setAutoCashout(Math.max(1.01, Number(e.target.value)))
                  }
                  className="w-full bg-transparent p-2 pl-4 text-white font-bold outline-none focus:ring-0 text-[13px]"
                  min="1.01"
                  step="0.01"
                  disabled={!isAutoCashoutEnabled || (gameState !== "idle" && hasBet)}
                />
                <div className="pr-4 text-[#8b9ba5] font-bold pointer-events-none">×</div>
              </div>
            </div>

            <div className="flex-1"></div>

            {gameState === "idle" || !hasBet ? (
              <button
                onClick={handleBet}
                disabled={gameState === "playing" || balance < betAmount || betAmount <= 0}
                className={cn(
                  "w-full py-3.5 rounded font-bold transition-all text-sm bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black",
                  (gameState === "playing" || balance < betAmount || betAmount <= 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                {gameState === "playing" ? "En cours..." : "Pari"}
              </button>
            ) : (
              <button
                onClick={handleCashout}
                disabled={cashedOut || gameState === "crashed"}
                className={cn(
                  "w-full py-3.5 rounded font-bold transition-all text-sm flex items-center justify-center gap-2",
                  (cashedOut || gameState === "crashed") 
                    ? "bg-[#1bc86a]/40 text-black/50 cursor-not-allowed"
                    : "bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black"
                )}
              >
                <span>{cashedOut ? "Retiré !" : "Retrait"}</span>
                {!cashedOut && (
                  <span className="flex items-center gap-1">
                    {(Math.floor(betAmount * multiplier * 100) / 100).toFixed(2)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="flex-1 bg-[#0f212e] lg:rounded-r-2xl lg:rounded-bl-none rounded-b-2xl relative flex flex-col overflow-hidden border border-l-0 border-[#233845] order-1 lg:order-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
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
