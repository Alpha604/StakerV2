import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  BarChart3,
  Star,
  Crown,
} from "lucide-react";
import { cn } from "../lib/utils";

const COLORS = [
  "#1475e1",
  "#00e676",
  "#ed4163",
  "#9b59b6",
  "#00bcd4",
  "#fbc02d",
  "#e67e22",
  "#1abc9c",
  "#34495e",
];

const VIP_LEVELS = [
  { name: "Aucun", req: 0, color: "text-gray-400" },
  { name: "Bronze", req: 10000, color: "text-amber-600" },
  { name: "Silver", req: 50000, color: "text-gray-300" },
  { name: "Gold", req: 100000, color: "text-yellow-400" },
  { name: "Platinum", req: 250000, color: "text-cyan-400" },
  { name: "Diamond", req: 1000000, color: "text-purple-400" },
];

export function Stats() {
  const { user, sessionBets } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin text-4xl text-accent">💰</div>
      </div>
    );
  }

  const totalWageredAllTime = user?.totalWagered || 0;

  // Calculate VIP
  let currentVipIdx = 0;
  for (let i = 0; i < VIP_LEVELS.length; i++) {
    if (totalWageredAllTime >= VIP_LEVELS[i].req) {
      currentVipIdx = i;
    } else {
      break;
    }
  }
  const currentVip = VIP_LEVELS[currentVipIdx];
  const nextVip =
    currentVipIdx < VIP_LEVELS.length - 1
      ? VIP_LEVELS[currentVipIdx + 1]
      : null;
  const vipProgress = nextVip
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalWageredAllTime - currentVip.req) /
            (nextVip.req - currentVip.req)) *
            100,
        ),
      )
    : 100;

  if (!user || sessionBets.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-24 h-24 bg-bg-panel border border-border-medium rounded-full mb-6 flex items-center justify-center shadow-xl">
          <BarChart3 size={40} className="text-accent/50" />
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400 mb-4 inline-block">
          Statistiques de Session
        </h2>
        <p className="max-w-md">
          Jouez à des jeux pour voir vos statistiques s'afficher ici.
          L'historique et les données se mettront à jour en temps réel.
        </p>

        <div className="mt-12 bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl w-full max-w-lg text-left">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Crown size={20} className={currentVip.color} /> Niveau VIP Global
          </h3>
          <div className="flex justify-between text-sm mb-2 font-bold">
            <span className={currentVip.color}>{currentVip.name}</span>
            {nextVip && <span className={nextVip.color}>{nextVip.name}</span>}
          </div>
          <div className="h-4 w-full bg-bg-inner rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-accent transition-all duration-1000 ease-out"
              style={{ width: `${vipProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-text-secondary mt-3">
            Total misé (tous les temps) :{" "}
            <span className="text-white font-mono">
              ${totalWageredAllTime.toFixed(2)}
            </span>
          </p>
        </div>
      </div>
    );
  }

  const bets = sessionBets.slice().sort((a, b) => a.timestamp - b.timestamp);

  // Calculate stats
  const totalWagered = bets.reduce((acc, b) => acc + b.wagered, 0);
  const totalPayout = bets.reduce((acc, b) => acc + b.payout, 0);
  const totalProfit = totalPayout - totalWagered;

  // Games count chart data
  const gamesCount = bets.reduce(
    (acc, b) => {
      acc[b.game] = (acc[b.game] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const pieData = Object.entries(gamesCount)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  // Bar chart data for profit by game
  const gamesProfit = bets.reduce(
    (acc, b) => {
      acc[b.game] = (acc[b.game] || 0) + b.profit;
      return acc;
    },
    {} as Record<string, number>,
  );

  const barData = Object.entries(gamesProfit)
    .map(([name, profit]) => ({
      name,
      profit: parseFloat((profit as number).toFixed(2)),
    }))
    .sort((a, b) => b.profit - a.profit);

  // Profit over time chart data
  let currentProfit = 0;
  const timeData = bets.map((b, i) => {
    currentProfit += b.profit;
    return {
      name: `Pari ${i + 1}`,
      profit: parseFloat(currentProfit.toFixed(2)),
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pb-4 border-b border-border-medium">
        <div className="flex items-center gap-3">
          <Activity className="text-accent" size={32} />
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            Rapport de Session
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-bg-panel px-4 py-2 rounded-lg border border-border-medium shadow-md">
          <Crown className={currentVip.color} size={24} />
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">
              Niveau VIP
            </span>
            <span className={cn("font-black leading-none", currentVip.color)}>
              {currentVip.name}
            </span>
          </div>
          <div className="w-[120px] ml-4">
            <div className="flex justify-between text-[10px] mb-1 font-bold">
              <span className="text-text-secondary">
                {vipProgress.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-bg-inner rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${vipProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Coins size={80} />
          </div>
          <span className="text-text-secondary text-sm font-bold uppercase tracking-wider relative z-10">
            Mise Totale
          </span>
          <span className="text-3xl font-black text-white font-mono relative z-10">
            ${totalWagered.toFixed(2)}
          </span>
          <span className="text-xs text-text-secondary mt-2 relative z-10">
            Dans la session actuelle
          </span>
        </div>
        <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Target size={80} />
          </div>
          <span className="text-text-secondary text-sm font-bold uppercase tracking-wider relative z-10">
            Gains Totaux
          </span>
          <span className="text-3xl font-black text-white font-mono relative z-10">
            ${totalPayout.toFixed(2)}
          </span>
          <span className="text-xs text-text-secondary mt-2 relative z-10">
            Paiements bruts
          </span>
        </div>
        <div
          className={cn(
            "bg-bg-panel border rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden transition-transform hover:-translate-y-1",
            totalProfit >= 0
              ? "border-[#00e676]/50 shadow-[#00e676]/10"
              : "border-[#ed4163]/50 shadow-[#ed4163]/10",
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {totalProfit >= 0 ? (
              <TrendingUp size={80} />
            ) : (
              <TrendingDown size={80} />
            )}
          </div>
          <span className="text-text-secondary text-sm font-bold uppercase tracking-wider relative z-10">
            Bénéfice Net
          </span>
          <span
            className={cn(
              "text-4xl font-black font-mono relative z-10",
              totalProfit >= 0 ? "text-[#00e676]" : "text-[#ed4163]",
            )}
          >
            {totalProfit > 0 ? "+" : ""}
            {totalProfit.toFixed(2)}
          </span>
          <span className="text-xs text-white/50 mt-1 relative z-10">
            Taux de retour:{" "}
            {totalWagered > 0
              ? ((totalPayout / totalWagered) * 100).toFixed(1)
              : 0}
            %
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Area Chart */}
        <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-[#00e676]" size={20} />
            <h3 className="text-white font-bold text-lg">
              Évolution du Bénéfice par Pari
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2c3b47"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#5b7b93"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#5b7b93"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{
                    stroke: "#5b7b93",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                  contentStyle={{
                    backgroundColor: "#0f212e",
                    borderColor: "#2f4553",
                    borderRadius: "8px",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#00e676", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#00e676"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart (Profit by Game) */}
        <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-accent" size={20} />
            <h3 className="text-white font-bold text-lg">Bénéfice par Jeu</h3>
          </div>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2c3b47"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#5b7b93"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#5b7b93"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0f212e",
                    borderColor: "#2f4553",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [`$${value}`, "Bénéfice"]}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? "#00e676" : "#ed4163"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-white font-bold mb-6 text-lg">
            Répartition des Paris
          </h3>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f212e",
                    borderColor: "#2f4553",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [value, "Paris"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend inside pie card */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {pieData.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-2 text-sm font-bold text-text-secondary bg-bg-inner px-3 py-1.5 rounded-full border border-border-subtle hover:border-text-secondary transition-colors cursor-default"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                ></span>
                {d.name}{" "}
                <span className="text-white ml-1 bg-white/10 px-1.5 rounded text-xs">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-bg-panel border border-border-medium rounded-xl shadow-xl overflow-hidden mt-4">
        <div className="p-6 border-b border-border-medium bg-bg-inner/30 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Historique Détaillé</h3>
          <span className="text-xs font-bold text-text-secondary bg-border-subtle px-2 py-1 rounded">
            {bets.length} PARIS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-inner/80 border-b border-border-medium">
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Jeu
                </th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Heure
                </th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                  Mise
                </th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                  Mult.
                </th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                  Gains
                </th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                  Bénéfice
                </th>
              </tr>
            </thead>
            <tbody>
              {[...bets].reverse().map((b, i) => {
                const profit = b.profit;
                return (
                  <tr
                    key={b.timestamp + i + Math.random()}
                    className="border-b border-border-medium/50 hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="p-4 text-sm font-bold text-white capitalize flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(20,117,225,0.8)]"></div>
                      {b.game.replace("-", " ")}
                    </td>
                    <td className="p-4 text-sm text-text-secondary font-mono">
                      {new Date(b.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-sm font-mono text-white text-right">
                      ${b.wagered.toFixed(2)}
                    </td>
                    <td className="p-4 text-sm font-mono text-text-secondary text-right">
                      {b.multiplier.toFixed(2)}x
                    </td>
                    <td className="p-4 text-sm font-mono text-white text-right">
                      ${b.payout.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "p-4 text-sm font-black font-mono text-right drop-shadow-sm",
                        profit > 0
                          ? "text-[#00e676]"
                          : profit < 0
                            ? "text-[#ed4163]"
                            : "text-text-secondary",
                      )}
                    >
                      {profit > 0 ? "+" : ""}
                      {profit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bets.length === 0 && (
            <div className="p-8 text-center text-text-secondary text-sm">
              Aucun pari.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
