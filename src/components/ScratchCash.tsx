import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function ScratchCash() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false]);
  
  const [box1Val, setBox1Val] = useState(0);
  const [box2Val, setBox2Val] = useState(0);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const buyTicket = () => {
    if (balance < betAmount || isPlaying || ticketBought) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setIsPlaying(true);
    setTicketBought(true);
    setRevealedBoxes([false, false]);
    
    // Win logic: 40% chance to win something
    let val1 = 0;
    let val2 = 0;
    if (Math.random() < 0.4) {
       // Win
       val1 = Math.random() < 0.5 ? (Math.floor(Math.random() * 5) + 1) * betAmount : 0;
       val2 = Math.random() < 0.5 ? (Math.floor(Math.random() * 5) + 1) * betAmount : 0;
       if (val1 === 0 && val2 === 0) val1 = betAmount * 2;
    }
    
    setBox1Val(val1);
    setBox2Val(val2);
  };

  const handleReveal = (index: number) => {
    if (!ticketBought) return;
    const newRevealed = [...revealedBoxes];
    newRevealed[index] = true;
    setRevealedBoxes(newRevealed);
    playHit();
    
    if (newRevealed.every(Boolean)) {
       const totalWin = box1Val + box2Val;
       setTimeout(() => {
          if (totalWin > 0) {
             const multiplier = totalWin / betAmount;
             addBalance(totalWin);
             setWinInfo({ multiplier, payout: totalWin });
             playWin();
             recordBet("Cash Original", betAmount, multiplier, totalWin - betAmount);
          } else {
             playLoss();
             recordBet("Cash Original", betAmount, 0, -betAmount);
          }
          setIsPlaying(false);
          setTicketBought(false);
       }, 500);
    }
  };

  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-[#0f212e] p-4 text-white">
        <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
        
        <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-2xl max-w-[500px] w-full border border-gray-700 relative">
           <h1 className="text-4xl font-black text-center mb-2 italic text-emerald-500 drop-shadow-lg">CASH</h1>
           <p className="text-center text-gray-400 font-bold mb-8 uppercase tracking-widest text-sm">Grattez et gagnez les montants indiqués !</p>
           
           <div className="grid grid-cols-2 gap-6 mb-8">
               <ScratchArea 
                  revealed={revealedBoxes[0]} 
                  onReveal={() => handleReveal(0)}
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
           
           <div className="flex flex-col gap-4 mt-8 bg-black/30 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between">
                 <span className="text-gray-400 font-bold">Prix du ticket</span>
                 <div className="flex items-center gap-2 bg-[#0f212e] rounded p-1">
                    <button onClick={() => setBetAmount(Math.max(1, betAmount/2))} disabled={isPlaying} className="px-3 bg-[#2f4553] rounded hover:bg-[#3d5a6a] transition-colors">½</button>
                    <span className="font-bold w-16 text-center">{formatCurrency(betAmount)}</span>
                    <button onClick={() => setBetAmount(betAmount*2)} disabled={isPlaying} className="px-3 bg-[#2f4553] rounded hover:bg-[#3d5a6a] transition-colors">2×</button>
                 </div>
              </div>
              <button 
                 onClick={buyTicket}
                 disabled={balance < betAmount || isPlaying || ticketBought}
                 className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-lg rounded-xl transition-all shadow-[0_4px_0_#059669] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {ticketBought ? "Grattez le ticket!" : "Acheter un ticket"}
              </button>
           </div>
        </div>
     </div>
  );
}
