import React, { useState, useEffect, useRef } from 'react';
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { formatCurrency } from '../lib/utils';
import { Volume2, Settings, MessageSquare, Menu, HelpCircle, FileText, Anchor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../lib/useSound';
import { WinPopup } from './WinPopup';

const SEGMENTS = 54;
const segmentsConfig = [
  { type: 'silver', color: '#c4d6da', textColor: '#475569', label: '', sub: "", multiplier: 2, isPattern: true },
  { type: 'blue', color: '#0054ff', textColor: '#ffffff', label: '10x', sub: "LIL' BLUES", multiplier: 10 },
  { type: 'orange', color: '#ff7700', textColor: '#ffffff', label: 'X', sub: "BIG ORANGE", multiplier: 20 }, // Replaced label to X so it just renders a dot/icon if I want, or just empty. Wait, the user image shows LIL' BLUES has 10x, HUGE REDS has 5x.
  { type: 'red', color: '#d91122', textColor: '#ffffff', label: '5x', sub: "HUGE REDS", multiplier: 5 },
];

const wheelLayout = [
  0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3
];

function getCoordinatesForPercent(percent: number, radius: number = 50) {
  const x = Math.cos(2 * Math.PI * percent - Math.PI / 2) * radius;
  const y = Math.sin(2 * Math.PI * percent - Math.PI / 2) * radius;
  return [x + 50, y + 50];
}

const SHADOW_CHIPS = [
   { value: 0.1, color: "bg-gray-400" },
   { value: 1, color: "bg-red-500" },
   { value: 5, color: "bg-blue-500" },
   { value: 25, color: "bg-emerald-500" },
   { value: 100, color: "bg-amber-500" },
   { value: 500, color: "bg-purple-500" }
];

export function IceFishing() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser() as any;
  const { playTick, playWin, playLoss } = useSound();
  
  const [bets, setBets] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [selectedChipIndex, setSelectedChipIndex] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => (a as number) + (b as number), 0) as number;

  const placeBetOnTrack = async (trackIndex: number) => {
     if (isSpinning) return;
     const chipValue = SHADOW_CHIPS[selectedChipIndex].value;
     if (balance < chipValue) return;

     const success = await subtractBalance(chipValue);
     if (success) {
        setBets(prev => ({ ...prev, [trackIndex]: prev[trackIndex] + chipValue }));
        playTick();
     }
  };

  const clearBets = () => {
      if (isSpinning) return;
      if (totalBet > 0) {
         addBalance(totalBet);
         setBets({ 0: 0, 1: 0, 2: 0, 3: 0 });
      }
  };

  const handleSpin = () => {
    if (isSpinning || totalBet <= 0) return;

    setIsSpinning(true);
    setWinInfo(null);

    const targetSegment = Math.floor(Math.random() * SEGMENTS);
    const confIdx = wheelLayout[targetSegment];
    const segmentConfig = segmentsConfig[confIdx];

    const segmentAngle = 360 / SEGMENTS;
    const targetAngle = targetSegment * segmentAngle + (segmentAngle / 2);
    
    const spins = 5;
    const currentRot = rotation % 360;
    const finalRotation = rotation - currentRot + (360 * spins) - targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
        setIsSpinning(false);
        const payoutConfig = segmentsConfig[confIdx];
        
        let payout = 0;
        let profit = -totalBet;

        const betAmountOnWinning = bets[confIdx] || 0;
        if (betAmountOnWinning > 0) {
            payout = betAmountOnWinning + (betAmountOnWinning * payoutConfig.multiplier);
            profit += payout;
            addBalance(payout);
            playWin();
            
            if (payoutConfig.multiplier >= 5) {
                setWinInfo({ multiplier: payoutConfig.multiplier, payout });
            }
        } else {
            playLoss();
        }

        recordBet({
            game: "Ice Fishing",
            betAmount: totalBet,
            multiplier: betAmountOnWinning > 0 ? payoutConfig.multiplier : 0,
            payout,
            profit
        });

        setBets({ 0: 0, 1: 0, 2: 0, 3: 0 });
    }, 7000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] min-h-[600px] w-full bg-[#0c1f2e] text-white relative overflow-hidden rounded-md font-sans border border-[#3f5d72] shadow-2xl">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex flex-col select-none">
               <span className="text-sm font-bold tracking-widest text-[#cfdfe8] drop-shadow-md">Ice Fishing €0.10 - 10,000</span>
               <div className="text-[10px] text-gray-300 font-medium">Covered 0.00% €0</div>
               <div className="text-[10px] text-gray-300 bg-black/40 px-2 py-0.5 mt-1 rounded-full w-max border border-white/10 cursor-pointer hover:bg-white/10">Click to chat</div>
            </div>
         </div>
         <div className="flex items-center gap-2 pointer-events-auto text-[#dce7eb]">
            <button className="hover:text-white transition-colors bg-black/40 p-1.5 rounded-full"><Volume2 size={18} /></button>
            <button className="hover:text-white transition-colors bg-black/40 p-1.5 rounded-full"><Settings size={18} /></button>
            <button className="hover:text-white transition-colors bg-black/40 p-1.5 rounded-full"><HelpCircle size={18} /></button>
            <button className="hover:text-white transition-colors bg-black/40 p-1.5 rounded-full"><FileText size={18} /></button>
            <button className="hover:text-white transition-colors bg-black/40 p-1.5 rounded-full"><Menu size={18} /></button>
         </div>
      </div>

      {/* GAME AREA */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden h-full">
         {/* Ice Cave Background */}
         <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-[10s]"
            style={{ 
               backgroundImage: 'url("https://lawbhoomi.com/wp-content/uploads/2025/12/Ice-Fishing-Casino-Game-Review.jpg")', 
               filter: 'blur(3px) brightness(0.7)' 
            }}
         />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.8)_100%)] mix-blend-overlay"></div>
         
         {/* Ice elements top */}
         <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
             <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-[#c4d6da] opacity-90 drop-shadow-2xl"></div>
             <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[50px] border-t-[#ffffff] opacity-100 absolute top-0 left-1/2 -translate-x-1/2"></div>
             {/* Red pointer tip */}
             <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-4 h-6 bg-[#d91122] rounded-full drop-shadow-[0_0_8px_rgba(217,17,34,0.8)] z-40 transform rotate-180" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
         </div>

         {/* THE WHEEL */}
         <div className="relative z-20 flex items-center justify-center transform scale-[0.55] sm:scale-[0.7] md:scale-85 lg:scale-100 xl:scale-110 transition-transform origin-center mt-[-30px]">
             
             {/* Background glow behind wheel */}
             <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full"></div>

             {/* The Rotating Wheel */}
             <div 
                className="w-[700px] h-[700px] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.8)] border-[12px] border-[#4b6a7a] relative overflow-hidden"
                style={{
                   transform: `rotate(${rotation}deg)`,
                   transition: isSpinning ? 'transform 7s cubic-bezier(0.2, 0.05, 0.1, 1)' : 'none',
                   background: '#7faac6'
                }}
             >
                <div className="absolute inset-0 rounded-full border-[6px] border-[#a0c4da] z-10 pointer-events-none mix-blend-overlay"></div>
                <div className="absolute inset-2 rounded-full border-[4px] border-[#597d92] z-10 pointer-events-none"></div>

                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                   {/* Render Slices */}
                   {wheelLayout.map((confIdx, i) => {
                       const startPercent = i / SEGMENTS;
                       const endPercent = (i + 1) / SEGMENTS;
                       const [startX, startY] = getCoordinatesForPercent(startPercent);
                       const [endX, endY] = getCoordinatesForPercent(endPercent);
                       const config = segmentsConfig[confIdx];
                       
                       const pathData = [
                         `M 50 50`,
                         `L ${startX} ${startY}`,
                         `A 50 50 0 0 1 ${endX} ${endY}`,
                         `Z`
                       ].join(' ');

                       return (
                          <g key={i}>
                             <path d={pathData} fill={config.color} stroke="#4b6a7a" strokeWidth="0.3" />
                          </g>
                       );
                   })}

                   {/* Render Labels separately so they stay on top of paths */}
                   {wheelLayout.map((confIdx, i) => {
                       const midPercent = (i + 0.5) / SEGMENTS;
                       const midAngle = midPercent * 360;
                       const config = segmentsConfig[confIdx];
                       
                       return (
                          <g key={`text-${i}`} transform={`rotate(${midAngle}, 50, 50)`}>
                              {config.isPattern && (
                                 <g transform="translate(75, 45) scale(0.12) rotate(90)">
                                    <path d="M50 0 C70 30, 90 70, 50 100 C10 70, 30 30, 50 0 Z" fill="#ffffff" opacity="0.3" />
                                    <path d="M50 0 C60 15, 70 35, 50 50 C30 35, 40 15, 50 0 Z" fill="#ffffff" opacity="0.5" />
                                 </g>
                              )}
                              {config.label && (
                                <text 
                                   x="68" y="52" 
                                   fontSize="3.5" 
                                   fontWeight="900" 
                                   fontFamily="Arial" 
                                   fill={config.textColor}
                                   textAnchor="middle"
                                   transform={`rotate(90, 75, 50)`}
                                   style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.8)" }}
                                >
                                   {config.label}
                                </text>
                              )}
                              {config.sub && (
                                <text 
                                  x="83" y="51" 
                                  fontSize="2" 
                                  fontWeight="800"
                                  fontFamily="Arial" 
                                  fill={config.textColor}
                                  textAnchor="middle"
                                  transform={`rotate(90, 83, 50)`}
                                  className="uppercase"
                                  style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.8)" }}
                                >
                                  {config.sub}
                                </text>
                              )}
                          </g>
                       );
                   })}
                   
                   {/* Center Hub */}
                   <circle cx="50" cy="50" r="18" fill="#a0c4da" stroke="#4b6a7a" strokeWidth="1" filter="drop-shadow(0px 10px 15px rgba(0,0,0,0.5))" />
                   <circle cx="50" cy="50" r="15" fill="#e0ebf2" stroke="#ffffff" strokeWidth="0.5" />
                   <text x="50" y="53" fontSize="6" fontWeight="900" fill="#4a6071" textAnchor="middle" letterSpacing="1" opacity="0.6">ICE</text>
                   <text x="50" y="53" fontSize="6" fontWeight="900" fill="#2d3f4d" textAnchor="middle" letterSpacing="1" style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}>ICE</text>
                </svg>
                
                {/* Silver Pins around edge */}
                {Array.from({ length: 54 }).map((_, i) => (
                   <div 
                      key={`pin-${i}`}
                      className="absolute w-4 h-4 rounded-full bg-gradient-to-t from-[#6a8b9f] to-[#e4eef4] shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-[#304554] z-10 box-border"
                      style={{
                         top: `calc(50% - 0.5rem + ${Math.sin((i / 54) * Math.PI * 2) * 48}%)`,
                         left: `calc(50% - 0.5rem + ${Math.cos((i / 54) * Math.PI * 2) * 48}%)`,
                         transform: 'none'
                      }}
                   >
                     <div className="absolute inset-[3px] bg-white/60 rounded-full" />
                   </div>
                ))}

                {/* Inner Pins */}
                {Array.from({ length: 18 }).map((_, i) => (
                   <div 
                      key={`inner-pin-${i}`}
                      className="absolute w-2 h-2 rounded-full bg-[#d0e0eb] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-[#597d92] z-10"
                      style={{
                         top: `calc(50% - 0.25rem + ${Math.sin((i / 18) * Math.PI * 2) * 19.5}%)`,
                         left: `calc(50% - 0.25rem + ${Math.cos((i / 18) * Math.PI * 2) * 19.5}%)`,
                      }}
                   />
                ))}
             </div>
         </div>

         {/* BIGWINBOARD WATERMARK */}
         <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[60px] md:text-[80px] text-white/10 uppercase tracking-tighter pointer-events-none z-30 select-none whitespace-nowrap blur-[1px]">
            BIGWINBOARD.COM
         </div>

         {/* PIP Presenter (Evolution UI element) */}
         <div className="absolute bottom-[20px] left-6 w-[220px] md:w-[280px] aspect-[4/3] rounded-sm border border-white/40 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 hidden md:block bg-black">
            {/* Using a placeholder frame inside to look like the lady webcam */}
            <div className="w-full h-full relative" style={{ backgroundImage: 'linear-gradient(to bottom, #dbeafe, #eff6ff)' }}>
               {/* Decorative Lady Outline */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-32 bg-gray-400 rounded-t-[50px] shadow-inner" style={{ backgroundImage: 'url("https://lawbhoomi.com/wp-content/uploads/2025/12/Ice-Fishing-Casino-Game-Review.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
               {/* Ice overlay */}
               <div className="absolute inset-0 border-[8px] border-[#c0e1f7]/50 rounded-sm pointer-events-none mix-blend-overlay"></div>
               {/* Frost edges */}
               <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,1)] pointer-events-none"></div>
            </div>
            <div className="absolute top-2 left-2 flex gap-1 items-center bg-black/60 px-1.5 py-0.5 rounded">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
               <span className="text-[9px] font-bold tracking-wider text-white">LIVE</span>
            </div>
            <button className="absolute top-2 right-2 hover:bg-white/20 p-1 rounded transition-colors text-white/80">
               <Anchor size={12} />
            </button>
            <div className="absolute bottom-2 left-2 text-white/50 text-[10px] font-mono">Camera 1</div>
         </div>
      </div>

      {/* FOOTER (Betting UI) */}
      <div className="h-[120px] md:h-[140px] bg-gradient-to-b from-[#182a39] to-[#0c1822] shadow-[0_-10px_20px_rgba(0,0,0,0.5)] relative z-40 flex flex-col items-center justify-center select-none w-full border-t border-[#304554]">
          <div className="flex w-full h-full justify-between items-center px-4 relative max-w-[1200px]">
             
             {/* Left: Balance */}
             <div className="hidden lg:flex flex-col justify-center gap-1 min-w-[200px]">
                <div className="font-bold text-[#8ba1b5] text-[10px] tracking-wider uppercase mb-1">BALANCE</div>
                <div className="font-bold text-lg flex items-center gap-1 text-white">
                   {formatCurrency(balance)}
                </div>
                <div className="text-white bg-green-600/20 text-yellow-500 text-xs font-bold px-2 py-0.5 rounded w-max mt-1 border border-green-600/30">
                   TOTAL BET {formatCurrency(totalBet)}
                </div>
             </div>

             {/* Center: Betting Grid */}
             <div className="flex flex-row justify-center gap-2 relative z-50 transform -translate-y-6 md:-translate-y-10">
                 {segmentsConfig.map((config, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => placeBetOnTrack(idx)}
                      className={`relative flex flex-col items-center justify-between w-[65px] h-[65px] md:w-[130px] md:h-[110px] rounded-sm hover:-translate-y-1 transition-all cursor-pointer overflow-hidden group shadow-[0_4px_15px_rgba(0,0,0,0.5)]
                         ${!isSpinning ? 'active:scale-95' : 'pointer-events-none opacity-80'}
                      `}
                      style={{ 
                         backgroundColor: config.color,
                         border: '2px solid rgba(255,255,255,0.2)',
                         borderTopColor: 'rgba(255,255,255,0.6)',
                         borderBottomColor: 'rgba(0,0,0,0.4)',
                      }}
                    >
                       <div className="mt-1 md:mt-2 text-center pb-2 w-full flex-1 flex flex-col justify-center">
                          <div className="text-[16px] md:text-3xl font-black drop-shadow-md tracking-tighter" style={{ color: config.textColor, textShadow: "0px 1px 3px rgba(0,0,0,0.5)" }}>
                             {config.label || <div className="w-4 h-4 md:w-10 md:h-10 border border-[#a0c4da] rounded-full mx-auto shadow-inner bg-[#e4eef4]/30"></div>}
                          </div>
                          {config.sub && (
                            <div className="text-[6px] md:text-[10px] font-black uppercase md:truncate px-0.5 md:px-1 opacity-90 tracking-tighter mt-0.5 leading-none" style={{ color: config.textColor, textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}>
                               {config.sub}
                            </div>
                          )}
                       </div>

                       {/* Hover Overlay */}
                       <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors"></div>

                       {/* Chips on table */}
                       <AnimatePresence>
                          {bets[idx] > 0 && (
                             <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }}
                                className="absolute right-1 bottom-1 flex flex-col items-center pointer-events-none"
                             >
                                <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-[#f1f5f9] border border-gray-400 shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                   <span className="text-[6px] md:text-[10px] font-black text-black leading-none">{bets[idx]}</span>
                                </div>
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                 ))}
             </div>

             {/* Right: Chips & Controls */}
             <div className="flex flex-col items-end justify-center min-w-[200px] pb-2">
                 {/* Chips grid */}
                 <div className="flex w-full justify-end">
                    <div className="grid grid-cols-6 gap-1 md:gap-2">
                       {SHADOW_CHIPS.map((chip, idx) => (
                          <button
                             key={idx}
                             onClick={() => setSelectedChipIndex(idx)}
                             disabled={isSpinning || balance < chip.value}
                             className={`relative w-7 h-7 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-[8px] md:text-sm shadow-[0_2px_5px_rgba(0,0,0,0.5)] transition-transform focus:outline-none border-2 border-white/60
                                ${chip.color} 
                                ${selectedChipIndex === idx ? 'scale-110 -translate-y-1 ring-2 ring-white ring-offset-1 ring-offset-[#182a39]' : 'hover:-translate-y-[2px]'}
                                ${(isSpinning || balance < chip.value) ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                             `}
                          >
                             <div className="absolute inset-[2px] rounded-full border border-black/30 bg-gradient-to-b from-white/20 to-transparent"></div>
                             {chip.value >= 1000 ? (chip.value / 1000) + 'k' : chip.value}
                          </button>
                       ))}
                    </div>
                 </div>
                 
                 <div className="flex w-full justify-end gap-2 mt-2">
                    <button 
                       onClick={clearBets}
                       disabled={isSpinning || totalBet === 0}
                       className="bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] px-4 py-1.5 md:px-6 md:py-3 rounded-md font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center border border-[#3f3f46]"
                    >
                       CLEAR
                    </button>
                    <button 
                       onClick={isSpinning ? undefined : handleSpin}
                       className="bg-[#10b981] hover:bg-[#059669] text-white px-6 md:px-10 py-1.5 md:py-3 rounded-md font-black text-[10px] md:text-sm uppercase tracking-widest transition-colors shadow-[0_2px_5px_rgba(16,185,129,0.5)] border border-[#34d399]"
                    >
                       {isSpinning ? 'SPINNING' : 'SPIN'}
                    </button>
                 </div>
             </div>
          </div>
      </div>

      <AnimatePresence>
         {winInfo && (
            <WinPopup 
               multiplier={winInfo.multiplier} 
               payout={winInfo.payout} 
               onClose={() => setWinInfo(null)} 
            />
         )}
      </AnimatePresence>
    </div>
  );
}

