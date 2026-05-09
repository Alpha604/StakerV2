import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Headset, Trophy, X, Clock, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser() as any;
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastRequest, setLastRequest] = useState<any>(null);

  useEffect(() => {
    async function fetchLastRequest() {
      if (!user?.id || !isOpen) return;
      const q = query(
        collection(db, "admin_requests"), 
        where("userId", "==", user.id), 
        where("type", "==", "rank_upgrade"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastRequest(snap.docs[0].data());
      }
    }
    fetchLastRequest();
  }, [user?.id, isOpen]);

  if (!isOpen || !user) return null;

  const handleRankUpgrade = async () => {
    if (user.canAppealRank === false) {
      alert("Vous n'êtes pas autorisé à demander une augmentation de grade. Veuillez contacter l'administration.");
      return;
    }

    const lastTime = user.lastRankAppealTime || 0;
    const cooldown = 60 * 60 * 1000; // 1 hour
    if (Date.now() - lastTime < cooldown) {
      const waitTime = Math.ceil((cooldown - (Date.now() - lastTime)) / 60000);
      alert(`Veuillez patienter encore ${waitTime} minutes avant de faire une nouvelle demande.`);
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    try {
      await updateDoc(doc(db, "users", user.id), {
        lastRankAppealTime: Date.now()
      });
      await addDoc(collection(db, "admin_requests"), {
        userId: user.id,
        userEmail: user.email,
        username: user.username,
        type: "rank_upgrade",
        status: "pending",
        createdAt: Date.now()
      });
      setSuccessMsg("Votre demande d'augmentation de grade a été envoyée avec succès à nos équipes !");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la demande.");
    } finally {
      setLoading(false);
    }
  };

  const isBannedFromAppeals = user.canAppealRank === false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/90 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-[#1f2937] border border-[#374151] p-6 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
            <Headset className="text-accent" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">Support en direct</h2>
            <p className="text-text-secondary text-sm">Comment pouvons-nous vous aider ?</p>
          </div>
        </div>

        {successMsg ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex flex-col items-center justify-center text-center py-8">
            <CheckCircle size={48} className="mb-4 text-emerald-500" />
            <p className="font-bold">{successMsg}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-bg-inner border border-border-subtle p-4 rounded-xl hover:border-accent/50 transition-colors group">
               <div className="flex items-start gap-4">
                 <div className="bg-bg-panel p-3 rounded-lg group-hover:bg-accent/10 transition-colors mt-1">
                   {isBannedFromAppeals ? <ShieldAlert className="text-red-500" size={24} /> : <Trophy className="text-amber-500" size={24} />}
                 </div>
                 <div className="flex-1">
                   <h3 className="text-white font-bold mb-1">Demander une évolution de grade</h3>
                   <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                     Pensez-vous remplir les conditions pour atteindre le grade suivant ? Soumettez votre demande pour être promu !
                   </p>
                   
                   {lastRequest && lastRequest.status !== 'pending' && (
                     <div className="mb-4 bg-black/40 border border-gray-700/50 p-3 rounded-lg text-sm">
                       <span className={`font-bold flex items-center gap-1 mb-1 ${lastRequest.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                         {lastRequest.status === 'accepted' ? <CheckCircle size={14}/> : <XCircle size={14}/>} 
                         Dernière demande {lastRequest.status === 'accepted' ? 'acceptée' : 'refusée'}
                       </span>
                       {lastRequest.adminResponse && (
                          <div className="text-gray-300 italic">" {lastRequest.adminResponse} "</div>
                       )}
                     </div>
                   )}
                   
                   {isBannedFromAppeals ? (
                     <div className="text-xs font-bold text-red-500 bg-red-500/10 inline-block px-3 py-1.5 rounded text-center w-full">
                       Désactivé par l'administration
                     </div>
                   ) : (
                     <button
                       onClick={handleRankUpgrade}
                       disabled={loading}
                       className="w-full py-2.5 bg-[#4c2e6b] hover:bg-[#5a3a7b] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm drop-shadow-md"
                     >
                       {loading ? "Envoi..." : "Envoyer une demande"}
                     </button>
                   )}
                   <p className="text-[10px] text-text-secondary text-center mt-2 flex items-center justify-center gap-1">
                     <Clock size={10} /> 1 demande autorisée par heure
                   </p>
                 </div>
               </div>
            </div>
            
            {/* Future options can go here */}
            <div className="text-center opacity-50 p-4 bg-bg-inner/50 rounded-xl border border-dashed border-border-subtle">
               <span className="text-sm text-text-secondary font-bold">Plus d'options de support à venir</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
