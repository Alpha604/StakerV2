import { formatCurrency } from "../lib/utils";
import React, { useState } from 'react';
import { useUser, renderCryptoIcon } from '../context/UserContext';
import { WinPopup } from './WinPopup';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../lib/useSound';
import { Anchor, FishMenu, Waves, Snowflake, Users, PlayCircle, History, Menu, Volume2, Info } from 'lucide-react';

const CATCH_TYPES = [
  { name: "Squelette", multiplier: 0.00, probability: 40, image: "☠️", color: "text-gray-400" },
  { name: "Botte", multiplier: 0.20, probability: 20, image: "👢", color: "text-zinc-500" },
  { name: "Poisson", multiplier: 1.50, probability: 25, image: "🐟", color: "text-blue-400" },
  { name: "Saumon", multiplier: 3.00, probability: 10, image: "🍣", color: "text-orange-400" },
  { name: "Requin", multiplier: 15.00, probability: 4.5, image: "🦈", color: "text-teal-300" },
  { name: "Trésor", multiplier: 100.00, probability: 0.5, image: "💎", color: "text-emerald-400" },
];

export function IceFishing() {
  const { user, balance, activeCrypto, subtractBalance, addBalance, recordBet } = useUser() as any;
  const { playTick, playWin, playLoss, playHit } = useSound();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFishing, setIsFishing] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  
  const [lastCatch, setLastCatch] = useState<any>(null);
  const [winInfo, setWinInfo] = useState<{ multiplier: number, payout: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const holeCount = 5;
  const [selectedHole, setSelectedHole] = useState<number | null>(null);

  const placeBet = async () => {
    if (!user || balance < betAmount || betAmount <= 0 || betPlaced) return;
    const success = await subtractBalance(betAmount);
    if (!success) return;
    playTick();
    setBetPlaced(true);
    setLastCatch(null);
    setSelectedHole(null);
  };

  const startFishing = (holeIndex: number) => {
    if (!betPlaced || isFishing) return;
    
    playTick();
    setIsFishing(true);
    setSelectedHole(holeIndex);
    
    // Determine catch
    const rand = Math.random() * 100;
    let cumulative = 0;
    let caught = CATCH_TYPES[0];
    
    for (const c of CATCH_TYPES) {
      cumulative += c.probability;
      if (rand <= cumulative) {
        caught = c;
        break;
      }
    }
    
    const payout = betAmount * caught.multiplier;
    const profit = payout - betAmount;
    
    // Simulate fishing time
    setTimeout(() => {
       setIsFishing(false);
       setLastCatch(caught);
       setBetPlaced(false);
       setHistory(prev => [caught.multiplier, ...prev].slice(0, 10));
       
       if (caught.multiplier > 0) {
         if (caught.multiplier >= 1) {
            playWin();
         } else {
            playHit();
         }
         addBalance(payout);
       } else {
         playLoss();
       }
       
       if (caught.multiplier > 1.5) {
         setWinInfo({ multiplier: caught.multiplier, payout });
       }
       
       recordBet({
         game: "Ice Fishing",
         betAmount,
         multiplier: caught.multiplier,
         payout,
         profit
       });
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] bg-black text-white relative overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
      {/* Evolution Gaming Style Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <div className="flex items-center gap-4 pointer-events-auto">
            <button className="text-gray-300 hover:text-white transition-colors"><Menu size={24} /></button>
            <div className="flex flex-col">
               <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Evolution</span>
               <span className="text-lg font-black tracking-widest text-[#d4af37]">ICE FISHING</span>
            </div>
         </div>
         <div className="flex items-center gap-4 pointer-events-auto">
            <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
               <Users size={16} className="text-gray-400" />
               <span className="text-sm font-bold">{Math.floor(Math.random() * 500) + 1200}</span>
            </div>
            <button className="text-gray-300 hover:text-white transition-colors"><Volume2 size={24} /></button>
            <button className="text-gray-300 hover:text-white transition-colors"><History size={24} /></button>
            <button className="text-gray-300 hover:text-white transition-colors"><Info size={24} /></button>
         </div>
      </div>

      {/* Main Game Area (Live Stream Vibe) */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-[400px]">
         {/* Background Layer */}
         <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1549488344-c7dafc4dd7ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
            <div className="absolute inset-0 bg-[#0f212e]/70 backdrop-blur-sm mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
         </div>

         {/* Center Ice Area */}
         <div className="relative z-10 w-full max-w-4xl mt-12">
            {!betPlaced && !isFishing && !lastCatch ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="text-center bg-black/40 backdrop-blur-md border border-white/10 p-8 rounded-2xl mx-auto max-w-md shadow-2xl"
               >
                  <Snowflake size={64} className="mx-auto text-blue-300 mb-4 animate-spin-slow" />
                  <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest text-[#d4af37]">Placez vos mises</h2>
                  <p className="text-gray-300">Testez votre chance sur la glace !</p>
               </motion.div>
            ) : betPlaced && !isFishing ? (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-center mb-8"
               >
                  <h2 className="text-3xl font-black uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">Faites votre choix !</h2>
                  <p className="text-lg text-white drop-shadow-md">Sélectionnez un trou dans la glace.</p>
               </motion.div>
            ) : null}

            {/* Ice Holes Grid */}
            <div className="grid grid-cols-5 gap-4 mt-8 px-4 justify-center items-center">
               {Array.from({ length: holeCount }).map((_, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                     <button
                        onClick={() => startFishing(idx)}
                        disabled={!betPlaced || isFishing}
                        className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[4px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 overflow-hidden group
                           ${selectedHole === idx ? "border-emerald-400 scale-110 shadow-[0_0_30px_rgba(52,211,153,0.5)]" : "border-blue-200/30 hover:border-blue-300 bg-black/40"}
                           ${!betPlaced && !isFishing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                     >
                        {/* Ice Texture inside */}
                        <div className="absolute inset-0 bg-[#add8e6]/10 backdrop-blur-sm group-hover:bg-[#add8e6]/20 transition-colors"></div>
                        
                        {/* Water Ripple when active */}
                        {isFishing && selectedHole === idx && (
                           <motion.div 
                             animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                             transition={{ repeat: Infinity, duration: 1.5 }}
                             className="absolute inset-0 m-auto w-10 h-10 border-2 border-blue-400 rounded-full"
                           />
                        )}

                        {/* Fishing Line Drop */}
                        <AnimatePresence>
                           {isFishing && selectedHole === idx && (
                              <motion.div 
                                 initial={{ y: -100, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 exit={{ y: -100, opacity: 0 }}
                                 className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full z-10"
                              >
                                 <div className="w-[2px] h-full bg-white/80"></div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </button>
                     
                     {/* Result Popup per hole */}
                     <AnimatePresence>
                        {lastCatch && selectedHole === idx && (
                           <motion.div
                              initial={{ y: 20, scale: 0.5, opacity: 0 }}
                              animate={{ y: -40, scale: 1, opacity: 1 }}
                              className="absolute top-[-40%] z-30 flex flex-col items-center pointer-events-none"
                           >
                              <div className="text-6xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                                 {lastCatch.image}
                              </div>
                              <div className={`text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border bg-black/80 whitespace-nowrap mt-2 select-none
                                 ${lastCatch.multiplier > 0 ? "border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`}>
                                 {lastCatch.multiplier.toFixed(2)}x
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               ))}
            </div>
         </div>

         {/* Multiplier History */}
         <div className="absolute right-4 bottom-4 md:right-8 md:bottom-28 md:top-auto top-20 flex flex-col gap-2 z-40 max-h-48 overflow-hidden pointer-events-none">
            {history.map((mult, idx) => (
               <motion.div 
                  key={idx}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap text-center
                     ${mult >= 10 ? "bg-amber-500/20 border-amber-500 text-amber-500" : 
                       mult >= 2 ? "bg-purple-500/20 border-purple-500 text-purple-400" : 
                       mult > 0 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-gray-800/80 border-gray-600 text-gray-400"}`}
               >
                  {mult.toFixed(2)}x
               </motion.div>
            ))}
         </div>
      </div>

      {/* Evolution Style Footer Betting Controls */}
      <div className="relative z-50 bg-[#1e1e1e] border-t border-[#333] p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
         <div className="flex-1 flex justify-start items-center gap-4">
            <div className="flex flex-col items-center">
               <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Solde</span>
               <div className="text-white font-mono font-bold text-lg flex items-center gap-2">
                  {formatCurrency(balance)} {renderCryptoIcon(activeCrypto)}
               </div>
            </div>
         </div>

         <div className="flex-none flex items-center justify-center gap-4 bg-[#2a2a2a] p-2 rounded-xl border border-[#444]">
            <button 
               onClick={() => setBetAmount(prev => Math.max(0.1, prev / 2))}
               disabled={isFishing || betPlaced}
               className="w-12 h-12 flex items-center justify-center bg-[#333] hover:bg-[#444] rounded-lg font-bold transition-colors shadow-inner text-gray-300 disabled:opacity-50"
            >
               /2
            </button>
            <div className="w-40 bg-[#111] p-3 rounded-lg border-b-2 border-[#555] text-center shadow-inner flex justify-center items-center gap-2">
               {renderCryptoIcon(activeCrypto)}
               <input
                 type="number"
                 value={betAmount}
                 onChange={(e) => setBetAmount(Number(e.target.value))}
                 disabled={isFishing || betPlaced}
                 className="w-full bg-transparent text-white font-black text-xl text-center outline-none"
               />
            </div>
            <button 
               onClick={() => setBetAmount(prev => prev * 2)}
               disabled={isFishing || betPlaced}
               className="w-12 h-12 flex items-center justify-center bg-[#333] hover:bg-[#444] rounded-lg font-bold transition-colors shadow-inner text-gray-300 disabled:opacity-50"
            >
               x2
            </button>
         </div>

         <div className="flex-1 flex justify-end">
            {!betPlaced ? (
               <button
                  onClick={placeBet}
                  disabled={betAmount <= 0 || balance < betAmount}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black px-12 py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
               >
                  Miser
               </button>
            ) : (
               <button
                  disabled={true}
                  className="bg-[#2a2a2a] text-emerald-500 border border-emerald-500/50 px-8 py-4 rounded-xl font-black text-lg uppercase tracking-widest text-center min-w-[200px]"
               >
                  {isFishing ? "Bonne chance" : "Pick a hole"}
               </button>
            )}
         </div>
      </div>

      <AnimatePresence>
         {winInfo && (
            <WinPopup 
               multiplier={winInfo.multiplier} 
               payout={winInfo.payout} 
               onComplete={() => setWinInfo(null)} 
            />
         )}
      </AnimatePresence>
    </div>
  );
}
