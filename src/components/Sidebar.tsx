import React from "react";
import { cn } from "../lib/utils";
import {
  Home,
  Trophy,
  Swords,
  Zap,
  Menu,
  Activity,
  Search,
  Bookmark,
  Heart,
  Grid,
  CircleDollarSign,
  Headset,
} from "lucide-react";
import { useUser } from "../context/UserContext";

export function Sidebar({
  view,
  setView,
}: {
  view: string;
  setView: (v: string) => void;
}) {
  const { showSessionStats, setShowSessionStats } = useUser();

  return (
    <aside className="hidden md:flex flex-col w-[60px] h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-bg-panel border-r border-border-subtle sticky top-16 md:top-20 left-0 overflow-y-auto z-40 items-center py-4 gap-4">
      {/* Active green item */}
      <div
        className="w-full h-12 bg-accent flex items-center justify-center cursor-pointer mb-2"
        onClick={() => setView("home")}
        title="Casino"
      >
        <Home size={22} className="text-[#0f212e]" />
      </div>

      {/* Other items */}
      <button
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Sports"
      >
        <Trophy size={20} />
      </button>
      <button
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Favoris"
      >
        <Bookmark size={20} />
      </button>
      <button
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Aimés"
      >
        <Heart size={20} />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-border-medium my-1"></div>

      <button
        onClick={() => setView("originals")}
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Stake Originals"
      >
        <Zap size={20} />
      </button>

      <button
        onClick={() => setView("slots")}
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Machines à sous"
      >
        <Grid size={20} />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-border-medium my-1"></div>

      <button
        onClick={() => setView("stats")}
        className="w-10 h-10 rounded-full hover:bg-bg-inner flex items-center justify-center text-text-secondary hover:text-white transition-colors"
        title="Statistiques"
      >
        <Activity size={20} />
      </button>

      <button
        onClick={() => setShowSessionStats(!showSessionStats)}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          showSessionStats
            ? "bg-bg-inner text-emerald-500"
            : "text-text-secondary hover:bg-bg-inner hover:text-white",
        )}
        title="Session en direct"
      >
        <CircleDollarSign size={20} />
      </button>

      {/* Support at bottom */}
      <div className="mt-auto mb-4">
        <button
          className="w-10 h-10 bg-bg-inner rounded-full flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          title="Support en direct"
        >
          <Headset size={20} />
        </button>
      </div>
    </aside>
  );
}
