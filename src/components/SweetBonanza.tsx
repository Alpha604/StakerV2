import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { cn } from "../lib/utils";

const COLS = 6;
const ROWS = 5;

// Scatter is lollipop. Others are candies and fruits.
const SYMBOLS = [
  { id: 0, type: "low", char: "🍌", name: "Banana" },
  { id: 1, type: "low", char: "🍇", name: "Grapes" },
  { id: 2, type: "low", char: "🍉", name: "Watermelon" },
  { id: 3, type: "low", char: "🍑", name: "Plum" },
  { id: 4, type: "low", char: "🍎", name: "Apple" },
  { id: 5, type: "med", char: "🟦", name: "Blue Candy" }, // Blue candy
  { id: 6, type: "med", char: "🟩", name: "Green Candy" }, // Green candy
  { id: 7, type: "high", char: "🟪", name: "Purple Candy" }, // Purple candy
  { id: 8, type: "high", char: "❤️", name: "Red Heart" }, // Red Heart Candy
  { id: 9, type: "scatter", char: "🍭", name: "Lollipop Scatter" },
];

const MULTIPLIERS = [2, 3, 4, 5, 8, 10, 15, 20, 25, 50, 100]; // Bomb multipliers

const PAYOUTS = {
  0: { 8: 0.25, 10: 0.75, 12: 2 },
  1: { 8: 0.4, 10: 0.9, 12: 4 },
  2: { 8: 0.5, 10: 1, 12: 5 },
  3: { 8: 0.8, 10: 1.2, 12: 8 },
  4: { 8: 1, 10: 1.5, 12: 10 },
  5: { 8: 1.5, 10: 2, 12: 12 },
  6: { 8: 2, 10: 5, 12: 15 },
  7: { 8: 2.5, 10: 10, 12: 25 },
  8: { 8: 10, 10: 25, 12: 50 },
  9: { 4: 3, 5: 5, 6: 100 }, // Scatters
} as any;

type Position = { x: number, y: number };
type Tile = { id: number, symbolIdx: number, isBomb?: boolean, mult?: number };

let nextId = 0;
const generateRandomSymbol = (isFreeSpins: boolean = false) => {
  const rand = Math.random() * 100;
  let symbolIdx = 0;
  if (rand < 20) symbolIdx = 0;
  else if (rand < 35) symbolIdx = 1;
  else if (rand < 50) symbolIdx = 2;
  else if (rand < 65) symbolIdx = 3;
  else if (rand < 75) symbolIdx = 4;
  else if (rand < 83) symbolIdx = 5;
  else if (rand < 90) symbolIdx = 6;
  else if (rand < 95) symbolIdx = 7;
  else if (rand < 98) symbolIdx = 8;
  else symbolIdx = 9;

  let isBomb = false;
  let mult = 0;
  if (isFreeSpins && symbolIdx !== 9 && Math.random() < 0.1) {
    isBomb = true;
    mult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  }

  return { id: nextId++, symbolIdx, isBomb, mult };
};

const generateBoard = (isFreeSpins: boolean = false) => {
  const b: Tile[][] = [];
  for (let x = 0; x < COLS; x++) {
    b[x] = [];
    for (let y = 0; y < ROWS; y++) {
      b[x][y] = generateRandomSymbol(isFreeSpins);
    }
  }
  return b;
};

export function SweetBonanza() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [board, setBoard] = useState<Tile[][]>(() => generateBoard());
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [totalWin, setTotalWin] = useState(0);
  const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());

  const [freeSpins, setFreeSpins] = useState(0);
  const [isFreeSpinMode, setIsFreeSpinMode] = useState(false);
  const [roundMultipliers, setRoundMultipliers] = useState<number[]>([]);

  const formatCurrency = (amount: number) => {
    return (
      <span className="inline-flex items-center gap-1">
        {amount.toFixed(4)} {renderCryptoIcon(activeCrypto, "w-[1em] h-[1em]")}
      </span>
    );
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setBetAmount(val);
    else setBetAmount(0);
  };

  const halfBet = () => setBetAmount(p => Math.max(0.1, p / 2));
  const doubleBet = () => setBetAmount(p => p * 2);

  const calculateWins = (currentBoard: Tile[][]) => {
    const counts = new Array(SYMBOLS.length).fill(0);
    const positions: { [key: number]: Position[] } = {};
    const bombs: number[] = [];

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        const tile = currentBoard[x][y];
        if (!tile) continue;
        if (tile.isBomb && tile.mult) {
           bombs.push(tile.mult);
        } else {
           counts[tile.symbolIdx]++;
           if (!positions[tile.symbolIdx]) positions[tile.symbolIdx] = [];
           positions[tile.symbolIdx].push({ x, y });
        }
      }
    }

    let winMultiplier = 0;
    const toPop = new Set<string>();
    
    for (let sIdx = 0; sIdx < SYMBOLS.length; sIdx++) {
      let count = counts[sIdx];
      let tier = count >= 12 ? 12 : count >= 10 ? 10 : count >= 8 ? 8 : 0;
      if (sIdx === 9 && count >= 4) {
        tier = count >= 6 ? 6 : count === 5 ? 5 : 4;
      }
      
      if (tier && PAYOUTS[sIdx] && PAYOUTS[sIdx][tier]) {
        winMultiplier += PAYOUTS[sIdx][tier];
        positions[sIdx].forEach(p => toPop.add(`${p.x},${p.y}`));
      }
    }
    
    return { winMultiplier, toPop, bombs };
  };

  const cascade = async () => {
    if (board.every(col => col.length === 0)) return; // Prevents crash

    let currentBoard = board.map(col => [...col]);
    let currentTotalMultiplier = 0;
    let anyWins = false;
    let roundBombs: number[] = [];

    while (true) {
      const { winMultiplier, toPop, bombs } = calculateWins(currentBoard);
      
      if (toPop.size === 0) {
        break; // No more wins
      }
      
      anyWins = true;
      currentTotalMultiplier += winMultiplier;
      roundBombs.push(...bombs);
      setPoppingCells(toPop);
      await new Promise(r => setTimeout(r, 600));

      // Remove popped
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          if (toPop.has(`${x},${y}`)) {
             currentBoard[x][y] = null as any;
          }
        }
      }

      // Fall down
      for (let x = 0; x < COLS; x++) {
        currentBoard[x] = currentBoard[x].filter(t => t !== null);
        while (currentBoard[x].length < ROWS) {
          currentBoard[x].unshift(generateRandomSymbol(isFreeSpinMode));
        }
      }

      setBoard([...currentBoard]);
      setPoppingCells(new Set());
      await new Promise(r => setTimeout(r, 500));
    }

    let finalMult = currentTotalMultiplier;
    if (anyWins && roundBombs.length > 0) {
       setRoundMultipliers(roundBombs);
       const totalBombMult = roundBombs.reduce((acc, v) => acc + v, 0);
       finalMult *= totalBombMult;
    }

    if (finalMult > 0) {
       const w = betAmount * finalMult;
       setTotalWin(prev => prev + w);
       if (!isFreeSpinMode) {
          await addBalance(w);
       }
    }
    return finalMult;
  };

  const executeSpin = async () => {
    if (isSpinning || (!isFreeSpinMode && (balance < betAmount || betAmount <= 0))) return;
    
    setIsSpinning(true);
    setTotalWin(0);
    setRoundMultipliers([]);

    if (!isFreeSpinMode) {
      subtractBalance(betAmount);
    }

    // Spin animation
    const newBoard = generateBoard(isFreeSpinMode);
    setBoard(newBoard);
    await new Promise(r => setTimeout(r, 500));

    const mult = await cascade();

    if (!isFreeSpinMode) {
      if (mult) {
         recordBet("SweetBonanza", betAmount, mult, betAmount * mult - betAmount);
      } else {
         recordBet("SweetBonanza", betAmount, 0, -betAmount);
      }
    }

    setIsSpinning(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col pt-20">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative">
        {/* Left Side: Controls */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#3a1a5b] rounded-lg flex flex-col p-6 z-10 border-4 border-[#ff6b6b]/30 shadow-[0_0_30px_rgba(255,107,107,0.2)]">
           <h2 className="text-3xl font-black text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-4 uppercase tracking-wider title-font flex flex-col">
              <span className="text-pink-400">Sweet</span>
              <span className="text-yellow-400">Bonanza</span>
           </h2>

           <div className="flex-1 flex flex-col gap-4">
              <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                 <div className="flex justify-between mb-2">
                   <label className="text-white/60 text-[13px] font-bold">Pari</label>
                   <span className="text-white/80 text-[13px] font-bold flex items-center gap-1">
                     {balance.toFixed(4)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                   </span>
                 </div>
                 <div className="flex items-center bg-black/50 rounded border border-white/10 relative">
                   <span className="absolute left-3">{renderCryptoIcon(activeCrypto, "w-4 h-4")}</span>
                   <input
                     type="number"
                     value={betAmount === 0 ? "" : betAmount}
                     onChange={handleBetChange}
                     className="w-full bg-transparent text-white font-bold pl-9 pr-2 py-2.5 outline-none font-mono"
                     disabled={isSpinning || isFreeSpinMode}
                   />
                   <div className="flex gap-1 pr-1">
                     <button onClick={halfBet} disabled={isSpinning || isFreeSpinMode} className="px-2 py-1 bg-white/10 rounded text-xs font-bold hover:bg-white/20">½</button>
                     <button onClick={doubleBet} disabled={isSpinning || isFreeSpinMode} className="px-2 py-1 bg-white/10 rounded text-xs font-bold hover:bg-white/20">2×</button>
                   </div>
                 </div>
              </div>

              {totalWin > 0 && (
                <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-xl animation-pulse text-center">
                   <div className="text-green-300 font-bold uppercase text-xs tracking-widest mb-1">Gain Total</div>
                   <div className="text-white text-3xl font-black">{formatCurrency(totalWin)}</div>
                </div>
              )}

              <button
                onClick={executeSpin}
                disabled={isSpinning || betAmount <= 0 || (!isFreeSpinMode && balance < betAmount)}
                className={cn(
                  "w-full py-5 rounded-xl font-black text-2xl mt-auto",
                  "bg-gradient-to-t from-pink-600 to-pink-400 text-white shadow-[0_5px_0_#9d174d,0_10px_20px_rgba(236,72,153,0.5)] active:shadow-[0_0px_0_#9d174d] active:translate-y-[5px] transition-all"
                )}
              >
                {isSpinning ? "🍬..." : "JOUER"}
              </button>
           </div>
        </div>

        {/* Right Side: Board */}
        <div className="flex-1 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-[8px] border-[#ffb3c6] bg-[url('https://rainbet.com/_next/image?url=https:%2F%2Frainbet-images.nyc3.cdn.digitaloceanspaces.com%2Fslots%2Fpragmatic-play-sweet-bonanza.jpg&w=1920&q=75')] bg-cover bg-center">
            <div className="absolute inset-0 bg-pink-900/40 mix-blend-multiply pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center p-8 backdrop-blur-[2px]">
               <div className="grid grid-cols-6 gap-2 w-full max-w-2xl h-full lg:max-h-[500px]">
                  {board.map((col, x) => (
                    <div key={x} className="flex flex-col gap-2 relative">
                      <AnimatePresence mode="popLayout">
                        {col.map((tile, y) => (
                          <motion.div
                            key={tile.id}
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: poppingCells.has(`${x},${y}`) ? 0 : 1, scale: poppingCells.has(`${x},${y}`) ? 1.5 : 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="flex-1 relative flex items-center justify-center bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg"
                          >
                            <span className="text-4xl md:text-5xl filter drop-shadow-md">
                              {tile.isBomb ? "💣" : SYMBOLS[tile.symbolIdx].char}
                            </span>
                            {tile.isBomb && (
                               <span className="absolute text-yellow-300 font-black text-xl md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                                  {tile.mult}x
                               </span>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
