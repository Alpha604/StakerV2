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

function InnerApp() {


  const [view, setView] = useState<ViewType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open

  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen bg-bg-base text-text-primary selection:bg-accent selection:text-bg-base overflow-x-hidden bg-pattern relative">
        <Header
          setView={setView as any}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex flex-1 relative">
          <Sidebar view={view} setView={setView as any} isOpen={sidebarOpen} />
          <main className="flex-1 w-full overflow-x-hidden min-h-[calc(100vh-80px)] relative flex flex-col">
            <div className="flex-1">
              {(view === "home" || view === "favorites" || view === "originals" || view === "slots") && <Home view={view} setView={setView as any} />}
              {view === "leaderboard" && (
                  <div className="p-4 md:p-8 relative min-h-full">
                      <Leaderboard onClose={() => setView("home")} isPage={true} />
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
            </footer>
          </main>
        </div>
        <LiveSessionWidget />
      </div>
    </UserProvider>
  );
}
