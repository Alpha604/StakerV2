import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { Search, Trophy, Frown, Copy, Check } from "lucide-react";
import { useUser, SessionBet } from "../context/UserContext";
import { cn } from "../lib/utils";

export function VerifyBet() {
  const { sessionBets } = useUser();
  const [searchId, setSearchId] = useState("");
  const [searchedBet, setSearchedBet] = useState<SessionBet | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentBets = () => {
      try {
        const globalBetsStr = localStorage.getItem("stake_global_bets_cache");
        if (globalBetsStr) {
          setRecentBets(JSON.parse(globalBetsStr));
        }
      } catch (err) {}
    };

    fetchRecentBets();
    const interval = setInterval(fetchRecentBets, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    setIsScanning(true);
    setHasSearched(false);
    
    setTimeout(() => {
      setIsScanning(false);
      setHasSearched(true);
      
      // Check locally 
      const localBet = sessionBets.find(b => b.id === searchId);
      if (localBet) {
        setSearchedBet(localBet);
        return;
      }

      // Attempt to decode as base64 encoded bet payload if it starts with 'bet_'
      if (searchId.startsWith('bet_') && searchId.length > 20) {
        try {
          const encoded = searchId.slice(4);
          const decodedStr = atob(encoded);
          const parsed = JSON.parse(decodedStr);
          if (parsed && typeof parsed.w === 'number' && typeof parsed.m === 'number') {
            // It's a valid decoded bet!
            setSearchedBet({
              id: searchId,
              game: parsed.g || "Unknown",
              wagered: parsed.w,
              multiplier: parsed.m,
              payout: parsed.p,
              profit: parsed.pr,
              timestamp: parsed.ts,
            });
            return;
          }
        } catch (err) {
          // Not a valid encoded bet, fallback to cache
        }
      }

      // Numeric pseudo-qrcode decoder (deterministic deciphering from digits)
      const numericPart = searchId.replace(/[^0-9]/g, "");
      if (numericPart.length >= 8) {
        // Deterministic generation based on searchId digits
        let hash = 0;
        for (let i = 0; i < numericPart.length; i++) {
          hash = numericPart.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const games = ["Mines", "Roulette", "Keno", "Dice", "Plinko", "Crash", "Limbo", "Wheel", "Blackjack", "Slots"];
        const gameIndex = Math.abs(hash) % games.length;
        const game = games[gameIndex];
        
        // Derive wagered amount from first few digits
        const wageredStr = numericPart.substring(0, 4);
        const wagered = (parseInt(wageredStr) || 1500) / 100 + 5.50; // Ensure float
        
        // Derive multiplier
        const multStr = numericPart.substring(3, 7);
        const multRaw = parseInt(multStr) || 2500;
        
        // Win or loss based on parity of a middle digit
        const midDigit = parseInt(numericPart.substring(numericPart.length / 2, numericPart.length / 2 + 1) || "1");
        const isWin = midDigit % 2 === 0; 
        
        let multiplier = 0;
        if (isWin) {
          // multiplier between 1.10x and ~50.00x roughly
          multiplier = Math.max(1.10, (multRaw % 5000) / 100);
        }
        
        const payout = isWin ? wagered * multiplier : 0;
        const profit = payout - wagered;
        
        // timestamp recent
        const tsOffset = (Math.abs(hash) % (7 * 24 * 3600 * 1000)); // up to 7 days ago
        const timestamp = Date.now() - tsOffset;

        setSearchedBet({
          id: searchId,
          game,
          wagered,
          multiplier,
          payout,
          profit,
          timestamp
        });
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
    }, 800); // 800ms fake scan delay for nice UX effect
  };

  const copyToClipboard = (id: string | undefined) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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
              disabled={isScanning}
              placeholder="Ex: bet_a1b2c3d4..."
              className="flex-1 bg-[#0f212e] border-2 border-[#2f4553] rounded-lg py-4 pl-12 pr-4 text-white font-mono focus:border-[#557086] outline-none transition-colors disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isScanning || !searchId}
              className="bg-[#1bc86a] text-black font-bold px-8 py-4 rounded-lg hover:bg-[#1bc86a]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {isScanning ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Scanner"}
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
                  <div className="text-white font-mono font-bold">{formatCurrency(searchedBet.wagered)}</div>
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
                    {formatCurrency(searchedBet.payout)}
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
                  {copied === searchedBet.id ? <Check size={14} className="text-[#1bc86a]" /> : <Copy size={14} className="text-[#8b9ba5] group-hover:text-white" />}
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="w-full max-w-5xl mx-auto mt-16 animate-in fade-in duration-500">
        <h2 className="text-xl font-bold text-white mb-4">Derniers Paris (Global)</h2>
        <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] overflow-hidden overflow-x-auto">
          <table className="w-full text-left font-mono text-sm min-w-[700px]">
            <thead className="bg-[#2f4553]/50 text-[#8b9ba5]">
              <tr>
                <th className="p-4 font-bold">Joueur</th>
                <th className="p-4 font-bold">Jeu</th>
                <th className="p-4 font-bold">Mise</th>
                <th className="p-4 font-bold">Multiplicateur</th>
                <th className="p-4 font-bold">Profit</th>
                <th className="p-4 font-bold">ID Seed</th>
              </tr>
            </thead>
            <tbody>
              {recentBets.map((bet, i) => (
                <tr key={i} className="border-t border-[#2f4553] hover:bg-[#2f4553]/20">
                  <td className="p-4">{bet.user || "Anonyme"}</td>
                  <td className="p-4">{bet.game}</td>
                  <td className="p-4">{bet.wagered?.toFixed(2)}</td>
                  <td className="p-4">{bet.multiplier?.toFixed(2)}x</td>
                  <td className={cn(
                    "p-4 font-bold",
                    bet.profit > 0 ? "text-[#1bc86a]" : "text-[#ed4163]"
                  )}>
                    {bet.profit > 0 ? "+" : ""}{bet.profit?.toFixed(2)}$
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <span className="truncate max-w-[120px] text-[#8b9ba5]" title={bet.id}>{bet.id}</span>
                    <button 
                      onClick={() => copyToClipboard(bet.id)} 
                      className="text-[#8b9ba5] hover:text-white transition-colors"
                      title="Copier"
                    >
                      {copied === bet.id ? <Check size={16} className="text-[#1bc86a]" /> : <Copy size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
              {recentBets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8b9ba5]">Aucun pari récent.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
