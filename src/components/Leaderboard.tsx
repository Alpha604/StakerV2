import React, { useState, useEffect } from "react";
import { getBinData, BinUser } from "../lib/jsonbin";
import { Trophy, X, Medal } from "lucide-react";
import { cn } from "../lib/utils";

export function Leaderboard({ onClose, isPage = false }: { onClose: () => void; isPage?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<BinUser[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getBinData();
        let binUsers = data.users || [];

        // Sort descending by balance, take up to 50
        binUsers.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        setUsers(binUsers.slice(0, 50));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className={cn(
      isPage ? "w-full max-w-4xl mx-auto flex flex-col h-full min-h-[500px]" : "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    )}>
      <div className={cn(
        "bg-bg-panel border border-border-subtle rounded-2xl shadow-2xl flex flex-col overflow-hidden",
        isPage ? "w-full flex-1" : "w-full max-w-2xl max-h-[85vh]"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-panel/50 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">
                Classement
              </h2>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Tops Joueurs par Solde
              </p>
            </div>
          </div>
          {!isPage && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex justify-center text-accent">
              <div className="animate-spin text-4xl">🏆</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div
                  key={u.username}
                  className="flex items-center justify-between bg-bg-inner border border-border-medium rounded-xl p-3 shadow-inner hover:border-border-subtle transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded text-center font-bold font-mono text-sm flex items-center justify-center text-text-secondary bg-bg-panel shadow">
                      {i === 0 ? (
                        <Medal size={16} className="text-yellow-400" />
                      ) : i === 1 ? (
                        <Medal size={16} className="text-gray-300" />
                      ) : i === 2 ? (
                        <Medal size={16} className="text-amber-600" />
                      ) : (
                        `#${i + 1}`
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden border border-border-medium shadow shrink-0">
                      {u.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">
                        {u.username || "Utilisateur Anonyme"}
                      </span>
                      <span className="text-xs text-text-secondary font-mono tracking-tight text-emerald-400">
                        Total Parié: ${formatCurrency((u.totalWagered || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-white font-black font-mono tracking-tighter">
                      ${formatCurrency((u.balance || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
