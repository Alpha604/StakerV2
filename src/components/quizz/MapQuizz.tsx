import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Trophy, TrendingUp, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Country {
  name: {
    common: string;
    translations: {
      fra?: { common: string };
    };
  };
  flags: { svg: string };
  cca2: string;
  ccn3: string;
}

export const MapQuizz = ({ onBack }: { onBack: () => void }) => {
  const { user, updateUserData } = useUser() as any;
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedGeoId, setSelectedGeoId] = useState<string | null>(null);
  const [revealMode, setRevealMode] = useState(false);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,cca2,ccn3")
      .then(res => res.json())
      .then((data: Country[]) => {
        const valid = data.filter(d => d.ccn3 && d.flags?.svg && (d.name?.translations?.fra?.common || d.name?.common));
        setCountries(valid);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        toast.error("Erreur de chargement");
        setLoading(false);
      });
  }, []);

  const quizData = useMemo(() => {
     return user?.quizMap || {};
  }, [user?.quizMap]);

  const pickNextCountry = () => {
    if (countries.length === 0) return;

    let totalWeight = 0;
    const weightedCountries = countries.map(country => {
      const stat = quizData[country.cca2];
      let weight = 10;
      
      if (stat && stat.total > 0) {
         const accuracy = stat.correct / stat.total;
         weight = 1 + (1 - accuracy) * 19;
      }
      
      totalWeight += weight;
      return { country, weight };
    });

    let randomVal = Math.random() * totalWeight;
    let pickedCountry = countries[0];
    for (const wc of weightedCountries) {
      randomVal -= wc.weight;
      if (randomVal <= 0) {
        pickedCountry = wc.country;
        break;
      }
    }

    setCurrentCountry(pickedCountry);
    setSelectedGeoId(null);
    setRevealMode(false);
  };

  useEffect(() => {
    if (countries.length > 0 && !currentCountry) {
      pickNextCountry();
    }
  }, [countries, currentCountry]);

  const handleGeographyClick = (geo: any) => {
    if (revealMode || !currentCountry) return; // already answered

    const clickedGeoId = geo.id; // from topojson
    setSelectedGeoId(clickedGeoId);
    setRevealMode(true);

    const isCorrect = clickedGeoId === currentCountry.ccn3;
    
    if (isCorrect) {
      setSessionScore(prev => prev + 1);
    }
    setSessionCount(prev => prev + 1);

    const stat = quizData[currentCountry.cca2] || { correct: 0, total: 0 };
    const newStat = {
      ...stat,
      total: stat.total + 1,
      correct: stat.correct + (isCorrect ? 1 : 0),
      lastSeen: Date.now()
    };
    
    updateUserData({
      quizMap: {
        ...quizData,
        [currentCountry.cca2]: newStat
      }
    }, true);

    setTimeout(() => {
      pickNextCountry();
    }, 2500); // give time to see correct answer on map
  };
  
  const getCountryName = (c: Country) => c.name.translations?.fra?.common || c.name.common;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  let totalCorrect = 0;
  let totalAnswers = 0;
  Object.values(quizData).forEach((s: any) => {
     totalCorrect += s.correct || 0;
     totalAnswers += s.total || 0;
  });
  const globalAccuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const knownCountries = Object.keys(quizData).length;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-center hover:bg-black/60 hover:border-gray-700 transition-colors"
          >
            <ArrowLeft className="text-gray-400" size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">
              Cartographie
            </h1>
            <p className="text-gray-500 font-mono text-xs mt-1">Trouvez le pays cible sur la carte.</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-[#090a0f] border border-emerald-900/30 rounded-xl px-4 py-2 flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase text-emerald-500/70 font-bold tracking-widest mb-1">Précision</span>
            <div className="font-mono text-xl font-bold text-emerald-400">{globalAccuracy}%</div>
          </div>
          <div className="bg-[#090a0f] border border-emerald-900/30 rounded-xl px-4 py-2 flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase text-emerald-500/70 font-bold tracking-widest mb-1">Localisés</span>
            <div className="font-mono text-xl font-bold text-emerald-400">{knownCountries} / {countries.length}</div>
          </div>
        </div>
      </div>

      {currentCountry && (
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Area */}
          <div className="flex-1 bg-gradient-to-br from-[#0c1210] to-[#080d0a] border border-gray-800 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center">
             <div className="w-full flex justify-between items-center mb-4 border-b border-gray-800/50 pb-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Question #{sessionCount + 1}</span>
                <div className="flex items-center gap-2 text-sm font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                  <TrendingUp size={16} /> Score Session: {sessionScore} / {sessionCount}
                </div>
             </div>

             <div className="flex items-center gap-4 mb-4 bg-black/40 p-4 rounded-2xl border border-gray-800 w-full justify-center">
               <img src={currentCountry.flags.svg} className="w-12 h-8 rounded border border-gray-800" alt="" />
               <h2 className="text-2xl font-bold text-white tracking-wide">Où se trouve : <span className="text-emerald-400">{getCountryName(currentCountry)}</span> ?</h2>
             </div>

             <div className="w-full aspect-[4/3] bg-[#0c141d] rounded-2xl border border-gray-800 overflow-hidden relative shadow-inner">
               <ComposableMap projection="geoMercator" width={800} height={600} className="w-full h-full">
                 <ZoomableGroup zoom={1} center={[0, 20]} maxZoom={10}>
                   <Geographies geography={geoUrl}>
                     {({ geographies }: any) =>
                       geographies.map((geo: any) => {
                         const isTarget = currentCountry.ccn3 === geo.id;
                         const isSelected = selectedGeoId === geo.id;
                         
                         let fill = "#1e293b"; // default
                         let outline = "#0f172a";
                         
                         if (revealMode) {
                           if (isTarget) {
                             fill = "#10b981"; // emerald for correct answer
                             outline = "#047857";
                           } else if (isSelected && !isTarget) {
                             fill = "#ef4444"; // red for wrong click
                             outline = "#b91c1c";
                           } else {
                             fill = "#0f172a"; // dim others
                             outline = "#020617";
                           }
                         }

                         return (
                           <Geography
                             key={geo.rsmKey}
                             geography={geo}
                             onClick={() => handleGeographyClick(geo)}
                             style={{
                               default: {
                                 fill,
                                 outline: 'none',
                                 stroke: outline,
                                 strokeWidth: 0.5
                               },
                               hover: {
                                 fill: revealMode ? fill : "#3b82f6",
                                 outline: 'none',
                                 cursor: revealMode ? "default" : "crosshair",
                                 transition: "all 250ms"
                               },
                               pressed: {
                                 fill: revealMode ? fill : "#2563eb",
                                 outline: 'none',
                               }
                             }}
                           />
                         );
                       })
                     }
                   </Geographies>
                 </ZoomableGroup>
               </ComposableMap>
               
               {/* Controls overlay */}
               <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-[10px] text-gray-400 p-2 rounded-lg font-mono uppercase tracking-widest pointer-events-none">
                 Zoom/Drag map
               </div>
             </div>
          </div>

          {/* Stats Area */}
          <div className="w-full lg:w-[350px] space-y-6 flex flex-col">
             <div className="bg-[#0c1210] border border-gray-800 rounded-3xl p-6">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
                   <AlertTriangle className="text-orange-500" size={16} /> Pays Ignorés (Pire scores)
                </h3>
                <div className="space-y-3">
                   {Object.entries(quizData)
                      .map(([cca2, stat]: [string, any]) => ({ cca2, ...stat }))
                      .filter((s: any) => s.total >= 3 && (s.correct / s.total) < 0.6)
                      .sort((a: any, b: any) => (a.correct / a.total) - (b.correct / b.total))
                      .slice(0, 5)
                      .map((s: any) => {
                         const country = countries.find(c => c.cca2 === s.cca2);
                         if (!country) return null;
                         const acc = Math.round((s.correct / s.total) * 100);
                         return (
                           <div key={s.cca2} className="flex justify-between items-center bg-[#090a0f] p-3 rounded-xl border border-red-900/20">
                              <div className="flex items-center gap-3">
                                <img src={country.flags.svg} className="w-8 h-5 object-cover rounded shadow-sm border border-gray-800" alt="" />
                                <span className="text-sm font-bold text-gray-300 truncate max-w-[130px]">{getCountryName(country)}</span>
                              </div>
                              <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{acc}%</span>
                           </div>
                         );
                      })
                   }
                   {Object.keys(quizData).length > 0 && Object.entries(quizData).filter(([, s]: [any, any]) => s.total >= 3 && (s.correct / s.total) < 0.6).length === 0 && (
                     <p className="text-xs text-emerald-500 font-mono py-4 text-center">Excellente connaissance de la carte !</p>
                   )}
                </div>
             </div>

             <div className="bg-[#0c1210] border border-gray-800 rounded-3xl p-6">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
                   <Trophy className="text-emerald-500" size={16} /> Top Performances
                </h3>
                <div className="space-y-3">
                   {Object.entries(quizData)
                      .map(([cca2, stat]: [string, any]) => ({ cca2, ...stat }))
                      .filter((s: any) => s.total >= 5 && (s.correct / s.total) >= 0.8)
                      .sort((a: any, b: any) => (b.correct / b.total) - (a.correct / a.total))
                      .slice(0, 5)
                      .map((s: any) => {
                         const country = countries.find(c => c.cca2 === s.cca2);
                         if (!country) return null;
                         const acc = Math.round((s.correct / s.total) * 100);
                         return (
                           <div key={s.cca2} className="flex justify-between items-center bg-[#090a0f] p-3 rounded-xl border border-emerald-900/20">
                              <div className="flex items-center gap-3">
                                <img src={country.flags.svg} className="w-8 h-5 object-cover rounded shadow-sm border border-gray-800" alt="" />
                                <span className="text-sm font-bold text-gray-300 truncate max-w-[130px]">{getCountryName(country)}</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{acc}%</span>
                           </div>
                         );
                      })
                   }
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
