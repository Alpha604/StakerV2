import React, { useState, useEffect } from "react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Play, Maximize, Minimize } from "lucide-react";
import { WinPopup } from "./WinPopup";

const COLS = 5;
const ROWS = 4;

const SYMBOLS = [
  { id: "grape", char: "🍇", class: "text-purple-500", mults: [0, 0, 0.2, 0.8, 3] },
  { id: "banana", char: "🍌", class: "text-yellow-400", mults: [0, 0, 0.3, 1.2, 5] },
  { id: "carrot", char: "🥕", class: "text-orange-500", mults: [0, 0, 0.5, 1.8, 8] },
  { id: "airplane", char: "✈️", class: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]", mults: [0, 0, 0.8, 2.5, 15] },
  { id: "scale", char: "⚖️", class: "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]", mults: [0, 0, 1.2, 4, 30] },
  { id: "castle", char: "🏯", class: "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]", mults: [0, 0, 2.5, 8, 60] },
  { id: "trident", char: "🔱", class: "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]", mults: [0, 0, 5, 20, 150] },
  { id: "wild", char: null, img: "https://i.imgur.com/DBVd8Kd.png", class: "drop-shadow-[0_0_8px_rgba(255,100,0,0.8)]", mults: [0, 0, 10, 40, 400] },
  { id: "scatter", char: null, img: "https://i.imgur.com/NasC9LL.png", class: "drop-shadow-[0_0_12px_rgba(202,138,4,1)]", mults: [0, 0, 0, 0, 0] },
];

// 20 Paylines definition (y-coordinate for each of the 5 columns)
const PAYLINES = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3], // Horizontals
  [0, 1, 2, 3, 3], [3, 2, 1, 0, 0], [0, 1, 2, 1, 0], [3, 2, 1, 2, 3], // Diagonals/Vs
  [1, 0, 1, 2, 1], [2, 3, 2, 1, 2], [1, 2, 1, 0, 1], [2, 1, 2, 3, 2], 
  [0, 0, 1, 2, 3], [3, 3, 2, 1, 0], [0, 2, 0, 2, 0], [3, 1, 3, 1, 3],
  [1, 1, 0, 1, 1], [2, 2, 3, 2, 2], [1, 0, 0, 0, 1], [2, 3, 3, 3, 2], 
];

const WEIGHTS = [30, 20, 15, 12, 8, 5, 2, 1, 2.2]; // Total approx 95.2. Calibrated for 0.99 RTP

export function ScarabSpin() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Board is COLS x ROWS. Reels are columns.
  const [board, setBoard] = useState<number[][]>(() => {
    return Array.from({ length: COLS }, () => 
      Array.from({ length: ROWS }, () => Math.floor(Math.random() * 8))
    );
  });
  
  const [winInfo, setWinInfo] = useState<{
    multiplier: number;
    payout: number;
  } | null>(null);
  
  const [winningLines, setWinningLines] = useState<{lineIdx: number; positions: [number, number][]}[]>([]);
  const [freeSpins, setFreeSpins] = useState(0);
  const [isFreeSpinMode, setIsFreeSpinMode] = useState(false);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const getRandomSymbol = () => {
    const totalWeight = WEIGHTS.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < SYMBOLS.length; i++) {
        rand -= WEIGHTS[i];
        if (rand <= 0) return i;
    }
    return 0;
  };

  const generateBoard = () => {
    return Array.from({ length: COLS }, () => 
      Array.from({ length: ROWS }, () => getRandomSymbol())
    );
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setBetAmount(val);
    }
  };

  const halfBet = () => setBetAmount((prev) => Math.max(0.01, prev / 2));
  const doubleBet = () => setBetAmount((prev) => prev * 2);

  const performSpin = async () => {
    if (!user || (!isFreeSpinMode && (balance < betAmount || betAmount <= 0))) return;
    if (isSpinning) return;

    if (!isFreeSpinMode) {
      const success = await subtractBalance(betAmount);
      if (!success) return;
    }

    setIsSpinning(true);
    setWinInfo(null);
    setWinningLines([]);

    // Visual spinning effect
    const spinDuration = 1000;
    const intervalTime = 100;
    
    const spinInterval = setInterval(() => {
        setBoard(generateBoard());
    }, intervalTime);

    await new Promise(resolve => setTimeout(resolve, spinDuration));
    clearInterval(spinInterval);

    // Final result
    const finalBoard = generateBoard();
    
    let totalMultiplier = 0;
    const currentWinningLines: {lineIdx: number; positions: [number, number][]}[] = [];
    let scattersCount = 0;

    // Count scatters
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (SYMBOLS[finalBoard[x][y]].id === "scatter") {
          scattersCount++;
        }
      }
    }

    // Check paylines
    for (let i = 0; i < PAYLINES.length; i++) {
      const lineY = PAYLINES[i];
      let lineSymbols = [];
      for (let x = 0; x < COLS; x++) {
         lineSymbols.push(finalBoard[x][lineY[x]]);
      }
      
      let firstSymbolId = -1;
      let isScatterLine = false;

      // Find the first non-wild symbol
      for (let x = 0; x < COLS; x++) {
        let sid = lineSymbols[x];
        let sym = SYMBOLS[sid];
        if (sym.id === "scatter") {
           isScatterLine = true;
           break;
        }
        if (sym.id !== "wild") {
           firstSymbolId = sid;
           break;
        }
      }

      if (isScatterLine) continue;
      
      if (firstSymbolId === -1) {
         // All wilds!
         firstSymbolId = lineSymbols[0];
      }

      let matches = 0;
      const linePositions: [number, number][] = [];

      for (let x = 0; x < COLS; x++) {
        let sid = lineSymbols[x];
        let sym = SYMBOLS[sid];
        if (sid === firstSymbolId || sym.id === "wild") {
           matches++;
           linePositions.push([x, lineY[x]]);
        } else {
           break;
        }
      }

      const mult = SYMBOLS[firstSymbolId].mults[matches - 1] || 0;
      if (mult > 0) {
          totalMultiplier += mult;
          currentWinningLines.push({ lineIdx: i, positions: linePositions });
      }
    }

    setBoard(finalBoard);
    setWinningLines(currentWinningLines);

    let payout = 0;

    // Trigger Free Spins
    if (scattersCount >= 3) {
       const newSpins = scattersCount === 3 ? 10 : scattersCount === 4 ? 15 : 20;
       setFreeSpins(prev => prev + newSpins);
       setIsFreeSpinMode(true);
       totalMultiplier += scattersCount * 2; 
    }

    if (totalMultiplier > 0) {
      // In free spins, the betAmount used for payout is the triggering bet, but here betAmount is just the state
      payout = betAmount * totalMultiplier;
      await addBalance(payout);
      setWinInfo({ multiplier: totalMultiplier, payout });
      
      if (isFreeSpinMode) {
          setTotalFreeSpinWin(prev => prev + payout);
      }
    }

    if (!isFreeSpinMode && totalMultiplier > 0) {
       recordBet("ScarabSpin", betAmount, totalMultiplier, payout - betAmount);
    } else if (!isFreeSpinMode) {
       recordBet("ScarabSpin", betAmount, 0, -betAmount);
    }

    setIsSpinning(false);
  };

  // Process auto free spins
  useEffect(() => {
     let timer: ReturnType<typeof setTimeout>;
     if (isFreeSpinMode && !isSpinning) {
       if (freeSpins > 0) {
         timer = setTimeout(() => {
           setFreeSpins(prev => prev - 1);
           performSpin();
         }, 1500);
       } else {
         // Free spins over
         timer = setTimeout(() => {
           setIsFreeSpinMode(false);
           setTotalFreeSpinWin(0);
         }, 2000);
       }
     }
     return () => clearTimeout(timer);
  }, [freeSpins, isFreeSpinMode, isSpinning]);


  return (
    <div className={cn("flex flex-col lg:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] w-full max-w-[1200px] mx-auto p-0 lg:p-4 transition-all duration-300", isTheaterMode && "max-w-none p-0")}>
      {/* Left Sidebar - Controls */}
      <div className={cn("w-full bg-[#162734] lg:rounded-l-2xl lg:rounded-br-none rounded-t-2xl p-4 flex flex-col gap-4 border border-[#233845] z-10 box-border order-2 lg:order-1 flex-shrink-0 shadow-xl relative top-0", isTheaterMode ? "hidden lg:flex lg:w-[320px]" : "lg:w-[320px]")}>
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full">
          {!isFreeSpinMode && (
            <>
              {/* Bet Amount */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-[#8b9ba5]">Montant du Pari</label>
                  <span className="text-sm text-white font-medium">
                    {formatCurrency(betAmount)}
                  </span>
                </div>
                <div className="relative flex items-center bg-[#0f212e] rounded-md border border-[#2f4553] focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                  <div className="pl-3">{renderCryptoIcon(activeCrypto, "w-4 h-4")}</div>
                  <input
                    type="number"
                    value={betAmount === 0 ? "" : betAmount}
                    onChange={handleBetChange}
                    className="w-full bg-transparent text-white font-bold px-2 py-2.5 outline-none font-mono"
                    placeholder="0.00000000"
                    disabled={isSpinning}
                  />
                  <div className="flex pr-1 gap-1">
                    <button
                      onClick={halfBet}
                      disabled={isSpinning}
                      className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors"
                    >
                      ½
                    </button>
                    <button
                      onClick={doubleBet}
                      disabled={isSpinning}
                      className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors"
                    >
                      2×
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {isFreeSpinMode && (
              <div className="mb-6 bg-accent/10 border border-accent/30 p-4 rounded-xl flex flex-col items-center">
                  <span className="text-accent text-sm font-bold uppercase tracking-wider mb-2">Tours Gratuits</span>
                  <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-4xl font-black text-white">{freeSpins}</span>
                      <span className="text-sm font-bold text-[#8b9ba5] uppercase">restants</span>
                  </div>
                  <div className="text-center w-full bg-[#0f212e] p-3 rounded-lg border border-[#2f4553]">
                      <span className="text-[#8b9ba5] text-xs font-medium uppercase block mb-1">Gains Totaux</span>
                      <span className="text-xl font-bold text-[#00e701]">{formatCurrency(totalFreeSpinWin)}</span>
                  </div>
              </div>
          )}

          <div className="mt-auto pt-4">
            {/* Bet Button */}
            <button
              onClick={performSpin}
              disabled={isSpinning || (!isFreeSpinMode && (betAmount <= 0 || betAmount > balance || user == null))}
              className={cn(
                "w-full py-3.5 rounded font-bold text-[14px] transition-all active:scale-95 flex items-center justify-center gap-2",
                isSpinning || (!isFreeSpinMode && (betAmount <= 0 || betAmount > balance || user == null))
                  ? "bg-[#00e701]/40 text-black/50 cursor-not-allowed"
                  : "bg-[#00e701] hover:bg-[#00e701]/80 text-black"
              )}
            >
              {isSpinning ? "En cours..." : isFreeSpinMode ? "TOUR GRATUIT EN COURS" : "Pari"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Area - Game Display */}
      <div className="flex-1 bg-[#0f212e] lg:rounded-r-2xl lg:rounded-bl-none rounded-b-2xl flex flex-col items-center justify-center order-1 lg:order-2 border border-l-0 border-[#233845] p-4 md:p-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
        
        <button 
          onClick={() => setIsTheaterMode(!isTheaterMode)}
          className="absolute bottom-4 right-4 text-[#8b9ba5] hover:text-white transition-colors bg-[#0f212e] hover:bg-[#2f4553] border border-[#2f4553] p-2 rounded-lg z-20"
          title={isTheaterMode ? "Quitter le mode théâtre" : "Mode théâtre"}
        >
          {isTheaterMode ? (
            <Minimize size={18} />
          ) : (
            <Maximize size={18} />
          )}
        </button>

        {/* Title */}
        <div className="absolute top-4 lg:top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none">
            <h1 className="text-3xl lg:text-5xl font-black tracking-widest text-[#e8c872] uppercase drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
               Scarab Spin
            </h1>
        </div>

        {/* Board Container */}
        <div className="relative w-full max-w-4xl max-h-[80vh] aspect-[5/4] bg-[#0b0c10] border-4 border-[#8B6914] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-2 md:p-3 mt-8 overflow-hidden flex">
            {/* Background design */}
            <div className="absolute inset-0 bg-[#0f1118] opacity-80 pointer-events-none"></div>
            
            {/* Columns (Reels) */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-3 w-full h-full relative z-10">
                {Array.from({ length: COLS }).map((_, cIndex) => (
                    <div key={`col-${cIndex}`} className="flex flex-col gap-1.5 md:gap-3 bg-black/60 rounded-xl overflow-hidden shadow-inner p-1">
                        {Array.from({ length: ROWS }).map((_, rIndex) => {
                            const symbolId = board[cIndex][rIndex];
                            const symConfig = SYMBOLS[symbolId];
                            
                            // Check if this position is part of a winning line
                            const isWinning = winningLines.some(line => 
                                line.positions.some(pos => pos[0] === cIndex && pos[1] === rIndex)
                            );
                            
                            const isScatter = symConfig.id === "scatter";
                            const isHighTier = ["castle", "trident", "wild"].includes(symConfig.id);
                            const isMediumTier = ["airplane", "scale"].includes(symConfig.id);

                            return (
                                <div 
                                    key={`cell-${cIndex}-${rIndex}`} 
                                    className={cn(
                                        "flex-1 flex items-center justify-center rounded-lg text-4xl md:text-5xl lg:text-7xl select-none transition-all duration-300 relative",
                                        isSpinning ? "blur-[2px] opacity-70" : "",
                                        isWinning ? "bg-[#00e701]/20 border-2 border-[#00e701] shadow-[0_0_20px_rgba(0,231,1,0.4)] scale-105 z-10" : "bg-[#162734]/60 border border-[#233845]",
                                        isScatter && !isSpinning ? "animate-pulse shadow-[0_0_15px_rgba(202,138,4,0.5)]" : "",
                                        !isWinning && isHighTier ? "bg-gradient-to-br from-[#162734]/60 to-amber-900/40 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]" : "",
                                        !isWinning && isMediumTier ? "bg-gradient-to-br from-[#162734]/60 to-blue-900/30 border-blue-500/20" : ""
                                    )}
                                >
                                    {symConfig.img ? (
                                      <img src={symConfig.img} alt={symConfig.id} className={cn("w-[80%] h-[80%] object-contain", symConfig.class)} />
                                    ) : (
                                      <span className={symConfig.class}>{symConfig.char}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>

        <AnimatePresence>
          {winInfo && winInfo.payout > 0 && !isSpinning && !isFreeSpinMode && (
            <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
