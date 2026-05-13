import { formatCurrency } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { useUser, CRYPTOS, renderCryptoIcon } from "../context/UserContext";
import {
  X,
  ArrowRightLeft,
  Wallet,
  Vault,
  CreditCard,
  Bitcoin,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export function WalletModal({ onClose }: { onClose: () => void }) {
  const {
    user,
    balance,
    vault,
    transferToVault,
    transferFromVault,
    addBalance,
    subtractBalance,
    activeCrypto,
    setActiveCrypto,
  } = useUser();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"buy" | "cashout" | "vault_in" | "vault_out">("buy");
  const [method, setMethod] = useState<"crypto" | "card" | "bank">("crypto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationPhase, setVerificationPhase] = useState(0);

  const handleAction = async () => {
    setError("");
    setSuccessMsg("");
    const val = parseFloat(amount);
    
    setLoading(true);

    if (tab === "buy") {
      setTimeout(async () => {
        await addBalance(val);
        setLoading(false);
        setSuccessMsg(`Dépôt de $${val} réussi !`);
        setTimeout(() => onClose(), 2000);
      }, 1500);
      return;
    }

    if (tab === "cashout") {
      setTimeout(async () => {
        const ok = await subtractBalance(val);
        setLoading(false);
        if (!ok) {
          setError("Fonds insuffisants");
          setStep(2);
        } else {
          setSuccessMsg(`Retrait initié avec succès !`);
          setTimeout(() => onClose(), 2000);
        }
      }, 1500);
      return;
    }

    let success = false;
    if (tab === "vault_out") {
      success = await transferFromVault(val);
      if (!success) {
         setError("Fonds insuffisants dans le Vault");
         setStep(2);
         setLoading(false);
         return;
      }
    } else if (tab === "vault_in") {
      success = await transferToVault(val);
      if (!success) {
         setError("Fonds insuffisants dans le Solde");
         setStep(2);
         setLoading(false);
         return;
      }
    }

    if (success) {
      setSuccessMsg("Transfert réussi !");
      setTimeout(() => onClose(), 2000);
    }
    setLoading(false);
  };

  const nextStep = () => {
      setError("");
      if (step === 1) {
          if (tab === "buy" && user?.permissions?.canDeposit === false) {
              setError("Les dépôts sont actuellement désactivés pour votre compte.");
              return;
          }
          if (tab === "cashout" && user?.permissions?.canWithdraw === false) {
              setError("Les retraits sont actuellement désactivés pour votre compte.");
              return;
          }
          setStep(2);
      } else if (step === 2) {
          const val = parseFloat(amount);
          if (isNaN(val) || val <= 0) {
              setError("Veuillez entrer un montant valide (> 0)");
              return;
          }
          if (tab === "cashout" && val > balance) {
              setError("Solde insuffisant.");
              return;
          }
          if (tab === "vault_in" && val > balance) {
              setError("Solde de jeu insuffisant.");
              return;
          }
          if (tab === "vault_out" && val > vault) {
              setError("Solde Vault insuffisant.");
              return;
          }
          setStep(3);
      }
  };

  const prevStep = () => {
      setError("");
      if (step === 2) setStep(1);
      if (step === 3) {
          setIsVerified(false);
          setVerifying(false);
          setVerificationPhase(0);
          setStep(2);
      }
  };

  // Anti-bot simulation logic
  const handleVerify = () => {
      setVerifying(true);
      setVerificationPhase(1);
      setTimeout(() => setVerificationPhase(2), 800);
      setTimeout(() => setVerificationPhase(3), 1600);
      setTimeout(() => {
          setIsVerified(true);
          setVerifying(false);
      }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-bg-panel border border-border-medium rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative"
      >
        <div className="flex justify-between items-center p-4 border-b border-border-medium bg-bg-base/50 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-bg-inner flex items-center justify-center border border-border-medium">
                <Wallet size={18} className="text-accent" />
             </div>
             <div>
                <h2 className="text-white font-bold text-lg leading-tight">Caisse</h2>
                <div className="flex gap-2 mt-0.5">
                   <div className={cn("h-1 w-6 rounded-full transition-colors", step >= 1 ? "bg-accent" : "bg-bg-inner")}></div>
                   <div className={cn("h-1 w-6 rounded-full transition-colors", step >= 2 ? "bg-accent" : "bg-bg-inner")}></div>
                   <div className={cn("h-1 w-6 rounded-full transition-colors", step >= 3 ? "bg-accent" : "bg-bg-inner")}></div>
                </div>
             </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors bg-bg-inner p-2 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col relative z-0 min-h-[400px]">
          {/* Global Error Display */}
          <AnimatePresence>
             {error && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl flex items-start gap-3 mb-4">
                 <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                 <div className="text-sm font-medium">{error}</div>
               </motion.div>
             )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                 key="step1"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="flex flex-col flex-1"
              >
                 <div className="text-sm text-text-secondary mb-4 uppercase tracking-wider font-bold">1. Type de transaction</div>
                 
                 <div className="bg-bg-base border border-border-medium rounded-xl p-1 grid grid-cols-4 gap-1 mb-6">
                    <button onClick={() => setTab("buy")} className={cn("py-3 flex flex-col items-center gap-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-colors", tab === "buy" ? "bg-bg-panel text-white shadow-md border-border-medium" : "text-text-secondary hover:text-white")}>
                       <ArrowDownToLine size={16} className={tab === "buy" ? "text-green-500" : ""} /> Dépôt
                    </button>
                    <button onClick={() => setTab("cashout")} className={cn("py-3 flex flex-col items-center gap-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-colors", tab === "cashout" ? "bg-bg-panel text-white shadow-md border-border-medium" : "text-text-secondary hover:text-white")}>
                       <ArrowUpFromLine size={16} className={tab === "cashout" ? "text-red-500" : ""} /> Retrait
                    </button>
                    <button onClick={() => setTab("vault_in")} className={cn("py-3 flex flex-col items-center gap-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-colors", tab === "vault_in" ? "bg-bg-panel text-white shadow-md border-border-medium" : "text-text-secondary hover:text-white")}>
                       <Vault size={16} className={tab === "vault_in" ? "text-indigo-400" : ""} /> Vault In
                    </button>
                    <button onClick={() => setTab("vault_out")} className={cn("py-3 flex flex-col items-center gap-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-colors", tab === "vault_out" ? "bg-bg-panel text-white shadow-md border-border-medium" : "text-text-secondary hover:text-white")}>
                       <Wallet size={16} className={tab === "vault_out" ? "text-accent" : ""} /> Vault Out
                    </button>
                 </div>

                 {(tab === "buy" || tab === "cashout") && (
                    <div className="mb-6">
                       <div className="text-sm text-text-secondary mb-3 uppercase tracking-wider font-bold">Moyen de paiement</div>
                       <div className="grid grid-cols-3 gap-2">
                         {(["crypto", "card", "bank"] as const).map((m) => (
                           <button
                             key={m}
                             onClick={() => setMethod(m)}
                             className={cn(
                               "py-4 rounded-xl flex flex-col items-center gap-2 border transition-all",
                               method === m
                                 ? "bg-accent/10 border-accent text-accent"
                                 : "bg-bg-inner border-border-medium text-text-secondary hover:text-white hover:border-text-secondary"
                             )}
                           >
                             {m === "crypto" && <Bitcoin size={24} />}
                             {m === "card" && <CreditCard size={24} />}
                             {m === "bank" && <Landmark size={24} />}
                             <span className="text-[10px] font-bold uppercase tracking-wider">{m === "card" ? "Carte Bleue" : m}</span>
                           </button>
                         ))}
                       </div>
                       
                       {method === "crypto" && (
                          <div className="mt-4 bg-bg-base border border-border-medium rounded-xl p-3 flex flex-wrap gap-2">
                             {CRYPTOS.map(crypto => (
                                <button
                                  key={crypto.symbol}
                                  onClick={() => setActiveCrypto(crypto)}
                                  className={cn(
                                     "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                                     activeCrypto.symbol === crypto.symbol
                                       ? "bg-bg-panel border-accent"
                                       : "bg-bg-inner border-border-medium hover:border-text-secondary"
                                  )}
                                >
                                   {renderCryptoIcon(crypto, "w-4 h-4")}
                                   <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                                </button>
                             ))}
                          </div>
                       )}
                    </div>
                 )}

                 <div className="mt-auto pt-4 flex justify-end">
                    <button onClick={nextStep} className="bg-accent hover:bg-accent/80 text-black font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all">
                       Continuer <ChevronRight size={18} />
                    </button>
                 </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex flex-col flex-1"
              >
                  <div className="text-sm text-text-secondary mb-4 uppercase tracking-wider font-bold">2. Saisir le montant</div>
                  
                  <div className="bg-bg-base border border-border-medium rounded-xl px-4 py-6 mb-6">
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          Montant (USD / {activeCrypto.symbol})
                        </label>
                        {(tab === "vault_in" || tab === "cashout") && (
                          <span className="text-xs text-text-secondary font-mono bg-bg-inner px-2 py-1 rounded">
                            Dispo: <span className="text-white">${formatCurrency(balance)}</span>
                          </span>
                        )}
                        {tab === "vault_out" && (
                          <span className="text-xs text-text-secondary font-mono bg-bg-inner px-2 py-1 rounded">
                            Vault: <span className="text-white">${formatCurrency(vault)}</span>
                          </span>
                        )}
                     </div>
                     
                     <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-xl group-focus-within:text-accent transition-colors">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-bg-inner/50 border-2 border-border-medium rounded-xl pt-5 pb-5 pl-10 pr-24 text-white font-mono font-bold text-2xl focus:outline-none focus:border-accent transition-colors shadow-inner"
                          placeholder="0.00"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button onClick={() => setAmount(String((balance || 0) / 2))} className="text-xs font-bold bg-bg-panel hover:bg-border-medium text-text-secondary hover:text-white px-2 py-1.5 rounded transition-colors hidden sm:block">Half</button>
                          <button onClick={() => setAmount(tab === "vault_out" ? String(vault) : String(balance))} className="text-xs font-bold bg-bg-panel hover:bg-border-medium text-text-secondary hover:text-white px-2 py-1.5 rounded transition-colors">Max</button>
                        </div>
                     </div>
                     
                     <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        {["10", "50", "100", "500", "1000"].map(v => (
                           <button key={v} onClick={() => setAmount(v)} className="flex-shrink-0 border border-border-subtle bg-bg-inner hover:bg-border-medium rounded-lg px-4 py-2 text-xs font-mono font-bold text-text-secondary hover:text-white transition-colors">
                              +${v}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="mt-auto flex justify-between gap-4">
                    <button onClick={prevStep} className="bg-bg-inner hover:bg-border-medium text-white font-bold py-3 px-4 rounded-xl flex items-center gap-2 transition-all">
                       <ChevronLeft size={18} /> Retour
                    </button>
                    <button onClick={nextStep} className="flex-1 bg-accent hover:bg-accent/80 text-black font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all">
                       Vérification <ChevronRight size={18} />
                    </button>
                 </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                 key="step3"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.05 }}
                 className="flex flex-col flex-1"
              >
                  <div className="text-sm text-text-secondary mb-4 uppercase tracking-wider font-bold">3. Vérification de Sécurité</div>
                  
                  <div className="bg-bg-base border border-border-medium rounded-xl p-6 mb-6 flex flex-col gap-4">
                      {/* Summary */}
                      <div className="flex items-center justify-between p-4 bg-bg-inner border border-border-subtle rounded-lg">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] text-text-secondary uppercase tracking-wider">Action</span>
                             <span className="font-bold flex items-center gap-2 text-sm text-white">
                                {tab === "buy" ? "Dépôt" : tab === "cashout" ? "Retrait" : tab === "vault_in" ? "Vers Vault" : "Depuis Vault"}
                                {(tab === "buy" || tab === "cashout") && <span className="text-text-secondary">({method})</span>}
                             </span>
                          </div>
                          <div className="text-right flex flex-col gap-1">
                             <span className="text-[10px] text-text-secondary uppercase tracking-wider">Montant</span>
                             <span className="font-mono font-bold text-xl text-emerald-400">${formatCurrency(parseFloat(amount))}</span>
                          </div>
                      </div>

                      {/* Anti-bot */}
                      <div className={cn("p-4 rounded-lg flex flex-col gap-3 transition-colors border", isVerified ? "bg-emerald-500/10 border-emerald-500/30" : "bg-bg-inner border-border-medium")}>
                          <div className="flex items-center gap-3">
                              {isVerified ? (
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 size={16} />
                                </div>
                              ) : verifying ? (
                                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                              ) : (
                                <button onClick={handleVerify} className="w-8 h-8 rounded border border-border-medium bg-bg-panel hover:bg-border-subtle focus:ring-2 focus:ring-accent transition-all cursor-pointer shadow-inner"></button>
                              )}
                              <div className="flex flex-col">
                                  <span className="font-bold text-sm text-white">Vérification de sécurité</span>
                                  <span className="text-xs text-text-secondary">
                                      {isVerified ? "Vérification réussie. Vous êtes validé." : verifying ? "Analyse de la connexion en cours..." : "Cochez la case pour prouver que vous êtes humain."}
                                  </span>
                              </div>
                              <div className="ml-auto opacity-30">
                                 <ShieldAlert size={24} />
                              </div>
                          </div>
                          
                          {verifying && (
                             <div className="mt-2 text-xs font-mono text-text-secondary flex flex-col gap-1.5 pl-[2.75rem]">
                                <div className="flex items-center gap-2">
                                     {verificationPhase >= 1 ? <CheckCircle2 size={12} className="text-emerald-400"/> : <Loader2 size={12} className="animate-spin" />}
                                     <span className={verificationPhase >= 1 ? "text-emerald-400/80" : ""}>Contrôle de l'adresse IP...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     {verificationPhase >= 2 ? <CheckCircle2 size={12} className="text-emerald-400"/> : verificationPhase >= 1 ? <Loader2 size={12} className="animate-spin" /> : <div className="w-3 h-3"/>}
                                     <span className={verificationPhase >= 2 ? "text-emerald-400/80" : verificationPhase >= 1 ? "text-white/60" : "text-text-secondary"}>Vérification des accès compte... {verificationPhase >= 2 && "(Autorisé)"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     {verificationPhase >= 3 ? <CheckCircle2 size={12} className="text-emerald-400"/> : verificationPhase >= 2 ? <Loader2 size={12} className="animate-spin" /> : <div className="w-3 h-3"/>}
                                     <span className={verificationPhase >= 3 ? "text-emerald-400/80" : verificationPhase >= 2 ? "text-white/60" : "text-text-secondary"}>Sécurisation de la connexion SSL...</span>
                                </div>
                             </div>
                          )}
                      </div>
                  </div>

                  <AnimatePresence>
                     {successMsg && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
                           <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                              <CheckCircle2 size={18} /> {successMsg}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <div className="mt-auto flex justify-between gap-4">
                    <button onClick={prevStep} disabled={loading || verifying} className="bg-bg-inner disabled:opacity-50 hover:bg-border-medium text-white font-bold py-3 px-4 rounded-xl flex items-center gap-2 transition-all">
                       <ChevronLeft size={18} /> Retour
                    </button>
                    <button onClick={handleAction} disabled={!isVerified || loading} className={cn("flex-1 text-black font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all", (!isVerified) ? "bg-bg-inner text-text-secondary cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]")}>
                       {loading ? <Loader2 size={18} className="animate-spin text-black" /> : tab === "buy" ? "Confirmer le dépôt" : tab === "cashout" ? "Confirmer le retrait" : "Valider le transfert"}
                    </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

