import React, { useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { Coins } from 'lucide-react';
import { WinPopup } from './WinPopup';

const SEGMENTS = {
  low: [
    { m: 1.5, color: '#3b82f6' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, 
    { m: 0.0, color: '#475569' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' },
    { m: 1.5, color: '#3b82f6' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, 
    { m: 0.0, color: '#475569' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' },
    { m: 1.5, color: '#3b82f6' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, 
    { m: 0.0, color: '#475569' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' },
    { m: 1.5, color: '#3b82f6' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, 
    { m: 0.0, color: '#475569' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' },
    { m: 1.5, color: '#3b82f6' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, 
    { m: 0.0, color: '#475569' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }, { m: 1.2, color: '#10b981' }
  ],
  high: [
    { m: 49.5, color: '#f59e0b' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' },
    { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' },
    { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' },
    { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 9.9, color: '#ef4444' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' },
    { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }, { m: 0.0, color: '#475569' }
  ]
};

export function Wheel() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [risk, setRisk] = useState<'low' | 'high'>('low');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const controls = useAnimation();
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const segments = SEGMENTS[risk];
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  const handleSpin = async () => {
    if (!user || balance < betAmount || isSpinning) return;
    
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
    const targetAngle = -(winIndex * anglePerSegment + anglePerSegment / 2) + extraSpins;
    
    const newRotation = rotation + targetAngle - (rotation % 360);

    await controls.start({
       rotate: newRotation,
       transition: { duration: 3, ease: [0.2, 0.8, 0.2, 1] } // Custom easeOut function
    });

    setRotation(newRotation);
    setIsSpinning(false);
    
    const payout = betAmount * winMultiplier;
    if (winMultiplier > 0) {
       addBalance(payout);
    }
    
    recordBet('Wheel', betAmount, winMultiplier, payout - betAmount);
    setWinInfo({ multiplier: winMultiplier, payout });
  };

  // Helper to generate SVG pie slices
  const createSlices = () => {
    let paths = [];
    let currentAngle = 0;

    for (let i = 0; i < numSegments; i++) {
      const segAngle = Math.PI * 2 / numSegments;
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
        `Z`
      ].join(' ');

      // Also need text position (middle of slice)
      const textAngle = startAngle + segAngle / 2;
      const textX = 50 + 40 * Math.cos(textAngle);
      const textY = 50 + 40 * Math.sin(textAngle);
      const textRotate = (textAngle + Math.PI/2) * (180 / Math.PI); // rotate text to face outward

      paths.push(
        <g key={i}>
           <path d={pathData} fill={segments[i].color} stroke="#1A2C38" strokeWidth="0.5" />
        </g>
      );
      currentAngle += segAngle;
    }
    return paths;
  };

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
                disabled={isSpinning}
              />
               <div className="flex items-center gap-1 pr-1">
                <button onClick={() => setBetAmount(prev => +(prev / 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">½</button>
                <button onClick={() => setBetAmount(prev => +(prev * 2).toFixed(2))} className="bg-[#2c4755] hover:bg-[#345464] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">2×</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-text-secondary text-sm font-semibold">Risque</label>
            <div className="flex gap-2">
               <button 
                  onClick={() => setRisk('low')}
                  disabled={isSpinning}
                  className={cn("flex-1 py-2 rounded font-bold text-sm", risk === 'low' ? "bg-bg-inner text-white border border-border-medium" : "bg-transparent text-text-secondary")}
               >
                  Faible
               </button>
               <button 
                  onClick={() => setRisk('high')}
                  disabled={isSpinning}
                  className={cn("flex-1 py-2 rounded font-bold text-sm", risk === 'high' ? "bg-bg-inner text-white border border-border-medium" : "bg-transparent text-text-secondary")}
               >
                  Élevé
               </button>
            </div>
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={handleSpin}
            disabled={isSpinning || balance < betAmount}
            className={cn(
              "w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] shadow-[0_4px_0_#00a84b]",
              "active:translate-y-1 active:shadow-[0_0px_0_#00a84b]",
              (isSpinning || balance < betAmount) && "opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-[0_4px_0_#00a84b]"
            )}
          >
            Tourner
          </button>
        </div>

        {/* Right Side: Game Canvas */}
        <div className="md:col-span-9 bg-[#0f172a] relative flex flex-col items-center justify-center overflow-hidden p-8">
           
           {/* Win Popup */}
           {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}

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
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                     {createSlices()}
                 </svg>
              </motion.div>
           </div>
           
        </div>
      </div>
    </div>
  );
}
