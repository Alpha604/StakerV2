import { formatCurrency } from "../lib/utils";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import { X, Minus, RefreshCcw, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from "recharts";
import { cn } from "../lib/utils";

export function LiveSessionWidget() {
  const { sessionBets, resetSession, showSessionStats, setShowSessionStats } =
    useUser();
  const [minimized, setMinimized] = useState(false);

  if (!showSessionStats) return null;

  let currentProfit = 0;
  let totalWagered = 0;
  let totalPayout = 0;
  const chartData = [{ profit: 0, index: 0 }]; // Start at 0

  sessionBets.forEach((bet, i) => {
    currentProfit += bet.profit;
    totalWagered += bet.wagered || 0;
    totalPayout += bet.payout || 0;
    chartData.push({ profit: Number(currentProfit.toFixed(2)), index: i + 1 });
  });

  const totalProfit = currentProfit;
  const isPositive = totalProfit >= 0;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 z-50 flex flex-col bg-[#0f212e] border border-[#2f4553] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden"
      style={{ width: 350, touchAction: "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2f4553] bg-[#213743]/50 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Activity
            size={18}
            className={isPositive ? "text-[#00e701]" : "text-rose-500"}
          />
          <span className="text-white font-extrabold text-sm tracking-wide">
            Statistiques de Session
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetSession();
            }}
            className="p-1.5 hover:bg-black/20 text-[#8b9ba5] hover:text-white rounded-lg transition-colors"
            title="Réinitialiser la session"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="p-1.5 hover:bg-black/20 text-[#8b9ba5] hover:text-white rounded-lg transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSessionStats(false);
            }}
            className="p-1.5 hover:bg-rose-500/20 text-[#8b9ba5] hover:text-rose-500 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div key="livesession"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col"
          >
            <div className="p-5 flex flex-col gap-5">
              {/* Detailed Stats Row */}
              <div className="grid grid-cols-2 gap-3 text-sm border-b border-[#2f4553] pb-4">
                <div className="flex flex-col bg-black/20 p-3 rounded-xl border border-[#2f4553]/50">
                  <span className="text-[10px] text-[#8b9ba5] uppercase tracking-wider font-extrabold mb-1">
                    Volume Parié
                  </span>
                  <span className="text-white font-mono font-medium truncate">
                    {formatCurrency(totalWagered)}$
                  </span>
                </div>
                <div className="flex flex-col items-end bg-black/20 p-3 rounded-xl border border-[#2f4553]/50 text-right">
                  <span className="text-[10px] text-[#8b9ba5] uppercase tracking-wider font-extrabold mb-1">
                    Retour (RTP)
                  </span>
                  <span className="text-white font-mono font-medium truncate">
                    {formatCurrency(totalPayout)}$
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-[#8b9ba5] uppercase tracking-wider">
                  Bénéfice Net
                </span>
                <span
                  className={cn(
                    "text-3xl font-black font-mono tracking-tighter drop-shadow-md",
                    isPositive ? "text-[#00e701]" : "text-rose-500",
                  )}
                >
                  {totalProfit > 0 ? "+" : ""}
                  {formatCurrency(totalProfit)}$
                </span>
              </div>

              <div className="h-[140px] w-full mt-1 relative border border-[#2f4553] rounded-xl bg-black/30 overflow-hidden shadow-inner cursor-crosshair">
                {chartData.length <= 1 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#8b9ba5] font-medium p-4 text-center">
                    Commencez à parier pour voir le graphique d'évolution en temps réel.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorProfitLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0.5}/>
                          <stop offset="95%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <ReferenceLine
                        y={0}
                        stroke="#8b9ba5"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <YAxis 
                        domain={[
                          (dataMin: number) => Math.floor(dataMin * 1.1) - 10,
                          (dataMax: number) => Math.ceil(dataMax * 1.1) + 10
                        ]} 
                        hide 
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)}$`, 'Profit']}
                        labelFormatter={() => ''}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke={isPositive ? "#00e701" : "#ed4163"}
                        strokeWidth={3}
                        fill="url(#colorProfitLight)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Latest Bets List */}
              {sessionBets.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                  {[...sessionBets].reverse().slice(0, 50).map((bet, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 hover:bg-black/40 transition-colors p-2 rounded-lg border border-[#2f4553]/50 text-xs font-mono group">
                      <div className="flex items-center gap-3">
                        <span className="text-[#8b9ba5] w-12 truncate font-bold text-[10px] uppercase bg-black/50 px-1 py-0.5 rounded text-center">{bet.game.substring(0, 6)}</span>
                        <span className={cn("font-bold", bet.profit > 0 ? "text-[#00e701]" : "text-rose-500")}>
                          {bet.profit > 0 ? "+" : ""}{formatCurrency(bet.profit)}$
                        </span>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(bet.id)}
                        className="text-[#8b9ba5] opacity-0 group-hover:opacity-100 hover:text-white transition-all bg-[#0f212e] border border-[#2f4553] px-2 py-1 rounded cursor-pointer"
                        title="Copier Seed ID"
                      >
                        Copier
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-[#8b9ba5] font-bold uppercase tracking-wider border-t border-[#2f4553] pt-4 mt-2">
                <span>Parties Jouées</span>
                <span className="text-white bg-[#2f4553] px-2 py-0.5 rounded-full">{sessionBets.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
