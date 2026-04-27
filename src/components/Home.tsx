import React from "react";
import { Search, Info, Flame, Grid, ArrowRightSquare, Heart, Tv } from "lucide-react";
import { cn } from "../lib/utils";
import { useUser } from "../context/UserContext";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const calculateIsNew = (releaseDate?: string) => {
  if (!releaseDate) return false;
  return Date.now() - new Date(releaseDate).getTime() < SEVEN_DAYS_MS;
};

const ALL_GAMES = [
  // Originals
  {
    name: "MINES", players: "3 521", category: "originals", link: "mines",
    img: "https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "DICE", players: "2 608", category: "originals", link: "dice",
    img: "https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "LIMBO", players: "2 226", category: "originals", link: "limbo", badge: "900×",
    img: "https://mediumrare.imgix.net/11caec5df20098884ae9071848e1951b8b34e5ec84a7241f2e7c5afd4b323dfd?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "PLINKO", players: "1 573", category: "originals", link: "plinko", badge: "10000×",
    img: "https://mediumrare.imgix.net/8c1768b783a43931a4ebc8784ce64085e39139d262e6bb50da242b9f3fda70da?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "BLACKJACK", players: "1 215", category: "originals", link: "blackjack",
    img: "https://mediumrare.imgix.net/3a536fa64023f92764ddccad1b80102d1b32b23a2e3dac4dff52394a612fc005?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "KENO", players: "1 150", category: "originals", link: "keno",
    img: "https://mediumrare.imgix.net/102cf3d7c840018b939cd787bf013e080b996d80e604f3008f21dddf1f1aa201?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "CHICKEN", players: "920", category: "originals", link: "chicken",
    releaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/a91aa468f459264d55fb9e2706c3684782cc5ecf716892c187122c611acf2773?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "MOLES", players: "856", category: "originals", link: "moles",
    releaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/5e6f7bb02df67a02a9182aab05d0976a9abbac7f45997975eed765332a8b7d73?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "CRASH", players: "1 419", category: "originals", link: "crash",
    img: "https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "DRAGON TOWER", players: "656", category: "originals", link: "dragon-tower",
    img: "https://mediumrare.imgix.net/2c3e16f0a3b8cd8d979265e48dd6a169937a4a4d0acb05ad532ca8345a1e6f21?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "HILO", players: "566", category: "originals", link: "hilo",
    img: "https://mediumrare.imgix.net/fced988e1628e3f05479dc6c9ee92bea34e003f6ad7eebb25b8e2fc7f46b3042?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "FLIP", players: "303", category: "originals", link: "flip",
    img: "https://mediumrare.imgix.net/1c0de2ee0ce713086ff7735697ad2b5385bc974f206b857c724a5ec84467a73b?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "WHEEL", players: "291", category: "originals", link: "wheel",
    img: "https://mediumrare.imgix.net/e0a4131a16c28a1c1516958c93ec90c6f0f1bb00f41de87f72f6800c535b9c6f?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "ROULETTE", players: "160", category: "originals", link: "roulette",
    img: "https://mediumrare.imgix.net/86cd89b12ec34439c0d1a6e32b06c971efc86091e09ba466182abe173c3d3f7d?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "SLIDE", players: "84", category: "originals", link: "slide",
    img: "https://mediumrare.imgix.net/08512fbdc9c4163e9fae5917c47ade43a7bfe8253de88d8d16296540eab0f0a1?w=180&h=236&fit=min&auto=format",
  },
  // Slots
  {
    name: "TOME OF LIFE", players: "105", category: "slots", link: "tome-of-life",
    releaseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/931cf1fd7147d0d0deda93f16fb8ef556d6d42df3586214f6539a9cfcfcf57b9?w=180&h=236&fit=min&auto=format",
  },
  {
    name: "Classic Slots", players: "1 245", category: "slots", link: "slots-game",
    releaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    img: "https://mediumrare.imgix.net/3a6fa5d49d31f11ce131acb64d8cbbe6cc5d8f916bd0afacaeb1fc5976aa4fdf?w=180&h=236&fit=min&auto=format",
  }
];

export function Home({ view, setView }: { view: string; setView: (view: string) => void }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [likedGames, setLikedGames] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_games') || '[]');
    } catch { return []; }
  });
  
  const [totalBets] = React.useState<Record<string, number>>(() => {
    const bets: Record<string, number> = {};
    ALL_GAMES.forEach(g => {
       bets[g.name] = Math.floor(Math.random() * 500000) + 10000;
    });
    return bets;
  });

  const { sessionBets } = useUser();

  const getGameBetsCount = (gameName: string) => {
    const fakeCount = totalBets[gameName] || 0;
    const realCount = sessionBets.filter(b => b.game.toLowerCase() === gameName.toLowerCase()).length;
    return fakeCount + realCount;
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
  ];

  let filteredGames = ALL_GAMES.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active filter logic based on `view`
  if (view === "favorites") {
    filteredGames = filteredGames.filter(g => likedGames.includes(g.name));
  } else if (view === "originals") {
    filteredGames = filteredGames.filter(g => g.category === "originals");
  } else if (view === "slots") {
    filteredGames = filteredGames.filter(g => g.category === "slots");
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
        {gamesToRender.map((game) => (
          <div
            key={game.name}
            className="flex flex-col group cursor-pointer"
            onClick={() => setView(game.link)}
          >
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 bg-bg-panel group-hover:-translate-y-1 transition-transform shadow-lg">
              <img
                src={game.img}
                alt={game.name}
                className="w-full h-full object-cover"
              />
              {calculateIsNew(game.releaseDate) && (
                <div className="absolute top-2 right-2 bg-[#1475e1] text-white text-[10px] font-black px-1.5 rounded uppercase tracking-tighter shadow-md z-10 w-fit">
                  Nouveau
                </div>
              )}
              {game.badge && (
                <div className="absolute top-2 right-2 bg-[#ffb300] text-[#0f172a] text-[10px] font-black px-1.5 rounded uppercase tracking-tighter z-10">
                  {game.badge}
                </div>
              )}
              {/* Like Button */}
              <div 
                className="absolute top-2 left-2 z-20 cursor-pointer p-1"
                onClick={(e) => toggleLike(e, game.name)}
              >
                <Heart 
                  size={16} 
                  className={cn("transition-colors", likedGames.includes(game.name) ? "fill-[#ed4163] text-[#ed4163]" : "text-white/50 hover:text-white")} 
                />
              </div>

              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
            </div>
            <div className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]"></div>
                <span className="text-[11px] font-bold text-text-secondary group-hover:text-white transition-colors truncate">
                  {game.name} <span className="opacity-60">({game.players})</span>
                </span>
              </div>
              <div className="group/info relative block w-full cursor-pointer text-center">
                <span className="block bg-gradient-to-tr from-[#1475e1]/80 via-[#1b80f0] to-[#1475e1] text-gray-100 rounded-md px-2 py-1.5 text-xs font-bold z-20 drop-shadow-md hover:from-[#1b80f0] hover:to-[#1475e1]">
                  Infos
                </span>
                <div className="absolute pointer-events-none block w-[180%] -top-32 left-1/2 -translate-x-1/2 z-[100]">
                  <div className="flex flex-col items-center opacity-0 transition-all ease-in duration-300 translate-y-1/2 group-hover/info:opacity-100 group-hover/info:-translate-y-1/4">
                    <div className="flex flex-col justify-start text-left w-full bg-[#0f212e] border border-[#2f4553] rounded-md p-3 drop-shadow-xl shadow-xl">
                      <span className="text-xs font-normal text-gray-400 leading-3">Joueurs en ligne</span>
                      <div className="inline-flex justify-between items-center opacity-0 translate-y-1 transition-all ease-in delay-100 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0 mt-1">
                        <span className="text-lg font-bold tracking-wide text-white">{game.players}</span>
                        <div className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 fill-[#00e701]">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.53 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v5.69a.75.75 0 0 0 1.5 0v-5.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-normal text-white ml-1">Stat.</span>
                        </div>
                      </div>
                      <div className="border-b border-[#2f4553] mx-2 my-2"></div>
                      <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 opacity-0 translate-y-1 transition-all ease-in delay-200 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0">
                        <span className="text-gray-400 mt-1">Mises totales</span>
                        <span className="text-gray-100 mt-1">{getGameBetsCount(game.name).toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 opacity-0 translate-y-1 transition-all ease-in delay-300 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0 mt-2">
                        <span className="text-gray-400">Gain Max.</span>
                        <span className="text-gray-100">{game.badge || "100×"}</span>
                      </div>
                    </div>
                    <div className="h-0 w-fit border-x-[8px] border-t-[8px] border-transparent border-t-[#2f4553] -mt-[0.5px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col min-h-[calc(100vh-80px)] overflow-x-hidden">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
          size={20}
        />
        <input
          type="text"
          placeholder="Cherchez votre jeu"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-panel border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-border-medium hover:border-border-medium transition-colors cursor-text hover:bg-bg-inner shadow-sm"
        />
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border-subtle mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all shadow-sm",
                active
                  ? "bg-white text-black drop-shadow-md"
                  : "bg-bg-panel text-text-secondary hover:bg-bg-inner hover:text-white border border-border-subtle cursor-pointer",
              )}
            >
              <Icon size={16} className={active ? "text-accent text-[currentColor]" : ""} /> <span>{tab.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => setView("leaderboard")}
          className={cn(
            "px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all shadow-sm cursor-pointer",
            view === "leaderboard" 
               ? "bg-white text-black drop-shadow-md"
               : "bg-bg-panel text-text-secondary hover:bg-bg-inner hover:text-white border border-border-subtle"
          )}
        >
           <Tv size={16} /> <span>Classement</span>
        </button>
      </div>

      {/* Results based on view */}
      {view === "home" ? (
        <>
          <div className="flex items-center justify-between mb-4 mt-2">
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
        </>
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
