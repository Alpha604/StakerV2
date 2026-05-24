import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

const FDJ_LOGO = "https://www.fdj.fr/assets/img/svg/fdj.svg";

export function ScratchAstroFdj() {
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
    setTicketBought(false); 
    setTicketId(prev => prev + 1);
    
    setTimeout(() => {
        let totalWin = 0;
        const rand = Math.random();
        if (rand < 0.05) totalWin = betAmount * 10;
        else if (rand < 0.15) totalWin = betAmount * 5;
        else if (rand < 0.30) totalWin = betAmount * 2;
        
        let val1 = 0;
        let val2 = 0;
        if (totalWin > 0) {
            if (Math.random() < 0.5) val1 = totalWin;
            else val2 = totalWin;
        }
        
        setBox1Val(val1);
        setBox2Val(val2);
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
       const totalWin = box1Val + box2Val;
       setTimeout(() => {
          if (totalWin > 0) {
             const multiplier = totalWin / betAmount;
             addBalance(totalWin);
             setWinInfo({ multiplier, payout: totalWin });
             playWin();
             recordBet("Astro FDJ", betAmount, multiplier, totalWin - betAmount);
          } else {
             playLoss();
             recordBet("Astro FDJ", betAmount, 0, -betAmount);
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
            recordBet("Astro FDJ", betAmount, multiplier, totalWin - betAmount);
        } else {
            playLoss();
            recordBet("Astro FDJ", betAmount, 0, -betAmount);
        }
        setIsPlaying(false);
    }, 500);
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] bg-[#0c1b26] md:rounded-lg shadow-2xl relative min-h-[600px] overflow-hidden mx-auto mt-4 border border-blue-500/20">
      <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
      
      <div className="w-full flex p-4 bg-[#09141d] z-10 border-b border-blue-500/20 shrink-0 gap-4">
        <img src={FDJ_LOGO} alt="FDJ" className="h-10 w-auto opacity-90" />
        <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 m-0 leading-tight">ASTRO</h1>
      </div>
      
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] flex flex-col p-4 z-10 relative">
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
                  >½</button>
                  <button 
                    onClick={() => setBetAmount(betAmount*2)} 
                    disabled={isPlaying || ticketBought}
                    className="bg-[#2f4553] hover:bg-[#3d5a6a] text-white font-bold px-3 text-[13px] rounded-sm transition-colors"
                  >2×</button>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <button 
                  onClick={ticketBought && !revealedBoxes.every(Boolean) ? revealAll : buyTicket}
                  disabled={(!ticketBought && balance < betAmount) || (isPlaying && !ticketBought)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[15px] rounded-sm transition-all shadow-[0_4px_0_theme(colors.blue.800)] active:shadow-none active:translate-y-1 disabled:opacity-50"
              >
                  {ticketBought && !revealedBoxes.every(Boolean) ? "Tout Gratter" : (isPlaying && !ticketBought ? "Génération..." : "Jouer")}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative flex flex-col justify-center items-center p-8 overflow-hidden bg-gradient-to-b from-[#0f212e] to-[#0a1620]">
          <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[500px] w-full border border-indigo-500/30 relative">
              <div className="text-center mb-6">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-sm bg-indigo-500/10 px-4 py-1 rounded-full border border-indigo-500/20">Signe du destin</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                  <ScratchArea 
                    revealed={revealedBoxes[0]} 
                    onReveal={() => handleReveal(0)}
                    resetKey={ticketId}
                    coverColors={["#3b82f6", "#2563eb", "#1d4ed8"]}
                    coverText="GRATTEZ"
                    className="w-full aspect-square rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] border-4 border-blue-500"
                  >
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1620]">
                        {box1Val > 0 ? (
                            <span className="text-blue-400 text-3xl font-black">{formatCurrency(box1Val)}</span>
                        ) : (
                            <span className="text-gray-600 text-xl font-bold">PERDU</span>
                        )}
                      </div>
                  </ScratchArea>
                  
                  <ScratchArea 
                    revealed={revealedBoxes[1]} 
                    onReveal={() => handleReveal(1)}
                    resetKey={ticketId}
                    coverColors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
                    coverText="GRATTEZ"
                    className="w-full aspect-square rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] border-4 border-purple-500"
                  >
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1620]">
                        {box2Val > 0 ? (
                            <span className="text-purple-400 text-3xl font-black">{formatCurrency(box2Val)}</span>
                        ) : (
                            <span className="text-gray-600 text-xl font-bold">PERDU</span>
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
