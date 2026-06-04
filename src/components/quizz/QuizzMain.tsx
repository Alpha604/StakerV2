import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { Lock, HelpCircle, Map, Flag, Globe2, ChevronRight, Play } from "lucide-react";
import { FlagsQuizz } from "./FlagsQuizz";
import { MapQuizz } from "./MapQuizz";

export const Quizz = () => {
  const { user } = useUser() as any;
  const [view, setView] = useState<"home" | "flags" | "map">("home");

  const isAuthorized = user?.quizzAccess === true && user?.quizzBlocked !== true;

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex flex-col items-center justify-center mb-6">
          <Lock className="text-red-500 w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-widest">Accès Refusé</h1>
        <p className="text-gray-400 mb-8 border border-gray-800 bg-black/40 p-6 rounded-xl">
          Le module complet des <b>Quizz d'entraînement</b> est actuellement en phase <span className="text-orange-400 font-bold uppercase">Beta Privée</span>. 
          Il est réservé uniquement aux utilisateurs autorisés par l'équipe administrative.
        </p>
      </div>
    );
  }

  if (view === "flags") return <FlagsQuizz onBack={() => setView("home")} />;
  if (view === "map") return <MapQuizz onBack={() => setView("home")} />;

  // global stats
  const quizFlagsData = user?.quizFlags || {};
  let flagsCorrect = 0;
  let flagsTotal = 0;
  Object.values(quizFlagsData).forEach((s: any) => {
     flagsCorrect += (s.correct || 0);
     flagsTotal += (s.total || 0);
  });
  const flagsAcc = flagsTotal > 0 ? Math.round((flagsCorrect / flagsTotal) * 100) : 0;
  const flagsKnown = Object.keys(quizFlagsData).length;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="border-b border-gray-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase">
            <Globe2 className="text-indigo-500" size={32} /> Académie du Monde
          </h1>
          <p className="text-gray-500 font-mono text-sm mt-1">Entraînement géographique avancé sans mise d'argent.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Game 1: Drapeaux */}
        <div 
          onClick={() => setView("flags")}
          className="bg-gradient-to-br from-[#0c0d14] to-[#090a0f] border border-indigo-900/30 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] rounded-3xl p-8 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
          
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 group-hover:scale-110 transition-transform">
            <Flag className="text-indigo-400 w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide flex items-center justify-between">
            Drapeaux du Monde
            <ChevronRight className="text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Un algorithme d'apprentissage espacé automatique qui analyse vos erreurs et cible vos faiblesses pour une mémorisation parfaite des 250 drapeaux.
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-800/50 pt-6">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Précision Moyenne</span>
              <span className="text-xl font-mono font-bold text-white tracking-widest">{flagsAcc}%</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Drapeaux Rencontrés</span>
              <span className="text-xl font-mono font-bold text-white tracking-widest">{flagsKnown}</span>
            </div>
          </div>
          
          <div className="mt-8">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors uppercase text-sm tracking-widest w-full justify-center">
              <Play fill="currentColor" size={16} /> Lancer une session
            </button>
          </div>
        </div>

        {/* Game 2: Cartes */}
        <div 
          onClick={() => setView("map")}
          className="bg-gradient-to-br from-[#0c0d14] to-[#090a0f] border border-emerald-900/30 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] rounded-3xl p-8 cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
          
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:scale-110 transition-transform">
            <Map className="text-emerald-400 w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide flex items-center justify-between">
            Cartographie Interactive
            <ChevronRight className="text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Testez vos connaissances en plaçant les pays sur une carte du monde vierge. Entraînez votre mémoire visuelle de la géographie planétaire.
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-800/50 pt-6">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Progression</span>
              <span className="text-xl font-mono font-bold text-white tracking-widest uppercase text-emerald-400/50">BETA</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Meilleur Score</span>
              <span className="text-xl font-mono font-bold text-white tracking-widest">-</span>
            </div>
          </div>

          <div className="mt-8">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors uppercase text-sm tracking-widest w-full justify-center">
              <Play fill="currentColor" size={16} /> Lancer sur la Carte
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
