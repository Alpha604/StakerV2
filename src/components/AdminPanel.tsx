import React, { useState, useEffect } from "react";
import { getBinData, putBinData, BinUser, BinData } from "../lib/jsonbin";
import { useUser } from "../context/UserContext";
import { Search, Users, Activity, DollarSign, TrendingUp, Trash2, Key, Shield, ShieldAlert, RefreshCw, AlertTriangle, X, Edit3, Save } from "lucide-react";
import { cn } from "../lib/utils";

export function AdminPanel() {
  const { user } = useUser();
  const [users, setUsers] = useState<BinUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalBetsCount, setGlobalBetsCount] = useState(0);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<BinUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<BinUser>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [suspensionHours, setSuspensionHours] = useState<number | "">("");

  useEffect(() => {
    fetchUsers();
    
    // Poll for live updates every 3 seconds
    const interval = setInterval(() => {
      getBinData().then(data => {
        setUsers(data.users || []);
      }).catch(() => {});
    }, 3000);

    const betsInterval = setInterval(() => {
       try {
         const bets = localStorage.getItem("stake_global_bets_cache");
         if (bets) setGlobalBetsCount(JSON.parse(bets).length);
       } catch(e) {}
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(betsInterval);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getBinData();
    setUsers(data.users || []);
    try {
      const bets = localStorage.getItem("stake_global_bets_cache");
      if (bets) setGlobalBetsCount(JSON.parse(bets).length);
    } catch(e) {}
    setLoading(false);
  };

  const updateUser = async (username: string, updates: Partial<BinUser>) => {
    setActionLoading(username + Object.keys(updates)[0]);
    const data = await getBinData();
    const index = data.users.findIndex(u => u.username === username);
    if (index >= 0) {
      data.users[index] = { ...data.users[index], ...updates };
      await putBinData(data);
      setUsers(data.users);
    }
    setActionLoading(null);
  };

  const deleteUser = async (username: string) => {
    if (username === "AdminFDJS") return alert("Impossible de supprimer le super administrateur.");
    if (!confirm(`Etes-vous sûr de vouloir supprimer définitivement ${username} ?`)) return;
    
    setActionLoading(username + "delete");
    const data = await getBinData();
    data.users = data.users.filter(u => u.username !== username);
    await putBinData(data);
    setUsers(data.users);
    setActionLoading(null);
  };

  const clearGlobalBets = () => {
    if (!confirm("Etes-vous sûr de vouloir purger l'historique global des paris ?")) return;
    localStorage.removeItem("stake_global_bets_cache");
    setGlobalBetsCount(0);
    alert("Historique des paris purgé.");
  };

  const handleEditClick = (u: BinUser) => {
    setEditingUser(u);
    setEditForm({
      balance: u.balance,
      vault: u.vault || 0,
      totalWagered: u.totalWagered || 0,
      totalWon: u.totalWon || 0,
      role: u.role || 'user',
      status: u.status || 'pending',
      password: u.password,
    });
    setSuspensionHours("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditLoading(true);
    await new Promise(r => setTimeout(r, 800)); // fake loader for UX

    const data = await getBinData();
    const index = data.users.findIndex(u => u.username === editingUser.username);
    
    if (index >= 0) {
      const finalUpdates: Partial<BinUser> = { ...editForm };
      
      if (finalUpdates.status === 'suspended' && suspensionHours !== "") {
        finalUpdates.suspensionEndsAt = Date.now() + Number(suspensionHours) * 3600 * 1000;
      } else if (finalUpdates.status !== 'suspended') {
        finalUpdates.suspensionEndsAt = undefined;
      }
      
      data.users[index] = { ...data.users[index], ...finalUpdates };
      await putBinData(data);
      setUsers(data.users);
    }
    
    setEditLoading(false);
    setEditingUser(null);
  };

  if (user?.role !== "admin" || user?.username !== "AdminFDJS") {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-[#0f212e] p-8 rounded-lg text-center border border-red-500/20 max-w-md w-full">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-2">Accès Restreint</h2>
          <p className="text-[#8b9ba5]">Vous n'avez pas les droits d'administration. Seul <strong className="text-white">AdminFDJS</strong> peut accéder à ce panel FDJS de haut niveau.</p>
        </div>
      </div>
    );
  }

  const onlineUsers = users.filter(u => u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000)).length;
  const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalWagered = users.reduce((acc, u) => acc + (u.totalWagered || 0), 0);
  const totalProfit = users.reduce((acc, u) => acc + (u.totalWon || 0), 0);

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-white animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-purple-500" />
            Centre de Commandement FDJS
          </h1>
          <p className="text-[#8b9ba5] text-sm mt-1">Gérez les utilisateurs, surveillez l'activité et purgez les données.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={clearGlobalBets}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded font-bold hover:bg-red-500/20 transition-colors"
          >
            <AlertTriangle size={16} />
            Purger Paris
          </button>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-[#2f4553] text-white px-4 py-2 rounded font-bold hover:bg-[#3d5a6c] transition-colors">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f212e] p-6 rounded-xl border border-[#2f4553] flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[#8b9ba5] text-sm font-bold uppercase">Utilisateurs</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
        </div>
        
        <div className="bg-[#0f212e] p-6 rounded-xl border border-[#2f4553] flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[#8b9ba5] text-sm font-bold uppercase">En Ligne</p>
            <p className="text-2xl font-bold">{onlineUsers}</p>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
        </div>

        <div className="bg-[#0f212e] p-6 rounded-xl border border-[#2f4553] flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[#8b9ba5] text-sm font-bold uppercase">Économie Globale</p>
            <p className="text-xl font-bold font-mono text-amber-500">{totalBalance.toFixed(2)}$</p>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
        </div>

        <div className="bg-[#0f212e] p-6 rounded-xl border border-[#2f4553] flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[#8b9ba5] text-sm font-bold uppercase">Paris Enregistrés</p>
            <p className="text-2xl font-bold text-purple-500">{globalBetsCount}</p>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
        </div>
      </div>

      <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2f4553] bg-[#2f4553]/20 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9ba5]" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f212e] border border-[#2f4553] rounded-lg py-2 pl-10 pr-4 text-white focus:border-[#557086] outline-none transition-colors text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-[#2f4553]/30 text-[#8b9ba5] text-xs uppercase tracking-wider hidden md:table-row">
                <th className="p-4 font-bold">Utilisateur</th>
                <th className="p-4 font-bold">Statut</th>
                <th className="p-4 font-bold">Rôle</th>
                <th className="p-4 font-bold">Finances</th>
                <th className="p-4 font-bold">Avancé</th>
                <th className="p-4 font-bold">Modération</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#8b9ba5]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#2f4553] border-t-white rounded-full animate-spin"></div>
                      <span>Chargement des données en temps réel...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#8b9ba5]">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const isOnline = u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000);
                return (
                <tr key={u.username} className="border-t border-[#2f4553] hover:bg-[#2f4553]/10 flex flex-col md:table-row relative group transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-[#2f4553] rounded-full flex items-center justify-center uppercase font-bold text-sm">
                          {u.username.substring(0, 2)}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f212e] ${isOnline ? 'bg-[#1bc86a]' : 'bg-[#8b9ba5]'}`} title={isOnline ? 'En ligne' : 'Hors ligne'} />
                      </div>
                      <div>
                        <div className="font-bold">{u.username}</div>
                        <div className="text-xs text-[#8b9ba5] font-mono" title="Dernière connexion">
                          {u.lastOnline ? new Date(u.lastOnline).toLocaleTimeString() : 'Jamais'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                      ${u.status === 'approved' ? 'bg-[#1bc86a]/10 text-[#1bc86a] border border-[#1bc86a]/20' : 
                        u.status === 'suspended' ? 'bg-[#f6c722]/10 text-[#f6c722] border border-[#f6c722]/20' :
                        u.status === 'banned' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      {u.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                         {u.role || 'user'}
                       </span>
                       {u.username !== "AdminFDJS" && (
                         <button
                           onClick={() => updateUser(u.username, { role: u.role === "admin" ? "user" : "admin" })}
                           disabled={actionLoading?.startsWith(u.username)}
                           className="text-[#8b9ba5] hover:text-white p-1 rounded hover:bg-[#2f4553] transition-colors"
                           title={u.role === "admin" ? "Rétrograder" : "Promouvoir"}
                         >
                           <Shield size={14} />
                         </button>
                       )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-[#1bc86a] text-sm font-bold">{u.balance.toFixed(2)}$</div>
                      <div className="text-xs text-[#8b9ba5]">
                        Coffre: <span className="font-mono text-white">{(u.vault || 0).toFixed(2)}$</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(u)}
                        disabled={actionLoading?.startsWith(u.username)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#2f4553] text-white hover:bg-[#3d5a6c] rounded transition-colors text-xs font-bold"
                      >
                         <Edit3 size={14} /> Éditer
                      </button>
                      {u.username !== "AdminFDJS" && (
                        <button
                          onClick={() => deleteUser(u.username)}
                          disabled={actionLoading?.startsWith(u.username)}
                          className="px-2 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded transition-colors"
                          title="Supprimer Utilisateur"
                        >
                           <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex gap-1.5 flex-wrap">
                      {u.status !== 'approved' && (
                        <button 
                          onClick={() => updateUser(u.username, { status: "approved", suspensionEndsAt: undefined })} 
                          disabled={actionLoading === u.username + "status"}
                          className="bg-[#1bc86a]/10 text-[#1bc86a] hover:bg-[#1bc86a]/20 border border-[#1bc86a]/20 px-2 py-1 rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                          {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>} Approuver
                        </button>
                      )}
                      {u.status !== 'suspended' && u.username !== "AdminFDJS" && (
                        <button 
                          onClick={() => updateUser(u.username, { status: "suspended" })} 
                          disabled={actionLoading === u.username + "status"}
                          className="bg-[#f6c722]/10 text-[#f6c722] hover:bg-[#f6c722]/20 border border-[#f6c722]/20 px-2 py-1 rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                          {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>} Suspendre
                        </button>
                      )}
                      {u.status !== 'banned' && u.username !== "AdminFDJS" && (
                        <button 
                          onClick={() => updateUser(u.username, { status: "banned" })} 
                          disabled={actionLoading === u.username + "status"}
                          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-2 py-1 rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                          {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>} Bannir
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f212e] border border-[#2f4553] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#2f4553] flex items-center justify-between bg-[#2f4553]/20">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="text-blue-500" />
                Editer: {editingUser.username}
              </h2>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-[#8b9ba5] hover:text-white p-1 rounded hover:bg-[#2f4553] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Solde Courant</label>
                    <input 
                      type="number" step="0.01" 
                      value={editForm.balance ?? ''} 
                      onChange={e => setEditForm({...editForm, balance: Number(e.target.value)})}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Coffre</label>
                    <input 
                      type="number" step="0.01" 
                      value={editForm.vault ?? ''} 
                      onChange={e => setEditForm({...editForm, vault: Number(e.target.value)})}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Rôle</label>
                    <select 
                      value={editForm.role}
                      onChange={e => setEditForm({...editForm, role: e.target.value as "admin"|"user"})}
                      disabled={editingUser.username === "AdminFDJS"}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Statut</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value as "pending"|"approved"|"suspended"|"banned"})}
                      disabled={editingUser.username === "AdminFDJS"}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="approved">Approuvé</option>
                      <option value="pending">En attente</option>
                      <option value="suspended">Suspendu</option>
                      <option value="banned">Banni</option>
                    </select>
                  </div>
                </div>

                {editForm.status === "suspended" && editingUser.username !== "AdminFDJS" && (
                  <div className="flex flex-col gap-1.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-amber-500 flex items-center gap-2">
                      Durée de suspension (Heures)
                    </label>
                    <input 
                      type="number" min="1" step="1"
                      placeholder="Ex: 24 (Laisser vide pour permanent)"
                      value={suspensionHours} 
                      onChange={e => setSuspensionHours(e.target.value !== "" ? Number(e.target.value) : "")}
                      className="bg-[#0f212e] text-white p-2.5 rounded border border-[#2f4553] focus:border-amber-500 outline-none"
                    />
                    <span className="text-xs text-[#8b9ba5]">
                      Le compte sera réactivé automatiquement après ce délai.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Paris Totaux ($)</label>
                    <input 
                      type="number" step="0.01" 
                      value={editForm.totalWagered ?? ''} 
                      onChange={e => setEditForm({...editForm, totalWagered: Number(e.target.value)})}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-[#8b9ba5]">Gains Totaux ($)</label>
                    <input 
                      type="number" step="0.01" 
                      value={editForm.totalWon ?? ''} 
                      onChange={e => setEditForm({...editForm, totalWon: Number(e.target.value)})}
                      className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2f4553]">
                  <label className="text-sm font-bold text-[#8b9ba5]">Nouveau Mot de Passe (Optionnel)</label>
                  <input 
                    type="text" 
                    placeholder="Laisser vide pour ne pas changer"
                    value={editForm.password ?? ''} 
                    onChange={e => setEditForm({...editForm, password: e.target.value})}
                    className="bg-[#2f4553] text-white p-2.5 rounded border border-[#0f212e] focus:border-blue-500 outline-none"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-[#2f4553] bg-[#2f4553]/20 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={editLoading}
                className="px-4 py-2 bg-transparent text-white font-bold hover:bg-[#3d5a6c] rounded transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button 
                type="submit"
                form="edit-user-form"
                disabled={editLoading}
                className="px-6 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
              >
                {editLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18} /> Sauvegarder</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

