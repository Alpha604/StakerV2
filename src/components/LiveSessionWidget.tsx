import { formatCurrency } from "../lib/utils";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import { X, Minus, RefreshCcw, Activity, Maximize2, Minimize2, PieChart as PieChartIcon, BarChart2, TrendingUp, TrendingDown, History } from "lucide-react";
import {
  AreaChart,
  Area,
  YAxis,
  XAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import { cn } from "../lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#413ea0', '#f50057'];

export function LiveSessionWidget() {
  const { sessionBets, resetSession, showSessionStats, setShowSessionStats } =
    useUser();
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Derived stats
  const stats = useMemo(() => {
    let currentProfit = 0;
    let totalWagered = 0;
    let totalPayout = 0;
    let wins = 0;
    let losses = 0;
    let maxWin = 0;
    let maxMultiplier = 0;

    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;

    let highestBalance = 0;
    let lowestBalance = 0;
    
    const chartData = [{ profit: 0, index: 0, game: "Start", bet: 0, win: 0, stepProfit: 0 }];
    const gameDistribution: Record<string, number> = {};
    const gameProfitDistribution: Record<string, number> = {};
    const gameVolumeDistribution: Record<string, number> = {};

    sessionBets.forEach((bet, i) => {
      currentProfit += bet.profit;
      totalWagered += bet.wagered || 0;
      totalPayout += bet.payout || 0;
      
      if (bet.profit > 0) {
        wins++;
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
      } else if (bet.profit < 0) {
        losses++;
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
      }

      if (currentProfit > highestBalance) highestBalance = currentProfit;
      if (currentProfit < lowestBalance) lowestBalance = currentProfit;

      if (bet.payout > maxWin) maxWin = bet.payout;
      if (bet.multiplier > maxMultiplier) maxMultiplier = bet.multiplier;

      gameDistribution[bet.game] = (gameDistribution[bet.game] || 0) + 1;
      gameProfitDistribution[bet.game] = (gameProfitDistribution[bet.game] || 0) + bet.profit;
      gameVolumeDistribution[bet.game] = (gameVolumeDistribution[bet.game] || 0) + (bet.wagered || 0);

      chartData.push({ 
        profit: Number(currentProfit.toFixed(2)), 
        index: i + 1,
        game: bet.game,
        bet: bet.wagered || 0,
        win: bet.payout || 0,
        stepProfit: bet.profit
      });
    });

    const maxDrawdown = highestBalance - lowestBalance;

    const pieData = Object.entries(gameDistribution).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    
    // Additional BarChart data for Win/Loss per game
    const barData = Object.entries(gameProfitDistribution).map(([name, profit]) => ({ name, profit, volume: gameVolumeDistribution[name] || 0 })).sort((a,b) => b.profit - a.profit);
    
    // Top 6 Biggest Wins
    const topWins = [...sessionBets]
      .filter(bet => bet.profit > 0)
      .sort((a, b) => (b.payout || 0) - (a.payout || 0))
      .slice(0, 6);

    return {
      currentProfit,
      totalWagered,
      totalPayout,
      chartData,
      wins,
      losses,
      maxWin,
      maxMultiplier,
      pieData,
      barData,
      topWins,
      totalBets: sessionBets.length,
      longestWinStreak,
      longestLossStreak,
      maxDrawdown,
      highestBalance,
      lowestBalance
    };
  }, [sessionBets]);

  if (!showSessionStats) return null;

  const totalProfit = stats.currentProfit;
  const isPositive = totalProfit >= 0;

  const renderTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
       const data = payload[0].payload;
       const isGain = data.profit >= 0;
       const stepProfit = data.stepProfit;
       return (
         <div className="bg-[#0f212e] border border-[#2f4553] p-3 rounded-lg shadow-xl shadow-black/50 z-50 relative">
            <div className="text-white font-black mb-1">{data.game === "Start" ? "Début" : data.game}</div>
            {data.game !== "Start" && (
               <div className={cn("text-sm font-black mb-1", stepProfit >= 0 ? "text-[#00e701]" : "text-rose-500")}>
                  {stepProfit >= 0 ? "Gain: +" : "Perte: "}{stepProfit.toFixed(2)}$
               </div>
            )}
            <div className="text-[#8b9ba5] text-xs font-bold border-t border-[#2f4553] pt-1 mt-1">
               Profit Total: <span className={isGain ? "text-[#00e701]" : "text-rose-500"}>{isGain ? "+" : ""}{data.profit.toFixed(2)}$</span>
            </div>
         </div>
       );
    }
    return null;
  };

  // Render logic for compact vs expanded
  if (expanded) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col bg-[#0f212e] border border-[#2f4553] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden w-full max-w-[1400px] h-full max-h-[95vh] md:max-h-[85vh]"
        >
          {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#2f4553] bg-[#213743]/50">
          <div className="flex items-center gap-3">
            <Activity className={isPositive ? "text-[#00e701]" : "text-rose-500"} size={24} />
            <h2 className="text-white font-black text-xl tracking-wide">Analytiques de Session Détaillées</h2>
            <span className="bg-[#2f4553] text-[#8b9ba5] px-3 py-1 rounded-full text-xs font-bold uppercase ml-4">{stats.totalBets} paris récents</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetSession} className="flex items-center gap-2 px-4 py-2 hover:bg-black/20 text-[#8b9ba5] hover:text-white rounded-lg transition-colors font-bold text-sm">
              <RefreshCcw size={16} /> Réinitialiser
            </button>
            <button onClick={() => setExpanded(false)} className="px-4 py-2 hover:bg-black/20 text-[#8b9ba5] hover:text-white rounded-lg transition-colors flex items-center gap-2 font-bold text-sm">
              <Minimize2 size={16} /> Réduire
            </button>
            <button onClick={() => setShowSessionStats(false)} className="px-4 py-2 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm">
              <X size={16} /> Fermer
            </button>
          </div>
        </div>

        {/* Fullscreen Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-[#2f4553] bg-black/10 p-4 flex flex-col gap-2 relative overflow-hidden">
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(0,231,1,0.05),transparent_70%)] pointer-events-none" />

            <button onClick={() => setActiveTab("overview")} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left relative z-10", activeTab === "overview" ? "bg-[#2f4553] text-white shadow-md border border-[#334b5c]" : "text-[#8b9ba5] hover:bg-black/20 hover:text-white border border-transparent")}>
              <TrendingUp size={18} className={activeTab === "overview" ? "text-blue-400" : ""} /> Vue d'ensemble
            </button>
            <button onClick={() => setActiveTab("advanced")} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left relative z-10", activeTab === "advanced" ? "bg-[#2f4553] text-white shadow-md border border-[#334b5c]" : "text-[#8b9ba5] hover:bg-black/20 hover:text-white border border-transparent")}>
              <Activity size={18} className={activeTab === "advanced" ? "text-purple-400" : ""} /> Stats Avancées
            </button>
            <button onClick={() => setActiveTab("distribution")} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left relative z-10", activeTab === "distribution" ? "bg-[#2f4553] text-white shadow-md border border-[#334b5c]" : "text-[#8b9ba5] hover:bg-black/20 hover:text-white border border-transparent")}>
              <PieChartIcon size={18} className={activeTab === "distribution" ? "text-amber-400" : ""} /> Distribution
            </button>
            <button onClick={() => setActiveTab("history")} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left relative z-10", activeTab === "history" ? "bg-[#2f4553] text-white shadow-md border border-[#334b5c]" : "text-[#8b9ba5] hover:bg-black/20 hover:text-white border border-transparent")}>
              <History size={18} className={activeTab === "history" ? "text-emerald-400" : ""} /> Historique
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.3),transparent_60%)] relative">
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6">
                 {/* Top KPI Cards */}
                 <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center">
                       <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Bénéfice Net</span>
                       <span className={cn("text-3xl font-black font-mono", isPositive ? "text-[#00e701]" : "text-rose-500")}>
                         {totalProfit > 0 ? "+" : ""}{formatCurrency(totalProfit)}$
                       </span>
                    </div>
                    <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center">
                       <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Volume Parié</span>
                       <span className="text-white text-2xl font-black font-mono">{formatCurrency(stats.totalWagered)}$</span>
                    </div>
                    <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center">
                       <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Meilleur Gain</span>
                       <span className="text-[#00e701] text-2xl font-black font-mono">+{formatCurrency(stats.maxWin)}$</span>
                    </div>
                    <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center">
                       <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Max Multiplier</span>
                       <span className="text-amber-400 text-2xl font-black font-mono">{stats.maxMultiplier.toFixed(2)}×</span>
                    </div>
                 </div>

                 {/* Main Chart */}
                 <div className="bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 h-[400px] flex flex-col shadow-inner">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-400" /> Évolution du Profit</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                             <linearGradient id="colorProfitExpand" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0.4}/>
                               <stop offset="95%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#2f4553" vertical={false} />
                           <XAxis dataKey="index" stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} />
                           <YAxis stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} />
                           <RechartsTooltip 
                             content={renderTooltipContent}
                             cursor={{ stroke: '#8b9ba5', strokeWidth: 1, strokeDasharray: '3 3' }}
                           />
                           <ReferenceLine y={0} stroke="#8b9ba5" />
                           <Area type="monotone" dataKey="profit" stroke={isPositive ? "#00e701" : "#ed4163"} strokeWidth={3} fill="url(#colorProfitExpand)" animationDuration={1000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Top Wins Highlights */}
                 {stats.topWins.length > 0 && (
                   <div className="bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 shadow-inner">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[#00e701]"/> Meilleurs Gains Récents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {stats.topWins.map((bet, idx) => (
                           <div key={idx} className="bg-[#0f212e] border border-[#2f4553] rounded-xl p-4 flex items-center justify-between">
                              <div>
                                 <div className="text-white font-black truncate">{bet.game}</div>
                                 <div className="text-[#8b9ba5] text-xs font-bold mt-1">Mise: {formatCurrency(bet.wagered || 0)}$</div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[#00e701] font-black text-lg">+{formatCurrency(bet.payout || 0)}$</div>
                                 <div className="text-emerald-400/80 text-xs font-bold font-mono bg-emerald-400/10 inline-block px-1.5 py-0.5 rounded mt-1">{bet.multiplier.toFixed(2)}×</div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            )}
            
            {activeTab === "advanced" && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><TrendingUp size={24} className="text-emerald-500"/></div>
                    <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Longest Win Streak</span>
                    <span className="text-white text-2xl font-black font-mono">{stats.longestWinStreak}</span>
                  </div>
                  <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><TrendingUp size={24} className="text-rose-500 scale-y-[-1]"/></div>
                    <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Longest Loss Streak</span>
                    <span className="text-white text-2xl font-black font-mono">{stats.longestLossStreak}</span>
                  </div>
                  <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Activity size={24} className="text-amber-500"/></div>
                    <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Max Drawdown</span>
                    <span className="text-rose-500 text-2xl font-black font-mono">{formatCurrency(stats.maxDrawdown)}$</span>
                  </div>
                  <div className="bg-[#213743]/50 border border-[#2f4553] rounded-2xl p-5 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Activity size={24} className="text-blue-500"/></div>
                    <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider mb-2">Highest Balance</span>
                    <span className="text-[#00e701] text-2xl font-black font-mono">+{formatCurrency(stats.highestBalance)}$</span>
                  </div>
                </div>

                <div className="bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 shadow-inner text-white">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Activity className="text-purple-400"/> Detailed Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4">
                     <div>
                       <div className="text-[#8b9ba5] text-xs uppercase font-bold">Total Wagered</div>
                       <div className="font-mono">{formatCurrency(stats.totalWagered)}$</div>
                     </div>
                     <div>
                       <div className="text-[#8b9ba5] text-xs uppercase font-bold">Total Payout</div>
                       <div className="font-mono">{formatCurrency(stats.totalPayout)}$</div>
                     </div>
                     <div>
                       <div className="text-[#8b9ba5] text-xs uppercase font-bold">Average Bet</div>
                       <div className="font-mono">{stats.totalBets ? formatCurrency(stats.totalWagered / stats.totalBets) : 0}$</div>
                     </div>
                     <div>
                       <div className="text-[#8b9ba5] text-xs uppercase font-bold">Win Rate</div>
                       <div className="font-mono">{stats.totalBets ? ((stats.wins / stats.totalBets) * 100).toFixed(1) : 0}%</div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "distribution" && (
               <div className="flex flex-col gap-6 h-full">
                  <div className="flex gap-6 h-[300px] shrink-0">
                    <div className="flex-1 bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 flex flex-col shadow-inner">
                       <h3 className="text-white font-bold mb-4">Jeux les plus joués</h3>
                       <div className="flex-1 min-h-0 flex items-center justify-center">
                         {stats.pieData.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={stats.pieData} stroke="#0f212e" strokeWidth={2} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={2} dataKey="value" nameKey="name" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                   {stats.pieData.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                                 </Pie>
                                 <RechartsTooltip contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }}/>
                              </PieChart>
                           </ResponsiveContainer>
                         ) : (
                           <div className="text-[#8b9ba5] font-bold">Aucune donnée disponible.</div>
                         )}
                       </div>
                    </div>
                    <div className="w-[300px] flex flex-col gap-4">
                       <div className="bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 shadow-inner h-full">
                          <span className="text-[#8b9ba5] text-xs font-black uppercase tracking-wider block mb-4">Statistiques de Réussite</span>
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-white font-bold">Victoires</span>
                             <span className="text-[#00e701] font-mono font-bold bg-[#00e701]/10 px-2 py-1 rounded">{stats.wins}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-white font-bold">Défaites</span>
                             <span className="text-rose-500 font-mono font-bold bg-rose-500/10 px-2 py-1 rounded">{stats.losses}</span>
                          </div>
                          <div className="w-full bg-[#2f4553] h-2 rounded-full overflow-hidden flex mt-2">
                             {stats.totalBets > 0 && (
                               <>
                                 <div className="bg-[#00e701] h-full" style={{ width: `${(stats.wins / stats.totalBets) * 100}%` }} />
                                 <div className="bg-rose-500 h-full" style={{ width: `${(stats.losses / stats.totalBets) * 100}%` }} />
                               </>
                             )}
                          </div>
                          <div className="text-center text-[#8b9ba5] text-xs font-bold mt-2">Taux de victoire: {stats.totalBets ? ((stats.wins / stats.totalBets) * 100).toFixed(1) : 0}%</div>
                       </div>
                    </div>
                  </div>

                  {stats.barData.length > 0 && (
                    <div className="flex gap-6 h-[300px] shrink-0">
                      <div className="flex-1 bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 flex flex-col shadow-inner">
                        <h3 className="text-white font-bold mb-4">Profit Net par Jeu (Bar Chart)</h3>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.barData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#2f4553" horizontal={true} vertical={false} />
                              <XAxis type="number" stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} />
                              <YAxis type="category" dataKey="name" stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} width={80} />
                              <RechartsTooltip 
                                cursor={{ fill: '#2f4553', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px' }} 
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: number) => [formatCurrency(value) + '$', 'Profit']}
                              />
                              <ReferenceLine x={0} stroke="#8b9ba5" />
                              <Bar dataKey="profit" animationDuration={1000}>
                                {stats.barData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#00e701' : '#ed4163'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="flex-1 bg-[#213743]/30 border border-[#2f4553] rounded-2xl p-6 flex flex-col shadow-inner">
                        <h3 className="text-white font-bold mb-4">Volume Parié par Jeu</h3>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2f4553" horizontal={true} vertical={false} />
                              <XAxis dataKey="name" stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} />
                              <YAxis stroke="#8b9ba5" tick={{ fill: "#8b9ba5", fontSize: 12 }} />
                              <RechartsTooltip 
                                cursor={{ fill: '#2f4553', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px' }} 
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: number) => [formatCurrency(value) + '$', 'Volume']}
                              />
                              <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            )}

            {activeTab === "history" && (
              <div className="bg-[#213743]/30 border border-[#2f4553] rounded-2xl overflow-hidden flex flex-col h-full shadow-inner">
                 <div className="p-4 border-b border-[#2f4553] grid grid-cols-5 text-[#8b9ba5] font-bold text-xs uppercase tracking-wider bg-[#213743]/50 sticky top-0">
                    <div>Jeu</div>
                    <div>Mise</div>
                    <div>Multiplicateur</div>
                    <div>Payout</div>
                    <div className="text-right">Profit</div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {[...sessionBets].reverse().map((bet, i) => (
                      <div key={i} className="grid grid-cols-5 items-center p-3 border-b border-[#2f4553]/50 hover:bg-black/20 rounded-lg transition-colors font-mono text-sm group">
                         <div className="text-white font-bold capitalize">{bet.game}</div>
                         <div className="text-[#8b9ba5]">{formatCurrency(bet.wagered)}$</div>
                         <div className="text-[#8b9ba5]">{bet.multiplier.toFixed(2)}×</div>
                         <div className="text-white">{formatCurrency(bet.payout)}$</div>
                         <div className={cn("font-black text-right", bet.profit >= 0 ? "text-[#00e701]" : "text-rose-500")}>
                           {bet.profit >= 0 ? "+" : ""}{formatCurrency(bet.profit)}$
                         </div>
                      </div>
                    ))}
                    {sessionBets.length === 0 && (
                      <div className="p-8 text-center text-[#8b9ba5]">Aucun pari trouvé dans cette session.</div>
                    )}
                 </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </div>
    );
  }

  // COMPACT MODE
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-4 right-4 z-50 flex flex-col bg-[#0f212e]/95 backdrop-blur-xl border border-[#2f4553]/80 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,231,1,0.05)] overflow-hidden"
      style={{ width: 360, touchAction: "none" }}
    >
      {/* Dynamic Header Gradient line */}
      <div className={cn("h-1 w-full", isPositive ? "bg-gradient-to-r from-[#00e701] to-emerald-800" : "bg-gradient-to-r from-rose-500 to-rose-900")} />
      
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#2f4553]/50 bg-gradient-to-b from-white/[0.03] to-transparent cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg shadow-inner", isPositive ? "bg-[#00e701]/10 text-[#00e701]" : "bg-rose-500/10 text-rose-500")}>
            <Activity size={16} />
          </div>
          <span className="text-white font-black text-[13px] tracking-wide uppercase">
            Stats de Session
          </span>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="p-1.5 hover:bg-white/10 text-[#8b9ba5] hover:text-white rounded-lg transition-colors" title="Agrandir complet">
            <Maximize2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetSession(); }}
            className="p-1.5 hover:bg-white/10 text-[#8b9ba5] hover:text-white rounded-lg transition-colors"
            title="Réinitialiser"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
            className="p-1.5 hover:bg-white/10 text-[#8b9ba5] hover:text-white rounded-lg transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowSessionStats(false); }}
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
            <div className="p-5 flex flex-col gap-5 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.02),transparent_80%)]">
              {/* Detailed Stats Row */}
              <div className="grid grid-cols-2 gap-3 text-sm border-b border-[#2f4553] pb-4">
                <div className="flex flex-col bg-black/30 p-3 rounded-xl border border-[#2f4553]/50 shadow-inner group">
                  <span className="text-[10px] text-[#8b9ba5] uppercase tracking-widest font-black mb-1">
                    Mise Totale
                  </span>
                  <span className="text-white font-mono font-medium truncate">
                    {formatCurrency(stats.totalWagered)}$
                  </span>
                </div>
                <div className="flex flex-col items-end bg-black/30 p-3 rounded-xl border border-[#2f4553]/50 shadow-inner group text-right">
                  <span className="text-[10px] text-[#8b9ba5] uppercase tracking-widest font-black mb-1">
                    Gain Total
                  </span>
                  <span className="text-white font-mono font-medium truncate">
                    {formatCurrency(stats.totalPayout)}$
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-[#8b9ba5] uppercase tracking-wider">
                  Bénéfice Net
                </span>
                <span
                  className={cn(
                    "text-3xl font-black font-mono tracking-tighter drop-shadow-lg",
                    isPositive ? "text-[#00e701] drop-shadow-[0_0_8px_rgba(0,231,1,0.4)]" : "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]",
                  )}
                >
                  {totalProfit > 0 ? "+" : ""}
                  {formatCurrency(totalProfit)}$
                </span>
              </div>

              <div className="h-[150px] w-full mt-1 relative rounded-xl overflow-hidden cursor-crosshair border border-[#2f4553]/30 bg-[#0a151d]">
                 {/* Chart Background Grid */}
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8cGF0aCBkPSJNIDE5IDAgTCAxOSAyMCBNIDAgMTkgTCAyMCAxOSIgeFN0cm9rZT0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50 z-0"/>
                {stats.chartData.length <= 1 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#8b9ba5] font-medium p-6 text-center z-10">
                    Commencez à parier pour voir votre tendance.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                    <AreaChart data={stats.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfitLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={isPositive ? "#00e701" : "#ed4163"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <ReferenceLine
                        y={0}
                        stroke="rgba(139, 155, 165, 0.4)"
                        strokeDasharray="3 3"
                      />
                      <YAxis domain={[(dataMin: number) => Math.min(0, dataMin), (dataMax: number) => Math.max(0, dataMax)]} hide />
                      <RechartsTooltip 
                        content={renderTooltipContent}
                        cursor={{ stroke: '#8b9ba5', strokeWidth: 1, strokeDasharray: '4 4' }}
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke={isPositive ? "#00e701" : "#ed4163"}
                        strokeWidth={4}
                        fill="url(#colorProfitLight)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Latest Bets List */}
              {sessionBets.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1 max-h-[90px] overflow-y-auto pr-1 custom-scrollbar">
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
                         <History size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer compact stats */}
            <div className="bg-[#0b171f] px-5 py-3 border-t border-[#2f4553]/50 flex justify-between items-center text-[10px] font-black uppercase text-[#8b9ba5] tracking-wider z-10 relative shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1 text-[#00e701]"><TrendingUp size={12}/> W {stats.wins}</span>
                 <span className="flex items-center gap-1 text-rose-500"><TrendingDown size={12}/> L {stats.losses}</span>
               </div>
               <span className="text-[#8b9ba5]/50 px-2">|</span>
               <span>{stats.totalBets} Bets</span>
               <span className="text-[#8b9ba5]/50 px-2">|</span>
               <span className="text-amber-400">{stats.maxMultiplier.toFixed(2)}x Max</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
