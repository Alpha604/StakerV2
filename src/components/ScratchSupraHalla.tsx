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
    setTicketBought(true);
    setRevealedBoxes([false, false]);
    generateGame();
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
       }, 500);
    }
  };

  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-[#0f212e] p-4 text-white">
        <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
        
        <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-2xl max-w-[500px] w-full border border-gray-700 relative flex flex-col gap-6">
           <div className="text-center">
               <h1 className="text-4xl md:text-5xl font-black mb-2 italic text-[#b82a2a] drop-shadow-[0_0_15px_rgba(184,42,42,0.5)]">SUPRA HALLA</h1>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm text-[#d45858]">Trouvez 3x As pour gagner la Coupe !</p>
           </div>
           
           <div className="bg-[#0f212e] rounded-xl p-4 border border-[#b82a2a]/20">
               <ScratchArea 
                  revealed={revealedBoxes[0]} 
                  onReveal={() => handleReveal(0)}
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
           
           <div className="flex flex-col gap-4 mt-4 bg-black/30 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between">
                 <span className="text-gray-400 font-bold">Prix du ticket</span>
                 <div className="flex items-center gap-2 bg-[#0f212e] rounded p-1">
                    <button onClick={() => setBetAmount(Math.max(2, betAmount/2))} disabled={isPlaying} className="px-3 bg-[#2f4553] rounded hover:bg-[#3d5a6a] transition-colors">½</button>
                    <span className="font-bold w-16 text-center">{formatCurrency(betAmount)}</span>
                    <button onClick={() => setBetAmount(betAmount*2)} disabled={isPlaying} className="px-3 bg-[#2f4553] rounded hover:bg-[#3d5a6a] transition-colors">2×</button>
                 </div>
              </div>
              <button 
                 onClick={buyTicket}
                 disabled={balance < betAmount || isPlaying || ticketBought}
                 className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase text-lg rounded-xl transition-all shadow-[0_4px_0_#b91c1c] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {ticketBought ? "Grattez le ticket!" : "Jouer (" + formatCurrency(betAmount) + ")"}
              </button>
           </div>
        </div>
     </div>
  );
}
