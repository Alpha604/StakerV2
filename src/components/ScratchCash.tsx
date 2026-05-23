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
  const [ticketId, setTicketId] = useState(0);
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
       }, 2000);
    }
  };

  const revealAll = () => {
    if (!ticketBought || revealedBoxes.every(Boolean)) return;
    setRevealedBoxes([true, true]);
    playHit();
    
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
                  onClick={() => setBetAmount(Math.max(1, betAmount/2))} 
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
