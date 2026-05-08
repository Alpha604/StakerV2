import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import { cn } from "../lib/utils";
import { WinPopup } from "./WinPopup";

const COLS = 6;
const ROWS = 5;

// Weight mapping to limit high end symbols
const WEIGHTS = [
  40, 40, 40, 40, 40, // Low symbols (10, J, Q, K, A)
  18, 14, 10, 8, 5,   // Medium/High symbols
  2,                  // Wild
  0,                  // Rainbow (dynamically adjusted)
  0                   // Scatter
];
const W_TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);

const SYMBOLS = [
  { id: 0, type: "low", char: "10", color: "text-[#8d7c67] font-black drop-shadow-sm" },
  { id: 1, type: "low", char: "J", color: "text-[#446a8b] font-black drop-shadow-sm" },
  { id: 2, type: "low", char: "Q", color: "text-[#6b4a8b] font-black drop-shadow-sm" },
  { id: 3, type: "low", char: "K", color: "text-[#5a8b5e] font-black drop-shadow-sm" },
  { id: 4, type: "low", char: "A", color: "text-[#a64a3d] font-black drop-shadow-sm" },
  { id: 5, type: "med", char: "🪤", color: "" },
  { id: 6, type: "med", char: "🧀", color: "" },
  { id: 7, type: "med", char: "🍺", color: "" },
  { id: 8, type: "med", char: "🥖", color: "" },
  { id: 9, type: "hat", char: "🎩", color: "" },
  { id: 10, type: "wild", char: "WILD", text: "Wanted", color: "text-red-700 font-black tracking-tighter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)] bg-yellow-400 border border-yellow-200 px-1 rounded-sm" },
  { id: 11, type: "rainbow", char: "🌈", color: "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-125" },
  { id: 12, type: "scatter", char: "📷", color: "drop-shadow-[0_0_8px_rgba(202,138,4,1)] scale-125" },
];

const PAYOUTS = {
  low: [0, 0, 0, 0, 0, 0.1, 0.2, 0.5, 1, 2, 5, 10, 10, 20, 20, 20, 20],
  med: [0, 0, 0, 0, 0, 0.5, 1, 2, 4, 8, 15, 30, 30, 50, 50, 50, 50],
  hat: [0, 0, 0, 0, 0, 1, 2, 4, 8, 15, 30, 60, 60, 100, 100, 100, 100],
};

const COIN_PRIZES = [
  { value: 0.2, weight: 30, type: "bronze" },
  { value: 0.5, weight: 20, type: "bronze" },
  { value: 1, weight: 15, type: "bronze" },
  { value: 2, weight: 10, type: "bronze" },
  { value: 5, weight: 10, type: "silver" },
  { value: 10, weight: 8, type: "silver" },
  { value: 20, weight: 4, type: "silver" },
  { value: 50, weight: 2, type: "gold" },
  { value: 100, weight: 0.8, type: "gold" },
  { value: 500, weight: 0.2, type: "gold" },
];
const COIN_W_TOTAL = COIN_PRIZES.reduce((a, b) => a + b.weight, 0);

function getRandomCoin() {
  let r = Math.random() * COIN_W_TOTAL;
  for (let c of COIN_PRIZES) {
    if (r < c.weight) return c;
    r -= c.weight;
  }
  return COIN_PRIZES[0];
}

function getPayoutTable(symbolIndex: number) {
  if (symbolIndex <= 4) return PAYOUTS.low;
  if (symbolIndex <= 8) return PAYOUTS.med;
  return PAYOUTS.hat;
}

function getPayout(symbolIndex: number, count: number) {
  const table = getPayoutTable(symbolIndex);
  return table[Math.min(count, table.length - 1)];
}

function getRandomSymbol(rainbowW: number, scatterW: number) {
  let wTotal = W_TOTAL + rainbowW + scatterW;
  let r = Math.random() * wTotal;
  
  for (let i = 0; i < WEIGHTS.length - 2; i++) {
    if (r < WEIGHTS[i]) return i;
    r -= WEIGHTS[i];
  }
  if (r < rainbowW) return 11;
  return 12;
}

let globalTileId = 0;

function generateBoard(rainbowW = 1.5, scatterW = 2) {
  const board: {id: number, symbolIdx: number}[][] = [];
  for (let x = 0; x < COLS; x++) {
    const col: {id: number, symbolIdx: number}[] = [];
    for (let y = 0; y < ROWS; y++) {
      col.push({ id: globalTileId++, symbolIdx: getRandomSymbol(rainbowW, scatterW) });
    }
    board.push(col);
  }
  return board;
}

type Position = { x: number; y: number };
type ClusterInfo = {
  symbolIdx: number;
  positions: Position[];
  payout: number;
};

export function LeBandit() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [board, setBoard] = useState<{id: number, symbolIdx: number}[][]>(() => generateBoard());
  const [goldenSquares, setGoldenSquares] = useState<boolean[][]>(() => Array(COLS).fill(0).map(() => Array(ROWS).fill(false)));
  const [revealedCoins, setRevealedCoins] = useState<{x: number, y: number, coin: ReturnType<typeof getRandomCoin>}[]>([]);
  
  // Gameplay state
  const [isSpinning, setIsSpinning] = useState(false);
  const [winInfo, setWinInfo] = useState<{ multiplier: number; payout: number } | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  
  // Auto play
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoBetsCount, setAutoBetsCount] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState<number>(0);

  // Bonus
  type BonusMode = null | "luck" | "glitters" | "treasure";
  const [freeSpins, setFreeSpins] = useState<number>(0);
  const [isFreeSpinMode, setIsFreeSpinMode] = useState<boolean>(false);
  const [activeBonusMode, setActiveBonusMode] = useState<BonusMode>(null);
  const [totalFreeSpinWin, setTotalFreeSpinWin] = useState<number>(0);
  const [bonusTriggered, setBonusTriggered] = useState<{ spins: number, mode: BonusMode } | null>(null);
  const [bonusEnded, setBonusEnded] = useState<{ payout: number } | null>(null);
  
  // Bonus Buy UI
  const [isBonusBuyOpen, setIsBonusBuyOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<"none" | "bonushunt" | "rainbow">("none");

  // Helper
  const findClusters = (currentBoard: ({id: number, symbolIdx: number} | null)[][]): ClusterInfo[] => {
    const clusters: ClusterInfo[] = [];
    const visited = Array(COLS).fill(0).map(() => Array(ROWS).fill(false));

    const dfs = (x: number, y: number, targetSymbol: number, currentCluster: Position[]) => {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
      if (visited[x][y]) return;
      
      const tile = currentBoard[x][y];
      if (!tile) return;

      const sym = tile.symbolIdx;
      // 10 is wildcard
      if (sym !== targetSymbol && sym !== 10) return;

      visited[x][y] = true;
      currentCluster.push({ x, y });

      dfs(x + 1, y, targetSymbol, currentCluster);
      dfs(x - 1, y, targetSymbol, currentCluster);
      dfs(x, y + 1, targetSymbol, currentCluster);
      dfs(x, y - 1, targetSymbol, currentCluster);
    };

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        const tile = currentBoard[x][y];
        if (!tile) continue;
        const sym = tile.symbolIdx;
        if (!visited[x][y] && sym !== 10 && sym !== 11 && sym !== 12) {
          const currentCluster: Position[] = [];
          dfs(x, y, sym, currentCluster);

          if (currentCluster.length >= 5) {
            clusters.push({
              symbolIdx: sym,
              positions: currentCluster,
              payout: getPayout(sym, currentCluster.length)
            });
          }
          
          for (let pos of currentCluster) {
            if (currentBoard[pos.x][pos.y]?.symbolIdx === 10) {
               visited[pos.x][pos.y] = false;
            }
          }
        }
      }
    }
    return clusters;
  };

  const executeSpin = async (buyFeature?: "tier1" | "tier2") => {
    if (isSpinning) return;
    
    let betCost = betAmount;
    let actualBet = betAmount;
    if (buyFeature === "tier1") {
       betCost = betAmount * 100;
    } else if (buyFeature === "tier2") {
       betCost = betAmount * 250;
    } else if (activeFeature === "bonushunt") {
       betCost = betAmount * 3;
    } else if (activeFeature === "rainbow") {
       betCost = betAmount * 50;
    }

    if (!isFreeSpinMode) {
      if (!user || balance < betCost || betCost <= 0) {
         if (isAutoPlaying) setIsAutoPlaying(false);
         return;
      }
      const success = await subtractBalance(betCost);
      if (!success) return;
    }
    
    setIsSpinning(true);
    setWinInfo(null);
    setHighlightedCells(new Set());
    setRevealedCoins([]);
    
    if (!isFreeSpinMode) {
       setGoldenSquares(Array(COLS).fill(0).map(() => Array(ROWS).fill(false)));
    }

    let rbW = isFreeSpinMode ? 3 : 1.5;
    let scW = isFreeSpinMode ? 1.5 : 2;
    if (!isFreeSpinMode) {
       if (activeFeature === "bonushunt") scW = 10;
       else if (activeFeature === "rainbow") rbW = 1000;
    }
    let currentBoard = generateBoard(rbW, scW);
    
    if (buyFeature === "tier1") {
       let placed = 0;
       while(placed < 3) {
          const rx = Math.floor(Math.random()*COLS);
          const ry = Math.floor(Math.random()*ROWS);
          if (currentBoard[rx][ry].symbolIdx !== 12) {
             currentBoard[rx][ry] = { id: globalTileId++, symbolIdx: 12 };
             placed++;
          }
       }
    } else if (buyFeature === "tier2") {
       let placed = 0;
       while(placed < 4) {
          const rx = Math.floor(Math.random()*COLS);
          const ry = Math.floor(Math.random()*ROWS);
          if (currentBoard[rx][ry].symbolIdx !== 12) {
             currentBoard[rx][ry] = { id: globalTileId++, symbolIdx: 12 };
             placed++;
          }
       }
    }
    
    if (isFreeSpinMode && activeBonusMode === "treasure" || (!isFreeSpinMode && activeFeature === "rainbow")) {
       let hasRainbow = currentBoard.some(col => col.some(t => t?.symbolIdx === 11));
       if (!hasRainbow) {
          const rx = Math.floor(Math.random()*COLS);
          const ry = Math.floor(Math.random()*ROWS);
          currentBoard[rx][ry] = { id: globalTileId++, symbolIdx: 11 };
       }
    }
    
    setBoard(currentBoard);
    let currentGolden = isFreeSpinMode ? [...goldenSquares.map(row => [...row])] : Array(COLS).fill(0).map(() => Array(ROWS).fill(false));
    
    let totalWinMultiplier = 0;
    
    await new Promise(r => setTimeout(r, 600));

    // Cascade Loop
    let cascaded = true;
    while (cascaded) {
       cascaded = false;
       const clusters = findClusters(currentBoard);
       
       if (clusters.length > 0) {
          cascaded = true;
          const highlights = new Set<string>();
          let cascadeMult = 0;
          
          for (const cl of clusters) {
             cascadeMult += cl.payout;
             for (const p of cl.positions) {
                highlights.add(`${p.x},${p.y}`);
                currentGolden[p.x][p.y] = true;
             }
          }
          
          totalWinMultiplier += cascadeMult;
          setHighlightedCells(highlights);
          setGoldenSquares([...currentGolden.map(r => [...r])]);
          
          await new Promise(r => setTimeout(r, 500));
          
          // Remove symbols
          let newBoard = currentBoard.map(col => [...col]);
          for (const cl of clusters) {
             for (const p of cl.positions) {
               newBoard[p.x][p.y] = null;
             }
          }
          setBoard(newBoard);
          await new Promise(r => setTimeout(r, 300));
          
          // Gravity
          for (let x = 0; x < COLS; x++) {
             let newCol = newBoard[x].filter(s => s !== null);
             while (newCol.length < ROWS) {
                newCol.unshift({ id: globalTileId++, symbolIdx: getRandomSymbol(rbW, scW) });
             }
             newBoard[x] = newCol as {id: number, symbolIdx: number}[];
          }
          currentBoard = newBoard as {id: number, symbolIdx: number}[][];
          setBoard(currentBoard);
          setHighlightedCells(new Set());
          await new Promise(r => setTimeout(r, 500));
       }
    }

    // Check Rainbow
    let hasRainbow = false;
    for (let x=0; x<COLS; x++) {
       for (let y=0; y<ROWS; y++) {
          if (currentBoard[x][y]?.symbolIdx === 11) hasRainbow = true;
       }
    }

    if (hasRainbow) {
       // Rainbow animation
       let coinWin = 0;
       const newReveals: {x: number, y: number, coin: ReturnType<typeof getRandomCoin>}[] = [];
       for (let x=0; x<COLS; x++) {
          for (let y=0; y<ROWS; y++) {
             if (currentGolden[x][y]) {
                const coin = getRandomCoin();
                coinWin += coin.value;
                newReveals.push({x, y, coin});
             }
          }
       }
       
       if (newReveals.length > 0) {
          setRevealedCoins(newReveals);
          await new Promise(r => setTimeout(r, 1200)); // Show coins
       }

       if (coinWin > 0) {
          totalWinMultiplier += coinWin;
          // In base game or 'luck' mode, rainbow resets the golden squares.
          // In 'glitters' or 'treasure' mode, they never reset.
          if (!isFreeSpinMode || activeBonusMode === "luck") {
            setGoldenSquares(Array(COLS).fill(0).map(() => Array(ROWS).fill(false)));
          }
       }
    }

    // Check Scatter
    let scatterCount = 0;
    for (let x=0; x<COLS; x++) {
       for (let y=0; y<ROWS; y++) {
          if (currentBoard[x][y]?.symbolIdx === 12) scatterCount++;
       }
    }
    
    // Evaluate payouts
    const payout = betAmount * totalWinMultiplier; // Payout is always based on base bet amount
    
    if (totalWinMultiplier > 0) {
       setWinInfo({ multiplier: totalWinMultiplier, payout });
       if (!isFreeSpinMode) {
         await addBalance(payout);
         recordBet("LeBandit", betCost, totalWinMultiplier, payout - betCost);
       } else {
         await addBalance(payout);
         setTotalFreeSpinWin(prev => prev + payout);
         recordBet("LeBandit(Free)", 0, totalWinMultiplier, payout);
       }
       await new Promise(r => setTimeout(r, 1500)); // Win display time
    } else if (!isFreeSpinMode) {
       recordBet("LeBandit", betCost, 0, -betCost);
    }

    if (!isFreeSpinMode && scatterCount >= 3) {
       const spins = scatterCount === 3 ? 8 : 12;
       let mode: BonusMode = "luck";
       if (scatterCount === 4) mode = "glitters";
       if (scatterCount >= 5) mode = "treasure";
       
       setActiveBonusMode(mode);
       setBonusTriggered({ spins, mode });
       setTimeout(() => setBonusTriggered(null), 3000);
       setFreeSpins(prev => prev + spins);
       setIsFreeSpinMode(true);
       await new Promise(r => setTimeout(r, 4000));
    } else if (isFreeSpinMode && scatterCount >= 2) {
       // Re-trigger
       const extraSpins = scatterCount === 2 ? 2 : 4;
       setFreeSpins(prev => prev + extraSpins);
       // Show small notification for extra spins maybe
    }

    setIsSpinning(false);
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isAutoPlaying && !isSpinning && !isFreeSpinMode && !bonusEnded) {
      if (autoBetsCount === 0 || autoBetsRemaining > 0) {
        timeoutId = setTimeout(() => {
          if (balance < betAmount || betAmount <= 0) {
             setIsAutoPlaying(false);
          } else {
             if (autoBetsCount > 0) {
                setAutoBetsRemaining(prev => prev - 1);
             }
             executeSpin();
          }
        }, 1000);
      } else if (autoBetsCount > 0 && autoBetsRemaining === 0) {
         setIsAutoPlaying(false);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [isAutoPlaying, isSpinning, isFreeSpinMode, autoBetsRemaining, autoBetsCount, balance, betAmount, bonusEnded, executeSpin]);

  useEffect(() => {
     let timer: ReturnType<typeof setTimeout>;
     if (isFreeSpinMode && !isSpinning && !bonusTriggered) {
       if (freeSpins > 0) {
         timer = setTimeout(() => {
           setFreeSpins(prev => prev - 1);
           executeSpin();
         }, 1000);
       } else {
         timer = setTimeout(() => {
           setBonusEnded({ payout: totalFreeSpinWin });
           setIsFreeSpinMode(false);
           setTotalFreeSpinWin(0);
           setGoldenSquares(Array(COLS).fill(0).map(() => Array(ROWS).fill(false)));
           setTimeout(() => {
              setBonusEnded(null);
           }, 4000);
         }, 1500);
       }
     }
     return () => clearTimeout(timer);
  }, [freeSpins, isFreeSpinMode, isSpinning, bonusTriggered, totalFreeSpinWin, executeSpin, addBalance]);


  const formatCurrency = (amount: number) => {
    return (
      <span className="inline-flex items-center gap-1">
        {amount.toFixed(4)} <img src={activeCrypto.icon} alt={activeCrypto.symbol} className="w-[1em] h-[1em]" />
      </span>
    );
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setBetAmount(val);
    } else {
      setBetAmount(0);
    }
  };

  const halfBet = () => setBetAmount(prev => Math.max(0.1, prev / 2));
  const doubleBet = () => setBetAmount(prev => prev * 2);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:h-[80vh] min-h-[600px] flex flex-col pt-20">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative">
        {/* Left Side: Controls */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col h-full">
              {!isFreeSpinMode && !isBonusBuyOpen && (
                <>
                  <div className="bg-[#0f212e] rounded-full p-1 flex mb-4">
                    <button 
                      onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("manual"); }}
                      className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
                    >Manuel</button>
                    <button 
                      onClick={() => { if(!isAutoPlaying && !isSpinning) setMode("auto"); }}
                      className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
                    >Auto</button>
                  </div>

                  {/* Bet Amount */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-[#8b9ba5] text-[13px] font-bold">
                        Montant du Pari
                      </label>
                      <span className="text-[#8b9ba5] text-[13px] font-bold flex items-center gap-1">
                        {balance.toFixed(4)} <img src={activeCrypto.icon} alt={activeCrypto.symbol} className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex items-center bg-[#0f212e] rounded border border-[#2f4553] focus-within:border-[#557086] transition-colors relative">
                      <span className="absolute left-3 text-white font-bold"><img src={activeCrypto.icon} alt={activeCrypto.symbol} className="w-4 h-4" /></span>
                      <input
                        type="number"
                        value={betAmount === 0 ? "" : betAmount}
                        onChange={handleBetChange}
                        className="w-full bg-transparent text-white font-bold pl-9 pr-2 py-2.5 outline-none font-mono text-[13px]"
                        placeholder="0.00"
                        disabled={isSpinning || isAutoPlaying || activeFeature !== "none"}
                      />
                      <div className="flex pr-1 gap-1">
                        <button
                          onClick={halfBet}
                          disabled={isSpinning || isAutoPlaying || activeFeature !== "none"}
                          className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors disabled:opacity-50"
                        >
                          ½
                        </button>
                        <button
                          onClick={doubleBet}
                          disabled={isSpinning || isAutoPlaying || activeFeature !== "none"}
                          className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors disabled:opacity-50"
                        >
                          2×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Feature Indicator */}
                  {activeFeature !== "none" && (
                    <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded p-3 flex items-center justify-between">
                       <div>
                          <div className="text-yellow-500 font-bold text-xs uppercase tracking-wider">
                             {activeFeature === "bonushunt" ? "BonusHunt FeatureSpins" : "Rainbow FeatureSpins"}
                          </div>
                          <div className="text-white font-black flex items-center gap-1">
                             {(betAmount * (activeFeature === "bonushunt" ? 3 : 50)).toFixed(4)} <img src={activeCrypto.icon} alt={activeCrypto.symbol} className="w-3 h-3" /> / tour
                          </div>
                       </div>
                       <button 
                         onClick={() => setActiveFeature("none")}
                         disabled={isSpinning || isAutoPlaying}
                         className="text-[#8b9ba5] hover:text-white disabled:opacity-50"
                         title="Désactiver la fonctionnalité"
                       >
                         ✕
                       </button>
                    </div>
                  )}

                  {/* Buy Bonus Toggle */}
                  <button
                    onClick={() => setIsBonusBuyOpen(true)}
                    disabled={isSpinning || isAutoPlaying}
                    className="w-full py-3 bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mb-6"
                  >
                    <span className="text-yellow-500 font-black">★</span> ACHETER BONUS
                  </button>

                  {mode === "auto" && (
                    <div className="mb-6 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[#8b9ba5] text-[13px] font-bold">
                          Nombre de paris
                        </label>
                        <input
                          type="number"
                          value={autoBetsCount}
                          onChange={(e) => setAutoBetsCount(Number(e.target.value))}
                          disabled={isAutoPlaying || isSpinning}
                          className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-2.5 text-white font-bold outline-none focus:border-[#557086] disabled:opacity-50 text-[13px]"
                          min="0"
                        />
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <label className="text-[#8b9ba5] text-[13px] font-bold">Autobet</label>
                        <input
                          className="toggle-input"
                          id="toggle"
                          name="toggle"
                          type="checkbox"
                          checked={isAutoPlaying}
                          disabled={!isAutoPlaying && (betAmount > balance || betAmount <= 0)}
                          onChange={(e) => {
                            if (isAutoPlaying) {
                              setIsAutoPlaying(false);
                            } else {
                              setIsAutoPlaying(true);
                              setAutoBetsRemaining(autoBetsCount);
                            }
                          }}
                        />
                        <label className="toggle-label !w-12 !h-6" htmlFor="toggle" title={isAutoPlaying ? "Arrêter Autobet" : "Démarrer Autobet"}>
                          <div className="cont-label-play">
                            <span className="label-play"></span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isFreeSpinMode && isBonusBuyOpen && (
                <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2f4553]">
                    <button 
                      onClick={() => setIsBonusBuyOpen(false)}
                      className="w-8 h-8 rounded bg-[#2f4553] hover:bg-[#3d5a6a] text-white flex items-center justify-center transition-colors"
                    >
                      ←
                    </button>
                    <span className="text-white font-black tracking-widest uppercase">Acheter Bonus</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
                     
                     {/* BonusHunt FeatureSpins */}
                     <div className="bg-[#0f212e] rounded p-3 border-l-4 border-emerald-500">
                        <div className="text-white font-black mb-1">BonusHunt FeatureSpins™</div>
                        <div className="text-[#8b9ba5] text-[11px] mb-3 leading-tight">Chaque tour a 5 fois plus de chance de déclencher le jeu bonus.</div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1 bg-[#213743] rounded p-2 text-center text-white font-bold">
                              {formatCurrency(betAmount * 3)}
                           </div>
                           <button 
                             onClick={() => { setActiveFeature(activeFeature === "bonushunt" ? "none" : "bonushunt"); setIsBonusBuyOpen(false); }}
                             className={cn("px-4 py-2 rounded font-bold transition-colors", activeFeature === "bonushunt" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-black")}
                           >
                              {activeFeature === "bonushunt" ? "Désactiver" : "Activer"}
                           </button>
                        </div>
                     </div>

                     {/* Rainbow FeatureSpins */}
                     <div className="bg-[#0f212e] rounded p-3 border-l-4 border-purple-500">
                        <div className="text-white font-black mb-1">Rainbow FeatureSpins™</div>
                        <div className="text-[#8b9ba5] text-[11px] mb-3 leading-tight">Chaque tour garantit la présence d'un symbole Arc-en-ciel.</div>
                        <div className="flex gap-2 items-center">
                           <div className="flex-1 bg-[#213743] rounded p-2 text-center text-white font-bold">
                              {formatCurrency(betAmount * 50)}
                           </div>
                           <button 
                             onClick={() => { setActiveFeature(activeFeature === "rainbow" ? "none" : "rainbow"); setIsBonusBuyOpen(false); }}
                             className={cn("px-4 py-2 rounded font-bold transition-colors", activeFeature === "rainbow" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white")}
                           >
                              {activeFeature === "rainbow" ? "Désactiver" : "Activer"}
                           </button>
                        </div>
                     </div>

                     {/* Luck of the Bandit */}
                     <div className="bg-[#0f212e] rounded p-3 border-l-4 border-amber-500">
                        <div className="text-white font-black mb-1 text-sm">Luck Of The Bandit</div>
                        <div className="text-[#8b9ba5] text-[11px] mb-3 leading-tight">Achète 8 tours gratuits où les cases dorées restent actives jusqu'à l'atterrissage d'un Arc-en-ciel.</div>
                        <button 
                          onClick={() => { setIsBonusBuyOpen(false); executeSpin("tier1"); }}
                          disabled={isSpinning || balance < betAmount * 100}
                          className="w-full py-2.5 rounded font-black transition-colors bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 disabled:hover:bg-amber-500 flex justify-between px-4 items-center"
                        >
                          <span>ACHETER</span>
                          <span>{formatCurrency(betAmount * 100)}</span>
                        </button>
                     </div>

                     {/* All That Glitters */}
                     <div className="bg-[#0f212e] rounded p-3 border-l-4 border-yellow-400">
                        <div className="text-white font-black mb-1 text-sm">All That Glitters Is Gold</div>
                        <div className="text-[#8b9ba5] text-[11px] mb-3 leading-tight">Achète 12 tours gratuits où les cases dorées ne se réinitialisent jamais.</div>
                        <button 
                          onClick={() => { setIsBonusBuyOpen(false); executeSpin("tier2"); }}
                          disabled={isSpinning || balance < betAmount * 250}
                          className="w-full py-2.5 rounded font-black transition-colors bg-yellow-400 hover:bg-yellow-300 text-black disabled:opacity-50 disabled:hover:bg-yellow-400 flex justify-between px-4 items-center"
                        >
                          <span>ACHETER</span>
                          <span>{formatCurrency(betAmount * 250)}</span>
                        </button>
                     </div>
                  </div>
                </div>
              )}

              {isFreeSpinMode && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded text-center">
                  <h3 className="text-yellow-500 font-black text-xl mb-2">BONUS ACTIF</h3>
                  <div className="text-white text-3xl font-mono mb-1">{freeSpins}</div>
                  <div className="text-[#8b9ba5] text-sm font-bold uppercase">Tours Restants</div>
                  
                  <div className="mt-4 pt-4 border-t border-yellow-500/20">
                     <div className="text-[#8b9ba5] text-sm font-bold uppercase mb-1">Gains du Bonus</div>
                     <div className="text-green-400 text-2xl font-mono">{formatCurrency(totalFreeSpinWin)}</div>
                  </div>
                </div>
              )}
            </div>

            {!isBonusBuyOpen && (
              <button
                onClick={() => executeSpin()}
                disabled={isSpinning || (!isFreeSpinMode && (betAmount <= 0 || (activeFeature === "bonushunt" ? betAmount * 3 : activeFeature === "rainbow" ? betAmount * 50 : betAmount) > balance || user == null || isAutoPlaying))}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg border-b-4",
                  isSpinning || (!isFreeSpinMode && (betAmount <= 0 || (activeFeature === "bonushunt" ? betAmount * 3 : activeFeature === "rainbow" ? betAmount * 50 : betAmount) > balance || user == null || isAutoPlaying))
                    ? "bg-[#00e701]/40 text-black/50 border-[#00e701]/20 cursor-not-allowed"
                    : "bg-[#00e701] hover:bg-[#00c700] text-[#0a2e0a] border-[#009b00]"
                )}
              >
                {isSpinning ? "EN COURS..." : isFreeSpinMode ? "TOUR GRATUIT" : isAutoPlaying ? "AUTO EN COURS..." : "PARIER"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Game */}
        <div className="flex-1 bg-[#dcd0bd] lg:rounded-r-lg lg:rounded-l-none rounded-b-lg relative overflow-hidden flex flex-col order-1 lg:order-2 self-stretch min-h-[500px]">
          {/* Noise/Vignette Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(60,40,20,0.8)_100%)] z-10 mix-blend-multiply"></div>
          
          {/* Game Header */}
          <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-20">
            <div className="text-2xl font-black text-[#5a4a35] tracking-widest uppercase origin-left scale-y-150 opacity-50">LE BANDIT</div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 z-20 relative">
             {/* 6x5 Grid */}
             <div className="relative p-3 bg-[#b5a995] rounded-xl border border-black/5 shadow-inner">
                {/* Background Grid Cells (Golden Squares) */}
                <div className="absolute inset-3 grid grid-cols-6 gap-1 md:gap-2">
                   {Array.from({ length: COLS }).map((_, x) => (
                      <div key={`bg-col-${x}`} className="flex flex-col gap-1 md:gap-2">
                         {Array.from({ length: ROWS }).map((_, y) => {
                            const isGolden = goldenSquares[x]?.[y] || false;
                            return (
                               <div key={`bg-cell-${x}-${y}`} className={cn(
                                  "w-10 h-10 md:w-16 md:h-16 rounded transition-colors duration-500",
                                  isGolden ? "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)] border border-yellow-200" : "bg-[#c5b8a5] border border-white/20"
                               )}>
                                  {isGolden && <div className="w-full h-full bg-white opacity-20 animate-pulse"></div>}
                               </div>
                            );
                         })}
                      </div>
                   ))}
                </div>

                {/* Foreground Moving Symbols */}
                <div className="grid grid-cols-6 gap-1 md:gap-2 relative z-10">
                {Array.from({ length: COLS }).map((_, x) => (
                  <div key={x} className="flex flex-col gap-1 md:gap-2 relative">
                     <AnimatePresence mode="popLayout">
                     {board[x].map((tile, y) => {
                        const cellId = `${x},${y}`;
                        const isHighlighted = highlightedCells.has(cellId);
                        const symbolIdx = tile?.symbolIdx ?? -1;
                        const sym = SYMBOLS.find(s => s.id === symbolIdx);
                        const revealedCoin = revealedCoins.find(c => c.x === x && c.y === y);

                        return (
                           <motion.div 
                              key={tile?.id ?? `empty-${x}-${y}`}
                              layout
                              initial={{ y: -50, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              className={cn(
                                 "w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-4xl transition-colors duration-300 relative rounded",
                                 isHighlighted && "scale-110 z-10 drop-shadow-2xl",
                                 sym?.id === 12 && !isSpinning && "animate-pulse" // Scatter pulse
                              )}
                           >
                              {revealedCoin ? (
                                 <motion.div 
                                   initial={{ scale: 0, rotateY: 180 }}
                                   animate={{ scale: 1, rotateY: 0 }}
                                   className={cn(
                                     "absolute inset-0 m-1 md:m-2 rounded-full border-2 flex items-center justify-center font-black text-xs md:text-sm drop-shadow-md z-30",
                                     revealedCoin.coin.type === "bronze" && "bg-gradient-to-br from-amber-700 to-amber-900 border-amber-600 text-amber-200",
                                     revealedCoin.coin.type === "silver" && "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 text-white",
                                     revealedCoin.coin.type === "gold"   && "bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-200 text-black"
                                   )}
                                 >
                                    {revealedCoin.coin.value}x
                                 </motion.div>
                              ) : (
                                 <>
                                    {sym && (
                                       <span className={cn("relative z-20", sym.color)}>
                                          {sym.char}
                                       </span>
                                    )}
                                    {sym?.text && (
                                       <span className="absolute bottom-1 right-1 text-[8px] md:text-[10px] font-black text-white tracking-widest uppercase drop-shadow z-30">
                                          {sym.text}
                                       </span>
                                    )}
                                 </>
                              )}
                           </motion.div>
                        );
                     })}
                     </AnimatePresence>
                  </div>
                ))}
                </div>
             </div>
          </div>
        </div>

        <AnimatePresence>
          {bonusTriggered && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center font-black drop-shadow-[0_0_30px_rgba(202,138,4,1)]">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl text-white mb-4 uppercase tracking-widest"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500">Chance du Bandit</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
                  className="text-6xl md:text-8xl text-yellow-500 font-mono tracking-tighter"
                >
                  {bonusTriggered.spins}
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-2xl md:text-3xl text-amber-200 mt-2 tracking-widest uppercase"
                >
                  Tours Gratuits
                </motion.div>
              </div>
            </motion.div>
          )}

          {bonusEnded && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center font-black drop-shadow-[0_0_30px_rgba(0,231,1,0.5)]">
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-5xl text-white mb-4 uppercase tracking-widest"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-200 to-green-500">Fin du Bonus</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
                  className="text-6xl md:text-8xl text-[#00e701] font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(0,231,1,0.8)]"
                >
                  {formatCurrency(bonusEnded.payout)}
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col items-center mt-4"
                >
                  <span className="text-xl md:text-2xl text-green-200 tracking-widest uppercase mb-1">
                    Gains Totaux
                  </span>
                  <span className="text-sm font-normal text-green-100 opacity-60">
                    Gains déjà ajoutés à votre solde
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {winInfo && winInfo.payout > 0 && !isSpinning && !isFreeSpinMode && !bonusEnded && (
             <WinPopup multiplier={winInfo.multiplier} payout={winInfo.payout} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
