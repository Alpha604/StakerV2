import React, { useState } from "react";
import { LogOut } from "lucide-react";
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
import { SuperWheel } from "./components/SuperWheel";
import { SuperDragonTower } from "./components/SuperDragonTower";
import { Hilo } from "./components/Hilo";
import { DragonTower } from "./components/DragonTower";
import { Flip } from "./components/Flip";
import { Slide } from "./components/Slide";
import { VideoPoker } from "./components/VideoPoker";
import { Baccarat } from "./components/Baccarat";
import { TomeOfLife } from "./components/TomeOfLife";
import { LiveSessionWidget } from "./components/LiveSessionWidget";
import { TruckLoader } from "./components/TruckLoader";
import { Blackjack } from "./components/Blackjack";
import { Chicken } from "./components/Chicken";
import { Moles } from "./components/Moles";
import { Slots } from "./components/Slots";
import { ScarabSpin } from "./components/ScarabSpin";
import { LeBandit } from "./components/LeBandit";
import { SweetBonanza } from "./components/SweetBonanza";
import { AdminPanel } from "./components/AdminPanel";
import { VerifyBet } from "./components/VerifyBet";
import { ApprovalGuard } from "./components/ApprovalGuard";
import { Profile } from "./components/Profile";
import { Stats } from "./components/Stats";
import { Leaderboard } from "./components/Leaderboard";
import { LiveChat } from "./components/LiveChat";
import { Toaster } from "react-hot-toast";

import { BannedScreen } from "./components/BannedScreen";

import { Rewards } from "./components/Rewards";

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
  | "super-wheel"
  | "hilo"
  | "dragon-tower"
  | "super-dragon-tower"
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
  | "sweet-bonanza"
  | "verify"
  | "admin"
  | "profile"
  | "rewards"
  | "stake-gaming";

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
  const [isChangingView, setIsChangingView] = useState(false);

  const handleSetView = (newView: ViewType) => {
    if (newView === view) return;
    setIsChangingView(true);
    setTimeout(() => {
      setView(newView);
      setIsChangingView(false);
    }, 50); // fast transition
  };

  return (
    <UserProvider>
      <InnerAppContent view={view} sidebarOpen={sidebarOpen} isChangingView={isChangingView} handleSetView={handleSetView} setSidebarOpen={setSidebarOpen} />
    </UserProvider>
  );
}

function InnerAppContent({ view, sidebarOpen, isChangingView, handleSetView, setSidebarOpen }: any) {
  const { user, isLoggingOut, showLogoutConfirm, setShowLogoutConfirm, logoutUser } = useUser() as any;
  const [chatOpen, setChatOpen] = useState(false);

  if (user?.status === "banned" || user?.status === "suspended") {
    return <BannedScreen user={user} />;
  }

  if (user?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden bg-pattern">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="bg-bg-panel border border-border-subtle p-8 md:p-12 rounded-2xl max-w-xl w-full mx-4 relative z-10 flex flex-col items-center text-center shadow-2xl">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
            <svg className="text-yellow-500 w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Compte en attente de vérification</h1>
          <p className="text-text-secondary mb-8">
            Votre compte vient d'être créé. Un administrateur doit l'approuver avant que vous puissiez commencer à jouer, déposer ou retirer des fonds. Merci de votre patience.
          </p>
          <button
            onClick={() => logoutUser()}
            className="w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 bg-[#1f2937] hover:bg-[#374151] text-white transition-all shadow-md active:scale-95"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-bg-base text-text-primary selection:bg-accent selection:text-bg-base overflow-x-hidden bg-pattern relative">
        <Toaster position="top-right" reverseOrder={true} toastOptions={{ className: 'min-w-[250px]' }} />
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/90 backdrop-blur-sm transition-opacity duration-300 px-4">
            <div className="bg-[#1f2937] p-8 rounded-xl shadow-2xl max-w-sm w-full border border-[#374151] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <LogOut className="text-red-500 mb-4 h-12 w-12" />
              <h2 className="text-2xl font-black text-white mb-2">Déconnexion</h2>
              <p className="text-text-secondary mb-8 font-medium">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-bg-panel hover:bg-bg-inner border border-border-subtle hover:border-white text-white font-bold rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logoutUser();
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
        <Header
          setView={handleSetView as any}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          toggleChat={() => setChatOpen(!chatOpen)}
        />
        <div className="flex flex-1 relative items-stretch">
          <div className={`bg-bg-panel border-border-subtle transition-all duration-300 ease-in-out z-40 ${sidebarOpen ? "w-[72px] min-w-[72px] border-r" : "w-0 min-w-0 border-r-0"}`}>
            <Sidebar view={view} setView={handleSetView as any} isOpen={sidebarOpen} />
          </div>
          <main className={`flex-1 w-full overflow-x-hidden min-h-[calc(100vh-80px)] relative flex flex-col transition-all duration-300 ${chatOpen ? "mr-[350px]" : ""}`}>
            <div className="flex-1">
              {(view === "home" || view === "favorites" || view === "originals" || view === "slots" || view === "stake-gaming") && <Home view={view} setView={handleSetView as any} />}
              {view === "leaderboard" && (
                  <div className="p-4 md:p-8 relative min-h-full">
                      <Leaderboard onClose={() => handleSetView("home")} isPage={true} />
                  </div>
              )}
              {view === "verify" && <VerifyBet />}
              {view === "stats" && <Stats />}
              {view === "admin" && <AdminPanel />}
              {view === "profile" && <Profile />}
              {view === "rewards" && <Rewards />}
              {view === "mines" && <ApprovalGuard gameName="mines"><Mines /></ApprovalGuard>}
              {view === "roulette" && <ApprovalGuard gameName="roulette"><Roulette /></ApprovalGuard>}
              {view === "keno" && <ApprovalGuard gameName="keno"><Keno /></ApprovalGuard>}
              {view === "dice" && <ApprovalGuard gameName="dice"><Dice /></ApprovalGuard>}
              {view === "plinko" && <ApprovalGuard gameName="plinko"><Plinko /></ApprovalGuard>}
              {view === "crash" && <ApprovalGuard gameName="crash"><Crash /></ApprovalGuard>}
              {view === "limbo" && <ApprovalGuard gameName="limbo"><Limbo /></ApprovalGuard>}
              {view === "wheel" && <ApprovalGuard gameName="wheel"><Wheel /></ApprovalGuard>}
              {view === "super-wheel" && <ApprovalGuard gameName="super-wheel"><SuperWheel /></ApprovalGuard>}
              {view === "super-dragon-tower" && <ApprovalGuard gameName="super-dragon-tower"><SuperDragonTower /></ApprovalGuard>}
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
              {view === "sweet-bonanza" && <ApprovalGuard gameName="sweet-bonanza"><SweetBonanza /></ApprovalGuard>}
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
        <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        <LiveSessionWidget />
        {isChangingView && !isLoggingOut && <TruckLoader />}
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
