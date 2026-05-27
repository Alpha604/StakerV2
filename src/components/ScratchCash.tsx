import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";
import { useAutoBetLogic, useAutoBetOptions, AutoBetSettingsForm } from "./AutoBetSettings";

export function ScratchCash() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [ticketId, setTicketId] = useState(0);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false]);
  
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoBetsCount, setAutoBetsCount] = useState(0);
  const [autoBetsRemaining, setAutoBetsRemaining] = useState(0);
  
  const autoBetOptions = useAutoBetOptions();
  const { startAutoBet, processResult } = useAutoBetLogic();
  
  const isAutoPlayingRef = useRef(isAutoPlaying);
  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const [box1Val, setBox1Val] = useState(0);
  const [box2Val, setBox2Val] = useState(0);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const handleEndOfRound = (totalWin: number) => {
    if (totalWin > 0) {
      const multiplier = totalWin / betAmount;
      addBalance(totalWin);
      
      // En mode auto on n'affiche pas la grosse WinPopup si c'est très rapide, 
      // ou on l'affiche et on compte sur le delay, mais pour l'instant on garde WinPopup
      if (!isAutoPlayingRef.current) {
        setWinInfo({ multiplier, payout: totalWin });
      }
      playWin();
      recordBet("Cash Original", betAmount, multiplier, totalWin - betAmount);
    } else {
      playLoss();
      recordBet("Cash Original", betAmount, 0, -betAmount);
    }
    
    setIsPlaying(false);

    if (isAutoPlayingRef.current) {
      if (processResult(totalWin > 0, totalWin - betAmount, autoBetOptions.config, setBetAmount, () => setIsAutoPlaying(false))) {
         // Auto play stopped by limits
      } else {
         setAutoBetsRemaining(prev => {
            const next = prev - 1;
            if (next <= 0 && autoBetsCount !== 0) {
               setIsAutoPlaying(false);
            }
            return next;
         });
      }
    }
  };

  useEffect(() => {
    if (isAutoPlaying && !isPlaying && !ticketBought && balance >= betAmount && (autoBetsCount === 0 || autoBetsRemaining > 0)) {
       // Loop auto buy
       const tm = setTimeout(() => {
          if (isAutoPlayingRef.current) {
              buyTicket();
          }
       }, 500);
       return () => clearTimeout(tm);
    } else if (isAutoPlaying && ticketBought && !revealedBoxes.every(Boolean)) {
       // Loop auto scratch
       const tm = setTimeout(() => {
          if (isAutoPlayingRef.current) revealAll();
       }, 300);
       return () => clearTimeout(tm);
    }
    if (isAutoPlaying && balance < betAmount) {
       setIsAutoPlaying(false);
    }
  }, [isAutoPlaying, isPlaying, ticketBought, revealedBoxes, balance, betAmount, autoBetsRemaining]);

  const buyTicket = () => {
    if (balance < betAmount || isPlaying || ticketBought) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setIsPlaying(true);
    setRevealedBoxes([false, false]);
    setTicketBought(false); // disable scratching while generating
    setTicketId(prev => prev + 1);
    
    // Win logic: 30% chance to win
    setTimeout(() => {
        let totalWin = 0;
        const rand = Math.random();
        if (rand < 0.05) totalWin = betAmount * 5;      // 5% 5x
        else if (rand < 0.15) totalWin = betAmount * 2; // 10% 2x
        else if (rand < 0.30) totalWin = betAmount * 1; // 15% 1x
        
        let val1 = 0;
        let val2 = 0;
        if (totalWin > 0) {
            if (Math.random() < 0.5) {
                val1 = totalWin;
            } else {
                val2 = totalWin;
            }
        } else {
            val1 = 0;
            val2 = 0;
        }
        
        setBox1Val(val1);
        setBox2Val(val2);
        setTicketBought(true);
    }, 400); // 400ms is enough for the canvas to cover and be fully opaque.
  };

  const handleReveal = (index: number) => {
    if (!ticketBought || isAutoPlayingRef.current) return;
    const newRevealed = [...revealedBoxes];
    newRevealed[index] = true;
    setRevealedBoxes(newRevealed);
    playHit();
    
    if (newRevealed.every(Boolean)) {
       const totalWin = box1Val + box2Val;
       setTimeout(() => {
          handleEndOfRound(totalWin);
          setTicketBought(false);
       }, 2000);
    }
  };

  const revealAll = () => {
    if (!ticketBought || revealedBoxes.every(Boolean)) return;
    setRevealedBoxes([true, true]);
    playHit();
    
    const totalWin = box1Val + box2Val;
    setTimeout(() => {
        handleEndOfRound(totalWin);
        setTicketBought(false);
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1200px] bg-[#0f212e] md:rounded-lg shadow-2xl relative min-h-[600px] overflow-hidden ml-auto mr-auto mt-4">
      <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
      
      {/* Sidebar Betting Panel */}
      <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
        <div className="flex flex-col gap-4 relative w-full h-full">
          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button 
                onClick={() => { if (!isAutoPlaying && !isPlaying) setMode("manual"); }} 
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "manual" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
            >Manuel</button>
            <button 
                onClick={() => { if (!isAutoPlaying && !isPlaying) setMode("auto"); }} 
                className={cn("flex-1 text-[13px] font-bold rounded-full py-1.5 transition-colors", mode === "auto" ? "text-white bg-[#2f4553] shadow-sm" : "text-[#8b9ba5] hover:text-white")}
            >Auto</button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[#8b9ba5] text-[13px] font-bold">Prix du Ticket</label>
              <span className="text-[#8b9ba5] text-[13px]">{formatCurrency(betAmount)}</span>
            </div>
            <div className="flex bg-[#0f212e] rounded-sm p-1 border border-[#2f4553] focus-within:border-[#557086] transition-colors relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input 
                type="number" 
                value={betAmount === 0 ? '' : betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={0}
                step={0.1}
                disabled={isPlaying || ticketBought || isAutoPlaying}
                className="w-full bg-transparent text-white font-bold pl-7 pr-2 outline-none h-8 text-[14px] disabled:opacity-50"
              />
              <div className="flex gap-1">
                <button 
                  onClick={() => setBetAmount(Math.max(0, betAmount/2))} 
                  disabled={isPlaying || ticketBought || isAutoPlaying}
                  className="bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold px-3 text-[13px] rounded-sm transition-colors disabled:opacity-50"
                >
                  ½
                </button>
                <button 
                  onClick={() => setBetAmount(betAmount*2)} 
                  disabled={isPlaying || ticketBought || isAutoPlaying}
                  className="bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold px-3 text-[13px] rounded-sm transition-colors disabled:opacity-50"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          {mode === "auto" && (
            <div className="flex flex-col gap-1 mt-2">
               <div className="flex justify-between items-center px-1">
                 <label className="text-[#8b9ba5] text-xs font-bold uppercase tracking-wide">Nombre de paris (0 = infini)</label>
               </div>
               <div className="relative flex items-center bg-[#0f212e] rounded-sm border border-[#2f4553] focus-within:border-[#557086] transition-colors p-0.5">
                 <input
                   type="number"
                   value={autoBetsCount}
                   onChange={(e) => setAutoBetsCount(Math.max(0, Number(e.target.value)))}
                   disabled={isAutoPlaying || isPlaying}
                   className="w-full bg-transparent p-2 text-white font-bold outline-none disabled:opacity-50 text-[13px]"
                   min="0"
                 />
                 {autoBetsCount === 0 && <span className="absolute right-3 text-[#8b9ba5] text-lg pointer-events-none pb-1">∞</span>}
               </div>
               
               <AutoBetSettingsForm config={autoBetOptions.config} actions={autoBetOptions.actions} disabled={isAutoPlaying || isPlaying} />
            </div>
          )}

          <div className="flex-1"></div>

          {mode === "auto" ? (
             <div className="mt-auto pt-4 flex gap-2">
               <button 
                  onClick={() => {
                   if (isAutoPlaying) {
                     setIsAutoPlaying(false);
                   } else {
                     startAutoBet(betAmount);
                     setIsAutoPlaying(true);
                     setAutoBetsRemaining(autoBetsCount);
                   }
                  }}
                  disabled={(!isAutoPlaying && betAmount > balance) || (isPlaying && !ticketBought && !isAutoPlaying)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 font-black uppercase text-[15px] rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                    isAutoPlaying 
                      ? "bg-transparent text-white border-2 border-white/20 hover:bg-white/5 active:bg-white/10" 
                      : "bg-[#00e701] hover:bg-[#1fff20] text-black shadow-[0_4px_0_#00c701] active:shadow-none active:translate-y-1"
                  )}
               >
                  {isAutoPlaying ? "Arrêter Autobet" : "Démarrer Autobet"}
               </button>
             </div>
          ) : (
            <div className="mt-auto pt-4 flex gap-2">
               {!ticketBought || revealedBoxes.every(Boolean) ? (
                 <button 
                    onClick={buyTicket}
                    disabled={(!ticketBought && balance < betAmount) || (isPlaying && !ticketBought)}
                    className="w-full py-3.5 bg-[#00e701] hover:bg-[#1fff20] text-black font-black uppercase text-[15px] rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#00c701] active:shadow-none active:translate-y-1"
                 >
                    {isPlaying ? "Génération..." : "Acheter"}
                 </button>
               ) : (
                 <button 
                    onClick={revealAll}
                    disabled={revealedBoxes.every(Boolean)}
                    className="w-full py-3.5 bg-[#00e701] hover:bg-[#1fff20] text-black font-black uppercase text-[15px] rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#00c701] active:shadow-none active:translate-y-1"
                 >
                    Tout Gratter
                 </button>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col justify-center items-center py-10 order-1 lg:order-2 overflow-hidden bg-[#0f212e] px-4">
         <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[500px] w-full border border-gray-700 relative">
            <h1 className="text-4xl font-black text-center mb-2 italic text-emerald-500 drop-shadow-lg">CASH</h1>
            <p className="text-center text-gray-400 font-bold mb-8 uppercase tracking-widest text-sm">Grattez et gagnez les montants indiqués !</p>
            
            <div className="grid grid-cols-2 gap-6">
                <ScratchArea 
                   revealed={revealedBoxes[0]} 
                   onReveal={() => handleReveal(0)}
                   resetKey={ticketId}
                   coverColors={["#34d399", "#10b981", "#059669"]}
                   coverText="$"
                   className="w-full aspect-square rounded-xl shadow-inner border-[3px] border-emerald-500"
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f212e] text-3xl sm:text-4xl font-black">
                       {box1Val > 0 ? (
                           <span className="text-emerald-400">{formatCurrency(box1Val)}</span>
                       ) : (
                           <span className="text-gray-500">0</span>
                       )}
                    </div>
                </ScratchArea>
                
                <ScratchArea 
                   revealed={revealedBoxes[1]} 
                   onReveal={() => handleReveal(1)}
                   resetKey={ticketId}
                   coverColors={["#34d399", "#10b981", "#059669"]}
                   coverText="$"
                   className="w-full aspect-square rounded-xl shadow-inner border-[3px] border-emerald-500"
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f212e] text-3xl sm:text-4xl font-black">
                       {box2Val > 0 ? (
                           <span className="text-emerald-400">{formatCurrency(box2Val)}</span>
                       ) : (
                           <span className="text-gray-500">0</span>
                       )}
                    </div>
                </ScratchArea>
            </div>
         </div>
      </div>
    </div>
  );
}
