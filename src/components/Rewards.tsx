import React, { useState, useEffect } from "react";
import { Gift, Calendar, Award, Zap, ChevronRight, TrendingUp, Crown, Check } from "lucide-react";
import { useUser } from "../context/UserContext";
import { formatCurrency, cn } from "../lib/utils";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Rewards() {
  const { user, addBalance, subtractBalance } = useUser() as any;
  const [claimLoading, setClaimLoading] = useState(false);
  const [vipLoading, setVipLoading] = useState(false);
  const [lastClaimed, setLastClaimed] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('last_faucet_claim_' + user?.id);
    if (saved) {
      setLastClaimed(parseInt(saved));
    }
  }, [user]);

  const vipActive = user?.vipStatus?.active && user?.vipStatus?.expiresAt > Date.now();
  const canClaim = !lastClaimed || (Date.now() - lastClaimed) > (vipActive ? 12 : 24) * 60 * 60 * 1000;
  
  const handleClaim = async () => {
    if (!user) return toast.error("Connectez-vous !");
    if (user.permissions?.canClaimRewards === false) return toast.error("Vous n'êtes pas autorisé à réclamer des récompenses.");
    if (!canClaim) return toast.error("Revenez plus tard !");

    setClaimLoading(true);
    setTimeout(async () => {
      // Reward based on rank
      let reward = 10;
      if (user.rank === "Bronze") reward = 25;
      if (user.rank === "Silver") reward = 50;
      if (user.rank === "Gold") reward = 100;
      if (user.rank === "Platinum") reward = 250;
      if (user.rank === "Diamond") reward = 1000;
      if (user.rank === "Champion") reward = 5000;
      
      if (vipActive) reward *= 2; // VIP x2 Bonus

      await addBalance(reward);
      localStorage.setItem('last_faucet_claim_' + user.id, Date.now().toString());
      setLastClaimed(Date.now());
      toast.success(`Bonus journalier réclamé ! +${formatCurrency(reward)}$`);
      setClaimLoading(false);
    }, 1500);
  };

  const handleBuyVip = async () => {
    if (!user) return toast.error("Connectez-vous !");
    if (user.permissions?.canBuyVip === false) return toast.error("Vous n'êtes pas autorisé à acheter le mode VIP.");
    if (vipActive) return toast.error("Vous avez déjà un abonnement VIP actif !");
    
    setVipLoading(true);
    const success = await subtractBalance(500); // Cost of VIP is $500
    if (!success) {
      toast.error("Solde insuffisant pour acheter l'abonnement VIP ($500).");
      setVipLoading(false);
      return;
    }
    
    try {
      const userRef = doc(db, "users", user.id);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      await updateDoc(userRef, {
        vipStatus: {
          active: true,
          expiresAt: expiresAt,
          plan: "Premium"
        }
      });
      user.vipStatus = { active: true, expiresAt, plan: "Premium" }; // local update
      toast.success("Abonnement VIP Premium activé pour 30 jours !");
    } catch {
      toast.error("Une erreur est survenue.");
    }
    setVipLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Gift className="text-[#00e701]" size={32} />
          Récompenses
        </h1>
        <p className="text-[#8b9ba5] font-bold mt-2">Réclamez vos bonus et profitez de vos avantages VIP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Faucet */}
        <div className="bg-[#0f212e] rounded-xl border border-[#2f4553] p-6 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Calendar className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">Bonus Journalier</h2>
                <p className="text-[#8b9ba5] text-sm">Disponible une fois toutes les 24 heures</p>
              </div>
            </div>
            
            <p className="text-white/80 text-sm mb-6 max-w-lg leading-relaxed font-medium">
              Augmentez votre rang VIP en jouant pour réclamer un meilleur bonus chaque jour. Le multiplicateur de rang augmente continuellement avec vos mises !
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
             <button 
               onClick={handleClaim}
               disabled={!canClaim || claimLoading}
               className={cn(
                 "w-full sm:w-auto px-8 py-3.5 rounded font-black tracking-widest uppercase transition-all flex justify-center items-center gap-2",
                 canClaim && !claimLoading ? "bg-emerald-500 hover:bg-emerald-400 text-[#0f212e] shadow-[0_4px_0_#00c25a] active:translate-y-1 active:shadow-none" 
                                           : "bg-[#2f4553] text-[#8b9ba5] cursor-not-allowed"
               )}
             >
               {claimLoading ? (
                 <div className="w-5 h-5 border-2 border-[#0f212e] border-t-transparent rounded-full animate-spin"></div>
               ) : !canClaim ? (
                 "Déjà réclamé"
               ) : (
                 "Réclamer"
               )}
             </button>

             {!canClaim && (
               <div className="text-sm font-bold text-emerald-500 flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded">
                 <Zap size={16} /> Disponible demain
               </div>
             )}
          </div>
        </div>

        {/* VIP Snapshot / Subscription */}
        <div className="bg-[#213743] rounded-xl border border-[#2f4553] p-6 relative overflow-hidden flex flex-col justify-between group">
           {vipActive ? (
             <>
               <div className="text-center mt-2">
                 <div className="relative inline-block mb-4">
                   <Crown className="text-yellow-500 h-16 w-16" />
                   <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-30"></div>
                 </div>
                 <h3 className="text-xl font-black text-white mb-2 tracking-wider">Membre VIP Premium</h3>
                 <p className="text-[#8b9ba5] text-sm mb-6">Vos avantages sont activés. Profitez un maximum de vos bonus x2 et rakeback exclusifs.</p>
               </div>
               
               <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2f4553] to-transparent mb-6"></div>
               
               <div className="w-full flex justify-between items-center px-4 text-sm font-bold text-white mb-2">
                 <span>Rakeback</span>
                 <span className="text-emerald-500">Activé (10%)</span>
               </div>
               <div className="w-full flex justify-between items-center px-4 text-sm font-bold text-white mb-2">
                 <span>Délai Bonus Journalier</span>
                 <span className="text-emerald-500">12 Heures</span>
               </div>
               <div className="w-full flex justify-between items-center px-4 text-sm font-bold text-white mb-4">
                 <span>Expiration</span>
                 <span className="text-yellow-500">
                   {new Date(user.vipStatus.expiresAt).toLocaleDateString()}
                 </span>
               </div>
             </>
           ) : (
             <>
               <div className="text-center mt-2">
                 <Award className="text-blue-500 mb-4 h-12 w-12 mx-auto group-hover:scale-110 transition-transform duration-500" />
                 <h3 className="text-xl font-black text-white mb-2 tracking-wider">Abonnement VIP</h3>
                 <p className="text-[#8b9ba5] text-sm mb-4">Devenez VIP pour débloquer des avantages exclusifs pendant 30 jours.</p>
                 <div className="text-3xl font-black text-white mb-4">$500 <span className="text-sm font-bold text-[#8b9ba5]">/ mois</span></div>
               </div>
               
               <div className="space-y-2 mb-6">
                 <div className="flex items-center gap-2 text-sm text-white/80"><Check size={16} className="text-emerald-500" /> Bonus journalier x2</div>
                 <div className="flex items-center gap-2 text-sm text-white/80"><Check size={16} className="text-emerald-500" /> Réclamation bonus toutes les 12h</div>
                 <div className="flex items-center gap-2 text-sm text-white/80"><Check size={16} className="text-emerald-500" /> Rakeback de 10% sur les pertes</div>
                 <div className="flex items-center gap-2 text-sm text-white/80"><Check size={16} className="text-emerald-500" /> Badge VIP dans le chat</div>
               </div>

               <button 
                 onClick={handleBuyVip}
                 disabled={vipLoading}
                 className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-black rounded tracking-wide transition-colors flex justify-center shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none"
               >
                 {vipLoading ? "Traitement..." : "Devenir VIP"}
               </button>
             </>
           )}
        </div>
      </div>
      
      {/* Challenges / Weekly */}
      <h2 className="text-xl font-black text-white flex items-center gap-3 mt-12 mb-6">
        <TrendingUp className="text-blue-500" size={24} />
        Défis de la Semaine
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { id: "mines_wins", title: "Gagner 5 fois sur Mines", reward: 25, req: 5 },
           { id: "dice_wager", title: "Miser $500 sur le Dice", reward: 50, req: 500 },
           { id: "crash_x10", title: "Atteindre x10 sur Crash", reward: 150, req: 1 },
         ].map((challenge) => {
           const progressObj = user?.weeklyChallenges?.[challenge.id] || { progress: 0, claimed: false };
           const progress = progressObj.progress || 0;
           const isDone = progress >= challenge.req;
           const isClaimed = progressObj.claimed || false;
           const percent = Math.min((progress / challenge.req) * 100, 100);

           return (
           <div key={challenge.id} className="bg-[#0f212e] border border-[#2f4553] rounded-xl p-5 hover:border-[#557086] transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-white font-bold">{challenge.title}</h4>
                  <span className="text-emerald-500 font-black text-sm bg-emerald-500/10 px-2 py-0.5 rounded">
                    +${challenge.reward}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#8b9ba5] font-bold mb-1">
                  <span>{progress} / {challenge.req}</span>
                  <span>{percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#213743] h-2 rounded-full overflow-hidden mb-4 relative">
                   <div className={cn("h-full transition-all duration-500 relative", isDone ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
              
              <button 
                disabled={!isDone || isClaimed}
                onClick={async () => {
                  try {
                     if (!user) return;
                     if (user.permissions?.canClaimRewards === false) return toast.error("Vous n'êtes pas autorisé à réclamer des récompenses.");
                     const newChallenges = { ...user.weeklyChallenges };
                     if (!newChallenges[challenge.id]) return;
                     newChallenges[challenge.id].claimed = true;
                     user.weeklyChallenges = newChallenges; // local fast update
                     await addBalance(challenge.reward);
                     
                     // In a real scenario we could import firestore tools directly here, 
                     // or use an updateUser prop. Since user object is observed, forcing a re-render can be tricky, 
                     // but React handles the state. To keep it simple, we don't have a direct `updateUser` from the hook, 
                     // but `addBalance` will also trigger a hook sync from firestore in the effect inside UserContext.
                     toast.success(`Défi complété ! +$${challenge.reward}`);
                  } catch (e) {
                     toast.error("Erreur lors de la réclamation.");
                  }
                }}
                className={cn(
                  "w-full py-2 font-bold rounded text-sm uppercase tracking-wider transition-colors",
                  isClaimed ? "bg-[#213743] text-emerald-500 cursor-not-allowed border border-emerald-500/20" :
                  isDone ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md active:translate-y-px" :
                  "bg-[#2f4553] text-[#8b9ba5] cursor-not-allowed"
                )}>
                {isClaimed ? "Réclamé ✅" : isDone ? "Réclamer" : "Incomplet"}
              </button>
           </div>
         )})}
      </div>
    </div>
  );
}
