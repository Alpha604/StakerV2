import React, { useState } from "react";
import { cn } from "../lib/utils";
import { RankBadge } from "./RankBadge";
import { SupportModal } from "./SupportModal";
import {
  Home,
  Trophy,
  Swords,
  Zap,
  Flame,
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
  MoreHorizontal,
  Gift
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
  const [showSupport, setShowSupport] = useState(false);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(false);

  return (
    <div className="relative h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex z-40">
      <aside 
        className={cn(
          "flex flex-col overflow-y-auto overflow-x-hidden items-center py-4 gap-4 transition-all duration-300 ease-in-out h-full border-r border-[#1a2c38] bg-[#0f212e]",
          isOpen ? "w-[72px] opacity-100 flex" : "w-0 min-w-0 opacity-0 px-0 py-0 overflow-hidden border-r-0"
        )}
      >
        {user && user.rank && user.rank !== "None" && (
          <div 
            className="w-full h-[40px] flex justify-center items-center cursor-pointer hover:brightness-125 transition-all -mt-4 mb-2 flex-shrink-0"
            onClick={() => { setView("profile"); setShowSecondarySidebar(false); }}
            title="Voir mon rang"
          >
            <RankBadge rank={user.rank} className="w-full h-full !object-cover !object-left" />
          </div>
        )}

        {/* Active green item */}
        <div
          className={cn("w-full h-12 flex items-center justify-center cursor-pointer mb-2 transition-colors", view === "home" ? "bg-accent" : "hover:bg-bg-inner")}
          onClick={() => { setView("home"); setShowSecondarySidebar(false); }}
          title="Casino"
        >
          <Home size={22} className={view === "home" ? "text-[#0f212e]" : "text-text-secondary"} />
        </div>

        <button
          onClick={() => { setView("favorites"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "favorites" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Favoris"
        >
          <Heart size={20} />
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-border-medium my-1 flex-shrink-0"></div>

        <button
          onClick={() => { setView("originals"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "originals" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Stake Originals"
        >
          <Flame size={20} />
        </button>

        <button
          onClick={() => { setView("slots"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "slots" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Machines à sous"
        >
          <Grid size={20} />
        </button>

        <button
          onClick={() => { setView("stake-gaming"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "stake-gaming" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Stake Gaming"
        >
          <Tv size={20} />
        </button>

        <button
          onClick={() => { setView("evolution"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "evolution" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Evolution"
        >
          <Zap size={20} className={view === "evolution" ? "text-emerald-500" : ""} />
        </button>

        {/* Divider */}
        <div className="w-6 h-px bg-border-medium my-1 flex-shrink-0"></div>

        <button
          onClick={() => { setView("rewards"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "rewards" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Récompenses VIP"
        >
          <Gift size={20} className={view === "rewards" ? "text-emerald-500" : ""} />
        </button>

        <button
          onClick={() => { setView("leaderboard"); setShowSecondarySidebar(false); }}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", view === "leaderboard" ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white")}
          title="Classement"
        >
          <Trophy size={20} />
        </button>
        
        {/* Fill available space */}
        <div className="flex-1"></div>

        {/* 3 dots menu for the rest */}
        <button
          onClick={() => setShowSecondarySidebar(!showSecondarySidebar)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            showSecondarySidebar ? "bg-bg-inner text-white" : "text-text-secondary hover:bg-bg-inner hover:text-white"
          )}
          title="Plus"
        >
          <MoreHorizontal size={20} />
        </button>

        <button
          onClick={() => setShowSessionStats(!showSessionStats)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-4",
            showSessionStats
              ? "bg-bg-inner text-emerald-500"
              : "text-text-secondary hover:bg-bg-inner hover:text-white",
          )}
          title="Session en direct"
        >
          <CircleDollarSign size={20} />
        </button>
      </aside>

      {/* Secondary Sidebar (Slide out panel) */}
      {isOpen && (
        <aside 
          className={cn(
            "absolute left-[72px] top-0 h-full flex flex-col py-4 gap-2 transition-all duration-300 ease-in-out bg-[#0f212e] border-r border-[#1a2c38] shadow-2xl z-30 whitespace-nowrap overflow-hidden",
            showSecondarySidebar ? "w-60 opacity-100" : "w-0 opacity-0 px-0 py-0 border-r-0"
          )}
        >
          <div className="px-4 pb-2 mb-2 border-b border-border-subtle uppercase text-xs font-bold text-text-secondary tracking-wider">
            Plus d'options
          </div>
          
          <button
            onClick={() => { setView("profile"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-10 px-4 flex items-center gap-3 transition-colors", view === "profile" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <User size={18} /> <span className="font-medium text-sm">Profil</span>
          </button>

          <button
            onClick={() => { setView("verify"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-10 px-4 flex items-center gap-3 transition-colors", view === "verify" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <Search size={18} /> <span className="font-medium text-sm">Statistiques de Pari</span>
          </button>

          <button
            onClick={() => { setView("stats"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-10 px-4 flex items-center gap-3 transition-colors", view === "stats" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <Activity size={18} /> <span className="font-medium text-sm">Stats Détaillées</span>
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => { setView("admin"); setShowSecondarySidebar(false); }}
              className={cn("w-full h-10 px-4 flex items-center gap-3 transition-colors mt-2", view === "admin" ? "bg-red-500/20 text-red-500 border-l-2 border-red-500" : "text-red-400 hover:bg-red-500/10 hover:text-red-500 border-l-2 border-transparent")}
            >
              <ShieldAlert size={18} /> <span className="font-medium text-sm">Administration FDJS</span>
            </button>
          )}

          <div className="mt-auto px-2 pb-2">
            <button
              onClick={() => { setShowSupport(true); setShowSecondarySidebar(false); }}
              className="w-full h-10 bg-bg-inner rounded-lg flex items-center justify-center gap-2 text-text-secondary hover:text-white transition-colors border border-border-subtle hover:border-border-medium"
            >
              <Headset size={18} /> <span className="font-medium text-sm">Support en direct</span>
            </button>
          </div>
        </aside>
      )}

      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
