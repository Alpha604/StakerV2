import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function ScratchSupraHalla() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(5); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [ticketId, setTicketId] = useState(0);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false]); // 0: grid, 1: cup
  
  const [grid, setGrid] = useState<string[]>([]);
  const [cupAmount, setCupAmount] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const ICONS = ["K", "Q", "J", "10", "9", "8", "7"];

  const generateGame = () => {
     let isWin = Math.random() < 0.25; 
     let newGrid = [];
     
     let numAces = isWin ? 3 : Math.floor(Math.random() * 3); // 0, 1 or 2 aces if lose
     let acesPlaced = 0;
     
     for (let i = 0; i < 12; i++) {
        if (acesPlaced < numAces) {
           let remainingSlots = 12 - i;
           let remainingAces = numAces - acesPlaced;
           if (Math.random() < (remainingAces / remainingSlots)) {
               newGrid.push("As");
               acesPlaced++;
               continue;
           }
        }
        newGrid.push(ICONS[Math.floor(Math.random() * ICONS.length)]);
     }
     
     // Shuffle
     newGrid = newGrid.sort(() => Math.random() - 0.5);
     setGrid(newGrid);
     
     let amount = 0;
     if (isWin) {
         if (Math.random() < 0.05) amount = betAmount * 100;
         else if (Math.random() < 0.2) amount = betAmount * 20;
         else amount = betAmount * (Math.floor(Math.random() * 5) + 2); // 2x to 6x
     } else {
         amount = [0, betAmount*2, betAmount*5, betAmount*10][Math.floor(Math.random()*4)];
     }
     
     setHasWon(isWin);
     setCupAmount(amount);
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
        generateGame();
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
       setTimeout(() => {
          if (hasWon && cupAmount > 0) {
             const multiplier = cupAmount / betAmount;
             addBalance(cupAmount);
             setWinInfo({ multiplier, payout: cupAmount });
             playWin();
             recordBet("Supra Halla", betAmount, multiplier, cupAmount - betAmount);
          } else {
             playLoss();
             recordBet("Supra Halla", betAmount, 0, -betAmount);
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
    
    setTimeout(() => {
       if (hasWon && cupAmount > 0) {
          const multiplier = cupAmount / betAmount;
          addBalance(cupAmount);
          setWinInfo({ multiplier, payout: cupAmount });
          playWin();
          recordBet("Supra Halla", betAmount, multiplier, cupAmount - betAmount);
       } else {
          playLoss();
          recordBet("Supra Halla", betAmount, 0, -betAmount);
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
                  onClick={() => setBetAmount(Math.max(2, betAmount/2))} 
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
         <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[500px] w-full border border-gray-700 relative flex flex-col gap-6">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-2 italic text-[#b82a2a] drop-shadow-[0_0_15px_rgba(184,42,42,0.5)]">SUPRA HALLA</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm text-[#d45858]">Trouvez 3x As pour gagner la Coupe !</p>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl p-4 border border-[#b82a2a]/20">
                <ScratchArea 
                   revealed={revealedBoxes[0]} 
                   onReveal={() => handleReveal(0)}
                   resetKey={ticketId}
                   coverColors={["#ef4444", "#dc2626", "#b91c1c"]}
                   coverText="GRATTEZ LES 12 CASES"
                   className="w-full h-80 rounded-lg shadow-inner border-2 border-[#b82a2a] bg-black/40"
                >
                    <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 gap-2 p-2">
                       {grid.map((s, i) => {
                          const isAce = s === "As";
                          return (
                             <div key={i} className={cn("flex items-center justify-center border rounded font-black text-2xl md:text-3xl", isAce && revealedBoxes[0] ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-white/5 bg-white/5 text-gray-300")}>
                                {s}
                             </div>
                          );
                       })}
                    </div>
                </ScratchArea>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl p-4 border border-[#b82a2a]/20 flex flex-col items-center">
                <h2 className="text-center text-[#d45858] font-black tracking-widest mb-4">LA COUPE</h2>
                <ScratchArea 
                   revealed={revealedBoxes[1]} 
                   onReveal={() => handleReveal(1)}
                   resetKey={ticketId}
                   coverColors={["#eab308", "#ca8a04", "#a16207"]}
                   coverText="🏆"
                   className="w-40 h-32 rounded-lg shadow-inner border-2 border-yellow-500 bg-black/40 mx-auto"
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-3xl mb-1">🏆</span>
                       <span className={cn("font-black text-xl", hasWon && revealedBoxes[1] ? "text-emerald-400" : "text-gray-500")}>
                          {formatCurrency(cupAmount)}
                       </span>
                    </div>
                </ScratchArea>
            </div>
         </div>
      </div>
    </div>
  );
}
