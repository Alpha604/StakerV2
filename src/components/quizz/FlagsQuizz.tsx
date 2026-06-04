import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { Trophy, TrendingUp, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Country {
  name: {
    common: string;
    translations: {
      fra?: { common: string };
    };
  };
  flags: { svg: string };
  cca2: string;
}

export const FlagsQuizz = ({ onBack }: { onBack: () => void }) => {
  const { user, updateUserData } = useUser() as any;
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [choices, setChoices] = useState<Country[]>([]);
  
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,flags,cca2")
      .then(res => res.json())
      .then((data: Country[]) => {
        const valid = data.filter(d => d.flags?.svg && (d.name?.translations?.fra?.common || d.name?.common));
        setCountries(valid);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        toast.error("Erreur de chargement des drapeaux");
        setLoading(false);
      });
  }, []);

  const quizData = useMemo(() => {
     return user?.quizFlags || {};
  }, [user?.quizFlags]);

  const pickNextFlag = () => {
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

    const wrongChoices: Country[] = [];
    while (wrongChoices.length < 3) {
      const rand = countries[Math.floor(Math.random() * countries.length)];
      if (rand.cca2 !== pickedCountry.cca2 && !wrongChoices.find(c => c.cca2 === rand.cca2)) {
        wrongChoices.push(rand);
      }
    }

    const allChoices = [...wrongChoices, pickedCountry];
    allChoices.sort(() => Math.random() - 0.5);

    setCurrentCountry(pickedCountry);
    setChoices(allChoices);
    setSelectedChoice(null);
  };

  useEffect(() => {
    if (countries.length > 0 && !currentCountry) {
      pickNextFlag();
    }
  }, [countries, currentCountry]);


  const handleChoice = async (choiceCca2: string) => {
    if (selectedChoice !== null) return; 

    setSelectedChoice(choiceCca2);
    const isCorrect = choiceCca2 === currentCountry?.cca2;
    
    if (isCorrect) {
      setSessionScore(prev => prev + 1);
    }
    setSessionCount(prev => prev + 1);

    if (currentCountry) {
       const stat = quizData[currentCountry.cca2] || { correct: 0, total: 0 };
       const newStat = {
         ...stat,
         total: stat.total + 1,
         correct: stat.correct + (isCorrect ? 1 : 0),
         lastSeen: Date.now()
       };
       
       updateUserData({
         quizFlags: {
           ...quizData,
           [currentCountry.cca2]: newStat
         }
       }, true);
    }

    setTimeout(() => {
      pickNextFlag();
    }, 1200);
  };
  
  const getCountryName = (c: Country) => c.name.translations?.fra?.common || c.name.common;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
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
  const knownFlags = Object.keys(quizData).length;

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
              Drapeaux du Monde
            </h1>
            <p className="text-gray-500 font-mono text-xs mt-1">Niveau évolutif selon vos erreurs.</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-[#090a0f] border border-indigo-900/30 rounded-xl px-4 py-2 flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase text-indigo-500/70 font-bold tracking-widest mb-1">Précision</span>
            <div className="font-mono text-xl font-bold text-indigo-400">{globalAccuracy}%</div>
          </div>
          <div className="bg-[#090a0f] border border-indigo-900/30 rounded-xl px-4 py-2 flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] uppercase text-indigo-500/70 font-bold tracking-widest mb-1">Drapeaux</span>
            <div className="font-mono text-xl font-bold text-indigo-400">{knownFlags} / {countries.length}</div>
          </div>
        </div>
      </div>

      {currentCountry && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Area */}
          <div className="flex-1 bg-gradient-to-br from-[#0b0c15] to-[#08090e] border border-gray-800 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center">
             <div className="w-full flex justify-between items-center mb-8 border-b border-gray-800/50 pb-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Question #{sessionCount + 1}</span>
                <div className="flex items-center gap-2 text-sm font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
                  <TrendingUp size={16} /> Score Session: {sessionScore} / {sessionCount}
                </div>
             </div>

             <div className="w-64 h-40 md:w-80 md:h-52 bg-[#1a1b26] rounded-xl mb-8 flex items-center justify-center p-4 border border-gray-800 shadow-inner overflow-hidden">
                <img 
                  src={currentCountry.flags.svg} 
                  className="max-w-full max-h-full object-contain drop-shadow-2xl" 
                  alt="Drapeau"
                />
             </div>

             <h2 className="text-xl font-bold text-white mb-6 tracking-wide">À quel pays appartient ce drapeau ?</h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
               {choices.map(choice => {
                 const isSelected = selectedChoice === choice.cca2;
                 const isCorrectAnswer = currentCountry.cca2 === choice.cca2;
                 
                 let style = "bg-[#090a0f] border-gray-800 hover:border-indigo-500/50 hover:bg-[#12141f] text-gray-300";
                 
                 if (selectedChoice) {
                   if (isCorrectAnswer) {
                     style = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                   } else if (isSelected && !isCorrectAnswer) {
                     style = "bg-red-500/20 border-red-500 text-red-400";
                   } else {
                     style = "bg-[#090a0f] border-gray-800 text-gray-600 opacity-50";
                   }
                 }

                 return (
                   <button
                     key={choice.cca2}
                     disabled={selectedChoice !== null}
                     onClick={() => handleChoice(choice.cca2)}
                     className={`p-5 rounded-2xl border-2 font-bold text-left transition-all ${style}`}
                   >
                     {getCountryName(choice)}
                   </button>
                 );
               })}
             </div>
          </div>

          {/* Stats Area */}
          <div className="w-full lg:w-[350px] space-y-6 flex flex-col">
             <div className="bg-[#0b0c15] border border-gray-800 rounded-3xl p-6">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
                   <AlertTriangle className="text-orange-500" size={16} /> Points Faibles
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
                     <p className="text-xs text-emerald-500 font-mono py-4 text-center">Statistiques excellentes, continuez!</p>
                   )}
                </div>
             </div>

             <div className="bg-[#0b0c15] border border-gray-800 rounded-3xl p-6">
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
