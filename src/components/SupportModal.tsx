import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Headset, Trophy, X, Clock, ShieldAlert, CheckCircle, XCircle, LockOpen, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useUser() as any;
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastRequest, setLastRequest] = useState<any>(null);
  
  // For standard message support
  const [supportMessage, setSupportMessage] = useState("");

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

  const handleMaxiVaultUnlock = async () => {
    setLoading(true);
    setSuccessMsg("");
    try {
      await addDoc(collection(db, "admin_requests"), {
        userId: user.id,
        userEmail: user.email,
        username: user.username,
        type: "maxi_vault_unlock",
        status: "pending",
        maxiVaultAmount: user.maxiVault || 0,
        createdAt: Date.now()
      });
      setSuccessMsg("Votre demande de déblocage du Maxi Vault a été envoyée à l'administration.");
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

  const handleSendMessage = async () => {
    if (!supportMessage.trim()) return;
    setLoading(true);
    setSuccessMsg("");
    try {
      await addDoc(collection(db, "admin_requests"), {
        userId: user.id,
        userEmail: user.email,
        username: user.username,
        type: "support_message",
        message: supportMessage.trim(),
        status: "pending",
        createdAt: Date.now()
      });
      setSuccessMsg("Votre message a été envoyé au support !");
      setSupportMessage("");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setLoading(false);
    }
  };

  const isBannedFromAppeals = user.canAppealRank === false;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/90 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-[#1f2937] border border-[#374151] p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Rank Upgrade */}
            <div className="bg-bg-inner border border-border-subtle p-4 rounded-xl hover:border-accent/50 transition-colors group flex flex-col">
               <div className="flex items-start gap-4 flex-1">
                 <div className="bg-bg-panel p-3 rounded-lg group-hover:bg-accent/10 transition-colors mt-1 shrink-0">
                   {isBannedFromAppeals ? <ShieldAlert className="text-red-500" size={24} /> : <Trophy className="text-amber-500" size={24} />}
                 </div>
                 <div className="flex-1 flex flex-col">
                   <h3 className="text-white font-bold mb-1">Évolution de grade</h3>
                   <p className="text-sm text-text-secondary mb-3 leading-relaxed flex-1">
                     Soumettez votre demande de promotion.
                   </p>
                   
                   {lastRequest && lastRequest.status !== 'pending' && (
                     <div className="mb-4 bg-black/40 border border-gray-700/50 p-3 rounded-lg text-xs">
                       <span className={`font-bold flex items-center gap-1 mb-1 ${lastRequest.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                         {lastRequest.status === 'accepted' ? <CheckCircle size={12}/> : <XCircle size={12}/>} 
                         Dernière dmd {lastRequest.status === 'accepted' ? 'acceptée' : 'refusée'}
                       </span>
                     </div>
                   )}
                   
                   {isBannedFromAppeals ? (
                     <div className="text-xs font-bold text-red-500 bg-red-500/10 inline-block px-3 py-2 rounded text-center w-full">
                       Désactivé par l'admin
                     </div>
                   ) : (
                     <button
                       onClick={handleRankUpgrade}
                       disabled={loading}
                       className="w-full py-2 bg-[#4c2e6b] hover:bg-[#5a3a7b] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm drop-shadow-md"
                     >
                       {loading ? "Envoi..." : "Solliciter"}
                     </button>
                   )}
                   <p className="text-[10px] text-text-secondary text-center mt-2 flex items-center justify-center gap-1">
                     <Clock size={10} /> 1 demande / heure
                   </p>
                 </div>
               </div>
            </div>
            
            {/* Maxi Vault */}
            <div className="bg-bg-inner border border-border-subtle p-4 rounded-xl hover:border-amber-500/50 transition-colors group flex flex-col">
               <div className="flex items-start gap-4 flex-1">
                 <div className="bg-bg-panel p-3 rounded-lg group-hover:bg-amber-500/10 transition-colors mt-1 shrink-0">
                   <LockOpen className="text-amber-500" size={24} />
                 </div>
                 <div className="flex-1 flex flex-col">
                   <h3 className="text-white font-bold mb-1">Maxi Vault (Bloqué)</h3>
                   <p className="text-sm text-text-secondary mb-3 leading-relaxed flex-1">
                     Demander le déblocage des fonds sécurisés (réservé aux blocages automatiques).
                   </p>
                   {user.maxiVault > 0 ? (
                      <button
                        onClick={handleMaxiVaultUnlock}
                        disabled={loading}
                        className="w-full py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm drop-shadow-md"
                      >
                        {loading ? "Envoi..." : `Débloquer ($${user.maxiVault.toFixed(2)})`}
                      </button>
                   ) : (
                      <div className="text-xs font-bold text-gray-500 bg-black/40 border border-gray-700/50 inline-block px-3 py-2 rounded text-center w-full">
                        Aucun fond bloqué
                      </div>
                   )}
                 </div>
               </div>
            </div>

            {/* General Message */}
            <div className="bg-bg-inner border border-border-subtle p-4 rounded-xl hover:border-blue-500/50 transition-colors group col-span-1 md:col-span-2 mt-2">
               <div className="flex items-start gap-4">
                 <div className="bg-bg-panel p-3 rounded-lg group-hover:bg-blue-500/10 transition-colors mt-1 shrink-0">
                   <MessageSquare className="text-blue-400" size={24} />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-white font-bold mb-1">Envoyer un message au support</h3>
                   <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                     Une question, un bug, ou une requête spécifique ? Écrivez-nous directement.
                   </p>
                   <textarea
                     value={supportMessage}
                     onChange={(e) => setSupportMessage(e.target.value)}
                     placeholder="Détaillez votre demande ici..."
                     className="w-full bg-[#0f1923] border border-border-subtle rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[100px] mb-3 resize-none"
                   ></textarea>
                   <button
                     onClick={handleSendMessage}
                     disabled={loading || !supportMessage.trim()}
                     className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed drop-shadow-md"
                   >
                     {loading ? "Envoi..." : "Envoyer le message"}
                   </button>
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
