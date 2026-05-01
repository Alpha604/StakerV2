import React, { useState } from "react";
import { Search, Trophy, Frown, Copy, Check } from "lucide-react";
import { useUser, SessionBet } from "../context/UserContext";
import { cn } from "../lib/utils";

export function VerifyBet() {
  const { sessionBets } = useUser();
  const [searchId, setSearchId] = useState("");
  const [searchedBet, setSearchedBet] = useState<SessionBet | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    
    // Check locally 
    const localBet = sessionBets.find(b => b.id === searchId);
    if (localBet) {
      setSearchedBet(localBet);
      return;
    }

    // Check global cache (simulating DB search)
    try {
      const globalBetsStr = localStorage.getItem("stake_global_bets_cache");
      if (globalBetsStr) {
        const globalBets = JSON.parse(globalBetsStr);
        const gBet = globalBets.find((b: any) => b.id === searchId);
        if (gBet) {
          setSearchedBet(gBet);
          return;
        }
      }
    } catch(err) {}

    setSearchedBet(null);
  };

  const copyToClipboard = (id: string | undefined) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full min-h-[calc(100vh-80px)] flex flex-col items-center">
      
      <div className="text-center mb-8 w-full">
        <h1 className="text-3xl font-bold text-white mb-4">Vérification de Pari</h1>
        <p className="text-[#8b9ba5] mb-6">Collez l'ID du pari (Seed ID) pour scanner ses statistiques en détail.</p>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto w-full relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-5 h-5 text-[#8b9ba5]" />
            </div>
            <input 
              type="text" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Ex: bet_a1b2c3d4..."
              className="flex-1 bg-[#0f212e] border-2 border-[#2f4553] rounded-lg py-4 pl-12 pr-4 text-white font-mono focus:border-[#557086] outline-none transition-colors"
            />
            <button 
              type="submit"
              className="bg-[#1bc86a] text-black font-bold px-8 py-4 rounded-lg hover:bg-[#1bc86a]/80 transition-colors"
            >
              Scanner
            </button>
        </form>
      </div>

      {hasSearched && (
        <div className="w-full max-w-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          {!searchedBet ? (
            <div className="bg-[#0f212e] rounded-xl p-8 border border-red-500/20 flex flex-col items-center text-center">
              <Frown className="w-16 h-16 text-[#ed4163] mb-4 opacity-80" />
              <h3 className="text-xl font-bold text-white mb-2">Pari Introuvable</h3>
              <p className="text-[#8b9ba5]">L'ID renseigné ne correspond à aucun pari ou a expiré.</p>
            </div>
          ) : (
            <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] overflow-hidden shadow-2xl relative">
              {/* Header */}
              <div className={cn(
                "p-6 flex items-center justify-between border-b border-[#2f4553]",
                searchedBet.profit > 0 ? "bg-[#1bc86a]/5" : "bg-[#ed4163]/5"
              )}>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Play {searchedBet.game}
                  </h3>
                  <p className="text-[#8b9ba5] text-sm">
                    {new Date(searchedBet.timestamp).toLocaleString()}
                  </p>
                </div>
                {searchedBet.profit > 0 ? (
                  <div className="bg-[#1bc86a]/20 text-[#1bc86a] p-3 rounded-full flex items-center justify-center">
                     <Trophy size={24} />
                  </div>
                ) : (
                  <div className="bg-[#ed4163]/20 text-[#ed4163] p-3 rounded-full flex items-center justify-center">
                     <Frown size={24} />
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="bg-[#213743] rounded-lg p-4">
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Mise</div>
                  <div className="text-white font-mono font-bold">{searchedBet.wagered.toFixed(2)}</div>
                </div>
                <div className="bg-[#213743] rounded-lg p-4">
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Multiplicateur</div>
                  <div className="text-white font-mono font-bold text-lg">{searchedBet.multiplier.toFixed(2)}x</div>
                </div>
                <div className="bg-[#213743] rounded-lg p-4 col-span-2 flex flex-col items-center justify-center">
                  <div className="text-[#8b9ba5] text-xs font-bold uppercase mb-1">Gain Total</div>
                  <div className={cn(
                    "font-mono font-bold text-2xl",
                    searchedBet.profit > 0 ? "text-[#1bc86a]" : "text-[#8b9ba5]"
                  )}>
                    {searchedBet.payout.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* ID Footer */}
              <div className="p-4 border-t border-[#2f4553] bg-[#0a151d] flex items-center justify-between">
                <span className="text-[#8b9ba5] text-xs">Seed ID:</span>
                <button 
                  onClick={() => copyToClipboard(searchedBet.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2f4553] hover:bg-[#3d5a6c] transition-colors group"
                >
                  <span className="font-mono text-white text-xs truncate max-w-[200px]">{searchedBet.id}</span>
                  {copied ? <Check size={14} className="text-[#1bc86a]" /> : <Copy size={14} className="text-[#8b9ba5] group-hover:text-white" />}
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
