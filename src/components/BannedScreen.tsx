import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { AlertTriangle, Clock, Mail, ShieldAlert, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function BannedScreen({ user }: { user: any }) {
  const { logoutUser } = useUser();
  const [appealing, setAppealing] = useState(false);
  const [appealRequested, setAppealRequested] = useState(user.banAppealRequested || false);
  const [lastRequest, setLastRequest] = useState<any>(null);

  const isSuspended = user.status === 'suspended';
  const endsAt = isSuspended && user.suspensionEndsAt ? new Date(user.suspensionEndsAt) : null;

  useEffect(() => {
    async function fetchLastRequest() {
      if (!user.id) return;
      const q = query(
        collection(db, "admin_requests"), 
        where("userId", "==", user.id), 
        where("type", "==", "ban_appeal"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLastRequest(snap.docs[0].data());
      }
    }
    fetchLastRequest();
  }, [user.id, appealRequested]);

  const handleAppeal = async () => {
    if (!user.id || appealing || appealRequested) return;
    setAppealing(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        banAppealRequested: true
      });
      await addDoc(collection(db, "admin_requests"), {
        userId: user.id,
        userEmail: user.email,
        username: user.username,
        type: "ban_appeal",
        status: "pending",
        createdAt: Date.now()
      });
      setAppealRequested(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la demande de révision.");
    } finally {
      setAppealing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden bg-pattern">
      <div className="absolute inset-0 bg-red-900/10 pointer-events-none"></div>

      <div className="bg-bg-panel border border-border-subtle p-8 md:p-12 rounded-2xl max-w-xl w-full mx-4 relative z-10 flex flex-col items-center text-center shadow-2xl">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="text-red-500 w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2">
          Compte {isSuspended ? 'Suspendu' : 'Banni'}
        </h1>
        <p className="text-text-secondary mb-8">
          {isSuspended 
            ? "Votre compte a été temporairement suspendu en raison d'une infraction à nos conditions d'utilisation."
            : "Votre compte a été banni de façon permanente de notre plateforme."}
        </p>

        <div className="w-full bg-bg-inner rounded-xl border border-border-subtle p-6 mb-8 text-left space-y-4">
          <div>
            <span className="text-text-secondary text-sm font-bold uppercase block mb-1">Raison</span>
            <span className="text-white font-medium">{isSuspended ? (user.suspensionReason || "Aucune raison spécifiée.") : (user.banReason || "Aucune raison spécifiée.")}</span>
          </div>

          {isSuspended && endsAt && (
            <div>
              <span className="text-text-secondary text-sm font-bold uppercase block mb-1">Fin de la suspension</span>
              <div className="flex items-center gap-2 text-white font-medium">
                <Clock className="text-accent" size={16} />
                {endsAt.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
            </div>
          )}
        </div>

        {lastRequest && lastRequest.status !== 'pending' && (
          <div className="w-full bg-black/30 rounded-xl border border-gray-800 p-6 mb-8 text-left space-y-2">
             <div className="flex flex-col mb-2">
                 <span className="text-text-secondary text-sm font-bold uppercase">Résultat de votre dernière demande</span>
                 <span className={`text-lg font-bold flex items-center gap-2 ${lastRequest.status === 'accepted' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {lastRequest.status === 'accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {lastRequest.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                 </span>
             </div>
             {lastRequest.adminResponse && (
               <div>
                 <span className="text-text-secondary text-xs font-bold uppercase block mb-1">Message d'un Administrateur</span>
                 <p className="text-gray-300 bg-[#1f2937] p-3 rounded-lg border border-gray-700">{lastRequest.adminResponse}</p>
               </div>
             )}
          </div>
        )}

        {!appealRequested ? (
          <button
            onClick={handleAppeal}
            disabled={appealing}
            className={cn(
              "w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md active:scale-95",
              appealing ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200"
            )}
          >
            <Mail size={20} />
            {appealing ? 'Envoi en cours...' : 'Demander une révision'}
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <AlertTriangle size={20} />
            Demande de révision en cours de traitement
          </div>
        )}

        <button
          onClick={() => logoutUser()}
          className="mt-6 text-text-secondary hover:text-white font-bold transition-colors flex items-center gap-2"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
