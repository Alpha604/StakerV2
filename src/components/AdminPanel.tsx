import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { useUser, CustomUser, UserRank } from "../context/UserContext";
import { Search, Users, Activity, DollarSign, TrendingUp, Trash2, Shield, ShieldAlert, RefreshCw, AlertTriangle, X, Edit3, Save, History, Settings, ExternalLink, Filter } from "lucide-react";
import { RankBadge } from "./RankBadge";
import { db } from "../lib/firebase";
import { collection, doc, updateDoc, deleteDoc, writeBatch, onSnapshot, query, orderBy, limit, getCountFromServer } from "firebase/firestore";

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
      // Real-time users listener
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }) as CustomUser);
        setUsers(usersData);
        setLoading(false);
      });

      // Real-time recent bets
      const betsQ = query(collection(db, "bets"), orderBy("timestamp", "desc"), limit(100));
      unsubBets = onSnapshot(betsQ, (snap) => {
        setRecentBets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Global count (fetch once and update periodically to save reads if needed)
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
    if (userToDelete.email === "lafrancaise.desjeux@outlook.fr") return alert("Impossible de supprimer le super administrateur.");
    if (!confirm(`Attention ! Supprimer ${userToDelete.username} est définitif. Confirmer ?`)) return;
    
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
    
    try {
      alert("Ce processus peut être long / impossible si > 500 documents sur FrontEnd. Veuillez utiliser Firebase Console -> Functions.");
    } catch (e) {
      console.warn(e);
    }
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
      setEditingUser(null);
    } catch(e) {
      console.warn(e);
      alert("Humm.. Erreur de sauvegarde.");
    }
    setEditLoading(false);
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-[#0f212e] p-8 rounded-lg text-center border border-red-500/20 max-w-md w-full">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-2">Accès Restreint</h2>
          <p className="text-[#8b9ba5]">Vous n'avez pas les droits d'administration.</p>
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-white animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
            <Shield className="text-purple-500" size={32} />
            God Mode
          </h1>
          <p className="text-[#8b9ba5] text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1bc86a] inline-block shadow-[0_0_8px_#1bc86a] animate-pulse"></span>
            Supervision du panel administrateur centralisée avec Live Data Streams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearGlobalBets}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold hover:bg-red-500/20 transition-all font-mono uppercase tracking-wider text-xs"
          >
            <AlertTriangle size={15} />
            Purger Paris
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#0f212e] to-[#0a171f] p-6 rounded-2xl border border-[#2f4553] flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Users size={24} />
            </div>
          </div>
          <div className="z-10 mt-2">
            <p className="text-[#8b9ba5] text-xs font-bold uppercase tracking-wider mb-1">Membres Actifs</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{users.length}</p>
              <span className="text-xs text-[#8b9ba5] font-mono">Inscrits</span>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
        </div>
        
        <div className="bg-gradient-to-br from-[#0f212e] to-[#0a171f] p-6 rounded-2xl border border-[#2f4553] flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <div className="w-12 h-12 bg-[#1bc86a]/10 rounded-xl flex items-center justify-center text-[#1bc86a] border border-[#1bc86a]/20">
              <Activity size={24} />
            </div>
          </div>
          <div className="z-10 mt-2">
            <p className="text-[#8b9ba5] text-xs font-bold uppercase tracking-wider mb-1">En Ligne Actuellement</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{onlineUsers}</p>
              <span className="text-xs text-[#8b9ba5] font-mono">Connectés</span>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#1bc86a]/5 rounded-full blur-2xl group-hover:bg-[#1bc86a]/10 transition-colors pointer-events-none"></div>
        </div>

        <div className="bg-gradient-to-br from-[#0f212e] to-[#0a171f] p-6 rounded-2xl border border-[#2f4553] flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="z-10 mt-2">
            <p className="text-[#8b9ba5] text-xs font-bold uppercase tracking-wider mb-1">Économie Globale</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold font-mono text-amber-500">{formatCurrency(totalEconomy)}$</p>
            </div>
            <p className="text-xs text-[#8b9ba5] mt-1">S:{formatCurrency(totalBalance)}$ / C:{formatCurrency(totalVault)}$</p>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
        </div>

        <div className="bg-gradient-to-br from-[#0f212e] to-[#0a171f] p-6 rounded-2xl border border-[#2f4553] flex flex-col gap-3 relative overflow-hidden group">
          <div className="flex justify-between items-center z-10">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="z-10 mt-2">
            <p className="text-[#8b9ba5] text-xs font-bold uppercase tracking-wider mb-1">Volume Historique des Paris</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white font-mono">{formatCurrency(totalWagered)}$</p>
            </div>
            <p className="text-xs text-[#8b9ba5] mt-1">{globalBetsCount.toLocaleString()} paris totaux placés</p>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
        </div>
      </div>

      <div className="bg-[#0f212e] rounded-2xl border border-[#2f4553] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-[#2f4553] bg-gradient-to-r from-[#2f4553]/20 via-transparent to-transparent flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-white font-mono flex items-center gap-2">
              <Users size={18} className="text-[#8b9ba5]" /> BASE UTILISATEURS LIVE
            </h2>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9ba5]" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher (Nom, Email)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a2c38] border border-[#2f4553] rounded-lg py-2 pl-9 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm h-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-[#1a2c38] text-[#8b9ba5] text-xs uppercase tracking-wider border-b border-[#2f4553]">
                <th className="p-4 font-bold w-1/4">Utilisateur / Profil</th>
                <th className="p-4 font-bold">Rôle & Rank</th>
                <th className="p-4 font-bold">Statut</th>
                <th className="p-4 font-bold">Portefeuille (Flux)</th>
                <th className="p-4 font-bold">Contrôle Accès</th>
                <th className="p-4 font-bold text-right" colSpan={2}>Outils Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f4553]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 border-4 border-white/10 border-t-blue-500 text-blue-500 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-[#8b9ba5]">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Aucune correspondance pour "{searchQuery}"</p>
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const isOnline = u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000);
                const isSuperAdmin = u.email === "lafrancaise.desjeux@outlook.fr";
                
                return (
                <tr key={u.id} className="hover:bg-[#1a2c38]/50 group transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {u.photoURL ? (
                           <img src={u.photoURL} alt={u.username} className="w-10 h-10 rounded-full object-cover border-2 border-[#2f4553] shadow-md group-hover:border-blue-500/50 transition-colors" />
                        ) : (
                           <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-[#2f4553] group-hover:border-blue-500/50 transition-colors rounded-full flex items-center justify-center uppercase font-bold text-sm shadow-md">
                             {u.username.substring(0, 2)}
                           </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f212e] ${isOnline ? 'bg-[#1bc86a]' : 'bg-[#8b9ba5]'}`} title={isOnline ? 'En ligne' : 'Hors ligne'} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate text-sm">{u.username}</div>
                        <div className="text-xs text-[#8b9ba5] font-mono truncate" title={u.email}>{u.email || <span className="opacity-50">Pas d'Email</span>}</div>
                        <div className="text-[10px] text-[#8b9ba5]/60 font-mono mt-0.5" title={u.id}>ID: <span className="text-[#8b9ba5]">{u.id.substring(0, 8)}</span>...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                             {u.role === 'admin' && <Shield size={10} />}
                             {u.role || 'user'}
                           </span>
                           <RankBadge rank={u.rank} className="h-5" />
                        </div>
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex items-center w-max gap-1.5
                      ${u.status === 'approved' ? 'bg-[#1bc86a]/10 text-[#1bc86a] border border-[#1bc86a]/20' : 
                        u.status === 'suspended' ? 'bg-[#f6c722]/10 text-[#f6c722] border border-[#f6c722]/20 shadow-[0_0_8px_rgba(246,199,34,0.2)]' :
                        u.status === 'banned' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      {u.status === 'approved' && <div className="w-1.5 h-1.5 rounded-full bg-[#1bc86a]"></div>}
                      {u.status === 'suspended' && <div className="w-1.5 h-1.5 rounded-full bg-[#f6c722] animate-pulse"></div>}
                      {u.status === 'banned' && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                      {u.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                      {u.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 w-full max-w-[180px]">
                      <div className="font-mono text-[#1bc86a] text-sm font-bold flex justify-between w-full">
                        <span className="opacity-70 text-[10px] font-sans mt-0.5">Solde</span>
                        <span>{formatCurrency(u.balance)}$</span>
                      </div>
                      <div className="w-full h-px bg-[#2f4553]/50 my-1"></div>
                      <div className="font-mono text-white text-sm flex items-center justify-between gap-4">
                        <span className="opacity-70 text-[10px] font-sans">Coffre</span>
                        <span>{formatCurrency((u.vault || 0))}$</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex gap-1.5 flex-wrap">
                      {u.status !== 'approved' && (
                        <button 
                          onClick={() => updateUser(u.id, { status: "approved", suspensionEndsAt: undefined })} 
                          disabled={actionLoading === u.id + "status"}
                          className="bg-[#1a2c38] hover:bg-[#1bc86a]/20 text-[#1bc86a] border border-[#1bc86a]/20 px-3 py-1.5 rounded text-[11px] font-bold disabled:opacity-50 transition-all shadow-sm flex items-center gap-1"
                        >
                          {actionLoading === u.id + "status" && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>} Approuver
                        </button>
                      )}
                      {u.status !== 'suspended' && !isSuperAdmin && (
                        <button 
                          onClick={() => updateUser(u.id, { status: "suspended" })} 
                          disabled={actionLoading === u.id + "status"}
                          className="bg-[#1a2c38] hover:bg-[#f6c722]/20 text-[#f6c722] border border-[#f6c722]/20 px-3 py-1.5 rounded text-[11px] font-bold disabled:opacity-50 transition-all shadow-sm flex items-center gap-1"
                        >
                          {actionLoading === u.id + "status" && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>} Suspendre
                        </button>
                      )}
                      {u.status !== 'banned' && !isSuperAdmin && (
                        <button 
                          onClick={() => updateUser(u.id, { status: "banned" })} 
                          disabled={actionLoading === u.id + "status"}
                          className="bg-[#1a2c38] hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded text-[11px] font-bold disabled:opacity-50 transition-all shadow-sm flex items-center gap-1"
                        >
                          {actionLoading === u.id + "status" && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>} Bannir Def.
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditClick(u)}
                        disabled={actionLoading?.startsWith(u.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all text-xs font-bold"
                      >
                         <Settings size={14} /> Gérer
                      </button>
                      {!isSuperAdmin && (
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={actionLoading?.startsWith(u.id)}
                          className="px-3 py-2 bg-[#1a2c38] text-[#8b9ba5] hover:text-red-500 hover:bg-red-500/10 border border-[#2f4553] hover:border-red-500/30 rounded-lg transition-all"
                          title="Supprimer Utilisateur"
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
        <div className="p-3 border-t border-[#2f4553] bg-[#1a2c38] text-xs text-[#8b9ba5] text-center font-mono flex items-center justify-center gap-2">
           <Activity size={12} className="text-[#1bc86a]" /> Mode Watcher: Synchronisation WebSocket Interne
        </div>
      </div>

      {/* Extreme Power Edit Modal */}
      {editingUser ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f212e] border border-[#2f4553] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2f4553] flex items-center justify-between bg-gradient-to-r from-[#2f4553]/30 via-transparent to-transparent flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                   {editingUser.photoURL ? (
                      <img src={editingUser.photoURL} alt={editingUser.username} className="w-14 h-14 rounded-full border border-gray-600 shadow-xl" />
                   ) : (
                      <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-emerald-500 text-white rounded-full flex items-center justify-center uppercase font-bold text-xl shadow-xl border-2 border-white/10">
                        {editingUser.username.substring(0, 2)}
                      </div>
                   )}
                   {editingUser.lastOnline && (Date.now() - editingUser.lastOnline < 5 * 60 * 1000) && (
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#1bc86a] border-2 border-[#0f212e] rounded-full shadow-[0_0_8px_#1bc86a]"></div>
                   )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white tracking-tight">
                    {editingUser.username}
                  </h2>
                  <div className="flex gap-2 mt-1.5 items-center font-mono text-xs">
                    <span className="text-[#8b9ba5]"><span className="text-[#2f4553]">MAILSYS: </span>{editingUser.email}</span>
                    <span className="text-[#2f4553] hidden md:inline">•</span>
                    <span className="text-[#8b9ba5] hidden md:inline" title={editingUser.id}><span className="text-[#2f4553]">UID: </span>{editingUser.id}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-[#8b9ba5] hover:text-rose-400 bg-[#1a2c38] hover:bg-[#2f4553] p-2.5 rounded-xl transition-all"
              >
                <X size={20} className="stroke-[3]" />
              </button>
            </div>

            {/* Powerful Navigation */}
            <div className="flex border-b border-[#2f4553] px-2 bg-[#0a171f] overflow-x-auto custom-scrollbar flex-shrink-0">
              <button onClick={() => setEditTab("general")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${editTab === "general" ? "border-blue-500 text-blue-500 bg-blue-500/5" : "border-transparent text-[#8b9ba5] hover:text-white hover:bg-white/5"}`}>
                <Settings size={16} /> Configuration Base
              </button>
              <button onClick={() => setEditTab("finances")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${editTab === "finances" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-[#8b9ba5] hover:text-white hover:bg-white/5"}`}>
                <DollarSign size={16} /> Économie & Soldes
              </button>
              <button onClick={() => setEditTab("permissions")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${editTab === "permissions" ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : "border-transparent text-[#8b9ba5] hover:text-white hover:bg-white/5"}`}>
                <Shield size={16} /> Blocages / Droits
              </button>
              <button onClick={() => setEditTab("history")} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${editTab === "history" ? "border-purple-500 text-purple-500 bg-purple-500/5" : "border-transparent text-[#8b9ba5] hover:text-white hover:bg-white/5"}`}>
                <History size={16} /> Live Logs Paris (<span className="text-[10px] bg-[#2f4553] px-1 rounded text-white">{recentBets.filter(b => b.userId === editingUser.id).length}</span>)
              </button>
            </div>

            {/* Editing Body */}
            <div className="overflow-y-auto flex-1 bg-[#1a242d] custom-scrollbar">
              <form id="edit-user-form" onSubmit={handleSaveEdit} className="p-6">
                
                {editTab === "general" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2f4553] pb-2 flex items-center gap-2">
                        <Users size={18} className="text-blue-500" /> Gestion des Rôles & Statut
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-[#8b9ba5]">Niveau d'Administration</label>
                          <select 
                            value={editForm.role}
                            onChange={e => setEditForm({...editForm, role: e.target.value as "admin"|"user"})}
                            disabled={editingUser.email === "lafrancaise.desjeux@outlook.fr"}
                            className="bg-[#0f212e] text-white p-3 rounded-lg border border-[#2f4553] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full appearance-none disabled:opacity-50 hover:border-[#557086] transition-all cursor-pointer"
                          >
                            <option value="user">Utilisateur Standard</option>
                            <option value="admin">Administrateur Total (Accès Panel)</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-[#8b9ba5]">Verrouillage Serveur</label>
                          <select 
                            value={editForm.status}
                            onChange={e => setEditForm({...editForm, status: e.target.value as "pending"|"approved"|"suspended"|"banned"})}
                            disabled={editingUser.email === "lafrancaise.desjeux@outlook.fr"}
                            className="bg-[#0f212e] text-white p-3 rounded-lg border border-[#2f4553] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none w-full appearance-none disabled:opacity-50 hover:border-[#557086] transition-all cursor-pointer"
                          >
                            <option value="approved">✅ Approuvé / Jeu Autorisé</option>
                            <option value="pending">⏳ En attente de Validation</option>
                            <option value="suspended">⚠️ Suspendu (Exclusion tempo)</option>
                            <option value="banned">❌ Bannissement Définitif</option>
                          </select>
                        </div>
                        
                        {editForm.status === "suspended" && editingUser.email !== "lafrancaise.desjeux@outlook.fr" && (
                          <div className="flex flex-col gap-2 md:col-span-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-in zoom-in-95 duration-200">
                            <label className="text-sm font-bold text-amber-500 flex items-center gap-2">
                              <ShieldAlert size={16} /> Durée de suspension (Heures)
                            </label>
                            <input 
                              type="number" min="1" step="1"
                              placeholder="Ex: 24 (Laisser vide pour permanent)"
                              value={suspensionHours} 
                              onChange={e => setSuspensionHours(e.target.value !== "" ? Number(e.target.value) : "")}
                              className="bg-[#0f212e] text-amber-500 font-mono text-lg p-3 rounded-lg border border-amber-500/30 focus:border-amber-500 outline-none placeholder:text-amber-500/30 w-full md:w-1/2"
                            />
                            <p className="text-xs text-amber-500/70 mt-1">
                              {suspensionHours ? `Fin prévue dans: ${suspensionHours} heure(s). L'utilisateur reprendra ses droits automatiquement.` : "Sans durée spécifiée, la suspension est manuelle (indéterminée)."}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-sm font-bold text-[#8b9ba5]">Échelon VIP Forcé</label>
                          <select 
                            value={editForm.rank || "None"}
                            onChange={e => setEditForm({...editForm, rank: e.target.value as UserRank})}
                            className="bg-[#0f212e] text-white p-3 rounded-lg border border-[#2f4553] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none w-full appearance-none hover:border-[#557086] transition-all cursor-pointer"
                          >
                            <option value="None">Pionnier (Aucun)</option>
                            <option value="Bronze">Niveau Bronze</option>
                            <option value="Silver">Niveau Argent</option>
                            <option value="Gold">Niveau Or</option>
                            <option value="Platinum">Niveau Platine</option>
                            <option value="Diamond">Niveau Diamant 💎</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "finances" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2f4553] pb-2 flex items-center gap-2">
                         <DollarSign size={18} className="text-[#1bc86a]" /> Manipulation Fiducière
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-[#8b9ba5] uppercase tracking-wider">Solde Liquide</label>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1bc86a] font-bold text-lg pointer-events-none">$</span>
                            <input 
                              type="number" step="0.01" 
                              value={editForm.balance ?? ''} 
                              onChange={e => setEditForm({...editForm, balance: Number(e.target.value)})}
                              className="bg-[#0f212e] text-[#1bc86a] font-mono text-2xl p-4 pl-10 rounded-xl border border-[#2f4553] focus:border-[#1bc86a] outline-none w-full shadow-inner transition-all group-hover:border-[#557086]"
                            />
                          </div>
                          <p className="text-xs text-[#8b9ba5]">Fonds immédiatement jouables.</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-[#8b9ba5] uppercase tracking-wider flex items-center gap-2">
                            <span>Coffre-Fort Crypté</span> <Shield size={12} className="text-blue-400" />
                          </label>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg pointer-events-none">$</span>
                            <input 
                              type="number" step="0.01" 
                              value={editForm.vault ?? ''} 
                              onChange={e => setEditForm({...editForm, vault: Number(e.target.value)})}
                              className="bg-[#0f212e] text-white font-mono text-2xl p-4 pl-10 rounded-xl border border-[#2f4553] focus:border-white outline-none w-full shadow-inner transition-all group-hover:border-[#557086]"
                            />
                          </div>
                          <p className="text-xs text-[#8b9ba5]">Fonds épargnés, non jouables.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-[#2f4553]/50">
                      <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2f4553] pb-2 flex items-center gap-2">
                         <Activity size={18} className="text-amber-500" /> Statistiques Overrides
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-[#8b9ba5]">Totaux Misés Forcés</label>
                           <input 
                             type="number" step="0.01" 
                             value={editForm.totalWagered ?? ''} 
                             onChange={e => setEditForm({...editForm, totalWagered: Number(e.target.value)})}
                             className="bg-[#0f212e] text-gray-300 font-mono p-3 rounded-lg border border-[#2f4553] outline-none w-full focus:border-amber-500"
                           />
                         </div>
                         <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-[#8b9ba5]">Totaux Gagnés Forcés</label>
                           <input 
                             type="number" step="0.01" 
                             value={editForm.totalWon ?? ''} 
                             onChange={e => setEditForm({...editForm, totalWon: Number(e.target.value)})}
                             className="bg-[#0f212e] text-gray-300 font-mono p-3 rounded-lg border border-[#2f4553] outline-none w-full focus:border-amber-500"
                           />
                         </div>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "permissions" && (
                   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                         <AlertTriangle className="text-red-500" size={18}/> Banissements de Jeux Précis
                      </h3>
                      <p className="text-sm text-[#8b9ba5] mb-6">Décochez un jeu pour empêcher ce joueur d'y jouer.</p>
                      
                      {/* Originaux / Classiques */}
                      <div className="mb-6">
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#2f4553] pb-2">Jeux Originaux Moteur</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { id: "crash", name: "Crash" },
                            { id: "dice", name: "Dice" },
                            { id: "hilo", name: "Hilo" },
                            { id: "keno", name: "Keno" },
                            { id: "limbo", name: "Limbo" },
                            { id: "mines", name: "Mines" },
                            { id: "plinko", name: "Plinko" },
                            { id: "roulette", name: "Roulette" },
                            { id: "slide", name: "Slide" },
                            { id: "wheel", name: "Wheel" }
                          ].map(game => (
                            <label key={game.id} className="flex items-center gap-3 text-sm text-white bg-[#0f212e] border border-[#2f4553] p-3 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-[#1bc86a] rounded cursor-pointer"
                                checked={!editForm.permissions?.blockedGames?.[game.id]}
                                onChange={e => {
                                  const newBlockedGames = { ...(editForm.permissions?.blockedGames || {}) };
                                  if (e.target.checked) {
                                    delete newBlockedGames[game.id];
                                  } else {
                                    newBlockedGames[game.id] = true;
                                  }
                                  setEditForm({
                                    ...editForm,
                                    permissions: { ...(editForm.permissions || {}), blockedGames: newBlockedGames }
                                  });
                                }}
                              />
                              <span className="font-medium">{game.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Cartes */}
                      <div>
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#2f4553] pb-2">Jeux de Cartes</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { id: "baccarat", name: "Baccarat" },
                            { id: "blackjack", name: "Blackjack" },
                            { id: "video-poker", name: "Video Poker" }
                          ].map(game => (
                            <label key={game.id} className="flex items-center gap-3 text-sm text-white bg-[#0f212e] border border-[#2f4553] p-3 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-[#1bc86a] rounded cursor-pointer"
                                checked={!editForm.permissions?.blockedGames?.[game.id]}
                                onChange={e => {
                                  const newBlockedGames = { ...(editForm.permissions?.blockedGames || {}) };
                                  if (e.target.checked) {
                                    delete newBlockedGames[game.id];
                                  } else {
                                    newBlockedGames[game.id] = true;
                                  }
                                  setEditForm({
                                    ...editForm,
                                    permissions: { ...(editForm.permissions || {}), blockedGames: newBlockedGames }
                                  });
                                }}
                              />
                              <span className="font-medium">{game.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editTab === "history" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center bg-[#2f4553]/20 p-4 border border-[#2f4553] rounded-xl">
                      <span className="text-[#8b9ba5] text-sm font-bold flex items-center gap-2"><History size={16}/> Logs de paris en temps réel (100 derniers du réseau)</span>
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-bold uppercase tracking-widest">{recentBets.filter(b => b.userId === editingUser.id).length} Récents</span>
                    </div>

                    <div className="bg-[#0f212e] border border-[#2f4553] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1a2c38] text-[#8b9ba5] font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Horodatage</th>
                            <th className="p-3">Game</th>
                            <th className="p-3">Investissement</th>
                            <th className="p-3">Multiplicateur</th>
                            <th className="p-3 text-right">Profit Brut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2f4553]">
                          {recentBets.filter(b => b.userId === editingUser.id).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[#8b9ba5]">Aucun pari de ce joueur dans l'historique récent global.</td>
                            </tr>
                          ) : recentBets.filter(b => b.userId === editingUser.id).map(bet => {
                            const profit = bet.payout - bet.betAmount;
                            const isWin = profit > 0;
                            return (
                              <tr key={bet.id} className="hover:bg-[#2f4553]/20">
                                <td className="p-3 text-[#8b9ba5] font-mono">{new Date(bet.timestamp).toLocaleTimeString()}</td>
                                <td className="p-3 font-bold text-white capitalize">{bet.game}</td>
                                <td className="p-3 text-[#8b9ba5] font-mono">{formatCurrency(bet.betAmount)}$</td>
                                <td className="p-3 text-white font-mono">{bet.multiplier.toFixed(2)}x</td>
                                <td className={`p-3 font-mono font-bold text-right ${isWin ? 'text-[#1bc86a]' : 'text-[#8b9ba5]'}`}>
                                  {isWin ? '+' : ''}{formatCurrency(profit)}$
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-[#2f4553] bg-[#0a171f] flex justify-between items-center flex-shrink-0">
               <div className="text-sm font-mono text-[#8b9ba5] flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Sauvegarde Immédiate Force Majeure
               </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="px-6 py-3 bg-transparent text-[#8b9ba5] font-bold hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Annuler & Quitter
                </button>
                <button 
                  type="submit"
                  form="edit-user-form"
                  disabled={editLoading}
                  className="px-8 py-3 bg-[#1bc86a] text-black font-bold text-lg rounded-lg hover:bg-[#1bc86a]/90 hover:scale-[1.02] shadow-[0_0_20px_rgba(27,200,106,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? (
                     <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                        Enregistrement Overload...
                     </>
                  ) : (
                     <>
                       <Save size={20} /> Force Save Action
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
