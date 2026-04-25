import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';
import { WinPopup } from './WinPopup';
import { motion, AnimatePresence } from 'motion/react';

type Difficulty = 'Classique' | 'Faible' | 'Moyen' | 'Élevé';

const playSound = (type: 'draw' | 'hit' | 'miss') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (type === 'hit') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
            osc.frequency.exponentialRampToValueAtTime(329.63, audioCtx.currentTime + 0.05); // E4
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'miss') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.15);
        } else if (type === 'draw') {
             osc.type = 'sine';
             osc.frequency.setValueAtTime(150, audioCtx.currentTime);
             gain.gain.setValueAtTime(0, audioCtx.currentTime);
             gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.01);
             gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
             osc.start(audioCtx.currentTime);
             osc.stop(audioCtx.currentTime + 0.1);
        }
    } catch(e) {
        console.warn('Audio play restricted', e);
    }
};

const PAYOUTS: Record<Difficulty, Record<number, number[]>> = {
  Classique: {
    1: [0.00, 3.80],
    2: [0.00, 1.70, 5.20],
    3: [0.00, 0.00, 2.70, 48.00],
    4: [0.00, 0.00, 1.70, 10.00, 84.00],
    5: [0.00, 0.00, 1.40, 4.00, 14.00, 390.00],
    6: [0.00, 0.00, 0.00, 3.00, 9.00, 70.00, 700.00],
    7: [0.00, 0.00, 0.00, 2.00, 7.00, 30.00, 280.00, 800.00],
    8: [0.00, 0.00, 0.00, 0.00, 6.50, 20.00, 80.00, 300.00, 900.00],
    9: [0.00, 0.00, 0.00, 0.00, 4.50, 13.00, 60.00, 200.00, 500.00, 1000.00],
    10: [0.00, 0.00, 0.00, 1.40, 2.25, 4.50, 8.00, 17.00, 50.00, 80.00, 100.00]
  },
  Faible: {
    1: [0.00, 3.80],
    2: [0.00, 1.10, 6.10],
    3: [0.00, 1.10, 1.38, 39.00],
    4: [0.00, 1.10, 1.50, 3.80, 89.00],
    5: [0.00, 0.00, 1.50, 4.80, 15.00, 150.00],
    6: [0.00, 0.00, 1.10, 2.00, 5.50, 45.00, 160.00],
    7: [0.00, 0.00, 1.10, 1.60, 4.00, 14.00, 70.00, 200.00],
    8: [0.00, 0.00, 1.10, 1.20, 2.70, 7.50, 30.00, 100.00, 250.00],
    9: [0.00, 0.00, 1.10, 1.20, 2.00, 4.40, 16.00, 50.00, 130.00, 270.00],
    10: [0.00, 0.00, 1.10, 1.00, 1.50, 2.60, 6.10, 21.00, 65.00, 130.00, 250.00]
  },
  Moyen: {
    1: [0.00, 3.80],
    2: [0.00, 0.00, 5.80],
    3: [0.00, 0.00, 2.60, 50.00],
    4: [0.00, 0.00, 1.70, 10.00, 100.00],
    5: [0.00, 0.00, 0.00, 5.00, 21.00, 220.00],
    6: [0.00, 0.00, 0.00, 2.00, 10.00, 60.00, 400.00],
    7: [0.00, 0.00, 0.00, 0.00, 8.00, 40.00, 400.00, 500.00],
    8: [0.00, 0.00, 0.00, 0.00, 4.00, 15.00, 100.00, 400.00, 700.00],
    9: [0.00, 0.00, 0.00, 0.00, 2.50, 10.00, 30.00, 150.00, 500.00, 800.00],
    10: [0.00, 0.00, 0.00, 0.00, 1.50, 5.50, 15.00, 40.00, 100.00, 250.00, 500.00]
  },
  Élevé: {
    1: [0.00, 3.80],
    2: [0.00, 0.00, 6.80],
    3: [0.00, 0.00, 0.00, 81.00],
    4: [0.00, 0.00, 0.00, 15.00, 200.00],
    5: [0.00, 0.00, 0.00, 0.00, 50.00, 800.00],
    6: [0.00, 0.00, 0.00, 0.00, 23.00, 160.00, 900.00],
    7: [0.00, 0.00, 0.00, 0.00, 4.00, 100.00, 500.00, 1000.00],
    8: [0.00, 0.00, 0.00, 0.00, 0.00, 40.00, 240.00, 700.00, 1000.00],
    9: [0.00, 0.00, 0.00, 0.00, 0.00, 20.00, 100.00, 300.00, 800.00, 1000.00],
    10: [0.00, 0.00, 0.00, 0.00, 0.00, 6.50, 50.00, 250.00, 500.00, 800.00, 1000.00]
  }
};

export function Keno() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(0.00000001);
  const [difficulty, setDifficulty] = useState<Difficulty>('Classique');
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const toggleNumber = (num: number) => {
    if (isDrawing) return;
    
    // Add small click sound
    playSound('draw');
    
    if (selected.includes(num)) {
      setSelected(selected.filter(n => n !== num));
    } else {
      if (selected.length < 10) {
        setSelected([...selected, num]);
      }
    }
  };

  const randomSelect = () => {
    if (isDrawing) return;
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
    if (!user) {
        alert("Veuillez vous connecter !");
        return;
    }
    if (selected.length === 0 || betAmount <= 0 || betAmount > balance || isDrawing) return;

    const success = await subtractBalance(betAmount);
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
      await new Promise(r => setTimeout(r, 150));
      const currentDraw = newDraws[i];
      setDrawn(prev => [...prev, currentDraw]);
      
      if (selected.includes(currentDraw)) {
          playSound('hit');
      } else {
          playSound('miss');
      }
    }

    // Wait a bit before showing result
    await new Promise(r => setTimeout(r, 400));

    // Calculate hits
    let hits = 0;
    newDraws.forEach(d => {
      if (selected.includes(d)) hits++;
    });

    const multiplier = PAYOUTS[difficulty][selected.length][hits] || 0;
    const payout = betAmount * multiplier;

    if (payout > 0) {
      await addBalance(payout);
      setWinInfo({ multiplier, payout });
    }

    await recordBet('Keno', betAmount, multiplier, payout - betAmount);
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col md:flex-row max-w-[1200px] mx-auto p-4 md:p-8 gap-4 min-h-[calc(100vh-80px)]">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-[320px] bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 overflow-hidden z-10 p-4 gap-4">
        
        <div className="bg-bg-inner flex w-full p-1 rounded-full border border-border-medium shadow-inner">
           <button className="flex-1 py-1.5 bg-border-medium rounded-full text-white text-sm font-bold shadow text-center">Manuel</button>
           <button className="flex-1 py-1.5 text-text-secondary hover:text-white text-sm font-bold transition-colors text-center cursor-not-allowed">Auto</button>
        </div>

        <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold opacity-80">
               <span className="text-text-secondary">Montant du Pari</span>
               <span className="text-white font-mono">0.00 $US</span>
            </div>
            <div className="flex items-center bg-bg-inner border border-border-medium rounded shadow-inner h-11">
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent p-3 text-white font-mono outline-none text-sm font-bold"
              />
              <span className="pr-3 flex items-center">
                 <span className="text-emerald-500 font-bold font-mono text-[10px] leading-none bg-emerald-500/20 w-4 h-4 flex items-center justify-center rounded-full shrink-0">T</span>
              </span>
              <div className="flex h-full border-l border-border-medium divide-x divide-border-medium shrink-0">
                 <button onClick={() => setBetAmount(prev => prev/2)} className="px-3 hover:bg-border-subtle text-xs font-semibold text-text-secondary transition-colors">½</button>
                 <button onClick={() => setBetAmount(prev => prev*2)} className="px-3 hover:bg-border-subtle text-xs font-semibold text-text-secondary transition-colors">2×</button>
              </div>
            </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
           <label className="text-xs font-semibold text-text-secondary opacity-80">Difficulté</label>
           <div className="relative">
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                disabled={isDrawing}
                className="w-full bg-bg-inner border border-border-medium rounded px-3 py-2.5 text-white font-bold text-sm outline-none focus:ring-1 focus:ring-accent appearance-none disabled:opacity-50"
              >
                 {(['Classique', 'Faible', 'Moyen', 'Élevé'] as Difficulty[]).map(d => (
                    <option key={d} value={d}>{d}</option>
                 ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary opacity-50">▼</div>
           </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
            <button onClick={randomSelect} disabled={isDrawing} className="w-full py-2.5 rounded bg-[#2a3f4c] hover:bg-[#344d5c] text-white text-sm font-bold shadow transition-colors">
              Sélection aléatoire
            </button>
            <button onClick={clearTable} disabled={isDrawing} className="w-full py-2.5 rounded bg-[#2a3f4c] hover:bg-[#344d5c] text-white text-sm font-bold shadow transition-colors">
              Vider la Table
            </button>
        </div>

        <button 
          onClick={handleBet}
          disabled={isDrawing || selected.length === 0 || betAmount <= 0 || betAmount > balance}
          className="w-full py-3.5 mt-2 rounded text-white font-bold text-lg bg-[#1475e1] hover:bg-[#1b80f0] transition-colors shadow disabled:opacity-30 disabled:bg-bg-inner disabled:text-text-secondary"
        >
          Pari
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-bg-panel/40 rounded-b-xl md:rounded-r-xl md:rounded-bl-none flex flex-col items-center md:order-2 p-4 md:p-8 relative overflow-hidden">
        
        {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}

        <div className="w-full max-w-[800px] flex flex-col gap-6 relative">
            
            {/* Grid 8x5 */}
            <div className="grid grid-cols-8 gap-1.5 md:gap-2">
               {Array.from({length: 40}, (_, i) => i + 1).map(n => {
                  const isSelected = selected.includes(n);
                  const isDrawn = drawn.includes(n);
                  const isHit = isSelected && isDrawn;
                  const isMiss = !isSelected && isDrawn;

                  return (
                     <button
                        key={n}
                        onClick={() => toggleNumber(n)}
                        className={cn(
                           "aspect-square rounded-md font-bold text-sm md:text-lg flex items-center justify-center transition-all relative overflow-hidden",
                           (!isSelected && !isDrawn) && "bg-[#213743] hover:bg-[#2c4755] text-white/80 hover:-translate-y-0.5 border-b-[3px] border-[#1a2c38]",
                           (isSelected && !isDrawn) && "bg-[#8b5cf6] text-white border-b-[3px] border-[#7c3aed]", // Purple selection, no gem
                           isHit && "bg-[#8b5cf6] text-transparent border-b-[3px] border-[#7c3aed]", // Hit: purple bg + gem (text hidden)
                           isMiss && "bg-[#213743] text-red-500 border-b-[3px] border-[#1a2c38]" // Miss: red text
                        )}
                     >
                        {n}
                        {(isSelected || isHit) && (
                            <div className="absolute inset-x-0 bottom-0 h-full w-full pointer-events-none rounded-md ring-2 ring-inset ring-white/10"></div>
                        )}
                        {/* Gem SVG ONLY shown if it's a hit */}
                        <AnimatePresence>
                        {isHit && (
                           <motion.div 
                               initial={{ scale: 0, rotate: -45 }}
                               animate={{ scale: 1, rotate: 0 }}
                               transition={{ type: "spring", stiffness: 400, damping: 15 }}
                               className="absolute inset-2 flex items-center justify-center"
                            >
                              <motion.div 
                                 initial={{ opacity: 0, scale: 0 }}
                                 animate={{ opacity: [0, 0.5, 0], scale: [1, 2, 3] }}
                                 transition={{ duration: 0.5, ease: "easeOut" }}
                                 className="absolute inset-0 bg-[#00E701] rounded-full blur-[20px] pointer-events-none"
                               />
                              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md relative z-10">
                                 <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="#00e676" stroke="#000" strokeWidth="2" strokeOpacity="0.2"/>
                                 <polygon points="50,15 80,35 50,45 20,35" fill="#69f0ae" opacity="0.8"/>
                                 <polygon points="20,35 50,45 50,85 10,70" fill="#00e676" opacity="0.5"/>
                              </svg>
                           </motion.div>
                        )}
                        </AnimatePresence>
                        {isHit && (
                            <div className="absolute inset-0 border-2 border-[#00e676] rounded-md animate-pulse pointer-events-none"></div>
                        )}
                     </button>
                  );
               })}
            </div>

            {/* Payouts Bar */}
            {selected.length > 0 && (
                <div className="flex flex-col w-full bg-bg-inner rounded-md p-1 mt-4 gap-1 overflow-x-auto scroller-hide">
                    {/* Multipliers */}
                    <div className="flex w-full gap-1">
                        {currentPayouts.map((mult, i) => {
                            const hits = drawn.filter(n => selected.includes(n)).length;
                            const isCurrentHit = !isDrawing && drawn.length === 10 && hits === i;

                            return (
                            <div key={i} className={cn(
                                "flex-1 min-w[40px] py-1.5 flex flex-col items-center justify-center rounded-sm text-xs font-bold transition-colors",
                                isCurrentHit ? "bg-[#00e676] text-[#0f1116]" : "bg-[#213743] text-white"
                            )}>
                                {mult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×
                            </div>
                            );
                        })}
                    </div>
                    {/* Match Numbers */}
                    <div className="flex w-full gap-1">
                        {currentPayouts.map((_, i) => (
                            <div key={i} className="flex-1 min-w[40px] py-1 flex items-center justify-center text-[10px] text-text-secondary font-bold font-mono">
                                {i}×
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
