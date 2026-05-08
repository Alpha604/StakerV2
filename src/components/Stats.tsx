import React, { useMemo, useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { formatCurrency } from "../lib/utils";
import { TruckLoader } from "./TruckLoader";
import { BarChart3, TrendingUp, TrendingDown, Target, Activity, Flame, Trophy, Coins, Clock, ListOrdered, Percent } from "lucide-react";
import { cn } from "../lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

export function Stats() {
  const { user, sessionBets } = useUser() as any;
  const [globalBets, setGlobalBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBets() {
       if (!user?.id) {
         setLoading(false);
         return;
       }
       try {
         const q = query(
           collection(db, "bets"),
           where("userId", "==", user.id),
           orderBy("timestamp", "desc"),
           limit(500)
         );
         const snapshot = await getDocs(q);
         const bets = snapshot.docs.map(doc => doc.data());
         setGlobalBets(bets);
       } catch (err) {
         console.error("Error fetching bets", err);
       } finally {
         setLoading(false);
       }
    }
    fetchBets();
  }, [user?.id]);

  const stats = useMemo(() => {
    const betsToProcess = globalBets.length > 0 ? globalBets : sessionBets;
    if (!betsToProcess || betsToProcess.length === 0) return null;
    
    let totalBets = betsToProcess.length;
    let totalWagered = 0;
    let totalWon = 0;
    let wins = 0;
    let losses = 0;
    let highestMultiplier = 0;
    let biggestWin = 0;
    
    // Group by game
    const gameStats: Record<string, { bets: number, wagered: number, won: number, profit: number }> = {};
    
    // Balance over time for chart (reverse array because we fetched desc, or for sessionBets it's asc)
    let currentBal = 0;
    const chartData: any[] = [];
    
    // Sort chronologically for chart
    const chronologicalBets = [...betsToProcess].sort((a, b) => {
       const timeA = a.timestamp ? (typeof a.timestamp === 'number' ? a.timestamp : a.timestamp.toMillis?.() || 0) : 0;
       const timeB = b.timestamp ? (typeof b.timestamp === 'number' ? b.timestamp : b.timestamp.toMillis?.() || 0) : 0;
       return timeA - timeB;
    });

    chronologicalBets.forEach((bet: any, i: number) => {
      // Compatibility with localized sessionBets vs global bets
      const betAmount = Number(bet.betAmount ?? bet.amount ?? 0);
      const profit = bet.profit !== undefined ? Number(bet.profit) : (bet.payout !== undefined ? Number(bet.payout) - betAmount : 0);
      const multiplier = Number(bet.multiplier ?? 0);
      const gameName = bet.game || "Unknown";

      totalWagered += betAmount;
      totalWon += profit > 0 ? (betAmount + profit) : 0;
      
      if (profit > 0) wins++;
      else if (profit < 0) losses++;
      
      if (multiplier > highestMultiplier) highestMultiplier = multiplier;
      if (profit > biggestWin) biggestWin = profit;
      
      if (!gameStats[gameName]) {
        gameStats[gameName] = { bets: 0, wagered: 0, won: 0, profit: 0 };
      }
      gameStats[gameName].bets++;
      gameStats[gameName].wagered += betAmount;
      gameStats[gameName].won += profit > 0 ? (betAmount + profit) : 0;
      gameStats[gameName].profit += profit;
      
      currentBal += profit;
      if (i >= chronologicalBets.length - 100) {
        chartData.push({
           name: i.toString(),
           profit: currentBal,
           bet: gameName
        });
      }
    });

    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const avgBet = totalBets > 0 ? totalWagered / totalBets : 0;
    const totalProfit = chronologicalBets.reduce((acc: number, curr: any) => acc + (curr.profit ?? (curr.payout ? curr.payout - curr.amount : 0)), 0);
    
    const favoriteGame = Object.entries(gameStats).sort((a, b) => b[1].bets - a[1].bets)[0]?.[0] || "-";
    const mostProfitableGame = Object.entries(gameStats).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] || "-";

    // Use global DB values from user profile if they differ significantly (e.g. capped limit)
    const displayWagered = user?.totalWagered > totalWagered ? user.totalWagered : totalWagered;
    const displayWon = user?.totalWon > totalWon ? user.totalWon : totalWon;

    return {
      totalBets: globalBets.length > 0 && user?.totalBets ? user.totalBets : totalBets,
      totalWagered: displayWagered,
      totalWon: displayWon,
      totalProfit,
      winRate,
      wins,
      losses,
      highestMultiplier,
      biggestWin,
      avgBet,
      favoriteGame,
      mostProfitableGame,
      gameStats,
      chartData,
      isGlobal: globalBets.length > 0
    };
  }, [globalBets, sessionBets, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <TruckLoader />
      </div>
    );
  }

  if (!user || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-[#8b9ba5] text-lg font-bold flex flex-col items-center gap-4">
          <Activity size={48} className="opacity-50" />
          Pas assez de données pour afficher les statistiques. Jouez quelques parties pour generer de la data !
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-white animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between">
         <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white mb-2">
            <BarChart3 className="text-accent" size={32} />
            Statistiques Détaillées
          </h1>
          <p className="text-text-secondary font-medium">Analyse complète de votre activité de jeu</p>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f212e] p-5 rounded-xl border border-[#2f4553]">
           <div className="flex items-center gap-2 text-[#8b9ba5] font-bold text-xs uppercase tracking-wider mb-2">
              <Activity size={16} /> Total Paris
           </div>
           <div className="text-2xl font-black">{stats.totalBets}</div>
        </div>
        <div className="bg-[#0f212e] p-5 rounded-xl border border-[#2f4553]">
           <div className="flex items-center gap-2 text-[#8b9ba5] font-bold text-xs uppercase tracking-wider mb-2">
              <Coins size={16} /> Total Misé
           </div>
           <div className="text-2xl font-black font-mono text-blue-400">{formatCurrency(stats.totalWagered)}$</div>
        </div>
        <div className="bg-[#0f212e] p-5 rounded-xl border border-[#2f4553]">
           <div className="flex items-center gap-2 text-[#8b9ba5] font-bold text-xs uppercase tracking-wider mb-2">
              <TrendingUp size={16} /> Total Gagné
           </div>
           <div className="text-2xl font-black font-mono text-emerald-400">{formatCurrency(stats.totalWon)}$</div>
        </div>
        <div className="bg-[#0f212e] p-5 rounded-xl border border-[#2f4553]">
           <div className="flex items-center gap-2 text-[#8b9ba5] font-bold text-xs uppercase tracking-wider mb-2">
              {stats.totalProfit >= 0 ? <TrendingUp size={16} className="text-emerald-500"/> : <TrendingDown size={16} className="text-red-500"/>} Profit Net
           </div>
           <div className={cn("text-2xl font-black font-mono", stats.totalProfit >= 0 ? "text-emerald-500" : "text-red-500")}>
              {stats.totalProfit > 0 ? "+" : ""}{formatCurrency(stats.totalProfit)}$
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Performance Matrix */}
         <div className="col-span-1 lg:col-span-2 bg-[#0f212e] p-6 rounded-xl border border-[#2f4553]">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Target className="text-purple-400" size={20} /> Matrice de Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Taux de Victoire</div>
                  <div className="text-xl font-black flex items-center gap-2">
                    {stats.winRate.toFixed(2)}% <Percent size={14} className="text-[#8b9ba5]"/>
                  </div>
                </div>
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Mise Moyenne</div>
                  <div className="text-xl font-black font-mono text-white">
                    {formatCurrency(stats.avgBet)}$
                  </div>
                </div>
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Multiplicateur Max</div>
                  <div className="text-xl font-black text-amber-400">
                    {stats.highestMultiplier.toFixed(2)}×
                  </div>
                </div>
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Plus Gros Gain</div>
                  <div className="text-xl font-black font-mono text-emerald-400">
                    +{formatCurrency(stats.biggestWin)}$
                  </div>
                </div>
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Gains / Pertes</div>
                  <div className="text-xl font-black flex items-center gap-2 text-sm">
                    <span className="text-emerald-500">{stats.wins}V</span> / <span className="text-red-500">{stats.losses}D</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Jeu Préféré</div>
                  <div className="text-xl font-black text-white truncate" title={stats.favoriteGame}>
                    {stats.favoriteGame}
                  </div>
                </div>
            </div>

            {/* Profit Chart */}
            <div className="mt-8 h-64 w-full">
               <h3 className="text-sm font-bold text-[#8b9ba5] mb-4 uppercase">Évolution du Profit (100 derniers paris)</h3>
               {stats.chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1bc86a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1bc86a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2f4553" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis stroke="#8b9ba5" fontSize={12} tickFormatter={(value) => `${value}$`} width={60} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value.toFixed(2)}$`, 'Profit Relatif']}
                        labelFormatter={() => ''}
                      />
                      <Area type="monotone" dataKey="profit" stroke="#1bc86a" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                 </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-[#8b9ba5] font-bold">Pas assez de données pour le graphique.</div>
               )}
            </div>
         </div>

         {/* Right Sidebar - Game Stats */}
         <div className="bg-[#0f212e] p-6 rounded-xl border border-[#2f4553] flex flex-col h-full max-h-[500px]">
             <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
               <Trophy className="text-amber-400" size={20} /> Top Jeux
             </h2>
             <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
                {(Object.entries(stats.gameStats) as [string, { bets: number, wagered: number, won: number, profit: number }][]).sort((a, b) => b[1].bets - a[1].bets).map(([gameName, gameData], index) => (
                   <div key={gameName} className="bg-[#213743] p-4 rounded-lg border border-[#2f4553] flex flex-col gap-2">
                       <div className="flex justify-between items-center">
                          <div className="font-bold text-white flex items-center gap-2">
                             <span className="text-[#8b9ba5] text-xs">#{index + 1}</span> {gameName}
                          </div>
                          <div className="text-xs font-bold text-[#8b9ba5] bg-black/20 px-2 py-1 rounded">
                             {gameData.bets} paris
                          </div>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-[#8b9ba5]">Wager: <span className="text-white font-mono">{formatCurrency(gameData.wagered)}$</span></span>
                          <span className={cn("font-mono font-bold", gameData.profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                             {gameData.profit > 0 ? "+" : ""}{formatCurrency(gameData.profit)}$
                          </span>
                       </div>
                   </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
}
