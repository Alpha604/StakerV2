import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { RotateCcw, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { WinPopup } from './WinPopup';

type Color = 'red' | 'black' | 'green';

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export function Roulette() {
  const { user, balance, addBalance, subtractBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(0.00000001);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  
  // Bets
  const [bets, setBets] = useState<Record<string, number>>({});
  const totalBet: number = Object.values(bets).map(x => Number(x)).reduce((a, b) => a + b, 0);

  const getColor = (num: number): Color => {
    if (num === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const handlePlaceBet = (target: string) => {
    if (isSpinning) return;
    setBets(prev => ({
      ...prev,
      [target]: (prev[target] || 0) + betAmount
    }));
  };

  const clearBets = () => {
    if (isSpinning) return;
    setBets({});
  };

  const spin = async () => {
    if (!user) {
        alert("Veuillez vous connecter pour jouer !");
        return;
    }
    if (isSpinning || totalBet <= 0 || totalBet > balance) return;
    
    const success = await subtractBalance(totalBet);
    if (!success) return;

    setIsSpinning(true);
    setWinInfo(null);

    const winningNumber = Math.floor(Math.random() * 37); // 0-36
    
    // Calculate rotation
    const index = WHEEL_NUMBERS.indexOf(winningNumber);
    const sectorAngle = 360 / 37;
    // Align the target pocket to the TOP
    const extraSpins = 360 * 5; 
    const targetRotation = -(index * sectorAngle) - extraSpins;
    
    setRotation(prev => prev + targetRotation - (prev % 360)); 
    
    setTimeout(async () => {
      setResult(winningNumber);
      
      let winnings = 0;
      const tColor = getColor(winningNumber);

      if (bets[winningNumber.toString()]) winnings += bets[winningNumber.toString()] * 36;
      if (tColor === 'red' && bets['red']) winnings += bets['red'] * 2;
      if (tColor === 'black' && bets['black']) winnings += bets['black'] * 2;
      if (winningNumber !== 0) {
        if (winningNumber % 2 !== 0 && bets['odd']) winnings += bets['odd'] * 2;
        if (winningNumber % 2 === 0 && bets['even']) winnings += bets['even'] * 2;
      }
      if (winningNumber >= 1 && winningNumber <= 18 && bets['1-18']) winnings += bets['1-18'] * 2;
      if (winningNumber >= 19 && winningNumber <= 36 && bets['19-36']) winnings += bets['19-36'] * 2;
      if (winningNumber >= 1 && winningNumber <= 12 && bets['doz1']) winnings += bets['doz1'] * 3;
      if (winningNumber >= 13 && winningNumber <= 24 && bets['doz2']) winnings += bets['doz2'] * 3;
      if (winningNumber >= 25 && winningNumber <= 36 && bets['doz3']) winnings += bets['doz3'] * 3;
      
      if (winningNumber !== 0) {
          if (winningNumber % 3 === 0 && bets['col3']) winnings += bets['col3'] * 3;
          if (winningNumber % 3 === 2 && bets['col2']) winnings += bets['col2'] * 3;
          if (winningNumber % 3 === 1 && bets['col1']) winnings += bets['col1'] * 3;
      }

      const multiplier = totalBet > 0 ? winnings / totalBet : 0;

      if (winnings > 0) {
        await addBalance(winnings);
        setWinInfo({ multiplier, payout: winnings });
      }
      
      await recordBet('Roulette', totalBet, multiplier, winnings - totalBet);

      setBets({});
      setIsSpinning(false);
    }, 4000); 
  };

  const getCellColor = (n: number | string) => {
    if (n === 0 || n === '0') return 'bg-[#43b359] hover:bg-[#348f46] text-white border-transparent';
    if (typeof n === 'number' && getColor(n) === 'red') return 'bg-[#ed4163] hover:bg-[#c23652] text-white border-transparent';
    if (typeof n === 'number' && getColor(n) === 'black') return 'bg-[#213743] hover:bg-[#2c4755] text-white border-transparent';
    return 'bg-[#213743] hover:bg-[#2c4755] text-white border-transparent';
  };

  const betChip = (amt: number) => (
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-5 h-5 rounded-full border border-dashed border-[#ffca28] bg-[#ff8f00] flex items-center justify-center text-[7px] font-black shadow-lg">
             <span className="drop-shadow bg-black/30 px-0.5 rounded text-white">{amt < 1 ? '•' : (amt >= 1000 ? (amt/1000)+'K' : amt)}</span>
          </div>
      </div>
  );

  return (
    <>
    <div className="flex flex-col md:flex-row max-w-[1200px] mx-auto p-4 md:p-8 gap-4 min-h-[calc(100vh-80px)]">
      
      {/* Sidebar Controls (Exact Match) */}
      <div className="w-full md:w-[320px] bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 overflow-hidden z-10 p-4 gap-4">
        
        {/* Toggle manuel/auto */}
        <div className="bg-bg-inner flex w-full p-1 rounded-full border border-border-medium shadow-inner">
           <button className="flex-1 py-1.5 bg-border-medium rounded-full text-white text-sm font-bold shadow text-center">Manuel</button>
           <button className="flex-1 py-1.5 text-text-secondary hover:text-white text-sm font-bold transition-colors text-center cursor-not-allowed">Auto</button>
        </div>

        {/* Valeur du Jeton */}
        <div className="flex flex-col gap-1 mt-2">
           <div className="flex justify-between items-center text-xs font-semibold text-text-secondary opacity-80">
              <span>Valeur du Jeton</span>
              <span className="text-white flex items-center gap-1 font-mono">{betAmount.toFixed(8)} <span className="text-emerald-500 bg-emerald-500/20 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] leading-none">T</span></span>
           </div>
           
           <div className="w-full h-12 bg-bg-inner border border-border-medium rounded flex items-center shadow-inner mt-1 px-1">
              <button className="w-8 h-full flex items-center justify-center text-text-secondary hover:text-white transition-colors">&lt;</button>
              <div className="flex-1 flex justify-center items-center gap-1.5">
                 {[1, 10, 100, 1000, 10000].map((v) => (
                    <button key={v} onClick={() => setBetAmount(v)} className={cn("w-7 h-7 rounded-full border shadow-sm flex items-center justify-center font-bold text-[9px] transition-transform hover:scale-110 relative", betAmount === v ? "border-yellow-300 scale-110 z-10 text-yellow-900" : "border-yellow-700 opacity-80 text-yellow-900", v === 10000 ? "opacity-30 cursor-not-allowed text-transparent" : "")} style={{ background: 'linear-gradient(135deg, #fde047, #ca8a04)' }}>
                       {v >= 1000 ? (v===10000 ? '' : '1K') : v}
                    </button>
                 ))}
             </div>
              <button className="w-8 h-full flex items-center justify-center text-text-secondary hover:text-white transition-colors">&gt;</button>
           </div>
        </div>

        {/* Pari Total Input */}
        <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold opacity-80">
               <span className="text-text-secondary">Pari Total</span>
               <span className="text-white font-mono">{totalBet.toFixed(2)} $US</span>
            </div>
            <div className="flex items-center bg-bg-inner border border-border-medium rounded shadow-inner h-11">
              <input 
                type="text" 
                readOnly
                value={totalBet > 0 ? totalBet.toFixed(8) : "0.00000000"}
                className="w-full bg-transparent p-3 text-white font-mono outline-none text-sm font-bold"
              />
              <span className="pr-3 flex items-center">
                 <span className="text-emerald-500 font-bold font-mono text-[10px] leading-none bg-emerald-500/20 w-4 h-4 flex items-center justify-center rounded-full shrink-0">T</span>
              </span>
              <div className="flex h-full border-l border-border-medium divide-x divide-border-medium shrink-0">
                 <button onClick={() => {}} className="px-3 hover:bg-border-subtle text-xs font-semibold text-text-secondary transition-colors cursor-not-allowed">½</button>
                 <button onClick={() => {}} className="px-3 hover:bg-border-subtle text-xs font-semibold text-text-secondary transition-colors cursor-not-allowed">2×</button>
              </div>
            </div>
        </div>

        <button 
          onClick={spin}
          disabled={isSpinning || totalBet <= 0 || totalBet > balance}
          className="w-full py-3 mt-2 rounded text-white font-semibold bg-[#1475e1] hover:bg-[#1b80f0] transition-colors shadow disabled:opacity-30 disabled:bg-bg-inner disabled:text-text-secondary disabled:cursor-not-allowed"
        >
          Pari
        </button>
      </div>

      {/* Game Area (Exact Match) */}
      <div className="flex-1 bg-bg-panel/40 rounded-b-xl md:rounded-r-xl md:rounded-bl-none flex flex-col items-center justify-start md:order-2 p-4 md:p-8 relative overflow-hidden">
        
        {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}

        {/* Wheel SVG Component */}
        <div className="w-[320px] h-[320px] mb-8 relative flex items-center justify-center pt-4">
            {/* Pointer */}
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-white drop-shadow-md"></div>
            
            {/* Spinning Wheel */}
            <div 
               className="w-full h-full rounded-full border-[10px] border-[#15242d] shadow-2xl relative transition-transform duration-[4000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
               style={{ transform: `rotate(${rotation}deg)` }}
            >
               <svg viewBox="0 0 100 100" className="w-full h-full rounded-full drop-shadow-xl" style={{ backgroundColor: '#1a2c38' }}>
                  {/* Base Circle */}
                  <circle cx="50" cy="50" r="50" fill="#213743" />
                  
                  {WHEEL_NUMBERS.map((n, i) => {
                     const sliceAngle = 360 / 37;
                     const startAngle = i * sliceAngle;
                     const radStart = (startAngle - 90 - (sliceAngle / 2)) * (Math.PI / 180);
                     const radEnd = (startAngle - 90 + (sliceAngle / 2)) * (Math.PI / 180);
                     
                     // SVG Path for pie slice
                     const x1 = 50 + 50 * Math.cos(radStart);
                     const y1 = 50 + 50 * Math.sin(radStart);
                     const x2 = 50 + 50 * Math.cos(radEnd);
                     const y2 = 50 + 50 * Math.sin(radEnd);
                     
                     // Text position
                     const tRad = (startAngle - 90) * (Math.PI / 180);
                     const tx = 50 + 41 * Math.cos(tRad);
                     const ty = 50 + 41 * Math.sin(tRad);
                     
                     return (
                        <g key={n}>
                           <path 
                              d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                              fill={getColor(n) === 'red' ? '#ed4163' : getColor(n) === 'green' ? '#43b359' : '#1a2c38'}
                              stroke="#15242d" strokeWidth="0.5"
                           />
                           <text 
                              x={tx} y={ty} 
                              fill="#fff" fontSize="3.5" fontWeight="900" fontFamily="sans-serif"
                              alignmentBaseline="middle" textAnchor="middle"
                              transform={`rotate(${startAngle}, ${tx}, ${ty})`}
                           >
                              {n}
                           </text>
                        </g>
                     );
                  })}
                  {/* Wheel Center details */}
                  <circle cx="50" cy="50" r="26" fill="#15242d" />
                  <circle cx="50" cy="50" r="24" fill="#1a2c38" />
                  {/* Yellow metallic spinner cross */}
                  <path d="M 50 34 L 50 66 M 34 50 L 66 50" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 44 44 L 56 56 M 44 56 L 56 44" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4" fill="#ca8a04" />
               </svg>
            </div>
            
            {/* Result Overlay */}
            {!isSpinning && result !== null && (
               <div className="absolute inset-0 m-auto w-14 h-14 bg-black/60 backdrop-blur-md rounded-full flex flex-col items-center justify-center border border-white/20 z-30 animate-in zoom-in shadow-2xl">
                  <span className={cn("text-xl font-black", getColor(result) === 'red' ? 'text-red-400' : getColor(result) === 'green' ? 'text-emerald-400' : 'text-white')}>
                     {result}
                  </span>
               </div>
            )}
        </div>

        {/* The Exact Board Layout */}
        <div className="w-full max-w-[700px] flex flex-col gap-1.5 selection:bg-transparent -mt-2">
            {/* Top row with 0 */}
            <div className="flex w-full gap-1.5 min-h-[120px] md:min-h-[140px]">
               {/* ZERO */}
               <button onClick={() => handlePlaceBet('0')} className={cn("w-[7.14%] rounded-sm text-lg font-bold relative overflow-hidden transition-colors flex items-center justify-center", getCellColor('0'))}>
                  0
                  {bets['0'] > 0 && betChip(bets['0'])}
               </button>
               
               {/* 1-36 Numbers block */}
               <div className="w-[85.71%] grid grid-cols-12 grid-rows-3 gap-1.5">
                  {/* Row 1: 3,6,9... */}
                  {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
                     <button key={n} onClick={() => handlePlaceBet(n.toString())} className={cn("rounded-sm flex items-center justify-center font-bold relative overflow-hidden transition-colors", getCellColor(n))}>
                        {n}
                        {bets[n.toString()] > 0 && betChip(bets[n.toString()])}
                     </button>
                  ))}
                  {/* Row 2: 2,5,8... */}
                  {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(n => (
                     <button key={n} onClick={() => handlePlaceBet(n.toString())} className={cn("rounded-sm flex items-center justify-center font-bold relative overflow-hidden transition-colors", getCellColor(n))}>
                        {n}
                        {bets[n.toString()] > 0 && betChip(bets[n.toString()])}
                     </button>
                  ))}
                  {/* Row 3: 1,4,7... */}
                  {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => (
                     <button key={n} onClick={() => handlePlaceBet(n.toString())} className={cn("rounded-sm flex items-center justify-center font-bold relative overflow-hidden transition-colors", getCellColor(n))}>
                        {n}
                        {bets[n.toString()] > 0 && betChip(bets[n.toString()])}
                     </button>
                  ))}
               </div>

               {/* 2:1 Column bets */}
               <div className="w-[7.14%] grid grid-rows-3 gap-1.5">
                  <button onClick={() => handlePlaceBet('col3')} className="rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-xs font-bold relative flex items-center justify-center transition-colors">
                     2:1 {bets['col3'] > 0 && betChip(bets['col3'])}
                  </button>
                  <button onClick={() => handlePlaceBet('col2')} className="rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-xs font-bold relative flex items-center justify-center transition-colors">
                     2:1 {bets['col2'] > 0 && betChip(bets['col2'])}
                  </button>
                  <button onClick={() => handlePlaceBet('col1')} className="rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-xs font-bold relative flex items-center justify-center transition-colors">
                     2:1 {bets['col1'] > 0 && betChip(bets['col1'])}
                  </button>
               </div>
            </div>

            {/* Dozens */}
            <div className="flex w-full gap-1.5 h-[45px] pr-[7.14%] pl-[7.14%]">
               <button onClick={() => handlePlaceBet('doz1')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  1 to 12 {bets['doz1'] > 0 && betChip(bets['doz1'])}
               </button>
               <button onClick={() => handlePlaceBet('doz2')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  13 to 24 {bets['doz2'] > 0 && betChip(bets['doz2'])}
               </button>
               <button onClick={() => handlePlaceBet('doz3')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  25 to 36 {bets['doz3'] > 0 && betChip(bets['doz3'])}
               </button>
            </div>

            {/* Bottom Row */}
            <div className="flex w-full gap-1.5 h-[45px] pr-[7.14%] pl-[7.14%]">
               <button onClick={() => handlePlaceBet('1-18')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  1 to 18 {bets['1-18'] > 0 && betChip(bets['1-18'])}
               </button>
               <button onClick={() => handlePlaceBet('even')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  Even {bets['even'] > 0 && betChip(bets['even'])}
               </button>
               <button onClick={() => handlePlaceBet('red')} className="flex-1 rounded-sm bg-[#ed4163] hover:opacity-80 text-white relative overflow-hidden transition-colors">
                  {bets['red'] > 0 && betChip(bets['red'])}
               </button>
               <button onClick={() => handlePlaceBet('black')} className="flex-1 rounded-sm bg-[#213743] hover:bg-[#2c4755] text-white relative overflow-hidden transition-colors">
                  {bets['black'] > 0 && betChip(bets['black'])}
               </button>
               <button onClick={() => handlePlaceBet('odd')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  Odd {bets['odd'] > 0 && betChip(bets['odd'])}
               </button>
               <button onClick={() => handlePlaceBet('19-36')} className="flex-1 rounded-sm bg-bg-inner hover:bg-border-subtle text-white text-sm font-bold relative overflow-hidden transition-colors">
                  19 to 36 {bets['19-36'] > 0 && betChip(bets['19-36'])}
               </button>
            </div>
        </div>

        {/* Toolbar below board */}
        <div className="w-full max-w-[700px] flex justify-between items-center mt-3 text-text-secondary text-sm font-semibold">
           <button onClick={clearBets} className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={isSpinning || totalBet === 0}>
              <RotateCcw size={16} className="-scale-x-100" /> Annuler
           </button>
           <button onClick={clearBets} className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer disabled:opacity-50" disabled={isSpinning || totalBet === 0}>
              Effacer <XCircle size={16} />
           </button>
        </div>

      </div>
    </div>
    
    </>
  );
}
