import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect, useMemo } from "react";
import { useUser, CustomUser, UserRank } from "../context/UserContext";
import { Search, Users, Activity, DollarSign, TrendingUp, Trash2, Shield, ShieldAlert, AlertTriangle, X, Save, History, Settings, Lock, Unlock, Gavel, Cpu, Database, Eye } from "lucide-react";
import { RankBadge } from "./RankBadge";
import { db } from "../lib/firebase";
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";

export function AdminPanel() {
  const { user } = useUser();
  const [users, setUsers] = useState<CustomUser[]>([]);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalBetsCount, setGlobalBetsCount] = useState(0);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<CustomUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomUser>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [suspensionHours, setSuspensionHours] = useState<number | "">("");
  const [editTab, setEditTab] = useState<"general"|"finances"|"permissions"|"history">("general");

  useEffect(() => {
    let unsubUsers: () => void;
    let unsubBets: () => void;

    if (user?.role === "admin") {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }) as CustomUser);
        setUsers(usersData);
        setLoading(false);
      });

      const betsQ = query(collection(db, "bets"), orderBy("timestamp", "desc"), limit(100));
      unsubBets = onSnapshot(betsQ, (snap) => {
        setRecentBets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      fetchGlobalBetsCount();
      const countInterval = setInterval(fetchGlobalBetsCount, 15000);

      return () => {
        if (unsubUsers) unsubUsers();
        if (unsubBets) unsubBets();
        clearInterval(countInterval);
      };
    }
  }, [user]);

  const fetchGlobalBetsCount = async () => {
    try {
      const snap = await getCountFromServer(collection(db, "bets"));
      setGlobalBetsCount(snap.data().count);
    } catch (e) {
      console.warn("Could not get bet count", e);
    }
  };

  const updateUser = async (userId: string, updates: Partial<CustomUser>) => {
    setActionLoading(userId + Object.keys(updates)[0]);
    try {
      await updateDoc(doc(db, "users", userId), updates as any);
    } catch (e) {
      console.warn(e);
      alert("Erreur lors de la mise à jour");
    }
    setActionLoading(null);
  };

  const deleteUser = async (userToDelete: CustomUser) => {
    if (["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(userToDelete.email || "")) return alert("Impossible de supprimer cet administrateur protégé.");
    if (userToDelete.id === user?.id) return alert("Vous ne pouvez pas vous supprimer vous-même.");
    if (!confirm(`Attention ! Supprimer ${userToDelete.username} implique l'effacement total de la base. Confirmer ?`)) return;
    
    setActionLoading(userToDelete.id + "delete");
    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
    } catch (e) {
      console.warn(e);
    }
    setActionLoading(null);
  };

  const clearGlobalBets = async () => {
    const doubleConfirm = prompt("TAPEZ 'PURGE' POUR SUPPRIMER TOUT L'HISTORIQUE DES PARIS (Irréversible):");
    if (doubleConfirm !== "PURGE") return;
    alert("Ce processus peut être long / impossible si > 500 documents sur FrontEnd. Veuillez utiliser Firebase Console -> Functions.");
  };

  const handleEditClick = (u: CustomUser) => {
    setEditingUser(u);
    setEditForm({
      balance: u.balance,
      vault: u.vault || 0,
      totalWagered: u.totalWagered || 0,
      totalWon: u.totalWon || 0,
      role: u.role || 'user',
      status: u.status || 'pending',
      rank: u.rank || "None",
      permissions: u.permissions || {},
    });
    setSuspensionHours("");
    setEditTab("general");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditLoading(true);
    try {
      const finalUpdates: Partial<CustomUser> = { ...editForm };
      
      if (finalUpdates.status === 'suspended' && suspensionHours !== "") {
        finalUpdates.suspensionEndsAt = Date.now() + Number(suspensionHours) * 3600 * 1000;
      } else if (finalUpdates.status !== 'suspended') {
        finalUpdates.suspensionEndsAt = null as any;
      }
      
      await updateDoc(doc(db, "users", editingUser.id), finalUpdates as any);
      const isSelf = user?.id === editingUser.id;
      setEditingUser(null);
      if(isSelf && finalUpdates.status === 'suspended' || finalUpdates.status === 'banned') {
         window.location.reload(); 
      }
    } catch(e) {
      console.warn(e);
      alert("Erreur de sauvegarde.");
    }
    setEditLoading(false);
  };

  const chartData = useMemo(() => {
    return [...recentBets].reverse().map((b, i) => ({
      name: i,
      amount: b.betAmount,
      profit: b.payout - b.betAmount
    }));
  }, [recentBets]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="bg-black/40 backdrop-blur-xl p-10 rounded-3xl text-center border border-red-500/20 max-w-lg w-full shadow-[0_0_100px_rgba(239,68,68,0.1)]">
          <ShieldAlert size={64} className="mx-auto text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h2 className="text-3xl font-extrabold text-red-500 mb-3 tracking-tight">Accès Refusé</h2>
          <p className="text-gray-400 font-medium">Habilitation administrateur requise pour Network_Core.</p>
        </div>
      </div>
    );
  }

  const onlineUsers = users.filter(u => u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000)).length;
  const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalVault = users.reduce((acc, u) => acc + (u.vault || 0), 0);
  const totalEconomy = totalBalance + totalVault;
  const totalWagered = users.reduce((acc, u) => acc + (u.totalWagered || 0), 0);
  
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full text-white animate-in fade-in duration-500 pb-24">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Cpu className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Nexus Control
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-400/80 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                SYSTEM: ONLINE / SECURED
              </div>
            </div>
          </div>
        </div>

        <div className="flex bg-black/40 border border-gray-800 rounded-xl p-1 gap-1 items-center">
           <button 
             onClick={clearGlobalBets}
             className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/30 px-5 py-2.5 rounded-lg font-bold transition-all text-sm group"
           >
             <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
             Master Purge
           </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Réseau Utilisateurs" icon={<Users className="text-blue-500" size={22}/>} value={users.length} sub={`${onlineUsers} Actifs en temps réel`} color="from-blue-600/20 to-blue-900/10" border="border-blue-500/20" />
        <StatCard title="Trésorerie Globale" icon={<Database className="text-emerald-500" size={22}/>} value={`$${formatCurrency(totalEconomy)}`} sub={`$${formatCurrency(totalBalance)} S. / $${formatCurrency(totalVault)} C.`} color="from-emerald-600/20 to-emerald-900/10" border="border-emerald-500/20" />
        <StatCard title="Flux Parié Total" icon={<Activity className="text-purple-500" size={22}/>} value={`$${formatCurrency(totalWagered)}`} sub="Capital misé à ce jour" color="from-purple-600/20 to-purple-900/10" border="border-purple-500/20" />
        
        {/* Trajectory Mini Chart Card */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-gray-800 p-5 flex flex-col justify-between relative overflow-hidden h-[140px]">
          <div className="z-10 relative">
             <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Trafic Live</span>
                <TrendingUp size={16} className="text-indigo-400" />
             </div>
             <p className="text-2xl font-bold font-mono">{globalBetsCount.toLocaleString()}</p>
             <p className="text-xs text-gray-500">Transactions Globales</p>
          </div>
          <div className="absolute inset-0 pt-16 z-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                  <defs>
                     <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <RechartsTooltip content={() => <div/>} cursor={{stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4'}} />
                  <Area type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center border border-gray-700">
               <Eye size={20} className="text-gray-400" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Registre des Identités</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Surveillance Synchrone</p>
             </div>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Identifier un citoyen (UID, Email, Pseudo)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
            />
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-black/40 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-800">
                <th className="py-4 px-6 font-medium">Sujet</th>
                <th className="py-4 px-6 font-medium text-center">Niveau / Grade</th>
                <th className="py-4 px-6 font-medium">État Sécuritaire</th>
                <th className="py-4 px-6 font-medium">Capitaux</th>
                <th className="py-4 px-6 font-medium text-center">Interventions Directes</th>
                <th className="py-4 px-6 font-medium text-right">Manipulation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                     <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="w-12 h-12 border-4 border-gray-800 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="font-mono text-xs tracking-widest uppercase">Acquisition des cibles...</span>
                     </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-gray-500">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg">Aucun enregistrement</p>
                    <p className="text-sm font-mono mt-1 opacity-60">Matrice de recherche vide pour : {searchQuery}</p>
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const isOnline = u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000);
                const isProtectedAdmin = ["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(u.email || "");
                const isSelf = user?.id === u.id;
                
                return (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* P1: Identity */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {u.photoURL ? (
                           <img src={u.photoURL} alt={u.username} className="w-12 h-12 rounded-xl object-cover border border-gray-700 shadow-lg" />
                        ) : (
                           <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg uppercase">
                             {u.username.substring(0, 2)}
                           </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] shadow-sm ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-gray-600'}`} title={isOnline ? 'Active' : 'Offline'} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-200 truncate flex items-center gap-2 text-base">
                          {u.username}
                          {isSelf && <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-indigo-500/30">Moi</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={u.email}>{u.email || 'Anonyme'}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-0.5" title={u.id}>UID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* P2: Role & Rank */}
                  <td className="py-4 px-6 text-center">
                     <div className="flex flex-col items-center gap-2">
                         <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max
                           ${u.role === 'admin' 
                             ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
                             : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                           {u.role === 'admin' ? <Shield size={12} /> : <Users size={12} />}
                           {u.role || 'user'}
                         </span>
                         <RankBadge rank={u.rank} className="h-5 drop-shadow-md" />
                     </div>
                  </td>

                  {/* P3: Status */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full 
                         ${u.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                           u.status === 'suspended' ? 'bg-amber-500 animate-pulse' :
                           u.status === 'banned' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                           'bg-gray-500'}
                       `}/>
                       <span className={`text-sm font-semibold 
                         ${u.status === 'approved' ? 'text-emerald-400' : 
                          u.status === 'suspended' ? 'text-amber-400' : 
                          u.status === 'banned' ? 'text-red-400' : 'text-gray-400'}`}>
                         {u.status === 'approved' ? 'Vérifié' : 
                          u.status === 'suspended' ? 'Suspendu' : 
                          u.status === 'banned' ? 'Banni' : 'En attente'}
                       </span>
                    </div>
                  </td>

                  {/* P4: Finances */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 w-full max-w-[160px] bg-black/30 p-2.5 rounded-lg border border-gray-800/50">
                      <div className="font-mono text-emerald-400 text-sm font-bold flex justify-between w-full items-center">
                        <span className="text-gray-500 text-[10px] font-sans uppercase font-bold tracking-wider">Main</span>
                        <span>{formatCurrency(u.balance)}$</span>
                      </div>
                      <div className="w-full h-px bg-gray-800 my-0.5"></div>
                      <div className="font-mono text-gray-300 text-sm flex justify-between w-full items-center">
                        <span className="text-gray-500 text-[10px] font-sans uppercase font-bold tracking-wider">Safe</span>
                        <span>{formatCurrency((u.vault || 0))}$</span>
                      </div>
                    </div>
                  </td>

                  {/* P5: Quick Actions (Guarded) */}
                  <td className="py-4 px-6 text-center">
                     <div className="flex justify-center gap-2">
                      {isSelf || isProtectedAdmin ? (
                         <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest"><Lock size={12} className="inline mr-1" /> Protégé</span>
                      ) : (
                        <>
                          {u.status !== 'approved' && (
                            <button 
                              onClick={() => updateUser(u.id, { status: "approved", suspensionEndsAt: undefined })} 
                              disabled={actionLoading === u.id + "status"}
                              className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                              title="Débloquer / Approuver"
                            >
                              {actionLoading === u.id + "status" ? <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/> : <Unlock size={14} />}
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button 
                              onClick={() => updateUser(u.id, { status: "suspended" })} 
                              disabled={actionLoading === u.id + "status"}
                              className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                              title="Suspendre Temporairement"
                            >
                              {actionLoading === u.id + "status" ? <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"/> : <ShieldAlert size={14} />}
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button 
                              onClick={() => updateUser(u.id, { status: "banned" })} 
                              disabled={actionLoading === u.id + "status"}
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                              title="Bannir Définitivement"
                            >
                              {actionLoading === u.id + "status" ? <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/> : <Gavel size={14} />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* P6: Panel / Delete */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(u)}
                        disabled={actionLoading?.startsWith(u.id)}
                        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-lg transition-all text-xs font-bold flex items-center gap-2 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50"
                      >
                         <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" /> Paramétrer
                      </button>
                      
                      {(!isProtectedAdmin && !isSelf) && (
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={actionLoading?.startsWith(u.id)}
                          className="w-9 h-9 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 rounded-lg transition-all disabled:opacity-50"
                          title="Effacer Entité"
                        >
                           <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Modal (Command Center Style) */}
      {editingUser ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-gray-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] ring-1 ring-white/10">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 via-[#09090b] to-[#09090b] flex-shrink-0">
              <div className="flex items-center gap-5">
                <div className="relative">
                   {editingUser.photoURL ? (
                      <img src={editingUser.photoURL} alt={editingUser.username} className="w-16 h-16 rounded-xl border border-gray-700 shadow-xl" />
                   ) : (
                      <div className="w-16 h-16 bg-gray-800 text-white rounded-xl flex items-center justify-center uppercase font-black text-2xl shadow-xl border border-gray-700">
                        {editingUser.username.substring(0, 2)}
                      </div>
                   )}
                   {editingUser.lastOnline && (Date.now() - editingUser.lastOnline < 5 * 60 * 1000) && (
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-[#09090b] rounded-full shadow-[0_0_8px_#10b981]"></div>
                   )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      {editingUser.username}
                    </h2>
                    {user?.id === editingUser.id && (
                      <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                        Votre Compte
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 items-center font-mono text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Cpu size={12} className="text-indigo-500"/> {editingUser.email || "NO-EMAIL"}</span>
                    <span>|</span>
                    <span title={editingUser.id} className="text-gray-600">ID: {editingUser.id}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-white bg-gray-900 hover:bg-gray-800 p-3 rounded-xl transition-all border border-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
               {/* Side Nav */}
               <div className="md:w-64 border-r border-gray-800 bg-[#0c0c0e] flex flex-row md:flex-col p-4 gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                 <NavButton active={editTab === "general"} onClick={() => setEditTab("general")} icon={<Settings size={18}/>} label="Accréditations" color="text-indigo-400" bg="bg-indigo-500/10" />
                 <NavButton active={editTab === "finances"} onClick={() => setEditTab("finances")} icon={<DollarSign size={18}/>} label="Ressources" color="text-emerald-400" bg="bg-emerald-500/10" />
                 <NavButton active={editTab === "permissions"} onClick={() => setEditTab("permissions")} icon={<ShieldAlert size={18}/>} label="Restrictions" color="text-rose-400" bg="bg-rose-500/10" />
                 <NavButton active={editTab === "history"} onClick={() => setEditTab("history")} icon={<History size={18}/>} label="Journaux (Logs)" color="text-purple-400" bg="bg-purple-500/10" badge={recentBets.filter(b => b.userId === editingUser.id).length.toString()} />
               </div>

               {/* Editing Body */}
               <div className="flex-1 overflow-y-auto bg-[#09090b] p-6 lg:p-10 custom-scrollbar relative">
                 <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full"></div>
                 
                 <form id="edit-user-form" onSubmit={handleSaveEdit} className="relative z-10 max-w-3xl mx-auto">
                   
                   {editTab === "general" && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <FormSection title="Classification & Accès Serveur" icon={<Shield className="text-indigo-400" />}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormSelect 
                             label="Niveau d'Administration" 
                             value={editForm.role || "user"}
                             onChange={(val: any) => setEditForm({...editForm, role: val as "admin"|"user"})}
                             disabled={["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(editingUser.email || "") || user?.id === editingUser.id}
                             options={[
                               {value: "user", label: "Utilisateur Standard"},
                               {value: "admin", label: "Agent Nexus (Admin)"}
                             ]}
                           />
                           
                           <FormSelect 
                             label="Statut Opérationnel"
                             value={editForm.status || "pending"}
                             onChange={(val: any) => setEditForm({...editForm, status: val as any})}
                             disabled={["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(editingUser.email || "") || user?.id === editingUser.id}
                             options={[
                               {value: "approved", label: "✅ Signal Clair (Approuvé)"},
                               {value: "pending", label: "⏳ En attente de contrôle..."},
                               {value: "suspended", label: "⚠️ Isolation Temporaire"},
                               {value: "banned", label: "❌ Radiation du Réseau (Ban)"}
                             ]}
                           />
                           
                           {editForm.status === "suspended" && !(["lafrancaise.desjeux@outlook.fr", "romeo.brawlstars59@gmail.com", "mimizerzer27@gmail.com"].includes(editingUser.email || "")) && user?.id !== editingUser.id && (
                             <div className="md:col-span-2 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                               <label className="text-sm font-bold text-amber-500 flex items-center gap-2">
                                 <AlertTriangle size={16} /> Durée d'isolation (Heures)
                               </label>
                               <input 
                                 type="number" min="1" step="1"
                                 placeholder="Ex: 24 (Laisser vide pour permanent)"
                                 value={suspensionHours} 
                                 onChange={e => setSuspensionHours(e.target.value !== "" ? Number(e.target.value) : "")}
                                 className="bg-black text-amber-500 font-mono text-lg p-3 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none placeholder:text-amber-500/30 w-full max-w-sm"
                               />
                               <p className="text-xs text-amber-500/70">
                                 {suspensionHours ? `Reprise d'activité prévue après ${suspensionHours}h de quarantaine.` : "Quarantaine à durée indéterminée (intervention manuelle requise)."}
                               </p>
                             </div>
                           )}
                           
                           <div className="md:col-span-2">
                             <FormSelect
                               label="Échelon Social (Rank Override)"
                               value={editForm.rank || "None"}
                               onChange={(val: any) => setEditForm({...editForm, rank: val as UserRank})}
                               options={[
                                 {value: "None", label: "Civile (Aucun)"},
                                 {value: "Bronze", label: "Niveau Bronze"},
                                 {value: "Silver", label: "Niveau Argent"},
                                 {value: "Gold", label: "Niveau Or"},
                                 {value: "Platinum", label: "Niveau Platine"},
                                 {value: "Diamond", label: "Niveau Diamant 💎"}
                               ]}
                             />
                           </div>
                         </div>
                       </FormSection>
                     </div>
                   )}

                   {editTab === "finances" && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       <FormSection title="Allocation des Ressources" icon={<Database className="text-emerald-400" />}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Opérations Courantes (Liquide)</label>
                             <div className="relative group">
                               <input 
                                 type="number" step="0.01" 
                                 value={editForm.balance ?? ''} 
                                 onChange={e => setEditForm({...editForm, balance: Number(e.target.value)})}
                                 className="bg-[#0c0c0e] text-emerald-400 font-mono text-2xl p-4 pl-4 rounded-xl border border-gray-800 focus:border-emerald-500/50 outline-none w-full transition-all group-hover:border-gray-700"
                               />
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Réserve Cryptée (Safe)</label>
                             <div className="relative group">
                               <input 
                                 type="number" step="0.01" 
                                 value={editForm.vault ?? ''} 
                                 onChange={e => setEditForm({...editForm, vault: Number(e.target.value)})}
                                 className="bg-[#0c0c0e] text-gray-200 font-mono text-2xl p-4 pl-4 rounded-xl border border-gray-800 focus:border-gray-500 outline-none w-full transition-all group-hover:border-gray-700"
                               />
                             </div>
                           </div>
                         </div>
                       </FormSection>
                       
                       <FormSection title="Falsification Statistique" icon={<TrendingUp className="text-purple-400" />}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/30 p-6 rounded-2xl border border-gray-800/80 border-dashed">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 tracking-wider">Volume Parié Total Fictif</label>
                              <input 
                                type="number" step="0.01" 
                                value={editForm.totalWagered ?? ''} 
                                onChange={e => setEditForm({...editForm, totalWagered: Number(e.target.value)})}
                                className="bg-black text-gray-300 font-mono p-3 rounded-lg border border-gray-800 outline-none w-full focus:border-purple-500/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-500 tracking-wider">Gains Totaux Fictifs</label>
                              <input 
                                type="number" step="0.01" 
                                value={editForm.totalWon ?? ''} 
                                onChange={e => setEditForm({...editForm, totalWon: Number(e.target.value)})}
                                className="bg-black text-gray-300 font-mono p-3 rounded-lg border border-gray-800 outline-none w-full focus:border-purple-500/50"
                              />
                            </div>
                         </div>
                       </FormSection>
                     </div>
                   )}

                   {editTab === "permissions" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                       <FormSection title="Restrictions Ludiques" icon={<Settings className="text-rose-400" />}>
                         <p className="text-sm text-gray-500 mb-6">Bloquez l'accès aux modules spécifiés (Rouge = Verrouillé).</p>
                         
                         <div className="mb-8">
                           <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Moteur Puits - Classiques</h4>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {[
                               "crash", "dice", "hilo", "keno", "limbo", 
                               "mines", "plinko", "roulette", "slide", "wheel"
                             ].map(gameId => {
                               const isBlocked = !!editForm.permissions?.blockedGames?.[gameId];
                               return (
                               <label key={gameId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isBlocked ? 'bg-rose-500/5 border-rose-500/30 text-rose-300' : 'bg-[#0c0c0e] border-gray-800 hover:border-gray-600 text-gray-300'}`}>
                                 <input 
                                   type="checkbox" 
                                   className="sr-only"
                                   checked={!isBlocked}
                                   onChange={e => {
                                     const newBlocked = { ...(editForm.permissions?.blockedGames || {}) };
                                     if (e.target.checked) delete newBlocked[gameId];
                                     else newBlocked[gameId] = true;
                                     setEditForm({...editForm, permissions: { ...(editForm.permissions||{}), blockedGames: newBlocked }});
                                   }}
                                 />
                                 <span className="w-4 h-4 rounded-[4px] border border-gray-600 flex items-center justify-center shrink-0" style={{backgroundColor: !isBlocked ? '#10b981' : 'transparent', borderColor: !isBlocked ? '#10b981' : ''}}>
                                    {!isBlocked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                 </span>
                                 <span className="text-sm font-medium capitalize truncate">{gameId}</span>
                               </label>
                             )})}
                           </div>
                         </div>

                         <div>
                           <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Cartes & Divers</h4>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {[
                               "baccarat", "blackjack", "video-poker"
                             ].map(gameId => {
                               const isBlocked = !!editForm.permissions?.blockedGames?.[gameId];
                               return (
                               <label key={gameId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isBlocked ? 'bg-rose-500/5 border-rose-500/30 text-rose-300' : 'bg-[#0c0c0e] border-gray-800 hover:border-gray-600 text-gray-300'}`}>
                                 <input 
                                   type="checkbox" 
                                   className="sr-only"
                                   checked={!isBlocked}
                                   onChange={e => {
                                     const newBlocked = { ...(editForm.permissions?.blockedGames || {}) };
                                     if (e.target.checked) delete newBlocked[gameId];
                                     else newBlocked[gameId] = true;
                                     setEditForm({...editForm, permissions: { ...(editForm.permissions||{}), blockedGames: newBlocked }});
                                   }}
                                 />
                                 <span className="w-4 h-4 rounded-[4px] border border-gray-600 flex items-center justify-center shrink-0" style={{backgroundColor: !isBlocked ? '#10b981' : 'transparent', borderColor: !isBlocked ? '#10b981' : ''}}>
                                    {!isBlocked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                 </span>
                                 <span className="text-sm font-medium capitalize truncate">{gameId.replace('-', ' ')}</span>
                               </label>
                             )})}
                           </div>
                         </div>
                       </FormSection>
                     </div>
                   )}

                   {editTab === "history" && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                       <FormSection title="Audit des Transactions" icon={<History className="text-gray-400"/>}>
                         <div className="overflow-hidden border border-gray-800 rounded-xl bg-black/50">
                           <table className="w-full text-left text-sm whitespace-nowrap">
                             <thead className="bg-gray-900/50 text-gray-500 font-mono text-[10px] uppercase border-b border-gray-800">
                               <tr>
                                 <th className="p-4">Heure (SYS)</th>
                                 <th className="p-4">Module</th>
                                 <th className="p-4">Risque</th>
                                 <th className="p-4">Quotient</th>
                                 <th className="p-4 text-right">Delta ($)</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-800/50">
                               {recentBets.filter(b => b.userId === editingUser.id).length === 0 ? (
                                 <tr>
                                   <td colSpan={5} className="p-10 text-center text-gray-600 font-mono">Aucune trace numérique récente.</td>
                                 </tr>
                               ) : recentBets.filter(b => b.userId === editingUser.id).map(bet => {
                                 const profit = bet.payout - bet.betAmount;
                                 const isWin = profit > 0;
                                 return (
                                   <tr key={bet.id} className="hover:bg-white/[0.02]">
                                     <td className="p-4 text-gray-500 font-mono text-xs">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                     <td className="p-4 font-bold text-gray-300 capitalize text-xs">{bet.game}</td>
                                     <td className="p-4 text-gray-400 font-mono text-xs">{formatCurrency(bet.betAmount)}$</td>
                                     <td className="p-4 text-gray-300 font-mono text-xs">{bet.multiplier.toFixed(2)}x</td>
                                     <td className={`p-4 font-mono font-bold text-right text-xs ${isWin ? 'text-emerald-400' : 'text-gray-500'}`}>
                                       {isWin ? '+' : ''}{formatCurrency(profit)}$
                                     </td>
                                   </tr>
                                 )
                               })}
                             </tbody>
                           </table>
                         </div>
                       </FormSection>
                     </div>
                   )}
                 </form>
               </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800 bg-[#09090b] flex justify-between items-center flex-shrink-0">
               <div className="text-xs font-mono text-gray-600 flex items-center gap-2">
                  Validation des modifications irréversible.
               </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-transparent text-gray-400 font-bold hover:text-white rounded-xl transition-colors border border-transparent hover:border-gray-800 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="edit-user-form"
                  disabled={editLoading}
                  className="px-8 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? (
                     <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Écriture...
                     </>
                  ) : (
                     <>
                       <Save size={18} /> Appliquer (SYS.UPDATE)
                     </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
}


// --- Sub components for clean code --- //

function StatCard({ title, icon, value, sub, color, border }: any) {
  return (
    <div className={`bg-black/40 ${color} p-6 rounded-3xl border ${border} flex flex-col gap-3 relative overflow-hidden backdrop-blur-md`}>
      <div className="flex justify-between items-center z-10 opacity-70">
        {icon}
      </div>
      <div className="z-10 mt-2">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-bold font-mono tracking-tight text-white mb-2">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, color, bg, badge }: any) {
  return (
    <button 
      onClick={onClick} 
      type="button"
      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all w-full text-left
        ${active ? `bg-white/5 text-white shadow-sm ring-1 ring-white/10` : `text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]`}`}
    >
      <div className={`p-1.5 rounded-lg ${active ? bg : 'bg-transparent'} ${active ? color : 'text-gray-500'}`}>
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function FormSection({ title, icon, children }: any) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function FormSelect({ label, value, onChange, disabled, options }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-gray-500 tracking-wider uppercase">{label}</label>
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="bg-[#0c0c0e] text-white p-3.5 rounded-xl border border-gray-800 focus:border-indigo-500/50 outline-none w-full appearance-none disabled:opacity-50 transition-all cursor-pointer hover:border-gray-700"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
