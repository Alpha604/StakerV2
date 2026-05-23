import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function ScratchMaxiCash() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(10); // costs more
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [ticketId, setTicketId] = useState(0);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false]); // 0: winning numbers, 1: player numbers
  
  const [winningNums, setWinningNums] = useState<number[]>([]);
  const [playerNums, setPlayerNums] = useState<{num: number, val: number}[]>([]);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const generateNumbers = () => {
     let wins: number[] = [];
     while(wins.length < 3) {
        let n = Math.floor(Math.random() * 50) + 1;
        if (!wins.includes(n)) wins.push(n);
     }
     setWinningNums(wins);
     
     let players: {num: number, val: number}[] = [];
     
     // Determine if win
     const isWin = Math.random() < 0.35; // 35% win rate
     let wonAmount = 0;
     
     for (let i = 0; i < 10; i++) {
        let n = Math.floor(Math.random() * 50) + 1;
        let isWinningNum = wins.includes(n);
        
        let val = 0;
        if (isWin && wonAmount === 0 && Math.random() < 0.1) {
            // Force a win on this cell
            n = wins[Math.floor(Math.random() * wins.length)];
            val = (Math.floor(Math.random() * 5) + 1) * betAmount;
            wonAmount += val;
        } else if (isWin && Math.random() < 0.05) {
            n = wins[Math.floor(Math.random() * wins.length)];
            val = (Math.floor(Math.random() * 2) + 1) * betAmount;
            wonAmount += val;
        } else {
            // Ensure not winning
            while (wins.includes(n)) {
               n = Math.floor(Math.random() * 50) + 1;
            }
            val = [0, betAmount, betAmount*2, betAmount*5][Math.floor(Math.random()*4)];
        }
        players.push({num: n, val});
     }
     setPlayerNums(players);
  };

  const buyTicket = () => {
    if (balance < betAmount || isPlaying || ticketBought) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setIsPlaying(true);
    setTicketBought(false);
    setRevealedBoxes([false, false]);
    setTicketId(prev => prev + 1);
    
    setTimeout(() => {
        generateNumbers();
        setTicketBought(true);
    }, 400);
  };

  const handleReveal = (index: number) => {
    if (!ticketBought) return;
    const newRevealed = [...revealedBoxes];
    newRevealed[index] = true;
    setRevealedBoxes(newRevealed);
    playHit();
    
    if (newRevealed.every(Boolean)) {
       let totalWin = 0;
       playerNums.forEach(p => {
          if (winningNums.includes(p.num)) totalWin += p.val;
       });
       
       setTimeout(() => {
          if (totalWin > 0) {
             const multiplier = totalWin / betAmount;
             addBalance(totalWin);
             setWinInfo({ multiplier, payout: totalWin });
             playWin();
             recordBet("Maxi Cash", betAmount, multiplier, totalWin - betAmount);
          } else {
             playLoss();
             recordBet("Maxi Cash", betAmount, 0, -betAmount);
          }
          setIsPlaying(false);
          setTicketBought(false);
       }, 2000);
    }
  };

  const revealAll = () => {
    if (!ticketBought || revealedBoxes.every(Boolean)) return;
    setRevealedBoxes([true, true]);
    playHit();
    
    let totalWin = 0;
    playerNums.forEach(p => {
       if (winningNums.includes(p.num)) totalWin += p.val;
    });
    
    setTimeout(() => {
       if (totalWin > 0) {
          const multiplier = totalWin / betAmount;
          addBalance(totalWin);
          setWinInfo({ multiplier, payout: totalWin });
          playWin();
          recordBet("Maxi Cash", betAmount, multiplier, totalWin - betAmount);
       } else {
          playLoss();
          recordBet("Maxi Cash", betAmount, 0, -betAmount);
       }
       setIsPlaying(false);
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-[1200px] bg-[#0f212e] md:rounded-lg shadow-2xl relative min-h-[600px] overflow-hidden ml-auto mr-auto mt-4">
      <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
      
      {/* Sidebar Betting Panel */}
      <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
        <div className="flex flex-col gap-4 relative w-full h-full">
          <div className="flex items-center gap-2 mb-2">
            <button className="flex-1 bg-[#2f4553] text-white py-2 rounded text-sm font-bold shadow-sm">Manuel</button>
            <button className="flex-1 bg-transparent hover:bg-[#2f4553]/50 text-white py-2 rounded text-sm font-bold transition-colors">Auto</button>
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
                disabled={isPlaying || ticketBought}
                className="w-full bg-transparent text-white font-bold pl-7 pr-2 outline-none h-8 text-[14px]"
              />
              <div className="flex gap-1">
                <button 
                  onClick={() => setBetAmount(Math.max(5, betAmount/2))} 
                  disabled={isPlaying || ticketBought}
                  className="bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold px-3 text-[13px] rounded-sm transition-colors"
                >
                  ½
                </button>
                <button 
                  onClick={() => setBetAmount(betAmount*2)} 
                  disabled={isPlaying || ticketBought}
                  className="bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold px-3 text-[13px] rounded-sm transition-colors"
                >
                  2×
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
             <button 
                onClick={ticketBought && !revealedBoxes.every(Boolean) ? revealAll : buyTicket}
                disabled={(!ticketBought && balance < betAmount) || (isPlaying && !ticketBought)}
                className="w-full py-3.5 bg-[#00e701] hover:bg-[#1fff20] text-black font-black uppercase text-[15px] rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#00c701] active:shadow-none active:translate-y-1"
             >
                {ticketBought && !revealedBoxes.every(Boolean) ? "Tout Gratter" : (isPlaying && !ticketBought ? "Génération..." : "Acheter (" + formatCurrency(betAmount) + ")")}
             </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col justify-center items-center py-10 order-1 lg:order-2 overflow-hidden bg-[#0f212e] px-4">
         <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[800px] w-full border border-gray-700 relative flex flex-col gap-6">
            <div className="text-center">
                <h1 className="text-5xl font-black mb-2 italic text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">MAXI CASH</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Gagnez jusqu'à 100 000€ !</p>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl p-4 border border-blue-500/20">
                <h2 className="text-center text-blue-400 font-black tracking-widest mb-4">NUMÉROS GAGNANTS</h2>
                <ScratchArea 
                   revealed={revealedBoxes[0]} 
                   onReveal={() => handleReveal(0)}
                   resetKey={ticketId}
                   coverColors={["#3b82f6", "#2563eb", "#1d4ed8"]}
                   coverText="?"
                   className="w-full h-24 rounded-lg shadow-inner border-2 border-blue-500"
                >
                    <div className="absolute inset-0 flex items-center justify-evenly bg-[#0f212e]">
                       {winningNums.map((n, i) => (
                          <div key={i} className="w-12 h-12 rounded-full border border-blue-400/30 flex items-center justify-center text-2xl font-black bg-white/5">{n}</div>
                       ))}
                    </div>
                </ScratchArea>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl p-4 border border-blue-500/20">
                <h2 className="text-center text-blue-400 font-black tracking-widest mb-4">VOS NUMÉROS</h2>
                <ScratchArea 
                   revealed={revealedBoxes[1]} 
                   onReveal={() => handleReveal(1)}
                   resetKey={ticketId}
                   coverColors={["#3b82f6", "#2563eb", "#1d4ed8"]}
                   coverText="GRATTEZ LES 10 NUMÉROS"
                   className="w-full min-h-[300px] rounded-lg shadow-inner border-2 border-blue-500"
                >
                    <div className="absolute inset-0 grid grid-cols-5 gap-2 bg-[#0f212e] p-2">
                       {playerNums.map((p, i) => {
                          const isMatch = winningNums.includes(p.num);
                          return (
                             <div key={i} className={cn("flex flex-col items-center justify-center rounded border bg-white/5", isMatch && revealedBoxes[1] ? "border-emerald-500 bg-emerald-500/20" : "border-white/5")}>
                                <span className="text-lg sm:text-xl font-bold">{p.num}</span>
                                <span className={cn("text-xs font-bold", isMatch && revealedBoxes[1] ? "text-emerald-400" : "text-gray-500")}>{formatCurrency(p.val)}</span>
                             </div>
                          );
                       })}
                    </div>
                </ScratchArea>
            </div>
         </div>
      </div>
    </div>
  );
}
