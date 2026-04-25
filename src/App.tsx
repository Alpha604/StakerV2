import React, { useState } from 'react';
import { UserProvider } from './context/UserContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { Originals } from './components/Originals';
import { Mines } from './components/Mines';
import { Roulette } from './components/Roulette';
import { Keno } from './components/Keno';
import { Dice } from './components/Dice';
import { Plinko } from './components/Plinko';
import { Crash } from './components/Crash';
import { Limbo } from './components/Limbo';
import { Wheel } from './components/Wheel';
import { Hilo } from './components/Hilo';
import { DragonTower } from './components/DragonTower';
import { Flip } from './components/Flip';
import { Slide } from './components/Slide';
import { VideoPoker } from './components/VideoPoker';
import { Baccarat } from './components/Baccarat';
import { TomeOfLife } from './components/TomeOfLife';
import { Stats } from './components/Stats';
import { LiveSessionWidget } from './components/LiveSessionWidget';

export type ViewType = 'home' | 'originals' | 'mines' | 'roulette' | 'keno' | 'dice' | 'plinko' | 'crash' | 'limbo' | 'wheel' | 'hilo' | 'dragon-tower' | 'flip' | 'slide' | 'video-poker' | 'baccarat' | 'tome-of-life' | 'stats';

export default function App() {
  const [view, setView] = useState<ViewType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen bg-bg-base text-text-primary selection:bg-accent selection:text-bg-base overflow-x-hidden">
        <Header setView={setView as any} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 relative">
           {sidebarOpen && <Sidebar view={view} setView={setView as any} />}
           <main className="flex-1 w-full overflow-x-hidden min-h-[calc(100vh-80px)]">
              {view === 'home' && <Home setView={setView as any} />}
              {view === 'originals' && <Originals setView={setView as any} />}
              {view === 'mines' && <Mines />}
              {view === 'roulette' && <Roulette />}
              {view === 'keno' && <Keno />}
              {view === 'dice' && <Dice />}
              {view === 'plinko' && <Plinko />}
              {view === 'crash' && <Crash />}
              {view === 'limbo' && <Limbo />}
              {view === 'wheel' && <Wheel />}
              {view === 'hilo' && <Hilo />}
              {view === 'dragon-tower' && <DragonTower />}
              {view === 'flip' && <Flip />}
              {view === 'slide' && <Slide />}
              {view === 'video-poker' && <VideoPoker />}
              {view === 'baccarat' && <Baccarat />}
              {view === 'tome-of-life' && <TomeOfLife />}
              {view === 'stats' && <Stats />}
           </main>
        </div>
        <LiveSessionWidget />
      </div>
    </UserProvider>
  );
}
