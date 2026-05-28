import React, { useState } from "react";
import { cn } from "../lib/utils";
import { RankBadge } from "./RankBadge";
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
  Gift,
  Ticket,
  Lock,
  Info
} from "lucide-react";
import { useUser } from "../context/UserContext";

export function Sidebar({
  view,
  setView,
  isOpen,
  toggleSidebar
}: {
  view: string;
  setView: (v: string) => void;
  isOpen: boolean;
  toggleSidebar?: () => void;
}) {
  const { user, showSessionStats, setShowSessionStats } = useUser();
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(false);

  const NavItem = ({ id, icon: Icon, label, colorClass = "", onClick, activeSub = false }: { id?: string, icon: any, label: string, colorClass?: string, onClick?: () => void, activeSub?: boolean }) => {
    const isActive = view === id || activeSub;
    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else if (id) {
            setView(id);
            setShowSecondarySidebar(false);
          }
        }}
        className={cn(
          "flex items-center transition-all w-full",
          isOpen ? "h-11 px-4 justify-start gap-4 rounded-lg" : "h-12 justify-center",
          isActive 
            ? isOpen ? "bg-bg-inner text-white border-l-2 border-accent" : "bg-bg-inner text-white" 
            : isOpen ? "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent" : "text-text-secondary hover:bg-bg-inner hover:text-white"
        )}
        title={!isOpen ? label : undefined}
      >
        <div className={cn("flex items-center justify-center flex-shrink-0 transition-colors", !isOpen ? "w-10 h-10 rounded-full" : "w-5 h-5", isActive && !isOpen ? "bg-bg-inner" : "")}>
          <Icon size={isOpen ? 18 : 20} className={colorClass} />
        </div>
        {isOpen && <span className="font-medium text-sm whitespace-nowrap truncate tracking-wide">{label}</span>}
      </button>
    );
  };

  return (
    <div className="relative h-full flex z-40 w-full bg-[#0f212e]">
      <aside 
        className={cn(
          "flex flex-col py-3 gap-1 h-full w-full custom-scrollbar",
          isOpen ? "px-2 overflow-y-auto overflow-x-hidden" : "px-0 overflow-y-auto overflow-x-hidden"
        )}
      >
        <div className="flex md:hidden items-center justify-between px-3 mb-2 flex-shrink-0">
           {isOpen && (
             <>
               <span className="font-bold text-white text-lg tracking-wider">MENU</span>
               <Menu 
                 onClick={toggleSidebar} 
                 className="text-text-secondary cursor-pointer hover:text-white transition-colors w-6 h-6" 
               />
             </>
           )}
        </div>

        {user && user.rank && user.rank !== "None" && (
          <div 
            className={cn("flex items-center cursor-pointer hover:brightness-125 transition-all mb-2 flex-shrink-0 rounded-lg", isOpen ? "px-3 py-2 hover:bg-bg-inner" : "justify-center mt-1")}
            onClick={() => { setView("profile"); setShowSecondarySidebar(false); }}
            title="Voir mon profil"
          >
            {isOpen ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <RankBadge rank={user.rank} className="w-8 h-8 rounded shrink-0 !object-cover !object-left" />
                <span className="font-bold text-sm text-white truncate max-w-[130px]">{user.username}</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-bg-inner p-1">
                <RankBadge rank={user.rank} className="w-full h-full !object-cover !object-left" />
              </div>
            )}
          </div>
        )}

        <NavItem id="home" icon={Home} label="Casino" />
        <NavItem id="sports" icon={Activity} colorClass={view === "sports" || isOpen ? "text-blue-500" : ""} label="Paris Sportifs" />
        <NavItem id="favorites" icon={Heart} label="Favoris" />
        
        <div className={cn("h-px bg-border-medium flex-shrink-0", isOpen ? "mx-3 my-2" : "w-6 mx-auto my-2")}></div>
        
        <NavItem id="originals" icon={Flame} label="Stake Originals" />
        <NavItem id="slots" icon={Grid} label="Machines à sous" />
        <NavItem id="stake-gaming" icon={Tv} label="Stake Gaming" />
        <NavItem id="evolution" icon={Zap} colorClass={view === "evolution" || isOpen ? "text-emerald-500" : ""} label="Evolution" />
        <NavItem id="grattage" icon={Ticket} colorClass={view === "grattage" || isOpen ? "text-orange-500" : ""} label="Grattage" />
        
        <div className={cn("h-px bg-border-medium flex-shrink-0", isOpen ? "mx-3 my-2" : "w-6 mx-auto my-2")}></div>
        
        <NavItem id="rewards" icon={Gift} colorClass={view === "rewards" || isOpen ? "text-emerald-500" : ""} label="Récompenses VIP" />
        <NavItem id="leaderboard" icon={Trophy} label="Classement" />

        <div className={cn("h-px bg-border-medium flex-shrink-0", isOpen ? "mx-3 my-2" : "w-6 mx-auto my-2")}></div>

        {/* ALWAYS SHOW PLUS BUTTON */}
        <button
          onClick={() => setShowSecondarySidebar(!showSecondarySidebar)}
          className={cn(
            "flex items-center transition-all w-full flex-shrink-0",
            isOpen ? "h-11 px-4 justify-start gap-4 rounded-lg" : "h-12 justify-center mb-2",
            showSecondarySidebar 
              ? "bg-bg-inner text-white" 
              : "text-text-secondary hover:bg-bg-inner hover:text-white"
          )}
          title={!isOpen ? "Plus" : undefined}
        >
          <div className={cn("flex items-center justify-center flex-shrink-0 transition-colors", !isOpen ? "w-10 h-10 rounded-full" : "w-5 h-5", showSecondarySidebar && !isOpen ? "bg-bg-inner" : "")}>
             <MoreHorizontal size={isOpen ? 18 : 20} />
          </div>
          {isOpen && <span className="font-medium text-sm whitespace-nowrap truncate tracking-wide">Plus</span>}
        </button>

        <div className="flex-1 min-h-[10px]"></div>

        {/* Bottom icon for session live */}
        <NavItem 
          icon={CircleDollarSign} 
          label="Session en direct" 
          colorClass={showSessionStats ? "text-emerald-500" : ""} 
          onClick={() => setShowSessionStats(!showSessionStats)} 
          activeSub={showSessionStats}
        />
        
      </aside>

      {/* Secondary Sidebar (Slide out panel) */}
      <aside 
        className={cn(
          "absolute left-full top-0 h-full flex flex-col py-4 gap-2 transition-all duration-300 ease-in-out bg-[#0f212e] border-r border-[#1a2c38] shadow-[10px_0_15px_-3px_rgba(0,0,0,0.5)] z-[100] whitespace-nowrap overflow-hidden",
          showSecondarySidebar ? "w-60 opacity-100" : "w-0 opacity-0 px-0 py-0 border-r-0"
        )}
      >
          <div className="px-5 pb-3 mb-2 border-b border-[#1a2c38] uppercase text-xs font-bold text-text-secondary tracking-wider flex items-center justify-between">
            Plus d'options
          </div>
          
          <button
            onClick={() => { setView("profile"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-11 px-5 flex items-center gap-4 transition-colors", view === "profile" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <User size={18} /> <span className="font-medium text-sm">Profil</span>
          </button>

          <button
            onClick={() => { setView("verify"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-11 px-5 flex items-center gap-4 transition-colors", view === "verify" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <Search size={18} /> <span className="font-medium text-sm">Statistiques de Pari</span>
          </button>

          <button
            onClick={() => { setView("stats"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-11 px-5 flex items-center gap-4 transition-colors", view === "stats" ? "bg-bg-inner text-white border-l-2 border-accent" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <Activity size={18} /> <span className="font-medium text-sm">Stats Détaillées</span>
          </button>
          
          <button
            onClick={() => { setView("infos"); setShowSecondarySidebar(false); }}
            className={cn("w-full h-11 px-5 flex items-center gap-4 transition-colors", view === "infos" ? "bg-bg-inner text-white border-l-2 border-amber-500" : "text-text-secondary hover:bg-bg-inner hover:text-white border-l-2 border-transparent")}
          >
            <Info size={18} /> <span className="font-medium text-sm">Informations</span>
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => { setView("admin"); setShowSecondarySidebar(false); }}
              className={cn("w-full h-11 px-5 flex items-center gap-4 transition-colors mt-2", view === "admin" ? "bg-red-500/20 text-red-500 border-l-2 border-red-500" : "text-red-400 hover:bg-red-500/10 hover:text-red-500 border-l-2 border-transparent")}
            >
              <ShieldAlert size={18} /> <span className="font-medium text-sm">Administration FDJS</span>
            </button>
          )}

          {user && (user.maxiVault || 0) > 0 && (
             <div className="mt-4 mx-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase mb-1">
                   <Lock size={14} /> Maxi Vault
                </div>
                <div className="text-white font-mono font-medium text-sm">
                   {user.maxiVault?.toFixed(2)}
                </div>
                <div className="text-xs text-text-secondary mt-1 whitespace-normal">
                   Verrouillé par limite dépassée.
                </div>
             </div>
          )}
        </aside>
    </div>
  );
}
