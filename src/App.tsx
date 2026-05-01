import React, { useState } from "react";
import { UserProvider } from "./context/UserContext";
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
import { Leaderboard } from "./components/Leaderboard";

export type ViewType =
  | "home"
  | "favorites"
  | "originals"
  | "slots"
  | "leaderboard"
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
  | "slots-game";

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
              {view === "mines" && <Mines />}
              {view === "roulette" && <Roulette />}
              {view === "keno" && <Keno />}
              {view === "dice" && <Dice />}
              {view === "plinko" && <Plinko />}
              {view === "crash" && <Crash />}
              {view === "limbo" && <Limbo />}
              {view === "wheel" && <Wheel />}
              {view === "hilo" && <Hilo />}
              {view === "dragon-tower" && <DragonTower />}
              {view === "flip" && <Flip />}
              {view === "slide" && <Slide />}
              {view === "video-poker" && <VideoPoker />}
              {view === "baccarat" && <Baccarat />}
              {view === "tome-of-life" && <TomeOfLife />}
              {view === "slots-game" && <Slots />}
              {view === "blackjack" && <Blackjack />}
              {view === "chicken" && <Chicken />}
              {view === "moles" && <Moles />}
            </div>
            
            {/* Footer */}
            <footer className="w-full bg-bg-panel/50 border-t border-border-subtle py-8 px-4 flex flex-col items-center justify-center gap-4 mt-12 bg-pattern">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg" 
                alt="Stake Logo" 
                className="h-6 opacity-30 brightness-[100] invert transition-opacity hover:opacity-80"
              />
              <p className="text-text-secondary text-xs">© 2026 Stake Casino. Tous droits réservés.</p>
              <p className="text-[#2f4553] text-[10px] uppercase font-bold tracking-widest mt-2 hover:text-[#557086] transition-colors cursor-default">v2.2.0</p>
            </footer>
          </main>
        </div>
        <LiveSessionWidget />
        {isChangingView && <HamsterLoader />}
      </div>
    </UserProvider>
  );
}
