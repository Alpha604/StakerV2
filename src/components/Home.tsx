import React from "react";
import { Search, Info, Flame, Grid, ArrowRightSquare, Heart, Tv, Lock, Zap, Star, Ticket, Play } from "lucide-react";
import { cn } from "../lib/utils";
import { useUser } from "../context/UserContext";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const calculateIsNew = (releaseDate?: string) => {
  return false;
};

export const ALL_GAMES = [
  // Originals
  {
    name: "MINES", category: "originals", link: "mines",
    img: "https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "DICE", category: "originals", link: "dice",
    img: "https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "LIMBO", category: "originals", link: "limbo", badge: "900×",
    img: "https://mediumrare.imgix.net/11caec5df20098884ae9071848e1951b8b34e5ec84a7241f2e7c5afd4b323dfd?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "PLINKO", category: "originals", link: "plinko", badge: "10000×",
    img: "https://mediumrare.imgix.net/8c1768b783a43931a4ebc8784ce64085e39139d262e6bb50da242b9f3fda70da?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "KENO", category: "originals", link: "keno",
    img: "https://mediumrare.imgix.net/102cf3d7c840018b939cd787bf013e080b996d80e604f3008f21dddf1f1aa201?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "CHICKEN", category: "originals", link: "chicken",
    releaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/a91aa468f459264d55fb9e2706c3684782cc5ecf716892c187122c611acf2773?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "MOLES", category: "originals", link: "moles",
    releaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/5e6f7bb02df67a02a9182aab05d0976a9abbac7f45997975eed765332a8b7d73?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "CRASH", category: "originals", link: "crash",
    img: "https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "DRAGON TOWER", category: "originals", link: "dragon-tower",
    img: "https://mediumrare.imgix.net/2c3e16f0a3b8cd8d979265e48dd6a169937a4a4d0acb05ad532ca8345a1e6f21?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "HILO", category: "originals", link: "hilo",
    img: "https://mediumrare.imgix.net/fced988e1628e3f05479dc6c9ee92bea34e003f6ad7eebb25b8e2fc7f46b3042?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "FLIP", category: "originals", link: "flip",
    img: "https://mediumrare.imgix.net/1c0de2ee0ce713086ff7735697ad2b5385bc974f206b857c724a5ec84467a73b?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "BLACKJACK", category: "originals", link: "blackjack",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://mediumrare.imgix.net/ceb29aff91c7ba3033e44ee289d2eeb4e85088cdb56daac04d2e82a886542b05?w=180&h=236&fit=min&auto=format",
  },
  // Scratch Games
  {
    name: "Cash", category: "grattage", link: "scratch-cash",
    img: "https://i.postimg.cc/HkCNWdbG/Gemini-Generated-Image-ig2bjbig2bjbig2b.png",
  },
  {
    name: "Maxi Cash", category: "grattage", link: "scratch-maxi-cash",
    img: "https://i.postimg.cc/09QvwQsk/Gemini-Generated-Image-xicu6qxicu6qxicu.png",
  },
  {
    name: "Super Millionnaire", category: "grattage", link: "scratch-millionnaire",
    img: "https://i.postimg.cc/W3fMK1bv/Gemini-Generated-Image-a5qj2da5qj2da5qj.png",
  },
  {
    name: "Supra Halla", category: "grattage", link: "scratch-supra-halla",
    img: "https://i.postimg.cc/RFjRPLRC/Gemini-Generated-Image-d74tcwd74tcwd74t.png",
  },
  {
    name: "Astro FDJ", category: "grattage", link: "scratch-astro",
    img: "https://www.fdj.fr/assets/img/svg/fdj.svg", 
    provider: "FDJ",
  },
  {
    name: "Mission Patrimoine", category: "grattage", link: "scratch-patrimoine",
    img: "https://www.fdj.fr/assets/img/svg/fdj.svg", 
    provider: "FDJ",
  },
  {
    name: "WHEEL", category: "originals", link: "wheel",
    img: "https://mediumrare.imgix.net/e0a4131a16c28a1c1516958c93ec90c6f0f1bb00f41de87f72f6800c535b9c6f?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "ROULETTE", category: "originals", link: "roulette",
    img: "https://mediumrare.imgix.net/86cd89b12ec34439c0d1a6e32b06c971efc86091e09ba466182abe173c3d3f7d?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "SLIDE", category: "originals", link: "slide",
    img: "https://mediumrare.imgix.net/08512fbdc9c4163e9fae5917c47ade43a7bfe8253de88d8d16296540eab0f0a1?w=180&h=236&fit=min&auto=format",
  },
  // Slots
  {
    name: "TOME OF LIFE", category: "slots", link: "tome-of-life",
    releaseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/931cf1fd7147d0d0deda93f16fb8ef556d6d42df3586214f6539a9cfcfcf57b9?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "Blue Samurai", category: "slots", link: "slots-game",
    releaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/3a6fa5d49d31f11ce131acb64d8cbbe6cc5d8f916bd0afacaeb1fc5976aa4fdf?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "Scarab Spin", category: "slots", link: "scarab-spin",
    releaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/7a2cc695cad10b097220f0c5c81858075c3ec4ee4235d8211cbbdbbd389c6d6c?w=180&h=236&fit=min&auto=format"
  },
  {
    name: "Le Bandit", category: "slots", link: "le-bandit", provider: "Hacksaw Gaming",
    releaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/8ade942d35d2cdbddf7888f303be4cf4bda8c650a112b3c53f7c6f3ccad81254?&dpr=2&format=auto&auto=format&q=50"
  },
  {
    name: "Sweet Bonanza", category: "slots", link: "sweet-bonanza", provider: "Dramatic Play",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://rainbet.com/_next/image?url=https:%2F%2Frainbet-images.nyc3.cdn.digitaloceanspaces.com%2Fslots%2Fpragmatic-play-sweet-bonanza.jpg&w=828&q=75"
  },
  {
    name: "Super Wheel", category: "stake-gaming", link: "super-wheel", provider: "Stake Gaming", badge: "1000×",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://i.postimg.cc/QNyNmWdQ/Chat-GPT-Image-9-mai-2026-14-04-49.png"
  },
  {
    name: "Super Tower DRAGON", category: "stake-gaming", link: "super-dragon-tower", provider: "Stake Gaming",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://cdn.phototourl.com/free/2026-05-09-3653812e-e002-4f06-af39-f370dfef6e0b.png"
  },
  {
    name: "Ice Fishing", category: "evolution", link: "ice-fishing", provider: "Evolution",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://lawbhoomi.com/wp-content/uploads/2025/12/Ice-Fishing-Casino-Game-Review.jpg"
  },
  {
    name: "First Person Blackjack", category: "evolution", link: "blackjack-evolution", provider: "Evolution",
    releaseDate: new Date(Date.now()).toISOString(),
    img: "https://mediumrare.imgix.net/ceb29aff91c7ba3033e44ee289d2eeb4e85088cdb56daac04d2e82a886542b05?w=180&h=236&fit=min&auto=format"
  }
];

export function Home({ view, setView }: { view: string; setView: (view: string) => void }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [likedGames, setLikedGames] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_games') || '[]');
    } catch { return []; }
  });

  const { sessionBets, globalGameStatus, appSettings } = useUser() as any;

  const heroBannerData = React.useMemo(() => {
    if (appSettings?.homeHeroAutoMode) {
      // Pick a random game, or prioritize newest games
      const newGames = ALL_GAMES.filter((g) => calculateIsNew(g.releaseDate));
      const gameToUse = newGames.length > 0 ? newGames[0] : ALL_GAMES[0];
      return {
        title: "Nouveau Jeu",
        subtitle: ('provider' in gameToUse) ? gameToUse.provider : "Stake Originals",
        gameName: gameToUse.name,
        description: `Découvrez ${gameToUse.name}, le jeu le plus chaud du moment. Tentez votre chance et gagnez gros !`,
        bannerUrl: gameToUse.img,
        link: gameToUse.link,
        rtp: "98.50%"
      };
    }
    return {
      title: appSettings?.homeHeroTitle || "Exclusive Release",
      subtitle: appSettings?.homeHeroSubtitle || "Evolution Gaming",
      gameName: appSettings?.homeHeroGameName || "Ice Fishing",
      description: appSettings?.homeHeroDescription || "La toute nouvelle roue d'Evolution en exclusivité. Misez sur vos prises, défiez le froid polaire et pêchez des multiplicateurs jusqu'à x20 par partie !",
      bannerUrl: appSettings?.homeHeroBannerUrl || "https://lawbhoomi.com/wp-content/uploads/2025/12/Ice-Fishing-Casino-Game-Review.jpg",
      link: appSettings?.homeHeroLink || "ice-fishing",
      rtp: appSettings?.homeHeroRTP || "98.50%"
    };
  }, [appSettings]);

  // Search logic for dropdown
  const desktopSearchMatches = React.useMemo(() => {
    if (!searchQuery) return [];
    return ALL_GAMES.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.provider?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8); // top 8 results
  }, [searchQuery]);

  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const getGameBetsCount = (gameName: string) => {
    return sessionBets.filter((b: any) => (typeof b.game === 'string' ? b.game : '').toLowerCase() === gameName.toLowerCase()).length;
  };

  const DEFAULT_BANNED = ["Chicken", "Moles", "Tome of Life", "Blue Samurai", "Slide", "Crash"];

  const isGameBanned = (gameName: string, categoryName: string) => {
    if (globalGameStatus?.["categories"]?.[categoryName]?.banned) return true;
    
    // Check if there is an explicit config set by admin
    if (globalGameStatus?.[gameName] && globalGameStatus[gameName].banned !== undefined) {
      return globalGameStatus[gameName].banned;
    }
    
    // Otherwise fallback to default banned list
    if (DEFAULT_BANNED.some(n => gameName.toLowerCase() === n.toLowerCase())) return true;
    
    return false;
  };

  const toggleLike = (e: React.MouseEvent, gameName: string) => {
    e.stopPropagation();
    setLikedGames(prev => {
      const newLiked = prev.includes(gameName) ? prev.filter(g => g !== gameName) : [...prev, gameName];
      localStorage.setItem('liked_games', JSON.stringify(newLiked));
      return newLiked;
    });
  };

  const tabs = [
    { name: "Accueil", icon: Grid, id: "home" },
    { name: "Favoris", icon: Heart, id: "favorites" },
    { name: "Originaux de Stake", icon: Flame, id: "originals" },
    { name: "Machines à sous", icon: ArrowRightSquare, id: "slots" },
    { name: "Evolution", icon: Zap, id: "evolution" },
    { name: "Stake Gaming", icon: Tv, id: "stake-gaming" },
    { name: "Grattage", icon: Ticket, id: "grattage" }
  ];

  let filteredGames = ALL_GAMES.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active filter logic based on `view`
  if (view === "favorites") {
    filteredGames = filteredGames.filter(g => likedGames.includes(g.name));
  } else if (view === "originals") {
    filteredGames = filteredGames.filter(g => g.category === "originals");
  } else if (view === "slots") {
    filteredGames = filteredGames.filter(g => g.category === "slots");
  } else if (view === "stake-gaming") {
    filteredGames = filteredGames.filter(g => g.category === "stake-gaming");
  } else if (view === "evolution") {
    filteredGames = filteredGames.filter(g => g.category === "evolution");
  } else if (view === "grattage") {
    filteredGames = filteredGames.filter(g => g.category === "grattage"); // show grattage category
  }

  const renderGameGrid = (gamesToRender: typeof ALL_GAMES) => {
    if (gamesToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-panel border border-border-subtle rounded-2xl">
          <Info className="text-text-secondary mb-4" size={48} />
          <h3 className="text-white text-xl font-bold mb-2">Aucun jeu trouvé</h3>
          <p className="text-text-secondary font-medium">Réessayez avec une autre recherche ou parcourez notre catalogue.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {gamesToRender.map((game) => {
          const isBanned = isGameBanned(game.name, game.category);
          const isCategoryBanned = globalGameStatus?.["categories"]?.[game.category]?.banned;
          const banInfo = isCategoryBanned 
             ? globalGameStatus?.["categories"]?.[game.category] 
             : (globalGameStatus?.[game.name] || { reason: "En construction", date: new Date().toISOString() });
          return (
          <div
            key={game.name}
            className={cn("flex flex-col group", isBanned ? "cursor-not-allowed opacity-75" : "cursor-pointer")}
            onClick={() => {
              if (!isBanned) setView(game.link);
            }}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-3 bg-[#0f172a] group-hover:-translate-y-2 transition-all duration-300 shadow-md group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5 group-hover:ring-white/20">
              <img
                src={game.img}
                alt={game.name}
                className={cn("w-full h-full object-cover transition-transform duration-700 group-hover:scale-110", isBanned && "grayscale blur-[2px]")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18] via-transparent to-transparent opacity-80 z-10 pointer-events-none"></div>
              {isBanned && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                  <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <Lock className="text-red-400" size={32} />
                  </div>
                </div>
              )}
              {(calculateIsNew(game.releaseDate) || globalGameStatus?.[game.name]?.isNew) && !isBanned && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md z-20 uppercase tracking-widest">
                  New
                </div>
              )}
              {game.badge && !isBanned && (
                <div className="absolute top-2 right-2 bg-[#ffb300] text-[#0f172a] text-[10px] font-black px-2 py-0.5 rounded shadow-md z-20 uppercase tracking-widest">
                  {game.badge}
                </div>
              )}
              {/* Like Button */}
              <div 
                className="absolute top-2 left-2 z-30 cursor-pointer p-1 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/60 transition-colors"
                onClick={(e) => toggleLike(e, game.name)}
              >
                <Heart 
                  size={16} 
                  className={cn("transition-colors", likedGames.includes(game.name) ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "text-white/60 hover:text-white")} 
                />
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none backdrop-blur-[2px]">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
                  <Play fill="currentColor" stroke="none" size={24} className="ml-1" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col relative px-0.5 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors truncate">
                  {game.name}
                </span>
                
                <div className="group/info relative flex items-center justify-center">
                  <Info size={16} className="text-[#8b9ba5] hover:text-white transition-colors cursor-help z-30" />
                  
                  <div className="absolute pointer-events-none opacity-0 scale-95 translate-y-2 origin-bottom transition-all duration-200 ease-out group-hover/info:opacity-100 group-hover/info:scale-100 group-hover/info:translate-y-0 w-[240px] bottom-full mb-2 right-[-10px] md:translate-x-0 md:right-auto md:-left-2 z-[100] drop-shadow-2xl">
                    <div className="flex flex-col w-full bg-[#0f212e] border border-[#2f4553] rounded-lg p-3 shadow-2xl">
                      <div className="mb-2 border-b border-[#2f4553] pb-2 flex items-center justify-between">
                         <span className="text-white font-bold text-sm truncate">{game.name}</span>
                         {(calculateIsNew(game.releaseDate) || globalGameStatus?.[game.name]?.isNew) && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">New</span>}
                      </div>
                      {isBanned ? (
                        <>
                          <div className="flex justify-between items-center text-[12px] font-bold text-red-500 bg-red-500/10 px-2 py-1.5 rounded mb-2">
                             <span>Interdit</span>
                             <span className="truncate max-w-[100px] text-right ml-2">{banInfo.reason}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-medium text-[#8b9ba5] px-1">
                             <span>Date</span>
                             <span className="text-gray-300">{new Date(banInfo.date).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[12px] font-bold bg-[#1a2c38] px-2 py-1 rounded">
                            <span className="text-[#8b9ba5]">RTP</span>
                            <span className="text-emerald-400 font-mono">{('rtp' in game ? game.rtp : (game.category === 'slots' ? '96.50%' : '99.00%')) as string}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-medium px-1 mt-1">
                            <span className="text-[#8b9ba5]">Fournisseur</span>
                            <span className="text-white truncate max-w-[100px] text-right">{('provider' in game) ? game.provider : 'Stake'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-medium px-1">
                            <span className="text-[#8b9ba5]">Sortie</span>
                            <span className="text-white">{('releaseDate' in game && game.releaseDate) ? new Date(game.releaseDate).getFullYear() : '2023'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isBanned ? "bg-red-500" : "bg-emerald-500 group-hover:shadow-[0_0_5px_currentColor]")}></div>
                <span className="text-[11px] text-[#8b9ba5] font-medium tracking-wide truncate">
                  {('provider' in game) ? game.provider : 'Stake Originals'}
                </span>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-3 md:p-8 flex flex-col min-h-[calc(100vh-80px)] overflow-x-hidden">
      {/* Search Input */}
      <div className="relative mb-4 md:mb-6">
        <div className="relative z-10">
          <Search
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4 md:w-5 md:h-5"
          />
          <input
            type="text"
            placeholder="Cherchez votre jeu"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full bg-[#0f212e] border border-border-subtle rounded-xl py-2.5 md:py-3.5 pl-10 md:pl-12 pr-4 text-white text-sm md:text-base font-medium focus:outline-none focus:border-accent hover:border-border-medium transition-all cursor-text hover:bg-[#1a2c38] shadow-sm relative z-10"
          />
        </div>

        {/* Autocomplete Dropdown (Desktop & Mobile Support) */}
        {isSearchFocused && searchQuery && desktopSearchMatches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f212e] border border-border-subtle rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[300px] md:max-h-[400px] overflow-y-auto w-full animate-in fade-in slide-in-from-top-2 z-[60]">
            <div className="p-2 border-b border-border-subtle text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-secondary bg-[#0a161f]">
              Résultats pour "{searchQuery}"
            </div>
            {desktopSearchMatches.map((game, i) => (
              <div 
                key={game.link + i}
                onClick={() => {
                  if (!isGameBanned(game.name, game.category)) {
                    typeof setView === 'function' && setView(game.link);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 md:gap-4 p-2.5 md:p-3 hover:bg-[#1a2c38] cursor-pointer transition-colors border-b border-white/5 last:border-0",
                  isGameBanned(game.name, game.category) && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <img src={game.img} alt={game.name} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-md" />
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs md:text-sm tracking-wide">{game.name}</span>
                  <span className="text-text-secondary text-[10px] md:text-xs">{('provider' in game) ? game.provider : 'Stake Originals'}</span>
                </div>
                {isGameBanned(game.name, game.category) && (
                  <div className="ml-auto flex items-center gap-1.5 md:gap-2">
                     <Lock className="text-text-secondary w-3 h-3 md:w-4 md:h-4" />
                     <span className="text-text-secondary text-[10px] md:text-xs">Indisponible</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav Tabs */}
      <div className="flex overflow-x-auto no-scrollbar items-center gap-2 pb-3 md:pb-4 border-b border-border-subtle mb-4 md:mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                "px-3 md:px-4 py-2 md:py-2.5 rounded-full flex items-center shrink-0 gap-1.5 md:gap-2 text-xs md:text-sm font-bold transition-all shadow-sm",
                active
                  ? "bg-white text-black drop-shadow-md"
                  : "bg-bg-panel text-text-secondary hover:bg-bg-inner hover:text-white border border-border-subtle cursor-pointer",
              )}
            >
              <Icon size={14} className={cn(active ? "text-accent text-[currentColor]" : "", "md:w-4 md:h-4")} /> <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Top Banner (Latest Game) */}
      {view === "home" && appSettings?.homeHeroEnabled !== false && (
        <div className="relative rounded-3xl w-full min-h-[380px] md:min-h-[420px] mb-8 overflow-hidden group shadow-2xl flex flex-col justify-end p-8 md:p-12 border border-white/10 transition-all hover:border-white/20">
          
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
             <img 
               src={heroBannerData.bannerUrl} 
               alt="Hero Banner" 
               className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out origin-center" 
             />
             {/* Dynamic Gradients overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-[#0f212e]/80 to-transparent"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-[#0f212e] via-[#0f212e]/50 to-transparent"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 max-w-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {heroBannerData.title}
              </span>
              <span className="text-gray-300 text-xs font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10 rounded-sm">
                {heroBannerData.subtitle}
              </span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-tighter uppercase leading-none">
              {heroBannerData.gameName ? (
                <>
                  {heroBannerData.gameName.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{heroBannerData.gameName.split(' ').slice(1).join(' ')}</span>
                </>
              ) : (
                <>Ice <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Fishing</span></>
              )}
            </h2>
            
            <p className="text-gray-300 font-medium mb-8 leading-relaxed text-lg max-w-xl text-shadow-sm">
              {heroBannerData.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              {isGameBanned(heroBannerData.gameName, "evolution") ? (
                 <div className="bg-red-500/10 border border-red-500/20 text-red-500 font-black px-8 py-3.5 rounded-lg flex items-center gap-2 cursor-not-allowed backdrop-blur-md">
                    <Lock size={18} /> Bloqué : {globalGameStatus?.[heroBannerData.gameName]?.reason || "Maintenance"}
                 </div>
              ) : (
                 <button
                    onClick={() => {
                        typeof setView === 'function' && setView(heroBannerData.link as any);
                    }}
                    className="bg-white text-black font-black py-4 px-10 rounded-full transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
                 >
                    Jouer Maintenant <ArrowRightSquare size={20} className="text-emerald-600" />
                 </button>
              )}
              
              <div className="hidden md:flex items-center gap-6 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest leading-none mb-1">RTP</span>
                    <span className="text-white font-mono font-bold leading-none">{heroBannerData.rtp}</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest leading-none mb-1">Volatilité</span>
                    <div className="flex items-center gap-1">
                      <Zap size={10} className="text-amber-400 fill-amber-400" />
                      <Zap size={10} className="text-amber-400 fill-amber-400" />
                      <Zap size={10} className="text-amber-400 fill-amber-400" />
                      <Zap size={10} className="text-gray-600 fill-gray-600" />
                      <Zap size={10} className="text-gray-600 fill-gray-600" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results based on view */}
      {view === "home" ? (
        <>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Star className="text-yellow-400" size={24} /> <span>Nouveautés</span>
            </h2>
          </div>
          {renderGameGrid(filteredGames.filter(g => globalGameStatus?.[g.name]?.isNew))}

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Flame className="text-text-secondary" size={24} /> <span>Originaux de Stake</span>
            </h2>
            <button
              onClick={() => setView("originals")}
              className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
            >
              Voir Tout
            </button>
          </div>
          {renderGameGrid(filteredGames.filter(g => g.category === "originals").slice(0, 12))}

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Tv className="text-text-secondary" size={24} /> <span>Stake Gaming</span>
            </h2>
            <button
              onClick={() => setView("stake-gaming")}
              className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
            >
              Voir Tout
            </button>
          </div>
          {renderGameGrid(filteredGames.filter(g => g.category === "stake-gaming"))}

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Zap className="text-emerald-500" size={24} /> <span>Evolution</span>
            </h2>
            <button
              onClick={() => setView("evolution")}
              className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
            >
              Voir Tout
            </button>
          </div>
          {renderGameGrid(filteredGames.filter(g => g.category === "evolution"))}

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <ArrowRightSquare className="text-text-secondary" size={24} /> <span>Machines à sous</span>
            </h2>
            <button
              onClick={() => setView("slots")}
              className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
            >
              Voir Tout
            </button>
          </div>
          {renderGameGrid(filteredGames.filter(g => g.category === "slots"))}

          <div className="flex items-center justify-between mb-4 mt-8">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Ticket className="text-orange-500" size={24} /> <span>Tickets à gratter</span>
            </h2>
            <button
              onClick={() => setView("grattage")}
              className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
            >
              Voir Tout
            </button>
          </div>
          {renderGameGrid(filteredGames.filter(g => g.category === "grattage"))}
        </>
      ) : view === "slots" ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4 mt-2">
             <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Grid className="text-accent" size={24} />
                <span>Machines à sous</span>
             </h2>
          </div>
          
          {Array.from(new Set(filteredGames.map(g => g.provider || "Stake Originals"))).map(provider => {
             const providerGames = filteredGames.filter(g => (g.provider || "Stake Originals") === provider);
             if (providerGames.length === 0) return null;
             return (
               <div key={provider} className="mt-4 mb-6">
                 <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
                    <div>{provider} <span className="text-sm font-normal text-text-secondary ml-2">{providerGames.length} jeux</span></div>
                 </h3>
                 {renderGameGrid(providerGames)}
               </div>
             )
          })}
        </div>
      ) : (
        <div className="flex flex-col">
          {view !== "leaderboard" && (
            <div className="flex items-center justify-between mb-4 mt-2">
               <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  {tabs.find(t => t.id === view)?.icon && React.createElement(tabs.find(t => t.id === view)!.icon, { className: "text-accent", size: 24 })}
                  <span>{tabs.find(t => t.id === view)?.name}</span>
               </h2>
            </div>
          )}
          {view !== "leaderboard" && renderGameGrid(filteredGames)}
        </div>
      )}

      {filteredGames.length > 12 && view === "home" && (
          <div className="flex justify-center mt-4 mb-12">
            <button className="bg-bg-panel hover:bg-bg-inner border border-border-subtle hover:border-white text-white font-bold px-12 py-3 rounded-full text-sm transition-colors cursor-pointer">
              Charger Plus
            </button>
          </div>
      )}
    </div>
  );
}
