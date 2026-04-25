import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins, Target } from 'lucide-react';

export function Crash() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashPoint, setCrashPoint] = useState<number>(1.00);
  
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
    return Math.max(1.00, result);
  };

  const handleBet = () => {
    if (!user || balance < betAmount) return;
    subtractBalance(betAmount);
    setHasBet(true);
    setCashedOut(false);
    setWinAmount(0);
    // Start sequence
    startSequence();
  };

  const handleCashout = () => {
    if (gameState === 'playing' && hasBet && !cashedOut) {
       setCashedOut(true);
       const payout = betAmount * multiplier;
       setWinAmount(payout);
       addBalance(payout);
       recordBet('Crash', betAmount, multiplier, payout - betAmount);
    }
  };

  const startSequence = () => {
    setGameState('playing');
    setMultiplier(1.00);
    const point = generateCrashPoint();
    setCrashPoint(point);
    startTimeRef.current = Date.now();
    
    const tick = () => {
       const elapsed = (Date.now() - startTimeRef.current) / 1000;
       const currentMulti = Math.pow(Math.E, growthRate * elapsed);
       
       if (currentMulti >= point) {
          // Crash!
          setMultiplier(point);
          setGameState('crashed');
          
          if (hasBet && !cashedOut) {
             // Lost
             recordBet('Crash', betAmount, 0, -betAmount);
          }
          
          setTimeout(() => {
             setGameState('idle');
             setHasBet(false);
             setCashedOut(false);
             setMultiplier(1.00);
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#1a2c38';
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
    if (gameState === 'idle') return;

    ctx.beginPath();
    ctx.moveTo(0, height);

    // Simulate curve progress
    const points = 100;
    const currentMaxTime = (Math.log(multiplier) / growthRate) || 0.1;
    
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

    ctx.strokeStyle = gameState === 'crashed' ? '#ed4163' : '#00e676';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Fill under curve
    ctx.lineTo(width * 0.8, height);
    ctx.lineTo(0, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (gameState === 'crashed') {
       gradient.addColorStop(0, 'rgba(237, 65, 99, 0.5)');
       gradient.addColorStop(1, 'rgba(237, 65, 99, 0)');
    } else {
       gradient.addColorStop(0, 'rgba(0, 230, 118, 0.5)');
       gradient.addColorStop(1, 'rgba(0, 230, 118, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [multiplier, gameState]);

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-bg-panel rounded-2xl overflow-hidden shadow-2xl min-h-[600px] md:min-h-[500px]">
        
        {/* Left Side: Controls */}
        <div className="md:col-span-3 bg-[#213743] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-medium z-10 relative">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-text-secondary text-sm font-semibold">Montant</label>
              <span className="text-text-secondary text-sm">€{(balance || 0).toFixed(2)}</span>
            </div>
            <div className="relative flex items-center bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover">
              <div className="pl-3 pr-2 flex items-center justify-center">
                <Coins size={16} className="text-text-secondary" />
              </div>
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-bold outline-none tabular-nums"
                min="0"
                step="0.01"
                disabled={gameState !== 'idle' && hasBet}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <label className="text-text-secondary text-sm font-semibold">Auto Cashout</label>
            </div>
            <div className="relative flex items-center bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover">
              <input 
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-bold outline-none tabular-nums pl-3"
                min="1.01"
                step="0.01"
                disabled={gameState !== 'idle' && hasBet}
              />
              <div className="pr-3 text-text-secondary font-bold">×</div>
            </div>
          </div>

          <div className="flex-1"></div>

          {gameState === 'idle' || !hasBet ? (
             <button 
                onClick={handleBet}
                disabled={gameState === 'playing' || balance < betAmount}
                className={cn(
                  "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
                  "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
                  (gameState === 'playing' || balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-[0_4px_0_#00a84b]"
                )}
             >
                {gameState === 'playing' ? 'En cours...' : 'Miser'}
             </button>
          ) : (
             <button 
                onClick={handleCashout}
                disabled={cashedOut || gameState === 'crashed'}
                className={cn(
                  "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#ff9800] hover:bg-[#f57c00] text-[#0f1116] shadow-[0_4px_0_#e65100]",
                  "active:translate-y-1 active:shadow-[0_0px_0_#e65100]",
                  (cashedOut || gameState === 'crashed') && "opacity-50 cursor-not-allowed active:translate-y-0"
                )}
             >
                {cashedOut ? 'Retiré !' : `Retirer (€${(betAmount * multiplier).toFixed(2)})`}
             </button>
          )}
        </div>

        {/* Right Side: Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative flex flex-col overflow-hidden">
           
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
                    gameState === 'crashed' ? "text-[#ed4163]" : "text-white"
                 )}
              >
                 {multiplier.toFixed(2)}<span className="text-4xl text-white/50">×</span>
              </motion.div>
              
              {gameState === 'crashed' && (
                 <div className="mt-4 text-[#ed4163] font-bold text-xl uppercase tracking-widest bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm animate-pulse">
                    Crashed
                 </div>
              )}
              {cashedOut && gameState !== 'crashed' && (
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
