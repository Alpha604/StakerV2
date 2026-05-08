import React, { useState } from "react";
import { useUser, renderCryptoIcon } from "../context/UserContext";
import { cn } from "../lib/utils";

export function SweetBonanza() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser();
  const [betAmount, setBetAmount] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setBetAmount(val);
    } else {
      setBetAmount(0);
    }
  };

  const halfBet = () => setBetAmount((prev) => Math.max(0.1, prev / 2));
  const doubleBet = () => setBetAmount((prev) => prev * 2);

  const executeSpin = async () => {
    if (isSpinning || balance < betAmount || betAmount <= 0) return;
    
    const success = await subtractBalance(betAmount);
    if (!success) return;

    setIsSpinning(true);
    setWinAmount(null);

    // Simulate spin
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple random outcome
    const isWin = Math.random() > 0.6;
    if (isWin) {
      const multiplier = Math.floor(Math.random() * 5) + 2; // 2x to 6x
      const payout = betAmount * multiplier;
      await addBalance(payout);
      setWinAmount(payout);
      recordBet("SweetBonanza", betAmount, multiplier, payout - betAmount);
    } else {
      setWinAmount(0);
      recordBet("SweetBonanza", betAmount, 0, -betAmount);
    }

    setIsSpinning(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:h-[80vh] min-h-[600px] flex flex-col pt-20">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative">
        <div className="w-full lg:w-[320px] shrink-0 bg-[#213743] lg:rounded-l-lg lg:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 lg:order-1 border-r border-[#0f212e]">
          <div className="flex flex-col gap-4 relative w-full h-full">
             <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-[#8b9ba5] text-[13px] font-bold">
                    Montant du Pari
                  </label>
                  <span className="text-[#8b9ba5] text-[13px] font-bold flex items-center gap-1">
                    {balance.toFixed(4)} {renderCryptoIcon(activeCrypto, "w-3 h-3")}
                  </span>
                </div>
                <div className="flex items-center bg-[#0f212e] rounded border border-[#2f4553] focus-within:border-[#557086] transition-colors relative">
                  <span className="absolute left-3 text-white font-bold">{renderCryptoIcon(activeCrypto, "w-4 h-4")}</span>
                  <input
                    type="number"
                    value={betAmount === 0 ? "" : betAmount}
                    onChange={handleBetChange}
                    className="w-full bg-transparent text-white font-bold pl-9 pr-2 py-2.5 outline-none font-mono text-[13px]"
                    disabled={isSpinning}
                  />
                  <div className="flex pr-1 gap-1">
                    <button
                      onClick={halfBet}
                      disabled={isSpinning}
                      className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors disabled:opacity-50"
                    >
                      ½
                    </button>
                    <button
                      onClick={doubleBet}
                      disabled={isSpinning}
                      className="px-2.5 py-1.5 bg-[#2f4553] hover:bg-[#3d5a6a] rounded text-xs font-bold text-white transition-colors disabled:opacity-50"
                    >
                      2×
                    </button>
                  </div>
                </div>
             </div>

             <button
               onClick={executeSpin}
               disabled={isSpinning || betAmount <= 0 || betAmount > balance}
               className={cn(
                 "w-full py-4 rounded-xl font-black text-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg",
                 isSpinning || betAmount <= 0 || betAmount > balance
                   ? "bg-[#00e701]/40 text-black/50 cursor-not-allowed"
                   : "bg-[#00e701] hover:bg-[#00c700] text-[#0a2e0a]"
               )}
             >
               {isSpinning ? "EN COURS..." : "PARIER"}
             </button>
             
             {winAmount !== null && (
               <div className={cn("mt-4 p-4 rounded text-center font-bold flex flex-col items-center gap-1", winAmount > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                 {winAmount > 0 ? (
                   <>
                     <span>Gagné</span>
                     <span className="flex items-center gap-1">{winAmount.toFixed(4)} {renderCryptoIcon(activeCrypto, "w-4 h-4")}</span>
                   </>
                 ) : "Perdu"}
               </div>
             )}
          </div>
        </div>

        <div className="flex-1 bg-[#1a0a2a] lg:rounded-r-lg lg:rounded-l-none rounded-b-lg relative overflow-hidden flex flex-col items-center justify-center p-8 order-1 lg:order-2">
           <h2 className="text-4xl font-black text-[#ff6b6b] uppercase tracking-widest text-center mb-8 drop-shadow-md">
             Sweet Bonanza (Demo Mock)
           </h2>
           <div className="grid grid-cols-6 grid-rows-5 gap-2 w-full max-w-xl mx-auto opacity-70">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={cn("aspect-square rounded shadow-inner flex items-center justify-center text-3xl", isSpinning ? "bg-[#2a1a3a] animate-pulse" : "bg-[#3a2a4a]")}>
                   {isSpinning ? "🍬" : ["🍎", "🍇", "🍉", "🍌", "🍒"][Math.floor(Math.random() * 5)]}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
