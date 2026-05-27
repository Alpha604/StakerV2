import React, { useState, useEffect } from "react";
import { Trophy, X, Medal, Crown, Star } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { CustomUser } from "../context/UserContext";
import { RankBadge } from "./RankBadge";

export function Leaderboard({ onClose, isPage = false }: { onClose: () => void; isPage?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<CustomUser[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("balance", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => doc.data() as CustomUser);
        setUsers(fetchedUsers);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className={cn(
      isPage ? "w-full max-w-5xl mx-auto flex flex-col h-full min-h-[500px] p-4 md:p-8" : "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    )}>
      <div className={cn(
        "bg-[#0f212e] border border-[#2f4553] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative",
        isPage ? "w-full flex-1" : "w-full max-w-3xl max-h-[85vh]"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-[#2f4553] flex items-center justify-between bg-gradient-to-r from-[#1a2c38] to-[#0f212e] sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Le Panthéon
              </h2>
              <p className="text-[11px] text-[#8b9ba5] uppercase tracking-widest font-bold">
                Les légendes classées par fortune
              </p>
            </div>
          </div>
          {!isPage && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-[#8b9ba5] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-2 sm:p-6 overflow-y-auto flex-1 custom-scrollbar relative">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 text-emerald-500">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
              <p className="text-sm font-bold text-[#8b9ba5] animate-pulse">Chargement des légendes...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative z-10 p-2">
              {users.map((u, i) => {
                const isTop1 = i === 0;
                const isTop2 = i === 1;
                const isTop3 = i === 2;

                return (
                  <div
                    key={u.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl p-3 md:p-4 transition-all group",
                      isTop1 ? "bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]" :
                      isTop2 ? "bg-gradient-to-r from-gray-300/10 to-transparent border border-gray-400/30 shadow-[0_4px_15px_rgba(209,213,219,0.05)]" :
                      isTop3 ? "bg-gradient-to-r from-amber-700/10 to-transparent border border-amber-700/30 shadow-[0_4px_15px_rgba(180,83,9,0.05)]" :
                      "bg-[#1a2c38] border border-transparent hover:border-[#2f4553]"
                    )}
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className={cn(
                        "w-8 md:w-10 h-8 md:h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-sm md:text-base",
                        isTop1 ? "bg-amber-500 text-[#0c0c0e] shadow-[0_0_15px_rgba(245,158,11,0.5)]" :
                        isTop2 ? "bg-gray-300 text-[#0c0c0e] shadow-[0_0_10px_rgba(209,213,219,0.5)]" :
                        isTop3 ? "bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.5)]" :
                        "bg-[#0f212e] text-[#8b9ba5] border border-[#2f4553]"
                      )}>
                        {isTop1 ? <Crown size={18} /> : 
                         isTop2 ? <Medal size={18} /> : 
                         isTop3 ? <Medal size={18} /> : 
                         `#${i + 1}`}
                      </div>
                      
                      <div className={cn(
                        "w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xl font-bold border-2",
                        isTop1 ? "border-amber-500 bg-amber-500/10 text-amber-500" :
                        isTop2 ? "border-gray-400 bg-gray-400/10 text-gray-300" :
                        isTop3 ? "border-amber-700 bg-amber-700/10 text-amber-600" :
                        "border-[#2f4553] bg-blue-500/10 text-blue-500"
                      )}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username?.substring(0, 2).toUpperCase() || "U"
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold md:text-lg truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px]",
                            isTop1 ? "text-amber-500" : "text-white"
                          )}>
                            {u.username || "Anonyme"}
                          </span>
                          <div className="hidden sm:block">
                             <RankBadge rank={u.rank} className="h-6 object-contain" />
                          </div>
                        </div>
                        <span className="text-[11px] md:text-xs text-[#8b9ba5] font-mono tracking-tight flex items-center gap-1">
                          Wager: <span className="text-gray-300">${formatCurrency((u.totalWagered || 0))}</span>
                        </span>
                        {/* Mobile rank badge */}
                        <div className="sm:hidden block mt-0.5">
                           <RankBadge rank={u.rank} className="h-4 object-contain" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span className={cn(
                        "text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5",
                        isTop1 ? "text-amber-500/70" : "text-[#8b9ba5]"
                      )}>
                        Capital
                      </span>
                      <div className={cn(
                        "font-mono font-black text-base md:text-xl tracking-tighter drop-shadow-md",
                        isTop1 ? "text-amber-400" : "text-emerald-400"
                      )}>
                        ${formatCurrency(u.balance || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {users.length === 0 && !loading && (
                <div className="text-center py-20 text-[#8b9ba5] font-bold">
                  Aucun joueur n'est classé pour le moment.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
