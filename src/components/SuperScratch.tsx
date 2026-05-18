import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import { cn, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { WinPopup } from "./WinPopup";
import { Maximize, Minimize } from "lucide-react";
import { useSound } from "../lib/useSound";
import { AutoBetSettingsForm, useAutoBetOptions, useAutoBetLogic } from "./AutoBetSettings";

export const TICKETS = {
  cash: {
    id: "cash",
    name: "Ticket CASH",
    colors: {
      from: "from-[#1b1c31]", to: "to-[#0f0e1c]",
      border: "border-[#ffb300]",
      textTitle: "text-[#ffb300]",
      line: "bg-[#ffb300]",
      bgCell: "bg-[#0b1720]",
      scratchGradient: ["#a0aec0", "#cbd5e1", "#94a3b8"],
      winHighlight: "bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      badge: "bg-red-600 text-white border-red-400"
    },
    title: "CASH MAX",
    tagline: "Grattez et Gagnez jusqu'à 100x!",
    symbols: [
      { id: "dollar", icon: "💵", multi: 100, prob: 0.1 },
      { id: "gold", icon: "💰", multi: 50, prob: 0.2 },
      { id: "cherry", icon: "🍒", multi: 20, prob: 1 },
      { id: "watermelon", icon: "🍉", multi: 10, prob: 4 },
      { id: "lemon", icon: "🍋", multi: 5, prob: 8 },
      { id: "grape", icon: "🍇", multi: 2, prob: 15 },
      { id: "star", icon: "⭐", multi: 1, prob: 15 },
      { id: "miss", icon: "❌", multi: 0, prob: 56.7 },
    ]
  },
  maxiblackjack: {
    id: "maxiblackjack",
    name: "MAXI BLACKJACK",
    colors: {
      from: "from-[#144f33]", to: "to-[#0b3320]",
      border: "border-[#ffc107]",
      textTitle: "text-[#ffffff]",
      line: "bg-[#ffc107]",
      bgCell: "bg-[#0a2617]",
      scratchGradient: ["#d4af37", "#f3e5ab", "#aa8000"],
      winHighlight: "bg-yellow-500/30 shadow-[0_0_20px_rgba(255,193,7,0.5)]",
      badge: "bg-[#000000] text-[#ffc107] border-[#ffc107]"
    },
    title: "MAXI BLACKJACK",
    tagline: "Trouvez le 21 pour le jackpot!",
    symbols: [
      { id: "bj21", icon: "🃏", multi: 500, prob: 0.05 },
      { id: "bj20", icon: "K♠", multi: 50, prob: 0.2 },
      { id: "bj19", icon: "Q♥", multi: 20, prob: 2 },
      { id: "bj18", icon: "10♦", multi: 10, prob: 5 },
      { id: "bj17", icon: "9♣", multi: 5, prob: 10 },
      { id: "chips", icon: "🪙", multi: 2, prob: 20 },
      { id: "miss", icon: "❌", multi: 0, prob: 62.75 },
    ]
  },
  millionaire: {
    id: "millionaire",
    name: "MILLIONNAIRE",
    colors: {
      from: "from-[#350a47]", to: "to-[#1e0529]",
      border: "border-[#ff00ea]",
      textTitle: "text-[#ff00ea]",
      line: "bg-[#ff00ea]",
      bgCell: "bg-[#1f062a]",
      scratchGradient: ["#aaaaaa", "#e0e0e0", "#888888"],
      winHighlight: "bg-fuchsia-500/20 shadow-[0_0_20px_rgba(255,0,234,0.4)]",
      badge: "bg-purple-600 text-white border-purple-400"
    },
    title: "MILLIONNAIRE",
    tagline: "Un gratage = un million?!",
    symbols: [
      { id: "diamant", icon: "💍", multi: 1000, prob: 0.05 },
      { id: "or", icon: "👑", multi: 100, prob: 0.2 },
      { id: "lingot", icon: "🧱", multi: 50, prob: 0.5 },
      { id: "billets", icon: "💸", multi: 10, prob: 5 },
      { id: "sac", icon: "💰", multi: 5, prob: 10 },
      { id: "piece", icon: "🪙", multi: 2, prob: 20 },
      { id: "miss", icon: "❌", multi: 0, prob: 64.25 },
    ]
  },
  wheel: {
    id: "wheel",
    name: "WHEEL SCRATCH",
    colors: {
      from: "from-[#4a1f1f]", to: "to-[#2d1212]",
      border: "border-[#ff4d4d]",
      textTitle: "text-[#ffd700]",
      line: "bg-[#ff4d4d]",
      bgCell: "bg-[#2d1212]",
      scratchGradient: ["#661111", "#ff4444", "#aa2222"],
      winHighlight: "bg-red-500/30 shadow-[0_0_20px_rgba(255,77,77,0.5)]",
      badge: "bg-yellow-500 text-black border-yellow-600 font-black"
    },
    title: "WHEEL SCRATCH",
    tagline: "Faites tourner la roue (en grattant)!",
    symbols: [
      { id: "wheel_gold", icon: "🎡", multi: 250, prob: 0.1 },
      { id: "ticket", icon: "🎟", multi: 50, prob: 0.5 },
      { id: "bell", icon: "🔔", multi: 20, prob: 2 },
      { id: "seven", icon: "7️⃣", multi: 10, prob: 5 },
      { id: "bar", icon: "🍫", multi: 5, prob: 10 },
      { id: "miss", icon: "❌", multi: 0, prob: 82.4 },
    ]
  }
};

type TicketType = keyof typeof TICKETS;

function ScratchCell({ 
  onReveal, 
  revealed, 
  colors,
  children
}: { onReveal: () => void, revealed: boolean, colors: typeof TICKETS['cash']['colors'], children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!revealed) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, colors.scratchGradient[0]);
      gradient.addColorStop(0.5, colors.scratchGradient[1]);
      gradient.addColorStop(1, colors.scratchGradient[2]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Noise texture
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
         const noiseX = Math.random() * 30 - 15;
         data[i] = Math.min(255, Math.max(0, data[i] + noiseX));
         data[i+1] = Math.min(255, Math.max(0, data[i+1] + noiseX));
         data[i+2] = Math.min(255, Math.max(0, data[i+2] + noiseX));
      }
      ctx.putImageData(imgData, 0, 0);
      
      // Repeating STAKE logo text
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.font = "italic 900 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText("STAKE", 0, -30);
      ctx.fillText("STAKE", 0, 0);
      ctx.fillText("STAKE", 0, 30);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [revealed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (revealed) return;
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    scratch(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || revealed) return;
    scratch(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    checkCompletion();
  };

  const scratch = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const checkCompletion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 10) transparentPixels++;
    }
    const percent = transparentPixels / (pixels.length / 4);
    if (percent > 0.15) {
      onReveal();
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-[#3d5a6a]">
       <div className="absolute inset-0 z-0 bg-[#0b1720]">
          {children}
       </div>
       <canvas
         ref={canvasRef}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerCancel={handlePointerUp}
         className="absolute inset-0 z-10 w-full h-full touch-none transition-opacity duration-300"
         style={{ 
            opacity: revealed ? 0 : 1, 
            pointerEvents: revealed ? 'none' : 'auto',
            cursor: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><text y=\"24\" font-size=\"24\">🪙</text></svg>') 16 16, crosshair" 
         }}
       />
    </div>
  );
}

export function SuperScratch() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [ticketsCount, setTicketsCount] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [ticketBought, setTicketBought] = useState<boolean>(false);
  const [grid, setGrid] = useState<string[]>(Array(9).fill("hidden"));
  const [revealedStates, setRevealedStates] = useState<boolean[]>(Array(9).fill(false));
  const [winInfo, setWinInfo] = useState<{ multiplier: number; payout: number } | null>(null);
  const [winSymbolId, setWinSymbolId] = useState<string | null>(null);

  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [autoBetsCount, setAutoBetsCount] = useState<number>(0);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState<number>(0);

  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const { playHit, playWin, playLoss } = useSound();

  const [activeTicket, setActiveTicket] = useState<TicketType>("cash");
  const ticketData = TICKETS[activeTicket];

  const autoBetOptions = useAutoBetOptions();
  const { startAutoBet, processResult } = useAutoBetLogic();

  const isAutoPlayingRef = useRef(isAutoPlaying);
  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  // Generate scratch card ticket result
  const generateTicket = () => {
    const symbols = ticketData.symbols;
    const rnd = Math.random() * 100;
    
    let targetSymbol = symbols[symbols.length - 1]; // default miss
    let winMulti = 0;
    
    let cumulative = 0;
    for (const sym of symbols) {
      cumulative += sym.prob;
      if (rnd < cumulative) {
        targetSymbol = sym;
        winMulti = sym.multi;
        break;
      }
    }

    let newGrid: string[] = [];
    const missSymbolId = symbols[symbols.length - 1].id;

    if (winMulti > 0) {
       // Winning ticket needs exactly 3 matching symbols of targetSymbol
       newGrid = [targetSymbol.id, targetSymbol.id, targetSymbol.id];
       // fill remaining 6 with random non-winning (at most 2 of each)
       let av = symbols.filter(s => s.id !== targetSymbol.id && s.id !== missSymbolId);
       if (av.length === 0) av = [symbols[symbols.length - 1]];
       
       let counts: Record<string, number> = {};
       for (let i = 0; i < 6; i++) {
           let sym: typeof av[0];
           do {
             sym = av[Math.floor(Math.random() * av.length)];
           } while ((counts[sym.id] || 0) >= 2);
           counts[sym.id] = (counts[sym.id] || 0) + 1;
           newGrid.push(sym.id);
       }
    } else {
       // Losing ticket needs at most 2 of any
       let av = symbols.filter(s => s.id !== missSymbolId);
       if (av.length === 0) av = [symbols[symbols.length - 1]];
       
       let counts: Record<string, number> = {};
       for (let i = 0; i < 9; i++) {
           let sym: typeof av[0];
           do {
             sym = av[Math.floor(Math.random() * av.length)];
           } while ((counts[sym.id] || 0) >= 2);
           counts[sym.id] = (counts[sym.id] || 0) + 1;
           newGrid.push(sym.id);
       }
    }

    // shuffle newGrid
    for (let i = newGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newGrid[i], newGrid[j]] = [newGrid[j], newGrid[i]];
    }

    return { resultGrid: newGrid, winSymbol: winMulti > 0 ? targetSymbol : null, wMulti: winMulti };
  };

  const buyTicket = () => {
    const totalCost = betAmount * ticketsCount;
    if (balance < totalCost || isPlaying || ticketBought) return;

    subtractBalance(totalCost);
    setWinInfo(null);
    setIsPlaying(true);
    setWinInfo(null);
    setWinSymbolId(null);

    if (ticketsCount === 1) {
      setTicketBought(true);
      const { resultGrid } = generateTicket();
      setGrid(resultGrid);
      setRevealedStates(Array(9).fill(false));
    } else {
       // Multi-ticket instant play
       let totalPayout = 0;
       let totalMulti = 0;
       
       for(let i=0; i<ticketsCount; i++) {
          const { wMulti } = generateTicket();
          if (wMulti > 0) {
             totalPayout += betAmount * wMulti;
          }
       }

       if (totalPayout > 0) {
          playWin();
          addBalance(totalPayout);
       } else {
          playLoss();
       }

       recordBet("Super Scratch", totalCost, totalPayout / totalCost, totalPayout - totalCost);
       
       if (totalPayout > 0) {
          setWinInfo({ multiplier: totalPayout / totalCost, payout: totalPayout });
       }
       setIsPlaying(false);
    }
  };

  const revealCell = (index: number) => {
    if (!ticketBought || isAutoPlayingRef.current) return;
    if (revealedStates[index]) return;

    playHit();
    const nextStates = [...revealedStates];
    nextStates[index] = true;
    setRevealedStates(nextStates);

    checkCompletion(nextStates);
  };

  const checkCompletion = (states: boolean[]) => {
    if (states.every(s => s)) {
      finishTicket();
    }
  };

  const revealAll = () => {
    if (!ticketBought) return;
    if (revealedStates.some(s => !s)) {
      playHit();
      setRevealedStates(Array(9).fill(true));
      finishTicket();
    }
  };

  const finishTicket = () => {
    setIsPlaying(false);
    
    // Evaluate
    let counts: Record<string, number> = {};
    grid.forEach(id => {
       counts[id] = (counts[id] || 0) + 1;
    });

    let winId: string | null = null;
    Object.keys(counts).forEach(k => {
       if (counts[k] >= 3) {
           winId = k;
       }
    });

    setWinSymbolId(winId);

    let payout = 0;
    let multiplier = 0;
    if (winId) {
       const sym = ticketData.symbols.find(s => s.id === winId);
       if (sym) {
          multiplier = sym.multi;
          payout = betAmount * multiplier;
       }
    }

    if (payout > 0) {
       playWin();
       addBalance(payout);
    } else {
       playLoss();
    }

    recordBet("Super Scratch", betAmount, multiplier, payout - betAmount);
    if (payout > 0) {
       setWinInfo({ multiplier, payout });
    }

    setTicketBought(false);

    if (isAutoPlayingRef.current) {
      const profitFromRound = payout - betAmount;
      const stopped = processResult(multiplier > 0, profitFromRound, autoBetOptions.config, setBetAmount, () => {
         setIsAutoPlaying(false);
      });
      if (!stopped && autoBetsCount > 0) {
        setAutoBetsRemaining(prev => {
          let next = prev - 1;
          if (next <= 0) { setIsAutoPlaying(false); return 0; }
          return next;
        });
      }
    }
  };

  // Auto Bet Loop
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isAutoPlaying && !ticketBought && !isPlaying) {
      if (autoBetsCount === 0 || autoBetsRemaining > 0) {
        timeout = setTimeout(() => {
           if (balance >= betAmount) {
               subtractBalance(betAmount);
               setIsPlaying(true);
               setTicketBought(true);
               const { resultGrid } = generateTicket();
               setGrid(resultGrid);
               // auto reveal instantly
               setRevealedStates(Array(9).fill(true));
               // wait a small delay before finish
               setTimeout(() => finishTicket(), 400);
           } else {
               setIsAutoPlaying(false);
           }
        }, 500); // Wait between bets
      } else {
        setIsAutoPlaying(false);
      }
    }
    return () => clearTimeout(timeout);
  }, [isAutoPlaying, ticketBought, autoBetsRemaining, autoBetsCount, betAmount, isPlaying]);


  return (
    <>
      <div className={cn("flex flex-col md:flex-row gap-4 mx-auto p-4 md:p-8 transition-all duration-300", isTheaterMode ? "max-w-full h-full lg:h-[calc(100vh-80px)]" : "max-w-[1200px] min-h-[calc(100vh-80px)]")}>
        
        {/* Left Side: Controls */}
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">

            <div className="flex flex-col gap-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold px-1">Style de ticket</label>
              <select
                 value={activeTicket}
                 onChange={(e) => setActiveTicket(e.target.value as TicketType)}
                 disabled={isPlaying || isAutoPlaying || ticketBought}
                 className="w-full bg-[#0f212e] text-white border border-[#2f4553] rounded p-2 text-[13px] font-bold outline-none focus:border-[#557086] disabled:opacity-50 h-[42px]"
              >
                 {Object.entries(TICKETS).map(([key, t]) => (
                    <option key={key} value={key}>{t.name}</option>
                 ))}
              </select>
            </div>

            <div className="bg-[#0f212e] rounded-full p-1 flex">
              <button 
                onClick={() => { if(!isAutoPlaying && !isPlaying) setMode("manual"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Manuel</button>
              <button 
                onClick={() => { if(!isAutoPlaying && !isPlaying) setMode("auto"); }}
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
              >Auto</button>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[#8b9ba5] text-[13px] font-bold">
                  Montant de la mise
                </label>
                <span className="text-[#8b9ba5] text-[13px] flex items-center gap-1 font-semibold">
                  $ {formatCurrency(balance)}
                </span>
              </div>
              <div className="bg-[#0f212e] rounded flex items-center border border-[#2f4553] focus-within:border-[#557086] transition-colors p-1">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full bg-transparent p-2 text-white font-bold outline-none focus:ring-0 text-[13px]"
                  min="0"
                  step="0.01"
                  disabled={isPlaying || isAutoPlaying}
                />
                <div className="flex gap-1 pr-1">
                  <button onClick={() => setBetAmount(b => Math.max(0, b / 2))} disabled={isPlaying || isAutoPlaying} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                    ½
                  </button>
                  <button onClick={() => setBetAmount(b => b * 2)} disabled={isPlaying || isAutoPlaying} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                    2×
                  </button>
                </div>
              </div>
            </div>

            {mode === "manual" && (
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[#8b9ba5] text-[13px] font-bold">
                    Nombre de tickets simultanés
                  </label>
                </div>
                <div className="bg-[#0f212e] rounded flex items-center border border-[#2f4553] focus-within:border-[#557086] transition-colors p-1">
                  <input
                    type="number"
                    value={ticketsCount}
                    onChange={(e) => setTicketsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-transparent p-2 text-white font-bold outline-none focus:ring-0 text-[13px]"
                    min="1"
                    disabled={isPlaying || ticketBought}
                  />
                  <div className="flex gap-1 pr-1">
                    <button onClick={() => setTicketsCount(1)} disabled={isPlaying || ticketBought} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                      1
                    </button>
                    <button onClick={() => setTicketsCount(10)} disabled={isPlaying || ticketBought} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                      10
                    </button>
                    <button onClick={() => setTicketsCount(100)} disabled={isPlaying || ticketBought} className="px-3 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] text-white rounded text-xs font-bold transition-colors disabled:opacity-50">
                      100
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === "auto" && (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b9ba5] text-[13px] font-bold px-1">
                    Nombre de paris (0 = infini)
                  </label>
                  <input
                    type="number"
                    value={autoBetsCount}
                    onChange={(e) => setAutoBetsCount(Number(e.target.value))}
                    disabled={isAutoPlaying || isPlaying}
                    className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-2.5 text-white font-bold outline-none focus:border-[#557086] disabled:opacity-50 text-[13px]"
                    min="0"
                  />
                </div>
                <div className="mt-2 text-left">
                   <AutoBetSettingsForm config={autoBetOptions.config} actions={autoBetOptions.actions} disabled={isAutoPlaying || isPlaying} />
                </div>
              </div>
            )}

            <div className="flex-1"></div>

            {mode === "auto" ? (
              <div className="toggle-cont">
                <input
                  className="toggle-input"
                  id="toggle"
                  name="toggle"
                  type="checkbox"
                  checked={isAutoPlaying}
                  disabled={!isAutoPlaying && (betAmount > balance || betAmount <= 0) || (isPlaying && !isAutoPlaying)}
                  onChange={(e) => {
                    if (isAutoPlaying) {
                      setIsAutoPlaying(false);
                    } else {
                      startAutoBet(betAmount);
                      setIsAutoPlaying(true);
                      setAutoBetsRemaining(autoBetsCount);
                    }
                  }}
                />
                <label className="toggle-label" htmlFor="toggle" title={isAutoPlaying ? "Arrêter Autobet" : "Démarrer Autobet"}>
                  <div className="cont-label-play">
                    <span className="label-play text-[13px]">Démarrer Autobet</span>
                  </div>
                </label>
              </div>
            ) : (
               <div className="flex gap-2">
                 {!ticketBought ? (
                   <button
                    onClick={buyTicket}
                    disabled={balance < (betAmount * ticketsCount) || betAmount <= 0 || isPlaying}
                    className={cn(
                      "flex-1 py-4 rounded font-bold transition-all text-sm shadow-[0_4px_0_#149e53] hover:translate-y-1 hover:shadow-[0_0px_0_#149e53] active:translate-y-1 active:shadow-none bg-[#1bc86a] hover:bg-[#1bc86a] text-black",
                      (balance < (betAmount * ticketsCount) || betAmount <= 0 || isPlaying) && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_4px_0_#149e53]"
                    )}
                   >
                    Acheter {ticketsCount > 1 ? `${ticketsCount} Tickets` : "Ticket"}
                   </button>
                 ) : (
                   <button
                    onClick={revealAll}
                    disabled={revealedStates.every(s => s) || isAutoPlaying}
                    className={cn(
                      "flex-1 py-4 rounded font-bold transition-all text-sm shadow-[0_4px_0_#149e53] hover:translate-y-1 hover:shadow-[0_0px_0_#149e53] active:translate-y-1 active:shadow-none bg-[#1bc86a] hover:bg-[#1bc86a] text-black",
                      (revealedStates.every(s => s) || isAutoPlaying) && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-[0_4px_0_#149e53]"
                    )}
                   >
                    Gratter Tout
                   </button>
                 )}
               </div>
            )}
            
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 bg-[#0f212e] lg:rounded-r-2xl lg:rounded-bl-none rounded-b-2xl flex flex-col items-center justify-center order-1 lg:order-2 border border-[#233845] lg:border-l-0 p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
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

          {winInfo && (
            <WinPopup
              multiplier={winInfo.multiplier}
              payout={winInfo.payout}
              onClose={() => setWinInfo(null)}
            />
          )}

          <div className={`relative w-full max-w-[500px] bg-gradient-to-br ${ticketData.colors.from} ${ticketData.colors.to} rounded-3xl p-6 md:p-8 shadow-2xl border-4 ${ticketData.colors.border} mx-auto overflow-hidden`}>
             
             {/* Ticket decorations */}
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #ffffff 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
             <div className={`absolute top-0 left-0 w-full h-[5px] ${ticketData.colors.line}`}></div>
             
             <div className="text-center mb-6 relative z-10">
               <h2 className={`${ticketData.colors.textTitle} text-3xl font-black italic tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] uppercase mb-1`} style={{ WebkitTextStroke: "1px #fff" }}>{ticketData.title}</h2>
               <p className={`font-bold text-sm inline-block px-4 py-1 rounded-full shadow-md mb-4 border ${ticketData.colors.badge}`}>{ticketData.tagline}</p>
               
               <div className="flex justify-center gap-2 flex-wrap mb-2">
                 {ticketData.symbols.filter(s => s.multi > 0).map(s => (
                    <div key={s.id} className="text-xs bg-[#000000]/40 px-2 py-1 rounded-md border border-white/10 shadow-inner flex flex-col items-center flex-1 min-w-[55px]">
                      <span className="text-lg leading-none">{s.icon}</span>
                      <span className="text-[#00e676] font-extrabold text-[13px]">{s.multi}x</span>
                      <span className="text-[#8b9ba5] text-[9px] mt-0.5">{s.prob.toFixed(2)}%</span>
                    </div>
                 ))}
               </div>
             </div>

             <div className={`grid grid-cols-3 gap-3 sm:gap-4 w-full p-4 sm:p-5 bg-black/40 rounded-xl shadow-inner border border-white/10 relative z-10 backdrop-blur-sm`}>
                {grid.map((cellId, i) => {
                  const symbolData = ticketData.symbols.find(s => s.id === cellId) || ticketData.symbols[ticketData.symbols.length - 1];
               const revealed = revealedStates[i];
               const isWinningCell = winSymbolId && winSymbolId === symbolData.id && revealed;
               const notWinningCell = winSymbolId && winSymbolId !== symbolData.id && revealed;
               
               return (
                  <div key={i} className="aspect-square">
                    <ScratchCell revealed={revealed} onReveal={() => revealCell(i)} colors={ticketData.colors}>
                       <div className={cn(
                          `w-full h-full flex items-center justify-center text-4xl sm:text-5xl transition-all duration-300 ${ticketData.colors.bgCell}`,
                          isWinningCell ? `${ticketData.colors.winHighlight} rounded-xl` : "rounded-xl",
                          notWinningCell ? "opacity-30 grayscale" : ""
                       )}>
                          {symbolData.icon}
                       </div>
                    </ScratchCell>
                  </div>
               );
             })}
          </div>
        </div>

        </div>
      </div>
    </>
  );
}
