import React, { useRef, useState } from "react";
import { cn } from "../lib/utils";

export interface AutoBetConfig {
  onWinAction: "reset" | "increase";
  onWinIncrease: number;
  onLossAction: "reset" | "increase";
  onLossIncrease: number;
  stopOnProfit: number;
  stopOnLoss: number;
}

export function useAutoBetOptions() {
  const [onWinAction, setOnWinAction] = useState<"reset" | "increase">("reset");
  const [onWinIncrease, setOnWinIncrease] = useState<number>(0);
  const [onLossAction, setOnLossAction] = useState<"reset" | "increase">("reset");
  const [onLossIncrease, setOnLossIncrease] = useState<number>(0);
  const [stopOnProfit, setStopOnProfit] = useState<number>(0);
  const [stopOnLoss, setStopOnLoss] = useState<number>(0);

  return {
    config: {
      onWinAction, onWinIncrease, onLossAction, onLossIncrease, stopOnProfit, stopOnLoss
    },
    actions: {
      setOnWinAction, setOnWinIncrease, setOnLossAction, setOnLossIncrease, setStopOnProfit, setStopOnLoss
    }
  };
}

export function useAutoBetLogic() {
  const baseBetRef = useRef<number>(0);
  const sessionProfitRef = useRef<number>(0);

  const startAutoBet = (betAmount: number) => {
    baseBetRef.current = betAmount;
    sessionProfitRef.current = 0;
  };

  const processResult = (
    isWin: boolean, 
    profitFromRound: number, 
    config: AutoBetConfig, 
    setBetAmount: (val: number | ((prev: number) => number)) => void,
    stopAuto: () => void
  ) => {
    sessionProfitRef.current += profitFromRound;

    const hasStopProfit = config.stopOnProfit > 0;
    const hasStopLoss = config.stopOnLoss > 0;

    let shouldStop = false;
    if (hasStopProfit && sessionProfitRef.current >= config.stopOnProfit) shouldStop = true;
    if (hasStopLoss && sessionProfitRef.current <= -config.stopOnLoss) shouldStop = true;

    if (shouldStop) {
      stopAuto();
      return true;
    }

    if (isWin) {
      if (config.onWinAction === "reset") {
        setBetAmount(baseBetRef.current);
      } else {
        setBetAmount(prev => Number((prev * (1 + config.onWinIncrease / 100)).toFixed(2)));
      }
    } else {
      if (config.onLossAction === "reset") {
        setBetAmount(baseBetRef.current);
      } else {
        setBetAmount(prev => Number((prev * (1 + config.onLossIncrease / 100)).toFixed(2)));
      }
    }
    
    return false;
  };

  return { startAutoBet, processResult, sessionProfitRef };
}

export function AutoBetSettingsForm({ 
  config, 
  actions, 
  disabled 
}: { 
  config: AutoBetConfig; 
  actions: any; 
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 mt-2 mb-2 p-3 bg-[#0b161f] rounded-lg border border-[transparent] shadow-inner">
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[#8b9ba5] text-xs font-bold px-1">Sur Gain</label>
          <div className="flex bg-[#0f212e] rounded p-1 border border-[#2f4553]">
             <button disabled={disabled} onClick={() => actions.setOnWinAction("reset")} className={cn("flex-1 text-[10px] sm:text-xs font-bold rounded py-1", config.onWinAction === "reset" ? "bg-[#2f4553] text-white" : "text-[#8b9ba5] hover:text-white")}>Reset</button>
             <button disabled={disabled} onClick={() => actions.setOnWinAction("increase")} className={cn("flex-1 text-[10px] sm:text-xs font-bold rounded py-1", config.onWinAction === "increase" ? "bg-[#2f4553] text-white" : "text-[#8b9ba5] hover:text-white")}>Inc %</button>
          </div>
          {config.onWinAction === "increase" && (
            <input type="number" min="0" value={config.onWinIncrease} onChange={e => actions.setOnWinIncrease(Number(e.target.value))} disabled={disabled} className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-1.5 text-white text-xs font-bold outline-none focus:border-[#557086] disabled:opacity-50 mt-1" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[#8b9ba5] text-xs font-bold px-1">Sur Perte</label>
          <div className="flex bg-[#0f212e] rounded p-1 border border-[#2f4553]">
             <button disabled={disabled} onClick={() => actions.setOnLossAction("reset")} className={cn("flex-1 text-[10px] sm:text-xs font-bold rounded py-1", config.onLossAction === "reset" ? "bg-[#2f4553] text-white" : "text-[#8b9ba5] hover:text-white")}>Reset</button>
             <button disabled={disabled} onClick={() => actions.setOnLossAction("increase")} className={cn("flex-1 text-[10px] sm:text-xs font-bold rounded py-1", config.onLossAction === "increase" ? "bg-[#2f4553] text-white" : "text-[#8b9ba5] hover:text-white")}>Inc %</button>
          </div>
          {config.onLossAction === "increase" && (
            <input type="number" min="0" value={config.onLossIncrease} onChange={e => actions.setOnLossIncrease(Number(e.target.value))} disabled={disabled} className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-1.5 text-white text-xs font-bold outline-none focus:border-[#557086] disabled:opacity-50 mt-1" />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
           <label className="text-[#8b9ba5] text-[10px] font-bold px-1 uppercase tracking-wider">Stop Profit</label>
           <input type="number" min="0" value={config.stopOnProfit} onChange={e => actions.setStopOnProfit(Number(e.target.value))} disabled={disabled} className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-1.5 text-white text-xs font-bold outline-none focus:border-[#557086] disabled:opacity-50" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
           <label className="text-[#8b9ba5] text-[10px] font-bold px-1 uppercase tracking-wider">Stop Perte</label>
           <input type="number" min="0" value={config.stopOnLoss} onChange={e => actions.setStopOnLoss(Number(e.target.value))} disabled={disabled} className="w-full bg-[#0f212e] rounded border border-[#2f4553] p-1.5 text-white text-xs font-bold outline-none focus:border-[#557086] disabled:opacity-50" />
        </div>
      </div>
    </div>
  );
}
