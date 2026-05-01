import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import { X, Minus, RefreshCcw, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
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
  const chartData = [{ profit: 0 }]; // Start at 0

  sessionBets.forEach((bet) => {
    currentProfit += bet.profit;
    totalWagered += bet.wagered || 0;
    totalPayout += bet.payout || 0;
    chartData.push({ profit: parseFloat(currentProfit.toFixed(2)) });
  });

  const totalProfit = currentProfit;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 z-50 flex flex-col bg-bg-panel border border-border-medium rounded-xl shadow-2xl overflow-hidden shadow-black/50"
      style={{ width: 340, touchAction: "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle bg-bg-base cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Activity
            size={16}
            className={totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
          />
          <span className="text-white font-bold text-sm tracking-wide">
            Live Stats
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetSession();
            }}
            className="p-1 hover:bg-bg-inner text-text-secondary hover:text-white rounded transition-colors"
            title="Reset Session"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="p-1 hover:bg-bg-inner text-text-secondary hover:text-white rounded transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSessionStats(false);
            }}
            className="p-1 hover:bg-bg-inner text-text-secondary hover:text-rose-500 rounded transition-colors"
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
            <div className="p-4 flex flex-col gap-4">
              {/* Detailed Stats Row */}
              <div className="grid grid-cols-2 gap-2 text-sm border-b border-border-subtle pb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                    Total Paris
                  </span>
                  <span className="text-white font-mono font-medium">
                    {totalWagered.toFixed(2)}$
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                    Total Gains
                  </span>
                  <span className="text-white font-mono font-medium">
                    {totalPayout.toFixed(2)}$
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                  Bénéfice Net
                </span>
                <span
                  className={cn(
                    "text-2xl font-black font-mono tracking-tighter",
                    totalProfit >= 0 ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {totalProfit > 0 ? "+" : ""}
                  {totalProfit.toFixed(2)}$
                </span>
              </div>

              <div className="h-[120px] w-full mt-2 relative border border-border-subtle rounded-lg bg-bg-inner/50 overflow-hidden">
                {chartData.length <= 1 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-text-secondary font-medium">
                    En attente de paris...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <ReferenceLine
                        y={0}
                        stroke="#2f4553"
                        strokeDasharray="3 3"
                      />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke={totalProfit >= 0 ? "#00e676" : "#ed4163"}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-text-secondary font-mono border-t border-border-subtle pt-2">
                <span>Parties: {sessionBets.length}</span>
                {sessionBets.length > 0 && (
                  <button 
                    onClick={() => {
                        const id = sessionBets[sessionBets.length - 1].id;
                        navigator.clipboard.writeText(id);
                    }}
                    className="hover:text-white transition-colors"
                    title="Copier ID du dernier pari"
                  >
                    ID: {sessionBets[sessionBets.length - 1].id.slice(0, 8)}...
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
