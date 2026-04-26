import React, { useState } from "react";
import { cn } from "../lib/utils";
import { Target, Info } from "lucide-react";
import { GameInfoModal } from "./GameInfoModal";

export function Originals({ setView }: { setView: (view: any) => void }) {
  const [infoModalGame, setInfoModalGame] = useState<any>(null);

  const games = [
    {
      name: "MINES",
      players: "3 521",
      bg: "from-[#2094f3] to-[#0c439c]",
      action: () => setView("mines"),
      img: "https://mediumrare.imgix.net/15a51a2ae2895872ae2b600fa6fe8d7f8d32c9814766b66ddea2b288d04ba89c?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "DICE",
      players: "2 608",
      bg: "from-[#ba54e5] to-[#7b2cbf]",
      action: () => setView("dice"),
      img: "https://mediumrare.imgix.net/30688668d7d2d48d472edd0f1e2bca0758e7ec51cbab8c04d8b7f157848640e0?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "LIMBO",
      players: "2 226",
      bg: "from-[#ffb300] to-[#fb8c00]",
      action: () => setView("limbo"),
      img: "https://mediumrare.imgix.net/11caec5df20098884ae9071848e1951b8b34e5ec84a7241f2e7c5afd4b323dfd?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "PLINKO",
      players: "1 573",
      bg: "from-[#ff4081] to-[#e91e63]",
      action: () => setView("plinko"),
      img: "https://mediumrare.imgix.net/8c1768b783a43931a4ebc8784ce64085e39139d262e6bb50da242b9f3fda70da?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "BLACKJACK",
      players: "1 215",
      bg: "from-[#ef5350] to-[#c62828]",
      action: () => setView("blackjack"),
      img: "https://mediumrare.imgix.net/3a536fa64023f92764ddccad1b80102d1b32b23a2e3dac4dff52394a612fc005?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "KENO",
      players: "1 150",
      bg: "from-[#5e35b1] to-[#311b92]",
      action: () => setView("keno"),
      img: "https://mediumrare.imgix.net/102cf3d7c840018b939cd787bf013e080b996d80e604f3008f21dddf1f1aa201?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "CHICKEN",
      players: "920",
      bg: "from-[#f4511e] to-[#bf360c]",
      action: () => setView("chicken"),
      img: "https://mediumrare.imgix.net/a91aa468f459264d55fb9e2706c3684782cc5ecf716892c187122c611acf2773?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "MOLES",
      players: "856",
      bg: "from-[#2094f3] to-[#0c439c]",
      action: () => setView("moles"),
      img: "https://mediumrare.imgix.net/5e6f7bb02df67a02a9182aab05d0976a9abbac7f45997975eed765332a8b7d73?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "CRASH",
      players: "1 419",
      bg: "from-[#29b6f6] to-[#0277bd]",
      action: () => setView("crash"),
      img: "https://mediumrare.imgix.net/c830595cbd07b2561ac76a365c2f01869dec9a8fe5e7be30634d78c51b2cc91e?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "DRAGON TOWER",
      players: "656",
      bg: "from-[#ffa726] to-[#e65100]",
      action: () => setView("dragon-tower"),
      img: "https://mediumrare.imgix.net/2c3e16f0a3b8cd8d979265e48dd6a169937a4a4d0acb05ad532ca8345a1e6f21?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "HILO",
      players: "566",
      bg: "from-[#00e676] to-[#009624]",
      action: () => setView("hilo"),
      img: "https://mediumrare.imgix.net/fced988e1628e3f05479dc6c9ee92bea34e003f6ad7eebb25b8e2fc7f46b3042?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "FLIP",
      players: "303",
      bg: "from-[#66bb6a] to-[#2e7d32]",
      action: () => setView("flip"),
      img: "https://mediumrare.imgix.net/1c0de2ee0ce713086ff7735697ad2b5385bc974f206b857c724a5ec84467a73b?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "WHEEL",
      players: "291",
      bg: "from-[#ffca28] to-[#ef6c00]",
      action: () => setView("wheel"),
      img: "https://mediumrare.imgix.net/e0a4131a16c28a1c1516958c93ec90c6f0f1bb00f41de87f72f6800c535b9c6f?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "ROULETTE",
      players: "160",
      bg: "from-[#00c853] to-[#00796b]",
      action: () => setView("roulette"),
      img: "https://mediumrare.imgix.net/86cd89b12ec34439c0d1a6e32b06c971efc86091e09ba466182abe173c3d3f7d?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "TOME OF LIFE",
      players: "105",
      bg: "from-[#8d6e63] to-[#4e342e]",
      action: () => setView("tome-of-life"),
      img: "https://mediumrare.imgix.net/931cf1fd7147d0d0deda93f16fb8ef556d6d42df3586214f6539a9cfcfcf57b9?w=180&h=236&fit=min&auto=format",
    },
    {
      name: "SLIDE",
      players: "84",
      bg: "from-[#ec407a] to-[#c2185b]",
      action: () => setView("slide"),
      img: "https://mediumrare.imgix.net/08512fbdc9c4163e9fae5917c47ade43a7bfe8253de88d8d16296540eab0f0a1?w=180&h=236&fit=min&auto=format",
    },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 min-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Target size={20} className="text-accent" />
        </div>
        <h2 className="text-white text-xl font-bold tracking-tight">
          Stake Originals
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
        {games.map((g) => (
          <div
            key={g.name}
            className="flex flex-col gap-2 group cursor-pointer"
            onClick={() =>
              g.action ? g.action() : alert("This game is coming soon!")
            }
          >
            <div
              className={cn(
                "aspect-[3/4] w-full rounded-xl overflow-hidden relative shadow-[0_10px_20px_rgba(0,0,0,0.2)] transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-0",
                "bg-gradient-to-br",
                g.bg,
              )}
            >
              {/* Custom Art Illustration */}
              <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
                {g.img && (
                  <img
                    src={g.img}
                    alt={g.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModalGame(g.name.toLowerCase().replace(/ /g, "-"));
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-20"
              >
                <Info size={16} />
              </button>
            </div>

            {/* Players footer */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-tight">
                  {g.players}
                </span>
              </div>
              <span className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">
                Joueurs
              </span>
            </div>
          </div>
        ))}
      </div>

      <GameInfoModal
        isOpen={infoModalGame !== null}
        onClose={() => setInfoModalGame(null)}
        gameId={infoModalGame}
      />
    </div>
  );
}
