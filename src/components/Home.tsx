import React from "react";
import { Search, Info, Flame, Grid, ArrowRightSquare, Heart, Tv, Lock } from "lucide-react";
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
    name: "BLACKJACK", category: "originals", link: "blackjack",
    img: "https://mediumrare.imgix.net/3a536fa64023f92764ddccad1b80102d1b32b23a2e3dac4dff52394a612fc005?w=180&h=236&fit=min&auto=format",
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
  }
];

export function Home({ view, setView }: { view: string; setView: (view: string) => void }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [likedGames, setLikedGames] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_games') || '[]');
    } catch { return []; }
  });

  const { sessionBets, globalGameStatus } = useUser() as any;

  const getGameBetsCount = (gameName: string) => {
    return sessionBets.filter((b: any) => b.game.toLowerCase() === gameName.toLowerCase()).length;
  };

  const isGameBanned = (gameName: string) => {
    if (globalGameStatus?.[gameName]) return globalGameStatus[gameName].banned;
    return ["Chicken", "Moles", "Tome of Life", "Blue Samurai", "Slide", "Crash"].some(n => gameName.toLowerCase() === n.toLowerCase());
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
        {gamesToRender.map((game) => {
          const isBanned = isGameBanned(game.name);
          const banInfo = globalGameStatus?.[game.name] || { reason: "En construction", date: new Date().toISOString() };
          return (
          <div
            key={game.name}
            className={cn("flex flex-col group", isBanned ? "cursor-not-allowed opacity-75" : "cursor-pointer")}
            onClick={() => {
              if (!isBanned) setView(game.link);
            }}
          >
            <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 bg-bg-panel group-hover:-translate-y-1 transition-transform shadow-lg">
              <img
                src={game.img}
                alt={game.name}
                className={cn("w-full h-full object-cover", isBanned && "grayscale blur-[2px]")}
              />
              {isBanned && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="bg-[#0f172a]/80 p-3 rounded-full backdrop-blur-sm">
                    <Lock className="text-[#8b9ba5]" size={32} />
                  </div>
                </div>
              )}
              {calculateIsNew(game.releaseDate) && !isBanned && (
                <div className="absolute top-2 right-2 bg-[#1475e1] text-white text-[10px] font-black px-1.5 rounded uppercase tracking-tighter shadow-md z-10 w-fit">
                  Nouveau
                </div>
              )}
              {game.badge && !isBanned && (
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
                  {game.name}
                </span>
              </div>
              <div className="group/info relative block w-full cursor-pointer text-center">
                <span className="block bg-gradient-to-tr from-[#1475e1]/80 via-[#1b80f0] to-[#1475e1] text-gray-100 rounded-md px-2 py-1.5 text-xs font-bold z-20 drop-shadow-md hover:from-[#1b80f0] hover:to-[#1475e1]">
                  Infos
                </span>
                <div className="absolute pointer-events-none block w-[180%] -top-24 left-1/2 -translate-x-1/2 z-[100]">
                  <div className="flex flex-col items-center opacity-0 transition-all ease-in duration-300 translate-y-1/2 group-hover/info:opacity-100 group-hover/info:-translate-y-1/4">
                    <div className="flex flex-col justify-start text-left w-full bg-[#0f212e] border border-[#2f4553] rounded-md p-3 drop-shadow-xl shadow-xl">
                      {isBanned ? (
                        <>
                          <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 mb-2 text-red-400">
                             <span className="font-bold">Statut</span>
                             <span>{banInfo.reason}</span>
                          </div>
                          <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 text-text-secondary">
                             <span>Date</span>
                             <span>{new Date(banInfo.date).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 opacity-0 translate-y-1 transition-all ease-in delay-200 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0">
                            <span className="text-gray-400 mt-1">RTP</span>
                            <span className="text-gray-100 mt-1">{('rtp' in game ? game.rtp : (game.category === 'slots' ? '96.50%' : '99.00%')) as string}</span>
                          </div>
                          <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 opacity-0 translate-y-1 transition-all ease-in delay-300 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0 mt-2">
                            <span className="text-gray-400">Éditeur</span>
                            <span className="text-gray-100 truncate max-w-[80px] text-right">{('provider' in game) ? game.provider : 'Stake Originals'}</span>
                          </div>
                          <div className="inline-flex justify-between items-center text-[11px] font-normal leading-3 opacity-0 translate-y-1 transition-all ease-in delay-400 duration-300 group-hover/info:opacity-100 group-hover/info:translate-y-0 mt-2">
                            <span className="text-gray-400">Date</span>
                            <span className="text-gray-100">{('releaseDate' in game && game.releaseDate) ? new Date(game.releaseDate).getFullYear() : '2023'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="h-0 w-fit border-x-[8px] border-t-[8px] border-transparent border-t-[#2f4553] -mt-[0.5px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        })}
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
      </div>

      {/* Top Banner (Latest Game) */}
      {view === "home" && (
        <div className="bg-gradient-to-r from-[#2a1b38] to-[#121f29] rounded-2xl w-full p-6 md:p-10 mb-8 border border-white/5 relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-0"></div>
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#1475e1] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-md">
                Nouveau Jeu
              </span>
              <span className="text-text-secondary text-sm font-bold">Dramatic Play</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md">Sweet Bonanza</h2>
            <p className="text-text-secondary font-medium mb-6 leading-relaxed">
              Découvrez la machine à sous sucrée Sweet Bonanza de Dramatic Play ! Profitez de symboles multiplicateurs et d'un mode tours gratuits explosif jusqu'à 21100× votre mise.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-6">
               <div className="flex flex-col">
                  <span className="text-xs text-text-secondary font-bold uppercase mb-1">RTP</span>
                  <span className="text-white font-mono font-bold bg-white/10 px-2 py-1 rounded">96.48%</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-xs text-text-secondary font-bold uppercase mb-1">Gain Max</span>
                  <span className="text-amber-400 font-mono font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded">21,100×</span>
               </div>
            </div>
            {isGameBanned("Sweet Bonanza") ? (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 font-black px-8 py-3.5 rounded-lg flex items-center gap-2 cursor-not-allowed w-fit">
                  <Lock size={18} /> Bloqué : {globalGameStatus?.["Sweet Bonanza"]?.reason || "Maintenance"}
               </div>
            ) : (
               <button
                  onClick={() => setView("sweet-bonanza")}
                  className="bg-[#00e701] hover:bg-[#00c700] text-[#0a2e0a] font-black px-8 py-3.5 rounded-lg transition-transform active:scale-95 drop-shadow flex items-center gap-2"
               >
                  Jouer Maintenant
               </button>
            )}
          </div>
          <div className="relative z-10 w-full max-w-[200px] md:max-w-[280px]">
             <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-[#0f212e]">
                <img src="https://rainbet.com/_next/image?url=https:%2F%2Frainbet-images.nyc3.cdn.digitaloceanspaces.com%2Fslots%2Fpragmatic-play-sweet-bonanza.jpg&w=828&q=75" alt="Sweet Bonanza" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      )}

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
