import React, { useState } from "react";
import { UserProvider, useUser } from "./context/UserContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./components/Home";
import { Mines } from "./components/Mines";
import { Roulette } from "./components/Roulette";
import { Keno } from "./components/Keno";
import { Dice } from "./components/Dice";
import { Plinko } from "./components/Plinko";
import { Crash } from "./components/Crash";
import { Limbo } from "./components/Limbo";
import { Wheel } from "./components/Wheel";
import { Hilo } from "./components/Hilo";
import { DragonTower } from "./components/DragonTower";
import { Flip } from "./components/Flip";
import { Slide } from "./components/Slide";
import { VideoPoker } from "./components/VideoPoker";
import { Baccarat } from "./components/Baccarat";
import { TomeOfLife } from "./components/TomeOfLife";
import { LiveSessionWidget } from "./components/LiveSessionWidget";
import { Blackjack } from "./components/Blackjack";
import { Chicken } from "./components/Chicken";
import { Moles } from "./components/Moles";
import { Slots } from "./components/Slots";
import { ScarabSpin } from "./components/ScarabSpin";
import { LeBandit } from "./components/LeBandit";
import { AdminPanel } from "./components/AdminPanel";
import { VerifyBet } from "./components/VerifyBet";
import { ApprovalGuard } from "./components/ApprovalGuard";
import { Profile } from "./components/Profile";
import { Stats } from "./components/Stats";
import { Leaderboard } from "./components/Leaderboard";

export type ViewType =
  | "home"
  | "favorites"
  | "originals"
  | "slots"
  | "leaderboard"
  | "stats"
  | "mines"
  | "roulette"
  | "keno"
  | "dice"
  | "plinko"
  | "crash"
  | "limbo"
  | "wheel"
  | "hilo"
  | "dragon-tower"
  | "flip"
  | "slide"
  | "video-poker"
  | "baccarat"
  | "tome-of-life"
  | "blackjack"
  | "chicken"
  | "moles"
  | "slots-game"
  | "scarab-spin"
  | "le-bandit"
  | "verify"
  | "admin"
  | "profile";

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state && (this.state as any).hasError) {
      return (
        <div className="text-red-500 font-bold p-8">
          App crashed: {(this.state as any).error?.message} 
          <pre>{(this.state as any).error?.stack}</pre>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <InnerApp />
    </ErrorBoundary>
  );
}

function HamsterLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#191a1a]/80 backdrop-blur-sm">
      <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>
    </div>
  );
}

function InnerApp() {
  const [view, setView] = useState<ViewType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open
  const [isChangingView, setIsChangingView] = useState(false);

  const handleSetView = (newView: ViewType) => {
    if (newView === view) return;
    setIsChangingView(true);
    setTimeout(() => {
      setView(newView);
      setIsChangingView(false);
    }, 1000);
  };

  return (
    <UserProvider>
      <InnerAppContent view={view} sidebarOpen={sidebarOpen} isChangingView={isChangingView} handleSetView={handleSetView} setSidebarOpen={setSidebarOpen} />
    </UserProvider>
  );
}

function InnerAppContent({ view, sidebarOpen, isChangingView, handleSetView, setSidebarOpen }: any) {
  const { isLoggingOut } = useUser();

  return (
      <div className="flex flex-col min-h-screen bg-bg-base text-text-primary selection:bg-accent selection:text-bg-base overflow-x-hidden bg-pattern relative">
        <Header
          setView={handleSetView as any}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex flex-1 relative items-stretch">
          <div className={`bg-bg-panel border-border-subtle overflow-hidden transition-all duration-300 ease-in-out z-40 ${sidebarOpen ? "w-[60px] min-w-[60px] border-r" : "w-0 min-w-0 border-r-0"}`}>
            <Sidebar view={view} setView={handleSetView as any} isOpen={sidebarOpen} />
          </div>
          <main className="flex-1 w-full overflow-x-hidden min-h-[calc(100vh-80px)] relative flex flex-col">
            <div className="flex-1">
              {(view === "home" || view === "favorites" || view === "originals" || view === "slots") && <Home view={view} setView={handleSetView as any} />}
              {view === "leaderboard" && (
                  <div className="p-4 md:p-8 relative min-h-full">
                      <Leaderboard onClose={() => handleSetView("home")} isPage={true} />
                  </div>
              )}
              {view === "verify" && <VerifyBet />}
              {view === "stats" && <Stats />}
              {view === "admin" && <AdminPanel />}
              {view === "profile" && <Profile />}
              {view === "mines" && <ApprovalGuard gameName="mines"><Mines /></ApprovalGuard>}
              {view === "roulette" && <ApprovalGuard gameName="roulette"><Roulette /></ApprovalGuard>}
              {view === "keno" && <ApprovalGuard gameName="keno"><Keno /></ApprovalGuard>}
              {view === "dice" && <ApprovalGuard gameName="dice"><Dice /></ApprovalGuard>}
              {view === "plinko" && <ApprovalGuard gameName="plinko"><Plinko /></ApprovalGuard>}
              {view === "crash" && <ApprovalGuard gameName="crash"><Crash /></ApprovalGuard>}
              {view === "limbo" && <ApprovalGuard gameName="limbo"><Limbo /></ApprovalGuard>}
              {view === "wheel" && <ApprovalGuard gameName="wheel"><Wheel /></ApprovalGuard>}
              {view === "hilo" && <ApprovalGuard gameName="hilo"><Hilo /></ApprovalGuard>}
              {view === "dragon-tower" && <ApprovalGuard gameName="dragon-tower"><DragonTower /></ApprovalGuard>}
              {view === "flip" && <ApprovalGuard gameName="flip"><Flip /></ApprovalGuard>}
              {view === "slide" && <ApprovalGuard gameName="slide"><Slide /></ApprovalGuard>}
              {view === "video-poker" && <ApprovalGuard gameName="video-poker"><VideoPoker /></ApprovalGuard>}
              {view === "baccarat" && <ApprovalGuard gameName="baccarat"><Baccarat /></ApprovalGuard>}
              {view === "tome-of-life" && <ApprovalGuard gameName="tome-of-life"><TomeOfLife /></ApprovalGuard>}
              {view === "slots-game" && <ApprovalGuard gameName="slots-game"><Slots /></ApprovalGuard>}
              {view === "blackjack" && <ApprovalGuard gameName="blackjack"><Blackjack /></ApprovalGuard>}
              {view === "chicken" && <ApprovalGuard gameName="chicken"><Chicken /></ApprovalGuard>}
              {view === "moles" && <ApprovalGuard gameName="moles"><Moles /></ApprovalGuard>}
              {view === "scarab-spin" && <ApprovalGuard gameName="scarab-spin"><ScarabSpin /></ApprovalGuard>}
              {view === "le-bandit" && <ApprovalGuard gameName="le-bandit"><LeBandit /></ApprovalGuard>}
            </div>
            
            {/* Footer */}
            <footer className="w-full bg-bg-panel/50 border-t border-border-subtle py-8 px-4 flex flex-col items-center justify-center gap-4 mt-12 bg-pattern">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
                alt="Stake Logo" 
                className="h-6 opacity-30 brightness-[100] invert transition-opacity hover:opacity-80"
              />
              <p className="text-text-secondary text-xs">© 2026 Stake Casino. Tous droits réservés.</p>
              <p className="text-[#2f4553] text-[10px] uppercase font-bold tracking-widest mt-2 hover:text-[#557086] transition-colors cursor-default">v2.5.0</p>
            </footer>
          </main>
        </div>
        <LiveSessionWidget />
        {isChangingView && !isLoggingOut && <HamsterLoader />}
        {isLoggingOut && <LogoutScreen />}
      </div>
  );
}

function LogoutScreen() {
  const { logoutProgress, logoutMessage } = useUser();
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923] bg-opacity-90 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-[#1f2937] p-8 rounded-xl shadow-2xl max-w-sm w-full border border-[#374151] flex flex-col items-center">
        <div className="flex justify-center mb-6 relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#374151] flex items-center justify-center bg-[#111827]">
            <CloudIcon className="w-8 h-8 text-[#10b981] animate-pulse" />
          </div>
          {logoutProgress < 100 && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          )}
        </div>
        
        <h3 className="text-white text-xl font-bold mb-2">Sauvegarde en cours</h3>
        <p className="text-[#9ca3af] text-sm text-center mb-6 h-10">
          {logoutMessage || "Veuillez patienter..."}
        </p>

        <div className="w-full bg-[#374151] rounded-full h-2 mb-2 overflow-hidden relative">
          <div 
            className="bg-[#10b981] h-2 rounded-full transition-all duration-300 ease-out flex relative"
            style={{ width: `${logoutProgress}%` }}
          >
            <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden rounded-md">
               <div className="w-full h-full bg-white opacity-20 transform -skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
        <div className="w-full flex justify-between text-xs text-[#9ca3af]">
          <span>0%</span>
          <span className="font-mono text-[#10b981]">{logoutProgress}%</span>
          <span>100%</span>
        </div>
        
        <div className="mt-6 text-xs text-red-400 font-medium tracking-wide flex items-center justify-center gap-2">
          <AlertCircleIcon className="w-4 h-4" /> Ne fermez pas la page
        </div>
      </div>
    </div>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
