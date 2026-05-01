import React, { useState, useEffect } from "react";
import { getBinData, putBinData, BinUser, BinData } from "../lib/jsonbin";
import { useUser } from "../context/UserContext";

export function AdminPanel() {
  const { user } = useUser();
  const [users, setUsers] = useState<BinUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    
    // Poll for live updates every 3 seconds
    const interval = setInterval(() => {
      getBinData().then(data => {
        setUsers(data.users || []);
      }).catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getBinData();
    setUsers(data.users || []);
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

  if (user?.role !== "admin" || user?.username !== "AdminFDJS") {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="bg-[#0f212e] p-8 rounded-lg text-center border border-red-500/20">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Accès Refusé</h2>
          <p className="text-[#8b9ba5]">Vous n'avez pas les droits d'administration. Seul <strong className="text-white">AdminFDJS</strong> peut accéder à ce panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-white">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Panel d'Administration (FDJS)</h1>
        <button onClick={fetchUsers} className="bg-[#2f4553] text-white px-4 py-2 rounded font-bold hover:bg-[#3d5a6c]">
          Rafraîchir
        </button>
      </div>

      <div className="bg-[#0f212e] rounded-lg border border-[#2f4553] overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-[#2f4553]/50 text-[#8b9ba5] text-sm hidden md:table-row">
              <th className="p-4 font-bold">Utilisateur</th>
              <th className="p-4 font-bold">Statut</th>
              <th className="p-4 font-bold">Rôle</th>
              <th className="p-4 font-bold">Solde</th>
              <th className="p-4 font-bold">Actions de Modération</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#8b9ba5]">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#2f4553] border-t-white rounded-full animate-spin"></div>
                    <span>Chargement des données en temps réel...</span>
                  </div>
                </td>
              </tr>
            ) : users.map(u => {
              const isOnline = u.lastOnline && (Date.now() - u.lastOnline < 5 * 60 * 1000);
              return (
              <tr key={u.username} className="border-t border-[#2f4553] hover:bg-[#2f4553]/20 flex flex-col md:table-row relative">
                <td className="p-4 font-bold flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#1bc86a]' : 'bg-[#8b9ba5]'}`} title={isOnline ? 'En ligne' : 'Hors ligne'} />
                  {u.username}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                    ${u.status === 'approved' ? 'bg-[#1bc86a]/20 text-[#1bc86a]' : 
                      u.status === 'suspended' ? 'bg-[#f6c722]/20 text-[#f6c722]' :
                      u.status === 'banned' ? 'bg-red-500/20 text-red-500' :
                      'bg-gray-500/20 text-gray-400'}`}>
                    {u.status || 'pending'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-[#1bc86a]">{u.balance.toFixed(2)}</span>
                    <button 
                      onClick={() => {
                        const amount = prompt(`Nouveau solde pour ${u.username}?`, u.balance.toString());
                        if (amount && !isNaN(Number(amount))) updateUser(u.username, { balance: Number(amount) });
                      }}
                      disabled={actionLoading?.startsWith(u.username)}
                      className="bg-[#2f4553] hover:bg-[#3d5a6c] px-2 py-1 rounded text-xs disabled:opacity-50"
                    >
                      Modifier
                    </button>
                  </div>
                </td>
                <td className="p-4 flex gap-2 flex-wrap">
                  {u.status !== 'approved' && (
                    <button 
                      onClick={() => updateUser(u.username, { status: "approved" })} 
                      disabled={actionLoading === u.username + "status"}
                      className="bg-[#1bc86a] text-black px-3 py-1 rounded text-xs font-bold hover:bg-opacity-80 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>} Approuver
                    </button>
                  )}
                  {u.status !== 'suspended' && u.username !== "AdminFDJS" && (
                    <button 
                      onClick={() => updateUser(u.username, { status: "suspended" })} 
                      disabled={actionLoading === u.username + "status"}
                      className="bg-[#f6c722] text-black px-3 py-1 rounded text-xs font-bold hover:bg-opacity-80 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>} Suspendre
                    </button>
                  )}
                  {u.status !== 'banned' && u.username !== "AdminFDJS" && (
                    <button 
                      onClick={() => updateUser(u.username, { status: "banned" })} 
                      disabled={actionLoading === u.username + "status"}
                      className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-opacity-80 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === u.username + "status" && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>} Bannir
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
