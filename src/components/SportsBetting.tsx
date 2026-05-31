import React, { useState, useEffect, useMemo } from "react";
import { Activity, Trophy, Clock, Search, CheckCircle2, AlertCircle, RefreshCw, X, LayoutGrid, List, Filter, History, Trash2, Edit2, Play, Plus, Coins, TrendingUp, ChevronRight } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

interface Match {
  id: string;
  name: string;
  shortName: string;
  date: string;
  leagueName: string;
  sport: string;
  status: { state: string; shortDetail: string; clock: string; period: number };
  teams: {
    home: { name: string; abbrev: string; logo: string; score?: string; winner?: boolean };
    away: { name: string; abbrev: string; logo: string; score?: string; winner?: boolean };
  };
  odds: { home: number; draw?: number; away: number };
}

interface PendingBet {
  id: string;
  matchId: string;
  matchName: string;
  team: "home" | "draw" | "away";
  odds: number;
  amount: number;
  date: string;
  sport: string;
  status: "pending" | "won" | "lost";
}

const SPORTS_CONFIG = {
  soccer: {
    name: "Football",
    icon: <div className="w-4 h-4 rounded-full border-2 border-current border-dashed" />,
    urls: [
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard", 
      "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
      "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard",
      "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard"
    ],
    hasDraw: true
  },
  basketball: {
    name: "Basketball",
    icon: <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-400" />,
    urls: [
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    ],
    hasDraw: false
  },
  tennis: {
    name: "Tennis",
    icon: <div className="w-4 h-4 rounded-full bg-[#ccff00]" />,
    urls: [
      "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard",
      "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard"
    ],
    hasDraw: false
  },
  american_football: {
    name: "Am. Football",
    icon: <div className="w-5 h-3 bg-[#6e3c23] rounded-[50%] border border-[#4a2615]" />,
    urls: [
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    ],
    hasDraw: false
  }
};

const generateRealisticOdds = (homeName: string, awayName: string, hasDraw: boolean) => {
  const getStrength = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return 50 + (Math.abs(hash) % 50);
  };

  const homeStrength = getStrength(homeName) + 5; 
  const awayStrength = getStrength(awayName);
  const diff = homeStrength - awayStrength;
  
  const formatOdd = (odd: number) => {
    if (odd < 1.01) return 1.01;
    if (odd < 2) return Math.round(odd * 20) / 20;
    if (odd < 3) return Math.round(odd * 10) / 10;
    if (odd < 10) return Math.round(odd * 5) / 5;
    return Math.round(odd);
  };

  if (hasDraw) {
    let probFav = 0.50 + Math.min(Math.abs(diff) * 0.015, 0.40); 
    let probDraw = 0.25 - Math.min(Math.abs(diff) * 0.005, 0.15); 
    let probOutsider = Math.max(1 - probFav - probDraw, 0.02); 

    const total = probFav + probDraw + probOutsider;
    probFav /= total; probDraw /= total; probOutsider /= total;
    
    const margin = 1.05;
    const homeIsFav = diff >= 0;

    return {
      home: formatOdd(homeIsFav ? margin / probFav : margin / probOutsider),
      draw: formatOdd(margin / probDraw),
      away: formatOdd(homeIsFav ? margin / probOutsider : margin / probFav)
    };
  } else {
    let probFav = 0.60 + Math.min(Math.abs(diff) * 0.02, 0.35); 
    let probOutsider = Math.max(1 - probFav, 0.05); 

    const margin = 1.05;
    const homeIsFav = diff >= 0;

    return {
      home: formatOdd(homeIsFav ? margin / probFav : margin / probOutsider),
      away: formatOdd(homeIsFav ? margin / probOutsider : margin / probFav)
    };
  }
};

export function SportsBetting() {
  const { user, balance, addBalance, updateUserData, appSettings, updateAppSettings } = useUser() as any;
  const [activeSport, setActiveSport] = useState<keyof typeof SPORTS_CONFIG>("soccer");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Access Gate
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const isGloballyActive = appSettings?.sportsBettingGlobalActive !== false;
  const hasAccess = user?.role === 'admin' || user?.sportsBettingAccess === true;

  const handleUnlock = async () => {
    setAccessError("");
    if (!accessCode.trim()) return;

    if (user?.sportsBettingBlocked) {
      setAccessError("Votre accès aux Paris Sportifs a été révoqué par l'administration.");
      return;
    }

    const correctCode = appSettings?.sportsCode;
    if (!correctCode) {
      setAccessError("Aucun code d'accès configuré par l'administrateur.");
      return;
    }

    if (accessCode.trim() !== correctCode) {
      setAccessError("Code invalide.");
      return;
    }

    const maxUses = appSettings?.sportsCodeMaxUses || 0;
    const currentUses = appSettings?.sportsCodeUses || 0;

    if (maxUses > 0 && currentUses >= maxUses) {
      setAccessError("Ce code a expiré ou atteint sa limite d'utilisation.");
      return;
    }

    setUnlocking(true);
    try {
      await updateAppSettings({ ...appSettings, sportsCodeUses: currentUses + 1 });
      await updateUserData({ sportsBettingAccess: true }, true);
      toast.success("Accès autorisé ! Bienvenue dans les Paris Sportifs.");
    } catch (e) {
      setAccessError("Erreur lors de la validation du code.");
    } finally {
      setUnlocking(false);
    }
  };
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [betSlipTab, setBetSlipTab] = useState<"slip" | "my_bets">("slip");
  
  // Bets
  const [pendingBets, setPendingBets] = useState<PendingBet[]>(() => {
    try {
      if (!user) return [];
      const stored = localStorage.getItem(`sports_bets_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save bets
  useEffect(() => {
    if (user) {
      localStorage.setItem(`sports_bets_${user.id}`, JSON.stringify(pendingBets));
    }
  }, [pendingBets, user]);
  
  // Selection
  const [selectedBet, setSelectedBet] = useState<{ matchId: string, team: "home" | "draw" | "away", odds: number, matchName: string, sport: string } | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [placingBet, setPlacingBet] = useState(false);

  useEffect(() => {
    fetchMatches(activeSport);
  }, [activeSport]);

  const fetchMatches = async (sportKey: keyof typeof SPORTS_CONFIG, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    
    try {
      const config = SPORTS_CONFIG[sportKey];
      const responses = await Promise.all(config.urls.map(url => fetch(url).catch(() => null)));
      
      let allMatches: Match[] = [];
      for (const res of responses) {
        if (!res || !res.ok) continue;
        const data = await res.json();
        const leagueName = data?.leagues?.[0]?.name || config.name;
        if (data && data.events) {
          const parsed = data.events.map((e: any) => {
            const competition = e.competitions[0];
            const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === "home");
            const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === "away");
            
            const homeTeamName = homeCompetitor?.team?.name || "Home";
            const awayTeamName = awayCompetitor?.team?.name || "Away";
            const odds = generateRealisticOdds(homeTeamName, awayTeamName, config.hasDraw);
            
            return {
              id: e.id,
              name: e.name,
              shortName: e.shortName,
              date: e.date,
              leagueName,
              sport: sportKey,
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
      if (!isRefresh) toast.error("Erreur lors du chargement des matchs.");
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
        sport: selectedBet.sport,
        status: "pending"
      };
      
      setPendingBets([newBet, ...pendingBets]);
      
      toast.success(`Pari placé !`);
      setSelectedBet(null);
      setBetSlipTab("my_bets");
    } catch (e) {
      toast.error("Erreur lors de la prise de pari");
    } finally {
      setPlacingBet(false);
    }
  };

  const cancelBet = async (betId: string) => {
    const bet = pendingBets.find(b => b.id === betId);
    if (!bet) return;
    
    const match = matches.find(m => m.id === bet.matchId);
    if (match && match.status.state !== "pre") {
      toast.error("Match déjà commencé !");
      return;
    }

    try {
      await addBalance(bet.amount);
      setPendingBets(prev => prev.filter(b => b.id !== betId));
      toast.success(`Pari annulé, remboursé.`);
    } catch (e) {
      toast.error("Erreur annulation.");
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const q = searchQuery.toLowerCase();
      const homeName = m.teams.home.name.toLowerCase();
      const awayName = m.teams.away.name.toLowerCase();
      return homeName.includes(q) || awayName.includes(q) || m.leagueName.toLowerCase().includes(q);
    });
  }, [matches, searchQuery]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-20 min-h-[600px] w-full text-center bg-[#0a1014] text-white">
        <div className="max-w-md w-full bg-[#0f1923] border border-[#1a2c38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <AlertCircle size={48} className="text-gray-500 mb-6 mx-auto" />
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Connexion Requise</h1>
          <p className="text-gray-400 mb-8 text-sm">Veuillez vous connecter pour accéder au module de Paris Sportifs.</p>
        </div>
      </div>
    );
  }

  if (user.sportsBettingBlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-20 min-h-[600px] w-full text-center bg-[#0a1014] text-white">
        <div className="max-w-md w-full bg-[#0f1923] border border-[#1a2c38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <AlertCircle size={48} className="text-red-500 mb-6 mx-auto" />
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Accès Interdit</h1>
          <p className="text-gray-400 text-sm">Votre accès au module de Paris Sportifs a été définitivement révoqué par l'administration.</p>
        </div>
      </div>
    );
  }

  if (!isGloballyActive && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-20 min-h-[600px] w-full text-center bg-[#0a1014] text-white">
        <div className="max-w-md w-full bg-[#0f1923] border border-[#1a2c38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <AlertCircle size={48} className="text-red-500 mb-6 mx-auto" />
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Maintenance en cours</h1>
          <p className="text-gray-400 text-sm">Le module de Paris Sportifs est temporairement désactivé par l'administration.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 md:p-20 min-h-[600px] w-full text-center bg-[#0a1014] text-white">
        <div className="max-w-md w-full bg-[#0f1923] border border-[#1a2c38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <AlertCircle size={48} className="text-blue-500 mb-6 mx-auto" />
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Accès Restreint</h1>
          <p className="text-gray-400 mb-8 text-sm">Le module de Paris Sportifs est en phase beta exclusive. Veuillez saisir votre code d'invitation pour débloquer l'accès.</p>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Code d'accès</label>
              <input 
                type="text" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Entrez le code ici..."
                className="w-full bg-[#14232d] border border-[#1e3445] text-white px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
            </div>
            {accessError && (
              <p className="text-red-400 text-xs font-bold">{accessError}</p>
            )}
            <button 
              onClick={handleUnlock}
              disabled={unlocking || !accessCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {unlocking ? "Validation..." : "Débloquer l'accès"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-[#0a1014] text-white overflow-hidden relative">
      
      {/* Left Sidebar */}
      <div className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-[#1a2c38] bg-[#0f1923] z-10 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-black mb-6 text-white tracking-widest flex items-center gap-3">
            <Trophy className="text-blue-500" /> SPORTS
          </h2>
          <div className="space-y-2">
            {(Object.entries(SPORTS_CONFIG) as [keyof typeof SPORTS_CONFIG, any][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => { setActiveSport(key); setViewMode("list"); }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all font-bold",
                  activeSport === key 
                    ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                    : "text-gray-400 hover:bg-[#1a2c38] hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  {config.icon}
                  {config.name}
                </div>
                <ChevronRight size={16} className={activeSport === key ? "text-white" : "text-gray-600"} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a1014]">
        
        {/* Mobile Nav */}
        <div className="lg:hidden flex items-center overflow-x-auto p-4 gap-2 border-b border-[#1a2c38] bg-[#0f1923] no-scrollbar shrink-0">
           {(Object.entries(SPORTS_CONFIG) as [keyof typeof SPORTS_CONFIG, any][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveSport(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border",
                  activeSport === key 
                    ? "bg-blue-600 text-white border-blue-500" 
                    : "bg-[#1a2c38] text-gray-400 border-transparent"
                )}
              >
                {config.icon} {config.name}
              </button>
            ))}
        </div>

        {/* Top Filters */}
        <div className="shrink-0 p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-center bg-[#0a1014] gap-4 z-10 sticky top-0 border-b border-[#1a2c38]">
           <div className="relative w-full sm:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
             <input 
               type="text"
               placeholder="Rechercher équipe, ligue..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-[#14232d] border border-[#1a2c38] text-white rounded-full py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
             />
           </div>
           
           <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button onClick={() => fetchMatches(activeSport, true)} className="p-3 bg-[#14232d] rounded-xl hover:bg-[#1a2c38] transition-colors" title="Actualiser">
                 <RefreshCw size={18} className={refreshing ? "animate-spin text-blue-500" : "text-gray-400"} />
              </button>
              
              <div className="hidden sm:flex bg-[#14232d] p-1 rounded-xl">
                 <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-gray-700 text-white shadow" : "text-gray-500")}>
                    <List size={18} />
                 </button>
                 <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg transition-all", viewMode === "grid" ? "bg-gray-700 text-white shadow" : "text-gray-500")}>
                    <LayoutGrid size={18} />
                 </button>
              </div>

              <button 
                onClick={() => setShowBetSlip(!showBetSlip)}
                className="lg:hidden flex items-center gap-2 px-4 py-3 bg-blue-600 rounded-xl font-bold font-sm"
              >
                <Activity size={18} />
                Ticket {pendingBets.length > 0 && <span className="bg-white text-blue-600 text-[10px] px-2 py-0.5 rounded-full">{pendingBets.length}</span>}
              </button>
           </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar pb-32">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center py-32">
                 <span className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                 <p className="font-bold text-gray-500 tracking-wider">Chargement des côtes...</p>
              </motion.div>
            ) : filteredMatches.length === 0 ? (
              <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center py-20 bg-[#14232d]/50 rounded-3xl border border-[#1a2c38]">
                <Activity size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-300">Aucun résultat</h3>
              </motion.div>
            ) : (
              <motion.div 
                 key="feed" 
                 initial={{opacity:0, y: 10}} 
                 animate={{opacity:1, y: 0}} 
                 className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1 max-w-4xl mx-auto")}
              >
                 {filteredMatches.map(match => {
                   const isLive = match.status.state === "in";
                   const isFinished = match.status.state === "post";
                   const hasDraw = SPORTS_CONFIG[activeSport].hasDraw;

                   return (
                     <div key={match.id} className="bg-[#14232d] hover:bg-[#1a2c38]/80 border border-[#1e3445] rounded-2xl overflow-hidden transition-colors shadow-sm group">
                        
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-[#1e3445] flex justify-between items-center text-xs">
                           <div className="flex items-center gap-3">
                              {isLive ? (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white font-black tracking-widest uppercase rounded">
                                  <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                                  LIVE {match.status.clock}
                                </span>
                              ) : isFinished ? (
                                <span className="px-2 py-0.5 bg-gray-700 font-bold uppercase rounded text-gray-300">Terminé</span>
                              ) : (
                                <span className="flex items-center gap-1.5 font-bold text-gray-400">
                                  <Clock size={12} /> {new Date(match.date).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute:'2-digit' })}
                                </span>
                              )}
                              <span className="text-gray-500 font-bold">{match.leagueName}</span>
                           </div>
                           <ChevronRight size={14} className="text-gray-600" />
                        </div>

                        {/* Match Data */}
                        <div className={cn("p-5 flex gap-4", viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row sm:items-center")}>
                           
                           {/* Teams & Score */}
                           <div className={cn("flex-1", viewMode === "list" && "flex items-center justify-between pr-8")}>
                             <div className="flex flex-col gap-3 w-full">
                               {[match.teams.home, match.teams.away].map((team, idx) => (
                                 <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {team.logo ? (
                                        <img src={team.logo} className="w-8 h-8 object-contain bg-white/10 rounded-full p-1 border border-white/5" alt={team.name} />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px]">{team.abbrev || "?"}</div>
                                      )}
                                      <span className={cn("font-bold", team.winner ? "text-yellow-400" : "text-white")}>{team.name}</span>
                                    </div>
                                    {(isLive || isFinished) && (
                                       <span className={cn("font-black text-xl w-8 text-center", team.winner ? "text-yellow-400" : "text-white")}>
                                         {team.score ?? "?"}
                                       </span>
                                    )}
                                 </div>
                               ))}
                             </div>
                           </div>

                           {/* Odds */}
                           {!isFinished && (
                             <div className={cn("flex gap-2 shrink-0", viewMode === "grid" ? "mt-4" : "w-[260px]")}>
                               {[
                                 {t: "home", l: "1", o: match.odds.home}, 
                                 ...(match.odds.draw ? [{t: "draw", l: "X", o: match.odds.draw}] : []),
                                 {t: "away", l: "2", o: match.odds.away}
                               ].map((opt, idx) => {
                                 const isSelected = selectedBet?.matchId === match.id && selectedBet?.team === opt.t;
                                 return (
                                   <button
                                     key={idx}
                                     onClick={() => {
                                       setSelectedBet({matchId: match.id, team: opt.t as any, odds: opt.o, matchName: match.shortName, sport: activeSport});
                                       setShowBetSlip(true);
                                       setBetSlipTab("slip");
                                     }}
                                     className={cn(
                                       "flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all relative overflow-hidden",
                                       isSelected 
                                         ? "bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                                         : "bg-[#0f1923] border-[#1e3445] hover:border-gray-500"
                                     )}
                                   >
                                     <span className={cn("font-bold text-[10px] mb-0.5", isSelected ? "text-blue-200" : "text-gray-500")}>{opt.l}</span>
                                     <span className={cn("font-black text-sm", isSelected ? "text-white" : "text-emerald-400")}>{opt.o?.toFixed(2)}</span>
                                   </button>
                                 )
                               })}
                             </div>
                           )}

                        </div>
                     </div>
                   )
                 })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Sidebar: Bet Slip */}
      <div className={cn(
        "fixed inset-y-0 right-0 lg:static flex flex-col w-full sm:w-[360px] lg:w-[320px] 2xl:w-[360px] bg-[#0f1923] border-l border-[#1a2c38] z-50 transform lg:transform-none transition-transform duration-300 shadow-2xl lg:shadow-none",
        showBetSlip ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Slilp Header */}
        <div className="shrink-0 p-4 border-b border-[#1a2c38] flex items-center justify-between bg-[#14232d]">
          <div className="flex bg-[#0f1923] p-1 rounded-lg w-full border border-[#1a2c38]">
             <button onClick={() => setBetSlipTab("slip")} className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", betSlipTab === "slip" ? "bg-[#2f4553] text-white" : "text-gray-500")}>
               TICKET
             </button>
             <button onClick={() => setBetSlipTab("my_bets")} className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1", betSlipTab === "my_bets" ? "bg-[#2f4553] text-white" : "text-gray-500")}>
               MES PARIS {pendingBets.length > 0 && <span className="bg-blue-600 text-white border border-blue-500 w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{pendingBets.length}</span>}
             </button>
          </div>
          <button onClick={() => setShowBetSlip(false)} className="lg:hidden ml-4 text-gray-400 hover:text-white bg-[#1a2c38] p-2 rounded-full">
             <X size={16} />
          </button>
        </div>

        {/* Slip Content */}
        <div className="flex-1 overflow-y-auto w-full p-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {betSlipTab === "slip" ? (
              <motion.div key="slip" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                {!selectedBet ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#1a2c38] flex items-center justify-center mb-4 border border-[#2f4553]">
                       <Plus size={24} className="text-gray-500" />
                    </div>
                    <span className="text-gray-400 font-bold">Votre ticket est vide.</span>
                    <span className="text-gray-500 text-sm mt-2">Sélectionnez une cote pour parier.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="bg-[#14232d] rounded-xl border border-blue-500/30 overflow-hidden relative">
                       <div className="bg-blue-600/10 p-3 flex justify-between items-start border-b border-[#1a2c38]">
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest">{SPORTS_CONFIG[selectedBet.sport as keyof typeof SPORTS_CONFIG]?.name}</span>
                             <span className="font-bold text-white leading-tight mt-1">{selectedBet.matchName}</span>
                          </div>
                          <button onClick={() => setSelectedBet(null)} className="text-gray-500 hover:text-red-400">
                             <Trash2 size={14} />
                          </button>
                       </div>
                       <div className="p-3 flex justify-between items-center">
                          <span className="font-bold text-sm text-gray-300">
                            {selectedBet.team === "home" ? "Domicile (1)" : selectedBet.team === "draw" ? "Nul (X)" : "Extérieur (2)"}
                          </span>
                          <span className="font-black text-lg text-emerald-400">{selectedBet.odds?.toFixed(2)}</span>
                       </div>
                    </div>

                    <div className="bg-[#14232d] p-4 rounded-xl border border-[#1a2c38]">
                       <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-2 tracking-widest">
                         <span>Mise</span>
                         <span>Solde: {formatCurrency(balance)}</span>
                       </div>
                       <div className="relative mb-3">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</div>
                         <input 
                           type="number"
                           value={betAmount || ""}
                           onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                           className="w-full bg-[#0a1014] border border-[#1e3445] rounded-lg py-3 pl-8 pr-4 text-white font-black focus:border-blue-500 outline-none transition-all"
                         />
                       </div>
                       <div className="grid grid-cols-4 gap-2">
                         {[10, 50, 100, 500].map(amt => (
                           <button key={amt} onClick={() => setBetAmount(amt)} className="bg-[#1a2c38] hover:bg-[#2f4553] text-gray-300 font-bold text-xs py-2 rounded-lg transition-colors border border-[#1e3445]">
                             +{amt}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center">
                       <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">Gain Potentiel</span>
                       <span className="font-black text-emerald-400 text-xl">{formatCurrency((betAmount||0) * selectedBet.odds)}</span>
                    </div>

                    <button 
                      onClick={handlePlaceBet}
                      disabled={placingBet || !betAmount || betAmount <= 0}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl tracking-wider transition-all disabled:opacity-50 mt-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none"
                    >
                      {placingBet ? "TRAITEMENT..." : "PRENDRE LE PARI"}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="my_bets" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                {pendingBets.length === 0 ? (
                   <div className="text-center py-20 text-gray-500 font-bold">Aucun pari en cours.</div>
                ) : (
                   pendingBets.map(bet => {
                      const isActiveMatch = matches.find(m => m.id === bet.matchId && m.status.state === "pre");
                      return (
                        <div key={bet.id} className="bg-[#14232d] rounded-xl border border-[#1a2c38] overflow-hidden">
                           <div className="bg-[#1a2c38] px-3 py-2 flex justify-between items-center border-b border-[#2f4553]">
                              <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">ID: {bet.id}</span>
                              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", !isActiveMatch ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400")}>
                                {!isActiveMatch ? "En cours" : "À venir"}
                              </span>
                           </div>
                           <div className="p-3">
                              <h4 className="font-bold text-white text-sm leading-tight mb-2">{bet.matchName}</h4>
                              <div className="flex justify-between items-center bg-[#0a1014] p-2 rounded-lg border border-[#1a2c38]">
                                <span className="text-xs font-bold text-gray-300">
                                  {bet.team === "home" ? "1" : bet.team === "draw" ? "X" : "2"}
                                </span>
                                <span className="text-sm font-black text-emerald-400">{bet.odds?.toFixed(2)}</span>
                              </div>
                              <div className="mt-3 flex justify-between items-end border-t border-[#1a2c38] pt-3">
                                 <div className="flex flex-col">
                                   <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Mise</span>
                                   <span className="text-white font-bold">{formatCurrency(bet.amount)}</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                   <span className="text-[9px] text-emerald-500 uppercase tracking-widest font-black">Gain Potentiel</span>
                                   <span className="text-emerald-400 font-black">{formatCurrency(bet.amount * bet.odds)}</span>
                                 </div>
                              </div>
                              {isActiveMatch && (
                                <button onClick={() => cancelBet(bet.id)} className="w-full mt-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-lg transition-colors">
                                  Cashout / Annuler
                                </button>
                              )}
                           </div>
                        </div>
                      )
                   })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}

// Add these to global index.css or via Tailwind plugin if not existing
const scrollbarCSS = `
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1a2c38; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2f4553; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
export function injectCSS() {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = scrollbarCSS;
    document.head.appendChild(style);
  }
}
injectCSS();
