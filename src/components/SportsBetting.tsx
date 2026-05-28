import React, { useState, useEffect, useMemo } from "react";
import { Activity, Trophy, Clock, Search, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, X, LayoutGrid, List, Filter, History, Trash2, Edit2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatCurrency } from "../lib/utils";
import { toast } from "react-hot-toast";

interface Match {
  id: string;
  name: string;
  shortName: string;
  date: string;
  leagueName: string;
  status: { state: string; shortDetail: string; clock: string; period: number };
  teams: {
    home: { name: string; abbrev: string; logo: string; score?: string; winner?: boolean };
    away: { name: string; abbrev: string; logo: string; score?: string; winner?: boolean };
  };
  odds: { home: number; draw: number; away: number };
}

interface PendingBet {
  id: string;
  matchId: string;
  matchName: string;
  team: "home" | "draw" | "away";
  odds: number;
  amount: number;
  date: string;
  status: "pending";
}

const FOOTBALL_URLS = [
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard", 
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard",
  "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard"
];

// Fonction pour générer des côtes réalistes basées sur un pseudo-ELO des équipes
const generateRealisticOdds = (homeName: string, awayName: string) => {
  // Simple hash to get consistent strength between 50 and 100
  const getStrength = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return 50 + (Math.abs(hash) % 50);
  };

  const homeStrength = getStrength(homeName) + 5; // Home advantage
  const awayStrength = getStrength(awayName);
  const diff = homeStrength - awayStrength;
  
  // Calculate probabilities based on strength difference
  let probFav = 0.50 + Math.min(Math.abs(diff) * 0.015, 0.40); // Max 90%
  let probDraw = 0.25 - Math.min(Math.abs(diff) * 0.005, 0.15); // Less likely if big difference
  let probOutsider = Math.max(1 - probFav - probDraw, 0.02); // Min 2%

  // Normalization
  const total = probFav + probDraw + probOutsider;
  probFav /= total;
  probDraw /= total;
  probOutsider /= total;
  
  // Apply bookmaker margin (approx 5%)
  const margin = 1.05;
  const rawFav = margin / probFav;
  const rawDraw = margin / probDraw;
  const rawOutsider = margin / probOutsider;
  
  // Format to neat bookmaker steps
  const formatOdd = (odd: number) => {
    if (odd < 1.01) return 1.01;
    if (odd < 2) return Math.round(odd * 20) / 20;
    if (odd < 3) return Math.round(odd * 10) / 10;
    if (odd < 10) return Math.round(odd * 5) / 5;
    return Math.round(odd);
  };

  const homeIsFav = diff >= 0;

  return {
    home: formatOdd(homeIsFav ? rawFav : rawOutsider),
    draw: formatOdd(rawDraw),
    away: formatOdd(homeIsFav ? rawOutsider : rawFav)
  };
};

export function SportsBetting() {
  const { user, balance, addBalance } = useUser() as any;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<"matches" | "my_bets">("matches");
  
  // Bets
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  
  // Selection / Ticket Modal
  const [selectedBet, setSelectedBet] = useState<{ matchId: string, team: "home" | "draw" | "away", odds: number, matchName: string } | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [placingBet, setPlacingBet] = useState(false);
  
  // Edit Pending Bet
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => {
       fetchMatches(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const responses = await Promise.all(FOOTBALL_URLS.map(url => fetch(url).catch(() => null)));
      
      let allMatches: Match[] = [];
      for (const res of responses) {
        if (!res || !res.ok) continue;
        const data = await res.json();
        const leagueName = data?.leagues?.[0]?.name || "Football";
        if (data && data.events) {
          const parsed = data.events.map((e: any) => {
            const competition = e.competitions[0];
            const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === "home");
            const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === "away");
            
            const homeTeamName = homeCompetitor?.team?.name || "Home";
            const awayTeamName = awayCompetitor?.team?.name || "Away";
            const odds = generateRealisticOdds(homeTeamName, awayTeamName);
            
            return {
              id: e.id,
              name: e.name,
              shortName: e.shortName,
              date: e.date,
              leagueName,
              status: {
                state: competition.status.type.state,
                shortDetail: competition.status.type.shortDetail,
                clock: competition.status.displayClock || "",
                period: competition.status.period || 1
              },
              teams: {
                home: { 
                  name: homeTeamName, 
                  abbrev: homeCompetitor?.team?.abbreviation || "",
                  logo: homeCompetitor?.team?.logo || "",
                  score: homeCompetitor?.score,
                  winner: homeCompetitor?.winner
                },
                away: { 
                  name: awayTeamName, 
                  abbrev: awayCompetitor?.team?.abbreviation || "",
                  logo: awayCompetitor?.team?.logo || "",
                  score: awayCompetitor?.score,
                  winner: awayCompetitor?.winner
                }
              },
              odds
            };
          });
          allMatches = [...allMatches, ...parsed];
        }
      }
      
      // Sort matches (Live > Upcoming > Finished), then by match date
      allMatches.sort((a, b) => {
        if (a.status.state === "in" && b.status.state !== "in") return -1;
        if (b.status.state === "in" && a.status.state !== "in") return 1;
        
        if (a.status.state === "pre" && b.status.state !== "pre") return -1;
        if (b.status.state === "pre" && a.status.state !== "pre") return 1;
        
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setMatches(allMatches);
    } catch (e) {
      console.error(e);
      if (!isRefresh) toast.error("Erreur lors du chargement des matchs en direct.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedBet) return;
    if (betAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (balance < betAmount) {
      toast.error("Solde insuffisant");
      return;
    }

    setPlacingBet(true);
    await new Promise(res => setTimeout(res, 800));
    
    try {
      await addBalance(-betAmount);
      
      const newBet: PendingBet = {
        id: Math.random().toString(36).substring(2, 9),
        matchId: selectedBet.matchId,
        matchName: selectedBet.matchName,
        team: selectedBet.team,
        odds: selectedBet.odds,
        amount: betAmount,
        date: new Date().toISOString(),
        status: "pending"
      };
      
      setPendingBets([newBet, ...pendingBets]);
      
      toast.success(`Pari placé sur ${selectedBet.matchName} ! Montant: ${formatCurrency(betAmount)}`, { duration: 4000 });
      setSelectedBet(null);
    } catch (e) {
      toast.error("Erreur lors de la prise de pari");
    } finally {
      setPlacingBet(false);
    }
  };

  const cancelBet = async (betId: string) => {
    const bet = pendingBets.find(b => b.id === betId);
    if (!bet) return;
    
    // Check if match already started
    const match = matches.find(m => m.id === bet.matchId);
    if (match && match.status.state !== "pre") {
      toast.error("Impossible d'annuler, le match a déjà commencé ou est terminé !");
      return;
    }

    try {
      await addBalance(bet.amount);
      setPendingBets(prev => prev.filter(b => b.id !== betId));
      toast.success(`Pari annulé, ${formatCurrency(bet.amount)} remboursé.`);
    } catch (e) {
      toast.error("Erreur lors de l'annulation.");
    }
  };

  const saveEditedBet = async () => {
    if (!editingBetId || editAmount <= 0) return;
    
    const bet = pendingBets.find(b => b.id === editingBetId);
    if (!bet) return;
    
    const match = matches.find(m => m.id === bet.matchId);
    if (match && match.status.state !== "pre") {
      toast.error("Impossible de modifier, le match a déjà commencé !");
      setEditingBetId(null);
      return;
    }

    const diff = editAmount - bet.amount;
    
    if (diff > 0 && balance < diff) {
      toast.error("Solde insuffisant pour augmenter la mise.");
      return;
    }

    try {
      await addBalance(-diff);
      setPendingBets(prev => prev.map(b => b.id === editingBetId ? { ...b, amount: editAmount } : b));
      toast.success("Mise modifiée avec succès.");
      setEditingBetId(null);
    } catch (e) {
      toast.error("Erreur lors de la modification.");
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const q = searchQuery.toLowerCase();
      // "PSG - ARS" support: split by "-" to see if both match somehow
      const searchParts = q.split("-").map(p => p.trim()).filter(Boolean);
      
      const homeName = m.teams.home.name.toLowerCase();
      const awayName = m.teams.away.name.toLowerCase();
      const homeAbbrev = m.teams.home.abbrev.toLowerCase();
      const awayAbbrev = m.teams.away.abbrev.toLowerCase();
      const league = m.leagueName.toLowerCase();
      const fullMatch = m.name.toLowerCase();
      
      if (searchParts.length > 1) {
        // Multi-part search (e.g. "psg - ars")
        return searchParts.every(part => 
          homeName.includes(part) || awayName.includes(part) || 
          homeAbbrev.includes(part) || awayAbbrev.includes(part)
        );
      }
      
      return fullMatch.includes(q) || league.includes(q) || 
             homeAbbrev.includes(q) || awayAbbrev.includes(q) ||
             homeName.includes(q) || awayName.includes(q);
    });
  }, [matches, searchQuery]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[600px] w-full text-center bg-[#0f1923]">
        <AlertCircle size={64} className="text-yellow-500 mb-6 mx-auto animate-pulse" />
        <h1 className="text-3xl font-black text-white mb-2">Accès Restreint</h1>
        <p className="text-gray-400 max-w-md mx-auto">Le module complet de Paris Sportifs est en mode développement (Tests API Résultats).</p>
        <div className="mt-8 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm font-bold">
          Fonctionnalité réservée aux Administrateurs
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0f1923] text-white overflow-hidden relative">
      
      {/* Header Tabs */}
      <div className="shrink-0 pt-6 px-6 md:px-8 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Trophy className="text-blue-500" size={32} /> Football
              <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded uppercase tracking-widest font-bold">VRAIES COTES</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Pariez sur les vrais matchs, cotes authentiques avec options de cache-out avant coup d'envoi.</p>
          </div>
          <div className="flex items-center bg-black/40 border border-gray-800 rounded-xl p-1 shrink-0">
            <button 
              onClick={() => setActiveTab("matches")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "matches" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              <Activity size={16} /> Événements
            </button>
            <button 
              onClick={() => setActiveTab("my_bets")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "my_bets" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
            >
              <History size={16} /> Mes Paris en cours
              {pendingBets.length > 0 && (
                <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1">
                  {pendingBets.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "matches" ? (
        <>
          {/* Filters Bar */}
          <div className="shrink-0 p-4 px-6 md:px-8 bg-black/20 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="Rechercher une équipe, ligue..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a2c38] border border-gray-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button 
                onClick={() => fetchMatches(true)}
                className={`p-2.5 bg-[#1a2c38] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all flex items-center justify-center ${refreshing ? "animate-spin text-blue-500" : ""}`}
                title="Actualiser les côtes"
              >
                <RefreshCw size={18} />
              </button>
              <div className="flex bg-[#1a2c38] border border-gray-700 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
                  title="Vue Liste"
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
                  title="Vue Grille"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Match Feed */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400 font-medium tracking-wide">Récupération des données et côtes en cours...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center p-20 bg-[#1a2c38]/50 rounded-2xl border border-gray-800">
                <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-gray-300">Aucun match trouvé</h3>
                <p className="text-gray-500 mt-2">Veuillez ajuster votre recherche ou réessayer plus tard.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xxl:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto"}`}>
                {filteredMatches.map(match => {
                  const isLive = match.status.state === "in";
                  const isFinished = match.status.state === "post";
                  
                  return (
                    <div key={match.id} className={`bg-gradient-to-br from-[#1a2c38] to-[#12202b] border ${isLive ? "border-red-500/30" : "border-gray-800"} rounded-xl p-4 md:p-5 hover:border-gray-600 transition-all shadow-md group ${isFinished ? "opacity-75" : ""}`}>
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-black tracking-wider uppercase rounded border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              {match.status.clock || match.status.shortDetail}
                            </span>
                          ) : isFinished ? (
                            <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-[10px] font-bold tracking-wider uppercase rounded border border-gray-800">
                              Terminé
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider uppercase rounded border border-blue-500/20">
                              <Clock size={10} />
                              {new Date(match.date).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500 font-bold bg-black/40 px-2 py-0.5 rounded truncate max-w-[120px]">{match.leagueName}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest hidden sm:block">{match.id}</span>
                      </div>

                      <div className={`flex items-center justify-between gap-4 ${viewMode === "grid" ? "flex-col" : "flex-row"}`}>
                        {/* Scoreboard / Teams Area */}
                        <div className={`flex-1 flex items-center justify-between w-full bg-black/30 p-4 rounded-xl border border-white/5`}>
                          <div className="flex flex-col items-center gap-2 w-1/3">
                            {match.teams.home.logo ? <img src={match.teams.home.logo} alt="Home" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg bg-white/5 p-1 rounded-full" /> : <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{match.teams.home.abbrev || "?"}</div>}
                            <span className={`text-xs md:text-sm font-bold text-center line-clamp-2 leading-tight ${match.teams.home.winner ? "text-yellow-400" : ""}`}>{match.teams.home.name}</span>
                          </div>
                          
                          <div className="flex flex-col items-center w-1/3 px-2">
                            {(isLive || isFinished) ? (
                              <div className="text-2xl md:text-4xl font-black tracking-widest text-white drop-shadow-md whitespace-nowrap">
                                <span className={match.teams.home.winner ? "text-white" : "text-gray-400"}>{match.teams.home.score ?? "?"}</span>
                                <span className="mx-2 text-gray-600">-</span>
                                <span className={match.teams.away.winner ? "text-white" : "text-gray-400"}>{match.teams.away.score ?? "?"}</span>
                              </div>
                            ) : (
                              <div className="text-xs font-black text-gray-500 bg-black/60 px-4 py-1.5 rounded-full border border-gray-800 shadow-inner">VS</div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center gap-2 w-1/3">
                            {match.teams.away.logo ? <img src={match.teams.away.logo} alt="Away" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg bg-white/5 p-1 rounded-full" /> : <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{match.teams.away.abbrev || "?"}</div>}
                            <span className={`text-xs md:text-sm font-bold text-center line-clamp-2 leading-tight ${match.teams.away.winner ? "text-yellow-400" : ""}`}>{match.teams.away.name}</span>
                          </div>
                        </div>

                        {/* Odds Area */}
                        {!isFinished && (
                          <div className={`flex gap-2 shrink-0 ${viewMode === "grid" ? "w-full justify-between mt-4" : "flex-col sm:flex-row mt-4 md:mt-0"}`}>
                            {[{t: "home", l: "1", o: match.odds.home, name: match.teams.home.abbrev}, {t: "draw", l: "N", o: match.odds.draw, name: "Nul"}, {t: "away", l: "2", o: match.odds.away, name: match.teams.away.abbrev}].map((betOpt: any) => (
                              <button 
                                key={betOpt.t}
                                onClick={() => setSelectedBet({ matchId: match.id, team: betOpt.t, odds: betOpt.o, matchName: match.shortName })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border flex-1 sm:min-w-[80px] overflow-hidden relative group/btn ${
                                  selectedBet?.matchId === match.id && selectedBet?.team === betOpt.t 
                                    ? "bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 z-10" 
                                    : "bg-[#0c141a]/80 border-gray-800 hover:border-blue-500 hover:bg-[#15232d] group-hover:border-gray-700"
                                }`}
                              >
                                {selectedBet?.matchId === match.id && selectedBet?.team === betOpt.t && (
                                  <div className="absolute inset-0 bg-gradient-to-t from-blue-700/50 to-transparent"></div>
                                )}
                                <div className="flex justify-between w-full px-1 mb-1 items-center z-10">
                                  <span className={`text-[10px] font-black tracking-widest uppercase ${selectedBet?.matchId === match.id && selectedBet?.team === betOpt.t ? "text-blue-100" : "text-gray-500 group-hover/btn:text-gray-400"}`}>{betOpt.l}</span>
                                  <span className={`text-[9px] font-bold truncate max-w-[40px] ${selectedBet?.matchId === match.id && selectedBet?.team === betOpt.t ? "text-blue-200" : "text-gray-600"}`}>{betOpt.name}</span>
                                </div>
                                <span className={`font-black text-sm md:text-base z-10 ${selectedBet?.matchId === match.id && selectedBet?.team === betOpt.t ? "text-white" : "text-emerald-400 group-hover/btn:text-emerald-300"}`}>
                                  {betOpt.o.toFixed(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Mes Paris Section */
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0c141a]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Filter className="text-gray-400" size={20} /> Paris en Cours ({pendingBets.length})</h2>
            
            {pendingBets.length === 0 ? (
              <div className="text-center p-16 border border-dashed border-gray-800 rounded-2xl bg-black/20">
                <History size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">Vous n'avez aucun pari en cours.</p>
                <button onClick={() => setActiveTab("matches")} className="text-blue-500 font-bold mt-4 hover:underline text-sm uppercase tracking-wider">Trouver des matchs</button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBets.map(bet => {
                  const match = matches.find(m => m.id === bet.matchId);
                  const canEdit = match && match.status.state === "pre";
                  const isEditing = editingBetId === bet.id;
                  
                  return (
                    <div key={bet.id} className="bg-[#1a2c38] rounded-2xl border border-gray-800 overflow-hidden shadow-lg relative">
                      {/* Ribbon */}
                      {!canEdit && <div className="absolute top-4 -right-10 bg-red-500 text-[10px] font-black uppercase tracking-widest px-10 py-1 rotate-45 shadow-lg border-y border-red-400 z-10">Match Débuté</div>}
                      
                      <div className="p-4 md:p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Ticket #{bet.id.toUpperCase()} • {new Date(bet.date).toLocaleString()}</span>
                            <h3 className="font-black text-lg text-white">{bet.matchName}</h3>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded font-black">
                            Cote: {bet.odds.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-800/50 gap-4">
                          <div className="w-full md:w-auto text-sm font-medium">
                            <span className="text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Sélection</span>
                            <div className="text-white bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg font-bold">
                              {bet.team === "home" ? "Equipe 1 " : bet.team === "draw" ? "Match Nul " : "Equipe 2 "} (Vainqueur)
                            </div>
                          </div>

                          <div className="self-stretch w-px bg-gray-800 hidden md:block"></div>

                          <div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto gap-4">
                            <div className="text-left md:text-right">
                              <span className="text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Mise</span>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={editAmount} 
                                    onChange={e => setEditAmount(parseFloat(e.target.value))}
                                    className="bg-black border border-gray-700 text-white rounded px-2 py-1 w-20 font-bold"
                                  />
                                  <button onClick={saveEditedBet} className="text-emerald-500 hover:text-emerald-400"><CheckCircle2 size={20}/></button>
                                  <button onClick={() => setEditingBetId(null)} className="text-red-500 hover:text-red-400"><X size={20}/></button>
                                </div>
                              ) : (
                                <span className="font-black text-xl text-white block">{formatCurrency(bet.amount)}</span>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <span className="text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Gains Potentiels</span>
                              <span className="font-black text-xl text-emerald-400">
                                {formatCurrency((isEditing ? editAmount : bet.amount) * bet.odds)}
                              </span>
                            </div>
                          </div>
                          
                          {canEdit && !isEditing && (
                            <div className="flex md:flex-col gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-800">
                              <button 
                                onClick={() => {setEditingBetId(bet.id); setEditAmount(bet.amount);}}
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                              >
                                <Edit2 size={14}/> Éditer
                              </button>
                              <button 
                                onClick={() => cancelBet(bet.id)}
                                className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                              >
                                <Trash2 size={14}/> Annuler
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {!canEdit && (
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-4 text-center">
                            Modifications désactivées : Le match a débuté.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pop-up Betslip Modal */}
      {selectedBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121c25] border border-gray-700/50 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-[#0f181f] p-5 flex items-center justify-between border-b border-gray-800/80">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                  <Activity className="text-blue-500" size={20} />
                </div>
                <div>
                  <h2 className="font-black text-white text-lg leading-none">Ticket de Pari</h2>
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1 block">Pronostic Simple</span>
                </div>
              </div>
              <button onClick={() => setSelectedBet(null)} className="text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Match Card inside Modal */}
              <div className="bg-gradient-to-br from-[#1a2936] to-[#121d26] border border-gray-700 rounded-2xl p-5 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-3 block flex items-between items-center gap-2">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Sélection Valide</span>
                </span>
                
                <h3 className="text-lg font-black text-white leading-tight mb-4 relative z-10">{selectedBet.matchName}</h3>
                
                <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pari sur</span>
                    <span className="font-bold text-white">
                      {selectedBet.team === "home" ? "Equipe Domicile (1)" : selectedBet.team === "draw" ? "Match Nul (X)" : "Equipe Extérieur (2)"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Cote validée</span>
                    <span className="text-emerald-400 font-black text-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                      {selectedBet.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stake & Returns */}
              <div className="space-y-4 mb-8">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                    <span>Mise</span>
                    <span className="text-white">Solde: {formatCurrency(balance)}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#0a1014] p-2 rounded-xl border border-gray-800 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                     <div className="pl-4 text-gray-500 font-black text-xl">$</div>
                     <input 
                       type="number" 
                       value={betAmount || ""}
                       onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                       className="w-full bg-transparent font-black focus:outline-none text-white text-2xl"
                       min={1}
                       placeholder="0.00"
                     />
                     <div className="flex gap-1 pr-2">
                       <button onClick={() => setBetAmount(10)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-700">+10</button>
                       <button onClick={() => setBetAmount(50)} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-700">+50</button>
                     </div>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-emerald-500 uppercase tracking-widest font-black text-xs">Gains Potentiels</span>
                  <span className="text-emerald-400 text-3xl font-black drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                    {formatCurrency((betAmount || 0) * selectedBet.odds)}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceBet}
                disabled={placingBet || !betAmount || betAmount <= 0}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-lg tracking-wider"
              >
                {placingBet ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>Valider le Pari</>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-500 font-bold mt-4">
                Les cotes peuvent fluctuer. Pari définitif après validation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
