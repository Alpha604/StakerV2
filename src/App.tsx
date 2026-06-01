import React, { useState, useEffect } from "react";
import { LogOut, Lock } from "lucide-react";
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
import { LoginModal } from "./components/LoginModal";
import { Blackjack } from "./components/Blackjack";
import { BlackjackOriginal } from "./components/BlackjackOriginal";
import { Chicken } from "./components/Chicken";
import { Moles } from "./components/Moles";
import { Slots } from "./components/Slots";
import { ScarabSpin } from "./components/ScarabSpin";
import { LeBandit } from "./components/LeBandit";
import { SweetBonanza } from "./components/SweetBonanza";
import { IceFishing } from "./components/IceFishing";
import { AdminPanel } from "./components/AdminPanel";
import { VerifyBet } from "./components/VerifyBet";
import { ApprovalGuard } from "./components/ApprovalGuard";
import { Profile } from "./components/Profile";
import { Stats } from "./components/Stats";
import { Leaderboard } from "./components/Leaderboard";
import { ScratchCash } from "./components/ScratchCash";
import { ScratchMaxiCash } from "./components/ScratchMaxiCash";
import { ScratchMillionnaire } from "./components/ScratchMillionnaire";
import { ScratchSupraHalla } from "./components/ScratchSupraHalla";
import { ScratchAstroFdj } from "./components/ScratchAstroFdj";
import { ScratchPatrimoine } from "./components/ScratchPatrimoine";
import { LiveChat } from "./components/LiveChat";
import { Toaster } from "react-hot-toast";
import { SuperScratch } from "./components/SuperScratch";
import { AgreementsModal } from "./components/AgreementsModal";

import { BannedScreen } from "./components/BannedScreen";

import { Rewards } from "./components/Rewards";
import { ScreenSizeGuard, IPGuard } from "./components/SecurityGuards";
import { UpdateModal } from "./components/UpdateModal";
import { Infos } from "./components/Infos";
import { SportsBetting } from "./components/SportsBetting";

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
  | "blackjack"
  | "tome-of-life"
  | "chicken"
  | "moles"
  | "slots-game"
  | "scarab-spin"
  | "le-bandit"
  | "sweet-bonanza"
  | "ice-fishing"
  | "blackjack-evolution"
  | "verify"
  | "admin"
  | "profile"
  | "rewards"
  | "super-scratch"
  | "scratch-cash"
  | "scratch-maxi-cash"
  | "scratch-millionnaire"
  | "scratch-supra-halla"
  | "scratch-astro"
  | "scratch-patrimoine"
  | "infos"
  | "stake-gaming"
  | "sports";

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null as Error | null, errorInfo: null as React.ErrorInfo | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f212e] text-white flex flex-col items-center justify-center p-8 font-sans">
          <div className="max-w-2xl w-full bg-[#1a2c38] border border-red-500/30 p-8 rounded-2xl shadow-xl shadow-red-500/10">
            <h1 className="text-3xl font-black text-red-500 mb-4 flex items-center gap-3">
              <span className="text-4xl text-red-500">⚠️</span> Crash de l'Application
            </h1>
            <p className="text-gray-300 font-medium mb-6">
              Une erreur inattendue s'est produite. L'interface a cessé de fonctionner correctement.
            </p>
            <div className="bg-black/50 p-4 rounded-xl overflow-auto text-sm text-red-300 font-mono border border-red-900/50 mb-6 max-h-64 custom-scrollbar">
              <span className="font-bold text-red-400 block mb-2">{this.state.error?.toString()}</span>
              {this.state.errorInfo?.componentStack}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-colors w-full sm:w-auto"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ScreenSizeGuard>
      <ErrorBoundary>
        <InnerApp />
      </ErrorBoundary>
    </ScreenSizeGuard>
  );
}

function InnerApp() {
  const [view, setView] = useState<ViewType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isChangingView, setIsChangingView] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // We no longer auto close sidebar on resize
    const handleResize = () => {
      // you can keep it or remove, user wants it to just stay as they left it
    };
    window.addEventListener("resize", handleResize);

    // Check for updates
    const currentVersion = "v1.1";
    const seenVersion = localStorage.getItem("seenUpdateVersion");
    if (seenVersion !== currentVersion) {
      setShowUpdate(true);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSetView = (newView: ViewType) => {
    if (newView === view) return;
    setIsChangingView(true);
    if (window.innerWidth < 768) {
      setSidebarOpen(false); // Close sidebar on mobile when navigating
    }
    setTimeout(() => {
      setView(newView);
      setIsChangingView(false);
    }, 50); // fast transition
  };

  const closeUpdate = () => {
    localStorage.setItem("seenUpdateVersion", "v1.1");
    setShowUpdate(false);
  };

  return (
    <UserProvider>
      <IPGuard>
        <UpdateModal isOpen={showUpdate} onClose={closeUpdate} />
        <InnerAppContent
          view={view}
          sidebarOpen={sidebarOpen}
          isChangingView={isChangingView}
          handleSetView={handleSetView}
          setSidebarOpen={setSidebarOpen}
        />
      </IPGuard>
    </UserProvider>
  );
}

function InnerAppContent({
  view,
  sidebarOpen,
  isChangingView,
  handleSetView,
  setSidebarOpen,
}: any) {
  const {
    user,
    isLoggingOut,
    showLogoutConfirm,
    setShowLogoutConfirm,
    logoutUser,
    globalAppStatus,
    showMaxiVaultModal,
    setShowMaxiVaultModal,
    requestMaxiVaultUnlock,
    appSettings
  } = useUser() as any;
  const [chatOpen, setChatOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Device detection
  const isIos =
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isMobile =
    isIos || isAndroid || /Mobi|Android/i.test(navigator.userAgent);
  const isDesktop = !isMobile;

  const currentDeviceType = isIos
    ? "ios"
    : isAndroid
      ? "android"
      : isDesktop
        ? "desktop"
        : "unknown";

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (globalAppStatus?.maintenance && globalAppStatus?.endTime) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [globalAppStatus]);

  const getBlockStatus = () => {
    if (user?.role === "admin") return { blocked: false };

    // 1. Check Scheduled Maintenance
    if (globalAppStatus?.scheduledMaintenance?.schedules) {
      const nowObj = new Date();
      const currentDay = nowObj.getDay();
      
      const padZero = (n: number) => n < 10 ? '0' + n : String(n);
      const currentTimeStr = `${padZero(nowObj.getHours())}:${padZero(nowObj.getMinutes())}`;
      
      // Get local YYYY-MM-DD
      const localYear = nowObj.getFullYear();
      const localMonth = padZero(nowObj.getMonth() + 1);
      const localDate = padZero(nowObj.getDate());
      const currentDateStr = `${localYear}-${localMonth}-${localDate}`;
      
      for (const sch of globalAppStatus.scheduledMaintenance.schedules) {
        if (!sch.enabled) continue;
        
        let appliesToday = false;
        if (sch.type === "recurring") {
          appliesToday = sch.days?.includes(currentDay) || false;
        } else if (sch.type === "once") {
          appliesToday = sch.specificDate === currentDateStr;
        }

        if (appliesToday && sch.startTime && sch.endTime) {
          if (sch.startTime <= sch.endTime) {
            if (currentTimeStr >= sch.startTime && currentTimeStr < sch.endTime) {
              return { blocked: true, mode: sch.mode || 'maintenance' };
            }
          } else {
            // Handles 23:00 to 06:00
            if (currentTimeStr >= sch.startTime || currentTimeStr < sch.endTime) {
              return { blocked: true, mode: sch.mode || 'maintenance' };
            }
          }
        }
      }
    }

    // 2. Check Manual Maintenance
    if (!globalAppStatus?.maintenance) return { blocked: false };

    if (
      globalAppStatus.autoUnlock &&
      globalAppStatus.endTime &&
      Date.now() > globalAppStatus.endTime
    ) {
      return { blocked: false };
    }

    const blockedDevices = globalAppStatus?.blockedDevices || [];
    if (blockedDevices.length === 0 || blockedDevices.includes(currentDeviceType)) {
      return { blocked: true, mode: globalAppStatus.mode || 'maintenance' };
    }

    return { blocked: false };
  };

  const blockStatus = getBlockStatus();

  if (blockStatus.blocked) {
    let modeTitle = "Maintenance En Cours";
    let modeDesc =
      "Notre équipe est en train de mettre à jour la plateforme pour vous offrir une meilleure expérience.";
    let modeColor = "#00e701"; // default stake green

    if (blockStatus.mode === "arret") {
      modeTitle = "Service Interrompu";
      modeDesc =
        "L'application est temporairement fermée. Veuillez réessayer plus tard.";
      modeColor = "#f43f5e"; // rose 500
    } else if (blockStatus.mode === "moderation") {
      modeTitle = "Modération Globale";
      modeDesc =
        "L'accès à la plateforme est restreint pour des raisons de modération. Merci de patienter.";
      modeColor = "#3b82f6"; // blue 500
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f212e] text-white relative overflow-hidden">
        {/* Background Patterns */}
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${modeColor} 0%, transparent 40%)`,
          }}
        ></div>
        <div
          className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-transparent to-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, ${modeColor}, transparent)`,
          }}
        ></div>

        <div className="z-10 flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative group">
            <div
              className="absolute inset-0 blur-2xl opacity-10 rounded-full animate-pulse"
              style={{ backgroundColor: modeColor }}
            ></div>

            <div className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-b from-[#1a2c38] to-[#0f212e] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite]"></div>

              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg"
                alt="Stake Logo"
                className="w-14 opacity-90 brightness-[100] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse"
              />
            </div>
          </div>

          <div className="text-center space-y-4 pt-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              {modeTitle}
            </h1>
            <p className="text-[#a2bbd2] max-w-sm mx-auto font-medium">
              {modeDesc}
            </p>
            {globalAppStatus.maintenance && globalAppStatus.endTime ? (
              <div className="flex flex-col items-center justify-center gap-2 mt-4">
                <div
                  className="text-sm font-bold tracking-widest uppercase"
                  style={{ color: modeColor }}
                >
                  Temps Restant Estimé :
                </div>
                <div className="font-mono text-2xl font-bold bg-[#1a2c38] px-4 py-2 rounded-lg border border-[#2f4553] text-white">
                  {(() => {
                    const remaining = Math.max(
                      0,
                      globalAppStatus.endTime - now,
                    );
                    const d = Math.floor(remaining / 86400000);
                    const h = Math.floor((remaining % 86400000) / 3600000);
                    const m = Math.floor((remaining % 3600000) / 60000);
                    const s = Math.floor((remaining % 60000) / 1000);

                    const pad = (num: number) =>
                      num.toString().padStart(2, "0");

                    if (d > 0) return `${d}j ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
                    if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
                    return `${pad(m)}m ${pad(s)}s`;
                  })()}
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase mt-4"
                style={{ color: modeColor }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: modeColor }}
                ></span>
                Nous revenons bientôt !
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-[#1a2c38] hover:bg-[#203746] text-[#b1cadd] font-bold rounded-lg border border-[#2f4553] transition-all"
          >
            Réessayer
          </button>
        </div>

        {/* Secret Admin Login Button */}
        <button
          onClick={() => setShowAdminLogin(true)}
          className="absolute bottom-6 right-6 p-3 bg-black/20 hover:bg-black/40 text-gray-500 hover:text-white rounded-full transition-all border border-transparent hover:border-gray-700"
          title="Accès Administrateur"
        >
          <Lock size={18} />
        </button>

        {showAdminLogin && (
          <LoginModal onClose={() => setShowAdminLogin(false)} />
        )}
      </div>
    );
  }

  if (user?.status === "banned" || user?.status === "suspended") {
    return <BannedScreen user={user} />;
  }

  const needsAgreements = user && user.role !== "admin" && (
    !user.agreements?.ageVerified || 
    !user.agreements?.termsAccepted || 
    (user.agreements?.termsVersion || 0) < (appSettings?.agreementsConfig?.termsVersion || 1) || 
    user.agreements?.needsReverification
  );

  if (needsAgreements && user?.status !== "pending") {
    return <AgreementsModal />;
  }

  if (user?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden bg-pattern">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="bg-bg-panel border border-border-subtle p-8 md:p-12 rounded-2xl max-w-xl w-full mx-4 relative z-10 flex flex-col items-center text-center shadow-2xl">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
            <svg
              className="text-yellow-500 w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Compte en attente de vérification
          </h1>
          <p className="text-text-secondary mb-8">
            Votre compte vient d'être créé. Un administrateur doit l'approuver
            avant que vous puissiez commencer à jouer, déposer ou retirer des
            fonds. Merci de votre patience.
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
    <div className="flex w-full h-[100dvh] overflow-hidden bg-bg-base text-text-primary selection:bg-accent selection:text-bg-base relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-pattern"></div>
      <Toaster
        position="top-right"
        reverseOrder={true}
        toastOptions={{ className: "min-w-[250px]" }}
      />
      
      {showMaxiVaultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/90 backdrop-blur-sm transition-opacity duration-300 px-4">
          <div className="bg-[#1f2937] p-8 rounded-xl shadow-2xl max-w-md w-full border border-amber-500/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
             
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 relative">
              <Lock className="text-amber-500 w-10 h-10" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Maxi Vault</h2>
            <p className="text-text-secondary mb-6 font-medium text-sm">
              Votre solde a dépassé la limite autorisée ({user?.balanceLimit || 500000} CHF). <br/>
              Le surplus a été automatiquement transféré dans votre Maxi Vault sécurisé.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={async () => {
                   await requestMaxiVaultUnlock();
                   setShowMaxiVaultModal(false);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Demander un déblocage à l'Admin
              </button>
              <button
                onClick={() => setShowMaxiVaultModal(false)}
                className="w-full justify-center flex items-center gap-2 py-3 bg-[#2a3a4a] hover:bg-[#34485a] text-white border border-[#4d7187] font-bold rounded-lg transition-colors uppercase tracking-wider text-xs"
              >
                Continuer à jouer
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/90 backdrop-blur-sm transition-opacity duration-300 px-4">
          <div className="bg-[#1f2937] p-8 rounded-xl shadow-2xl max-w-sm w-full border border-[#374151] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <LogOut className="text-red-500 mb-4 h-12 w-12" />
            <h2 className="text-2xl font-black text-white mb-2">Déconnexion</h2>
            <p className="text-text-secondary mb-8 font-medium">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* FULL HEIGHT LEFT SIDEBAR */}
      <div
        className={`bg-bg-panel border-border-subtle transition-all duration-300 ease-in-out z-[60] flex-shrink-0 absolute md:relative top-0 bottom-0 left-0 bg-[#0f212e] h-[100dvh] ${
          sidebarOpen 
            ? "w-[240px] translate-x-0 border-r shadow-2xl md:shadow-none" 
            : "-translate-x-full md:translate-x-0 w-[240px] md:w-[72px] md:border-r"
        }`}
      >
        <Sidebar
          view={view}
          setView={handleSetView as any}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* RIGHT MAIN CONTENT AREA WITH HEADER TOP */}
      <div className="flex flex-col flex-1 min-w-0 bg-transparent overflow-hidden h-[100dvh]">
        <div className="relative z-40 flex-shrink-0">
          <Header
            setView={handleSetView as any}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            toggleChat={() => setChatOpen(!chatOpen)}
          />
        </div>
        
        <main
          className={`flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col transition-all duration-300 ${chatOpen ? "lg:mr-[350px]" : ""}`}
        >
          <div className="flex-1">
            {(view === "home" ||
              view === "favorites" ||
              view === "originals" ||
              view === "slots" ||
              view === "stake-gaming" ||
              view === "evolution" ||
              view === "grattage") && (
              <Home view={view} setView={handleSetView as any} />
            )}
            {view === "leaderboard" && (
              <div className="p-4 md:p-8 relative min-h-full">
                <Leaderboard
                  onClose={() => handleSetView("home")}
                  isPage={true}
                />
              </div>
            )}
            {view === "verify" && <VerifyBet />}
            {view === "stats" && <Stats />}
            {view === "admin" && <AdminPanel />}
            {view === "profile" && <Profile />}
            {view === "rewards" && <Rewards />}
            {view === "mines" && (
              <ApprovalGuard gameName="mines">
                <Mines />
              </ApprovalGuard>
            )}
            {view === "roulette" && (
              <ApprovalGuard gameName="roulette">
                <Roulette />
              </ApprovalGuard>
            )}
            {view === "keno" && (
              <ApprovalGuard gameName="keno">
                <Keno />
              </ApprovalGuard>
            )}
            {view === "dice" && (
              <ApprovalGuard gameName="dice">
                <Dice />
              </ApprovalGuard>
            )}
            {view === "plinko" && (
              <ApprovalGuard gameName="plinko">
                <Plinko />
              </ApprovalGuard>
            )}
            {view === "crash" && (
              <ApprovalGuard gameName="crash">
                <Crash />
              </ApprovalGuard>
            )}
            {view === "limbo" && (
              <ApprovalGuard gameName="limbo">
                <Limbo />
              </ApprovalGuard>
            )}
            {view === "wheel" && (
              <ApprovalGuard gameName="wheel">
                <Wheel />
              </ApprovalGuard>
            )}
            {view === "super-wheel" && (
              <ApprovalGuard gameName="super-wheel">
                <SuperWheel />
              </ApprovalGuard>
            )}
            {view === "super-dragon-tower" && (
              <ApprovalGuard gameName="super-dragon-tower">
                <SuperDragonTower />
              </ApprovalGuard>
            )}
            {view === "hilo" && (
              <ApprovalGuard gameName="hilo">
                <Hilo />
              </ApprovalGuard>
            )}
            {view === "dragon-tower" && (
              <ApprovalGuard gameName="dragon-tower">
                <DragonTower />
              </ApprovalGuard>
            )}
            {view === "flip" && (
              <ApprovalGuard gameName="flip">
                <Flip />
              </ApprovalGuard>
            )}
            {view === "slide" && (
              <ApprovalGuard gameName="slide">
                <Slide />
              </ApprovalGuard>
            )}
            {view === "video-poker" && (
              <ApprovalGuard gameName="video-poker">
                <VideoPoker />
              </ApprovalGuard>
            )}
            {view === "baccarat" && (
              <ApprovalGuard gameName="baccarat">
                <Baccarat />
              </ApprovalGuard>
            )}
            {view === "blackjack" && (
              <ApprovalGuard gameName="blackjack">
                <BlackjackOriginal />
              </ApprovalGuard>
            )}
            {view === "tome-of-life" && (
              <ApprovalGuard gameName="tome-of-life">
                <TomeOfLife />
              </ApprovalGuard>
            )}
            {view === "slots-game" && (
              <ApprovalGuard gameName="slots-game">
                <Slots />
              </ApprovalGuard>
            )}
            {view === "chicken" && (
              <ApprovalGuard gameName="chicken">
                <Chicken />
              </ApprovalGuard>
            )}
            {view === "moles" && (
              <ApprovalGuard gameName="moles">
                <Moles />
              </ApprovalGuard>
            )}
            {view === "scarab-spin" && (
              <ApprovalGuard gameName="scarab-spin">
                <ScarabSpin />
              </ApprovalGuard>
            )}
            {view === "le-bandit" && (
              <ApprovalGuard gameName="le-bandit">
                <LeBandit />
              </ApprovalGuard>
            )}
            {view === "sweet-bonanza" && (
              <ApprovalGuard gameName="sweet-bonanza">
                <SweetBonanza />
              </ApprovalGuard>
            )}
            {view === "ice-fishing" && (
              <ApprovalGuard gameName="Ice Fishing">
                <IceFishing />
              </ApprovalGuard>
            )}
            {view === "blackjack-evolution" && (
              <ApprovalGuard gameName="Blackjack">
                <Blackjack />
              </ApprovalGuard>
            )}
            {view === "super-scratch" && (
              <ApprovalGuard gameName="Super Scratch">
                <SuperScratch />
              </ApprovalGuard>
            )}
            {view === "scratch-cash" && (
              <ApprovalGuard gameName="Cash">
                <ScratchCash />
              </ApprovalGuard>
            )}
            {view === "scratch-maxi-cash" && (
              <ApprovalGuard gameName="Maxi Cash">
                <ScratchMaxiCash />
              </ApprovalGuard>
            )}
            {view === "scratch-millionnaire" && (
              <ApprovalGuard gameName="Super Millionnaire">
                <ScratchMillionnaire />
              </ApprovalGuard>
            )}
            {view === "scratch-supra-halla" && (
              <ApprovalGuard gameName="Supra Halla">
                <ScratchSupraHalla />
              </ApprovalGuard>
            )}
            {view === "scratch-astro" && (
              <ApprovalGuard gameName="Astro FDJ">
                <ScratchAstroFdj />
              </ApprovalGuard>
            )}
            {view === "scratch-patrimoine" && (
              <ApprovalGuard gameName="Mission Patrimoine">
                <ScratchPatrimoine />
              </ApprovalGuard>
            )}
            {view === "infos" && <Infos />}
            {view === "sports" && <SportsBetting />}
          </div>

          {/* Footer */}
          <footer className="w-full bg-bg-panel/50 border-t border-border-subtle py-8 px-4 flex flex-col items-center justify-center gap-4 mt-12 bg-pattern">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Stake_logo.svg"
              alt="Stake Logo"
              className="h-6 opacity-30 brightness-[100] invert transition-opacity hover:opacity-80"
            />
            <p className="text-text-secondary text-xs">
              © 2026 Stake Casino. Tous droits réservés.
            </p>
            <p className="text-[#2f4553] text-[10px] uppercase font-bold tracking-widest mt-2 hover:text-[#557086] transition-colors cursor-default">
              v2.5.0
            </p>
          </footer>
        </main>
      </div>
      {user && user.permissions?.canChat !== false && (
        <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      )}
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

        <h3 className="text-white text-xl font-bold mb-2">
          Sauvegarde en cours
        </h3>
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
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
