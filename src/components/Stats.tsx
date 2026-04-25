import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Target, Coins, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['#1475e1', '#00e676', '#ed4163', '#9b59b6', '#00bcd4', '#fbc02d', '#e67e22', '#1abc9c', '#34495e'];

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

  if (!user || sessionBets.length === 0) {
    return (
       <div className="p-8 text-center text-text-secondary">
         <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-blue-400 mb-4 inline-block">Statistiques de Session (Temps Réel)</h2>
         <p>Jouez à des jeux pour voir vos statistiques s'afficher ici.</p>
       </div>
    );
  }

  const bets = sessionBets.slice().sort((a, b) => a.timestamp - b.timestamp);

  // Calculate stats
  const totalWagered = bets.reduce((acc, b) => acc + b.wagered, 0);
  const totalPayout = bets.reduce((acc, b) => acc + b.payout, 0);
  const totalProfit = totalPayout - totalWagered;

  // Games count chart data
  const gamesCount = bets.reduce((acc, b) => {
    acc[b.game] = (acc[b.game] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(gamesCount).map(([name, value]) => ({ name, value: Number(value) })).sort((a,b) => b.value - a.value);

  // Bar chart data for profit by game
  const gamesProfit = bets.reduce((acc, b) => {
    acc[b.game] = (acc[b.game] || 0) + b.profit;
    return acc;
  }, {} as Record<string, number>);
  
  const barData = Object.entries(gamesProfit).map(([name, profit]) => ({ name, profit: parseFloat(profit.toFixed(2)) })).sort((a,b) => b.profit - a.profit);

  // Profit over time chart data
  let currentProfit = 0;
  const timeData = bets.map((b, i) => {
    currentProfit += b.profit;
    return {
      name: `Bet ${i+1}`,
      profit: parseFloat(currentProfit.toFixed(2))
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-3 mb-2 border-b border-border-medium pb-4">
         <Activity className="text-accent" size={32} />
         <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Statistiques & Historique (Session)</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Coins size={64}/></div>
            <span className="text-text-secondary text-sm font-bold uppercase tracking-wider">Total Parié</span>
            <span className="text-3xl font-black text-white font-mono">${totalWagered.toFixed(2)}</span>
         </div>
         <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={64}/></div>
            <span className="text-text-secondary text-sm font-bold uppercase tracking-wider">Total Gagné</span>
            <span className="text-3xl font-black text-white font-mono">${totalPayout.toFixed(2)}</span>
         </div>
         <div className={cn("bg-bg-panel border rounded-xl p-6 shadow-xl flex flex-col gap-2 relative overflow-hidden", totalProfit >= 0 ? "border-[#00e676]/30" : "border-[#ed4163]/30")}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
               {totalProfit >= 0 ? <TrendingUp size={64}/> : <TrendingDown size={64}/>}
            </div>
            <span className="text-text-secondary text-sm font-bold uppercase tracking-wider">Bénéfice Net</span>
            <span className={cn("text-3xl font-black font-mono", totalProfit >= 0 ? "text-[#00e676]" : "text-[#ed4163]")}>
               {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Area Chart */}
         <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
               <TrendingUp className="text-[#00e676]" size={20} />
               <h3 className="text-white font-bold text-lg">Évolution du Bénéfice</h3>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#00e676" stopOpacity={0.6}/>
                           <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#2c3b47" vertical={false} />
                     <XAxis dataKey="name" stroke="#5b7b93" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                     <YAxis stroke="#5b7b93" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                     <Tooltip 
                        cursor={{ stroke: '#5b7b93', strokeWidth: 1, strokeDasharray: '5 5' }}
                        contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#00e676', fontWeight: 'bold' }}
                     />
                     <Area type="monotone" dataKey="profit" stroke="#00e676" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
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
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#2c3b47" vertical={false} />
                     <XAxis dataKey="name" stroke="#5b7b93" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                     <YAxis stroke="#5b7b93" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                     <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px', color: '#fff' }}
                     />
                     <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                       {barData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#00e676' : '#ed4163'} />
                       ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pie Chart */}
         <div className="bg-bg-panel border border-border-medium rounded-xl p-6 shadow-xl flex flex-col">
            <h3 className="text-white font-bold mb-6 text-lg">Répartition des Jeux Joués</h3>
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
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f212e', borderColor: '#2f4553', borderRadius: '8px', color: '#fff' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            {/* Legend inside pie card */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
               {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm font-bold text-text-secondary bg-bg-inner px-3 py-1.5 rounded-full border border-border-subtle">
                     <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                     {d.name} <span className="text-white ml-1">{d.value}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* History Table */}
      <div className="bg-bg-panel border border-border-medium rounded-xl shadow-xl overflow-hidden mt-4">
         <div className="p-6 border-b border-border-medium bg-bg-inner/30">
            <h3 className="text-white font-bold text-lg">Historique Récent (50 derniers)</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-bg-inner/80 border-b border-border-medium">
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Jeu</th>
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Heure</th>
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Mise</th>
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Mult.</th>
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Gains</th>
                     <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Bénéfice</th>
                  </tr>
               </thead>
               <tbody>
                  {[...bets].reverse().slice(0, 50).map((b, i) => {
                     const profit = b.profit;
                     return (
                        <tr key={b.timestamp + i} className="border-b border-border-medium/50 hover:bg-white/[0.04] transition-colors">
                           <td className="p-4 text-sm font-bold text-white capitalize flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-accent"></div>
                             {b.game.replace('-', ' ')}
                           </td>
                           <td className="p-4 text-sm text-text-secondary font-mono">{new Date(b.timestamp).toLocaleTimeString()}</td>
                           <td className="p-4 text-sm font-mono text-white text-right">${b.wagered.toFixed(2)}</td>
                           <td className="p-4 text-sm font-mono text-text-secondary text-right">{b.multiplier.toFixed(2)}x</td>
                           <td className="p-4 text-sm font-mono text-white text-right">${b.payout.toFixed(2)}</td>
                           <td className={cn("p-4 text-sm font-black font-mono text-right bg-gradient-to-r bg-clip-text text-transparent", 
                               profit > 0 ? "from-[#00e676] to-[#00b25e]" : profit < 0 ? "from-[#ed4163] to-[#c8324e]" : "from-text-secondary to-text-secondary")}>
                              {profit > 0 ? '+' : ''}{profit.toFixed(2)}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
      
    </div>
  );
}
