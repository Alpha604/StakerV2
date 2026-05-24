import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { ScratchArea } from "./ui/ScratchArea";
import { WinPopup } from "./WinPopup";
import { useSound } from "../lib/useSound";

const FDJ_LOGO = "https://www.fdj.fr/assets/img/svg/fdj.svg";

export function ScratchPatrimoine() {
  const { user, balance, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState(15); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [ticketBought, setTicketBought] = useState(false);
  const [ticketId, setTicketId] = useState(0);
  const [revealedBoxes, setRevealedBoxes] = useState([false, false]); // 0: win nums, 1: player nums
  
  const [winningNums, setWinningNums] = useState<number[]>([]);
  const [playerNums, setPlayerNums] = useState<{num: number, val: number}[]>([]);
  
  const [winInfo, setWinInfo] = useState<{multiplier: number, payout: number} | null>(null);
  const { playWin, playLoss, playHit } = useSound();

  const generateNumbers = () => {
     let wins: number[] = [];
     while(wins.length < 4) {
        let n = Math.floor(Math.random() * 60) + 1;
        if (!wins.includes(n)) wins.push(n);
     }
     setWinningNums(wins);
     
     let players: {num: number, val: number}[] = [];
     const isWin = Math.random() < 0.35; 
     let wonAmount = 0;
     
     for (let i = 0; i < 15; i++) {
        let n = Math.floor(Math.random() * 60) + 1;
        
        let val = 0;
        if (isWin && wonAmount === 0 && Math.random() < 0.1) {
            n = wins[Math.floor(Math.random() * wins.length)];
            val = (Math.floor(Math.random() * 5) + 1) * betAmount;
            wonAmount += val;
        } else if (isWin && Math.random() < 0.05) {
            n = wins[Math.floor(Math.random() * wins.length)];
            val = (Math.floor(Math.random() * 2) + 1) * betAmount;
            wonAmount += val;
        } else {
            while (wins.includes(n)) {
               n = Math.floor(Math.random() * 60) + 1;
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
             recordBet("Mission Patrimoine", betAmount, multiplier, totalWin - betAmount);
          } else {
             playLoss();
             recordBet("Mission Patrimoine", betAmount, 0, -betAmount);
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
          recordBet("Mission Patrimoine", betAmount, multiplier, totalWin - betAmount);
       } else {
          playLoss();
          recordBet("Mission Patrimoine", betAmount, 0, -betAmount);
       }
       setIsPlaying(false);
    }, 500);
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] bg-[#0c1b26] md:rounded-lg shadow-2xl relative min-h-[600px] overflow-hidden mx-auto mt-4 border border-amber-500/20">
      <WinPopup multiplier={winInfo?.multiplier || 0} payout={winInfo?.payout || 0} onClose={() => setWinInfo(null)} />
      
      <div className="w-full flex p-4 bg-[#09141d] z-10 border-b border-amber-500/20 shrink-0 gap-4">
        <img src={FDJ_LOGO} alt="FDJ" className="h-10 w-auto opacity-90" />
        <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 m-0 leading-tight uppercase">MISSION PATRIMOINE</h1>
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
                    onClick={() => setBetAmount(Math.max(5, betAmount/2))} 
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
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[15px] rounded-sm transition-all shadow-[0_4px_0_theme(colors.amber.700)] active:shadow-none active:translate-y-1 disabled:opacity-50"
              >
                  {ticketBought && !revealedBoxes.every(Boolean) ? "Tout Gratter" : (isPlaying && !ticketBought ? "Génération..." : "Jouer")}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative flex flex-col justify-center items-center py-6 px-4 bg-[#0a1620]">
          <div className="bg-[#1a2c38] p-6 rounded-2xl shadow-xl max-w-[800px] w-full border border-amber-500/30 flex flex-col gap-6">
              <div className="text-center">
                  <h2 className="text-gray-400 font-bold tracking-widest text-sm uppercase">Fondation du Patrimoine</h2>
                  <p className="text-amber-500/80 font-bold text-xs mt-1">1 500 000€ à gagner</p>
              </div>
              
              <div className="bg-[#0f212e] rounded-xl p-4 border border-amber-500/20">
                  <h2 className="text-center text-amber-500 font-black tracking-widest mb-4">NUMÉROS GAGNANTS</h2>
                  <ScratchArea 
                    revealed={revealedBoxes[0]} 
                    onReveal={() => handleReveal(0)}
                    resetKey={ticketId}
                    coverColors={["#f59e0b", "#d97706", "#b45309"]}
                    coverText="GRATTEZ ICI"
                    className="w-full h-24 rounded-lg shadow-inner border-2 border-amber-500"
                  >
                      <div className="absolute inset-0 flex items-center justify-evenly bg-[#0f212e]">
                        {winningNums.map((n, i) => (
                            <div key={i} className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center text-2xl font-black text-white bg-white/5 shadow-inner">{n}</div>
                        ))}
                      </div>
                  </ScratchArea>
              </div>
              
              <div className="bg-[#0f212e] rounded-xl p-4 border border-amber-500/20">
                  <h2 className="text-center text-amber-500 font-black tracking-widest mb-4">VOS NUMÉROS</h2>
                  <ScratchArea 
                    revealed={revealedBoxes[1]} 
                    onReveal={() => handleReveal(1)}
                    resetKey={ticketId}
                    coverColors={["#f59e0b", "#d97706", "#b45309"]}
                    coverText="GRATTEZ VOS 15 NUMÉROS"
                    className="w-full min-h-[300px] rounded-lg shadow-inner border-2 border-amber-500"
                  >
                      <div className="absolute inset-0 grid grid-cols-5 gap-3 bg-[#0f212e] p-3">
                        {playerNums.map((p, i) => {
                            const isMatch = winningNums.includes(p.num);
                            return (
                              <div key={i} className={cn("flex flex-col items-center justify-center rounded border bg-[#1a2c38]", isMatch && revealedBoxes[1] ? "border-amber-400 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "border-white/5")}>
                                  <span className="text-xl font-bold text-white">{p.num}</span>
                                  <span className={cn("text-xs font-bold", isMatch && revealedBoxes[1] ? "text-amber-400" : "text-gray-500")}>{formatCurrency(p.val)}</span>
                              </div>
                            );
                        })}
                      </div>
                  </ScratchArea>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
