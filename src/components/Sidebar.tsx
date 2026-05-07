import React from "react";
import { cn } from "../lib/utils";
import { RankBadge } from "./RankBadge";
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
  Tv,
  ShieldAlert,
  User,
} from "lucide-react";
import { useUser } from "../context/UserContext";

export function Sidebar({
  view,
  setView,
  isOpen,
}: {
  view: string;
  setView: (v: string) => void;
  isOpen: boolean;
}) {
  const { user, showSessionStats, setShowSessionStats } = useUser();

  return (
    <aside 
      className={cn(
        "flex flex-col sticky top-16 md:top-20 left-0 overflow-y-auto overflow-x-hidden z-40 items-center py-4 gap-4 transition-all duration-300 ease-in-out h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]",
        isOpen ? "w-full opacity-100 flex" : "w-0 min-w-0 opacity-0 overflow-hidden px-0 py-0"
      )}
    >
      {user && user.rank && user.rank !== "None" && (
        <div 
          className="w-full h-[40px] flex justify-center items-center cursor-pointer hover:brightness-125 transition-all -mt-4 mb-2 flex-shrink-0"
          onClick={() => setView("profile")}
          title="Voir mon rang"
        >
          <RankBadge rank={user.rank} className="w-full h-full !object-cover !object-left" />
        </div>
      )}

      {/* Active green item */}
      <div
        className={cn("w-full h-12 flex items-center justify-center cursor-pointer mb-2 transition-colors", view === "home" ? "bg-accent" : "hover:bg-bg-inner")}
        onClick={() => setView("home")}
        title="Casino"
      >
        <Home size={22} className={view === "home" ? "text-[#0f212e]" : "text-text-secondary"} />
      </div>

      <button
        onClick={() => setView("favorites")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "favorites" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Favoris"
      >
        <Heart size={20} />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-border-medium my-1"></div>

      <button
        onClick={() => setView("originals")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "originals" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Stake Originals"
      >
        <Zap size={20} />
      </button>

      <button
        onClick={() => setView("slots")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "slots" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Machines à sous"
      >
        <Grid size={20} />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-border-medium my-1"></div>

      <button
        onClick={() => setView("leaderboard")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "leaderboard" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Classement"
      >
        <Tv size={20} />
      </button>

      <button
        onClick={() => setView("verify")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "verify" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Statistiques de Pari"
      >
        <Search size={20} />
      </button>

      <button
        onClick={() => setView("profile")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "profile" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Profil"
      >
        <User size={20} />
      </button>

      <button
        onClick={() => setView("stats")}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "stats" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
        title="Stats Détaillées"
      >
        <Activity size={20} />
      </button>

      {useUser().user?.role === "admin" && (
        <button
          onClick={() => setView("admin")}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "admin" ? "bg-red-500/20 text-red-500" : "text-text-secondary hover:bg-red-500/10 hover:text-red-500")}
          title="Administration FDJS"
        >
          <ShieldAlert size={20} />
        </button>
      )}

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
