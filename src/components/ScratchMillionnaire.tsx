import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

export function ScratchMillionnaire() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(25); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false, false]); // game 1, 2, 3
  
  const [segments, setSegments] = useState<{s1: string, s2: string, val: number}[]>([]);
  const [weights, setWeights] = useState<{diamond: number, sapphire: number, val: number}>({diamond: 0, sapphire: 0, val: 0});
  const [ticketWin, setTicketWin] = useState(0);

  const [totalWinAmount, setTotalWinAmount] = useState(0);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const ICONS = ["🍒", "🍉", "🍋", "🛎", "⭐", "💎", "7️⃣"];

  const generateGame = () => {
     let currentWin = 0;
     const isG1Win = Math.random() < 0.2;
     let segs = [];
     for(let i=0; i<8; i++) {
        if(isG1Win && currentWin === 0 && Math.random() < 0.2) {
           let val = betAmount * (Math.floor(Math.random() * 5) + 1);
           currentWin += val;
           segs.push({s1: "🍎", s2: "🍎", val});
        } else {
           segs.push({s1: ICONS[Math.floor(Math.random()*ICONS.length)], s2: ICONS[Math.floor(Math.random()*ICONS.length)], val: betAmount*2});
           if (segs[i].s1 === segs[i].s2) {
               // Prevent accidental win
               segs[i].s2 = "🥑"; 
           }
        }
     }
     setSegments(segs);
     
     const isG2Win = Math.random() < 0.15;
     if (isG2Win) {
         let val = betAmount * (Math.floor(Math.random() * 10) + 2);
         currentWin += val;
         setWeights({ diamond: 100 + Math.floor(Math.random()*50), sapphire: 50 + Math.floor(Math.random()*40), val});
     } else {
         setWeights({ diamond: 50 + Math.floor(Math.random()*40), sapphire: 100 + Math.floor(Math.random()*50), val: betAmount*5});
     }
     
     const isG3Win = Math.random() < 0.05;
     if (isG3Win) {
         let val = betAmount * (Math.floor(Math.random() * 50) + 10);
         currentWin += val;
         setTicketWin(val);
     } else {
         setTicketWin(0);
     }
     
     setTotalWinAmount(currentWin);
  };

  const buyTicket = () => {
    if (balance < betAmount || isPlaying || ticketBought) return;
    subtractBalance(betAmount);
    setWinInfo(null);
    setIsPlaying(true);
    setTicketBought(true);
    setRevealedBoxes([false, false, false]);
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
          if (totalWinAmount > 0) {
             const multiplier = totalWinAmount / betAmount;
             addBalance(totalWinAmount);
             setWinInfo({ multiplier, payout: totalWinAmount });
             playWin();
             recordBet("Super Millionnaire", betAmount, multiplier, totalWinAmount - betAmount);
          } else {
             playLoss();
             recordBet("Super Millionnaire", betAmount, 0, -betAmount);
          }
          setIsPlaying(false);
          setTicketBought(false);
       }, 500);
    }
  };

  const g2Win = weights.diamond > weights.sapphire;

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
                  onClick={() => setBetAmount(Math.max(10, betAmount/2))} 
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
                onClick={buyTicket}
                disabled={balance < betAmount || isPlaying || ticketBought}
                className="w-full py-3.5 bg-[#00e701] hover:bg-[#1fff20] text-black font-black uppercase text-[15px] rounded-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_#00c701] active:shadow-none active:translate-y-1"
             >
                {ticketBought ? "Grattez TOUT le ticket!" : "Acheter (" + formatCurrency(betAmount) + ")"}
             </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col justify-center items-center py-10 order-1 lg:order-2 overflow-hidden bg-[#0f212e] px-4">
         <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[800px] w-full border border-gray-700 relative flex flex-col gap-6">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-2 italic text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">SUPER MILLIONNAIRE</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm text-yellow-600">Le jeu à 3 étapes !</p>
            </div>
            
            <div className="bg-[#0f212e] rounded-xl p-4 border border-yellow-500/20">
                <h2 className="text-center text-yellow-400 font-black tracking-widest mb-4 text-sm">JEU 1: 2 SYMBOLES IDENTIQUES</h2>
                <ScratchArea 
                   revealed={revealedBoxes[0]} 
                   onReveal={() => handleReveal(0)}
                   coverColors={["#eab308", "#ca8a04", "#a16207"]}
                   coverText="?"
                   className="w-full min-h-[160px] md:min-h-[120px] rounded-lg shadow-inner border-2 border-yellow-500 bg-black/40"
                >
                    <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-8 gap-1 p-2">
                       {segments.map((s, i) => {
                          const match = s.s1 === s.s2;
                          return (
                             <div key={i} className={cn("flex flex-col items-center justify-center border rounded bg-white/5", match && revealedBoxes[0] ? "border-emerald-500 bg-emerald-500/20" : "border-white/5")}>
                                <div className="flex text-lg md:text-xl">
                                   <span>{s.s1}</span><span>{s.s2}</span>
                                </div>
                                <span className={cn("text-xs font-bold mt-1", match && revealedBoxes[0] ? "text-emerald-400" : "text-gray-500")}>
                                   {formatCurrency(s.val)}
                                </span>
                             </div>
                          );
                       })}
                    </div>
                </ScratchArea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f212e] rounded-xl p-4 border border-yellow-500/20">
                    <h2 className="text-center text-yellow-400 font-black tracking-widest mb-4 text-sm">JEU 2: DIAMANT &gt; SAPHIR</h2>
                    <ScratchArea 
                       revealed={revealedBoxes[1]} 
                       onReveal={() => handleReveal(1)}
                       coverColors={["#eab308", "#ca8a04", "#a16207"]}
                       coverText="GRATTEZ"
                       className="w-full h-32 rounded-lg shadow-inner border-2 border-yellow-500 bg-black/40"
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <div className="flex justify-evenly w-full px-4 mb-2">
                              <div className="flex flex-col items-center text-xl">
                                 💍 <span className={cn("font-bold text-sm", g2Win && revealedBoxes[1] ? "text-emerald-400" : "text-white")}>{weights.diamond}g</span>
                              </div>
                              <div className="text-2xl font-black text-gray-600">VS</div>
                              <div className="flex flex-col items-center text-xl">
                                 💎 <span className="font-bold text-sm text-gray-400">{weights.sapphire}g</span>
                              </div>
                           </div>
                           <span className={cn("font-black text-lg", g2Win && revealedBoxes[1] ? "text-emerald-400" : "text-gray-500")}>
                              {formatCurrency(weights.val)}
                           </span>
                        </div>
                    </ScratchArea>
                </div>
 
                <div className="bg-[#0f212e] rounded-xl p-4 border border-yellow-500/20">
                    <h2 className="text-center text-yellow-400 font-black tracking-widest mb-4 text-sm">JEU 3: TICKET D'OR</h2>
                    <ScratchArea 
                       revealed={revealedBoxes[2]} 
                       onReveal={() => handleReveal(2)}
                       coverColors={["#eab308", "#ca8a04", "#a16207"]}
                       coverText="TICKET D'OR"
                       className="w-full h-32 rounded-lg shadow-inner border-2 border-yellow-500 bg-black/40"
                    >
                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">
                           {ticketWin > 0 ? (
                              <span className="text-emerald-400 animate-pulse">{formatCurrency(ticketWin)}</span>
                           ) : (
                              <span className="text-gray-500">0</span>
                           )}
                        </div>
                    </ScratchArea>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
