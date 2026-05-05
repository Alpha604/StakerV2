import { formatCurrency } from "../lib/utils";
import React, { useState } from 'react';
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { WinPopup } from './WinPopup';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSound } from '../lib/useSound';

export function Chicken() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const { playTick, playWin, playLoss, playHit } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [bonesCount, setBonesCount] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Game state
  const [board, setBoard] = useState<{isBone: boolean, revealed: boolean}[]>(Array(25).fill({isBone: false, revealed: false}));
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);

  const start = async () => {
    if (!user || balance < betAmount || betAmount <= 0) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;
    playTick();

    // Generate board
    const newBoard = Array(25).fill({ isBone: false, revealed: false });
    let bonesPlaced = 0;
    while (bonesPlaced < bonesCount) {
       const idx = Math.floor(Math.random() * 25);
       if (!newBoard[idx].isBone) {
          newBoard[idx] = { isBone: true, revealed: false };
          bonesPlaced++;
       }
    }

    setBoard(newBoard);
    setIsPlaying(true);
    setGameOver(false);
    setRevealedCount(0);
    setWinInfo(null);
  };

  const calculateMultiplier = (cleared: number, totalBones: number) => {
    if (cleared === 0) return 1;
    const totalTiles = 25;
    let prob = 1;
    for (let i = 0; i < cleared; i++) {
        prob *= (totalTiles - totalBones - i) / (totalTiles - i);
    }
    return prob > 0 ? (0.99 / prob) : 0; 
  };

  const currentMultiplier = revealedCount > 0 ? calculateMultiplier(revealedCount, bonesCount) : 1;
  const currentProfit = betAmount * currentMultiplier;

  const handleClick = (idx: number) => {
     if (!isPlaying || gameOver || board[idx].revealed) return;

     const newBoard = [...board];
     newBoard[idx] = { ...newBoard[idx], revealed: true };
     setBoard(newBoard);

     if (newBoard[idx].isBone) {
         playLoss();
         setGameOver(true);
         setIsPlaying(false);
         recordBet('Chicken', betAmount, 0, -betAmount);
         setBoard(newBoard.map(b => ({ ...b, revealed: true })));
     } else {
         playHit();
         setRevealedCount(r => r + 1);
         
         const newRevealedCount = revealedCount + 1;
         if (newRevealedCount === 25 - bonesCount) {
             const multi = calculateMultiplier(newRevealedCount, bonesCount);
             cashout(multi);
         }
     }
  };

  const cashout = (forcedMulti?: number) => {
      if (!isPlaying || gameOver) return;
      const multi = forcedMulti || currentMultiplier;
      const payout = betAmount * multi;
      
      playWin();
      addBalance(payout);
      setWinInfo({ multiplier: multi, payout });
      recordBet('Chicken', betAmount, multi, payout - betAmount);
      
      setGameOver(true);
      setIsPlaying(false);
      setBoard(board.map(b => ({ ...b, revealed: true })));
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full flex flex-col lg:flex-row bg-bg-panel rounded-lg overflow-hidden shadow-2xl min-h-[600px]">
        
        {/* Controls Sidebar */}
        <div className="bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e] w-full lg:w-[320px] shrink-0">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-sm font-bold text-white bg-[#2f4553] rounded-full py-2 transition-colors">Manuel</button>
            <button className="flex-1 text-sm font-bold text-[#8b9ba5] hover:text-white rounded-full py-2 transition-colors">Auto</button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Bet Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-xs font-bold"> Montant de la mise </label>
                <span className="text-[#8b9ba5] text-xs font-bold flex items-center gap-1"> $ {formatCurrency(balance || 0)} </span>
              </div>
              <div className="relative flex items-center bg-[#0f212e] rounded border border-[#2f4553] p-1 transition-colors focus-within:border-border-hover">
                <div className="pl-2 pr-1 flex items-center justify-center"> {renderCryptoIcon(activeCrypto, "w-4 h-4")} </div>
                <input
                  type="number"
                  value={betAmount === 0 ? "" : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-white font-bold outline-none tabular-nums text-sm px-1 py-1"
                  min="0"
                  step="0.01"
                  disabled={isPlaying}
                />
                <div className="flex items-center gap-1 pr-1 border-l border-[#2f4553] pl-2">
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev / 2 * 100) / 100)} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors" disabled={isPlaying}> ½ </button>
                  <div className="w-px h-3 bg-[#2f4553]"></div>
                  <button onClick={() => setBetAmount((prev) => Math.floor(prev * 2 * 100) / 100)} className="text-white hover:bg-[#2f4553] px-2 py-1.5 rounded text-xs font-bold transition-colors" disabled={isPlaying}> 2× </button>
                </div>
              </div>
            </div>

            {/* Bones Selection */}
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[#8b9ba5] text-xs font-bold"> Os (Pièges) </label>
                </div>
                <select 
                    value={bonesCount}
                    onChange={(e) => setBonesCount(Number(e.target.value))}
                    disabled={isPlaying}
                    className="w-full bg-[#0f212e] text-white font-bold text-sm rounded border border-[#2f4553] p-2.5 focus:border-border-hover outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b1bad3%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                >
                    {[...Array(24)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                </select>
            </div>
          </div>

          <div className="flex-1"></div>

          {isPlaying ? (
              <button 
                onClick={() => cashout()}
                disabled={revealedCount === 0 || gameOver}
                className="w-full py-3.5 mt-2 rounded text-white font-bold text-sm bg-[#e53935] hover:bg-[#ef5350] transition-colors shadow disabled:opacity-50"
              >
                 Retirer {formatCurrency(currentProfit)} $
              </button>
          ) : (
              <button 
                onClick={start}
                disabled={!user || balance < betAmount}
                className={cn(
                    "w-full py-3.5 rounded font-bold text-sm transition-all bg-[#00e676] hover:bg-[#1bc86a] text-[#0f1116]",
                    (!user || balance < betAmount) && "opacity-50 cursor-not-allowed"
                )}
              >
                 Pari
              </button>
          )}

        </div>

        {/* Game Area */}
        <div className="bg-[#0f212e] relative p-4 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
            {winInfo && <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} onClose={() => setWinInfo(null)} />}
            
            <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 max-w-[500px] w-full">
                {board.map((tile, idx) => {
                    const isWinningTile = tile.revealed && !tile.isBone;
                    const isLosingTile = tile.revealed && tile.isBone && gameOver;
                    
                    return (
                    <div 
                        key={idx} 
                        onClick={() => handleClick(idx)}
                        className={cn(
                            "aspect-square rounded-xl transition-all duration-300 relative group flex items-center justify-center",
                            tile.revealed 
                                ? (tile.isBone ? "bg-[#2f4553] shadow-inner" : "bg-[#2f4553] shadow-inner")
                                : isPlaying 
                                ? "bg-[#3d5a6c] hover:bg-[#4a6b80] hover:-translate-y-1 shadow-[0_6px_0_#283c48] cursor-pointer" 
                                : "bg-[#2f4553] opacity-80 shadow-[0_6px_0_#1e2d36]"
                        )}
                    >
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-500",
                            tile.revealed ? "opacity-100 scale-100" : "opacity-0 scale-50"
                        )}>
                            {tile.revealed && (
                                tile.isBone 
                                ? <span className="text-3xl sm:text-4xl md:text-5xl filter drop-shadow opacity-90 relative">
                                       <span className="absolute inset-0 flex items-center justify-center">🦴</span>
                                       {isLosingTile && <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>}
                                  </span> 
                                : <span className="text-3xl sm:text-4xl md:text-5xl filter drop-shadow">
                                       🍗
                                  </span>
                            )}
                        </div>
                        {/* Cloche dome if not revealed */}
                        {!tile.revealed && (
                            <span className="text-2xl sm:text-3xl md:text-4xl filter drop-shadow opacity-50 group-hover:opacity-80 transition-opacity">
                                🍽️
                            </span>
                        )}
                    </div>
                )})}
            </div>
            
            {/* Multiplier Track below */}
            <div className="w-full max-w-[500px] mt-8 bg-[#0b161f] rounded-lg p-2 flex gap-1 overflow-x-auto scrollbar-hide border border-[#2f4553]">
                {Array.from({length: Math.min(6, 25 - bonesCount)}).map((_, i) => {
                    const stepNum = Math.max(1, revealedCount - 2 + i);
                    if (stepNum > 25 - bonesCount) return null;
                    const mult = calculateMultiplier(stepNum, bonesCount);
                    const isCurrent = stepNum === revealedCount;
                    
                    return (
                        <div key={stepNum} className={cn(
                            "flex-1 min-w-[50px] py-2 flex flex-col items-center justify-center rounded transition-all",
                            isCurrent ? "bg-[#00e676] text-[#0f1116] scale-105 shadow-[0_0_10px_rgba(0,230,118,0.3)] z-10 font-black" : 
                            stepNum < revealedCount ? "bg-[#00e676]/20 text-[#00e676] font-bold" : "bg-[#2f4553] text-white/50 font-bold"
                        )}>
                           <span className="text-[10px] sm:text-xs">{mult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×</span>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
}

