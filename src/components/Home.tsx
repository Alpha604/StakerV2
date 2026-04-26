import React from "react";
import { motion } from "motion/react";
import {
  Search,
  Info,
  Flame,
  Grid,
  Gamepad2,
  Tv,
  ArrowRightSquare,
  Heart,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const calculateIsNew = (releaseDate?: string) => {
  if (!releaseDate) return false;
  return Date.now() - new Date(releaseDate).getTime() < SEVEN_DAYS_MS;
};

const games = [
  {
    name: "DICE",
    players: "3 305",
    img: "https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?w=180&h=236&fit=min&auto=format",
    link: "dice",
  },
  {
    name: "MINES",
    players: "4 323",
    img: "https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?w=180&h=236&fit=min&auto=format",
    link: "mines",
  },
  {
    name: "PLINKO",
    players: "2 467",
    img: "https://mediumrare.imgix.net/8c1768b783a43931a4ebc8784ce64085e39139d262e6bb50da242b9f3fda70da?w=180&h=236&fit=min&auto=format",
    link: "plinko",
    badge: "10000×",
  },
  {
    name: "MOLES",
    players: "856",
    img: "https://mediumrare.imgix.net/5e6f7bb02df67a02a9182aab05d0976a9abbac7f45997975eed765332a8b7d73?w=180&h=236&fit=min&auto=format",
    link: "moles",
    releaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    name: "CHICKEN",
    players: "830",
    img: "https://mediumrare.imgix.net/a91aa468f459264d55fb9e2706c3684782cc5ecf716892c187122c611acf2773?w=180&h=236&fit=min&auto=format",
    link: "chicken",
    releaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    name: "CRASH",
    players: "1 734",
    img: "https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?w=180&h=236&fit=min&auto=format",
    link: "crash",
    releaseDate: "2023-01-01T00:00:00.000Z",
  },
  {
    name: "KENO",
    players: "2 340",
    img: "https://mediumrare.imgix.net/102cf3d7c840018b939cd787bf013e080b996d80e604f3008f21dddf1f1aa201?w=180&h=236&fit=min&auto=format",
    link: "keno",
  },
  {
    name: "LIMBO",
    players: "2 918",
    img: "https://mediumrare.imgix.net/11caec5df20098884ae9071848e1951b8b34e5ec84a7241f2e7c5afd4b323dfd?w=180&h=236&fit=min&auto=format",
    link: "limbo",
    badge: "900×",
  },
];

const newGames = [
  {
    name: "Tome of Life",
    img: "https://mediumrare.imgix.net/931cf1fd7147d0d0deda93f16fb8ef556d6d42df3586214f6539a9cfcfcf57b9?w=180&h=236&fit=min&auto=format",
    link: "tome-of-life",
    releaseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
  },
  {
    name: "Classic Slots",
    img: "https://mediumrare.imgix.net/5292ebbf1d5d1c251d17cf3607736dbdf1da3e3bb5140bf6f168019a3eb6ea9f?w=180&h=236&fit=min&auto=format",
    link: "slots",
    releaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export function Home({ setView }: { setView: (view: string) => void }) {
  const [activeTab, setActiveTab] = React.useState("Accueil du casino");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [likedGames, setLikedGames] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('liked_games') || '[]');
    } catch { return []; }
  });

  const toggleLike = (e: React.MouseEvent, gameName: string) => {
    e.stopPropagation();
    setLikedGames(prev => {
      const newLiked = prev.includes(gameName) ? prev.filter(g => g !== gameName) : [...prev, gameName];
      localStorage.setItem('liked_games', JSON.stringify(newLiked));
      return newLiked;
    });
  };

  const tabs = [
    { name: "Accueil du casino", icon: Grid },
    { name: "Uniquement sur Stake", icon: Flame },
    { name: "Nouvelles sorties", icon: Info },
    { name: "Originaux de Stake", icon: Gamepad2 },
    { name: "Machines à sous", icon: ArrowRightSquare },
  ];

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
          className="w-full bg-bg-panel border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-border-medium hover:border-border-medium transition-colors cursor-text hover:bg-bg-inner"
        />
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-border-subtle mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-colors",
                active
                  ? "bg-bg-inner text-white"
                  : "text-text-secondary hover:bg-bg-panel hover:text-white",
              )}
            >
              <Icon size={16} /> <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* section: Originaux de Stake */}
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

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {games.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((game) => (
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
                <div className="absolute top-2 left-2 bg-[#ffb300] text-[#0f172a] text-[10px] font-black px-1.5 rounded uppercase tracking-tighter">
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
              <div className="absolute bottom-2 inset-x-0 bottom-indicator group-hover:opacity-100 opacity-0 transition-opacity flex justify-center pointer-events-none">
                <div className="bg-black/60 rounded-full px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 backdrop-blur-sm">
                  <Info size={10} /> Info
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]"></div>
              <span className="text-[11px] font-bold text-text-secondary group-hover:text-white transition-colors">
                {game.players}{" "}
                <span className="font-medium opacity-70">joueurs</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* section: Machines à sous (Only on Stake / new games) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-xl flex items-center gap-2">
          <ArrowRightSquare className="text-text-secondary" size={24} />{" "}
          <span>Machines à sous</span>
        </h2>
        <button
          onClick={() => setView("slots")}
          className="text-sm font-bold text-text-secondary hover:text-white transition-colors"
        >
          Voir Tout
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {newGames.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((game) => (
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
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-text-secondary group-hover:text-white transition-colors truncate">
                {game.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4 mb-12">
        <button className="bg-bg-panel hover:bg-bg-inner border border-text-secondary hover:border-white text-white font-bold px-12 py-3 rounded-full text-sm transition-colors cursor-pointer">
          Charger Plus
        </button>
      </div>
    </div>
  );
}
