import { formatCurrency } from "../lib/utils";
import React, { useState } from "react";
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
} from "lucide-react";
import { motion } from "motion/react";
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
  const [amount, setAmount] = useState("100");
  const [tab, setTab] = useState<"buy" | "cashout" | "vault_in" | "vault_out">(
    "buy",
  );
  const [method, setMethod] = useState<"crypto" | "card" | "bank">("crypto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleAction = async () => {
    setError("");
    setSuccessMsg("");
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Montant invalide");
      return;
    }

    if (tab === "buy" && user?.permissions?.canDeposit === false) {
      setError("Les dépôts sont actuellement désactivés pour votre compte.");
      return;
    }

    if (tab === "buy" && !isVerified) {
      setError("Veuillez vérifier que vous n'êtes pas un robot.");
      return;
    }

    if (tab === "cashout" && user?.permissions?.canWithdraw === false) {
      setError("Les retraits sont actuellement désactivés pour votre compte.");
      return;
    }

    setLoading(true);

    if (tab === "buy") {
      setTimeout(async () => {
        await addBalance(val);
        setLoading(false);
        setAmount("");
        setSuccessMsg(`Dépôt de $${val} réussi !`);
        setTimeout(() => setSuccessMsg(""), 3000);
      }, 1000);
      return;
    }

    if (tab === "cashout") {
      setTimeout(async () => {
        const ok = await subtractBalance(val);
        setLoading(false);
        if (!ok) {
          setError("Fonds insuffisants");
        } else {
          setAmount("");
          setSuccessMsg(`Retrait de $${val} initié avec succès !`);
          setTimeout(() => setSuccessMsg(""), 3000);
        }
      }, 1000);
      return;
    }

    let success = false;
    if (tab === "vault_out") {
      success = await transferFromVault(val);
      if (!success) setError("Fonds insuffisants dans le Vault (Coffre)");
    } else if (tab === "vault_in") {
      success = await transferToVault(val);
      if (!success) setError("Fonds insuffisants dans le Solde de Jeu");
    }

    if (success) {
      setAmount("");
      setSuccessMsg("Transfert réussi !");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-bg-panel border border-border-medium rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-border-medium bg-bg-base/50">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Wallet size={20} className="text-accent" />
            Portefeuille & Vault
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors bg-bg-inner p-1.5 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Balances Display */}
          <div className="flex gap-4">
            <div className="flex-1 bg-bg-base border border-border-medium rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-accent opacity-5 blur-xl rounded-full"></div>
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <Wallet size={12} /> Solde Jeu
              </span>
              <span className="text-xl font-bold font-mono text-white">
                ${formatCurrency(balance)}
              </span>
            </div>

            <div className="flex items-center justify-center text-border-medium">
              <ArrowRightLeft size={20} />
            </div>

            <div className="flex-1 bg-bg-base border border-border-medium shadow-inner rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500 opacity-5 blur-xl rounded-full"></div>
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <Vault size={12} /> Vault
              </span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                ${formatCurrency(vault)}
              </span>
            </div>
          </div>

          <div className="bg-bg-base border border-border-medium rounded-xl p-1 grid grid-cols-4 gap-1">
            <button
              onClick={() => setTab("buy")}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1",
                tab === "buy"
                  ? "bg-bg-panel text-white shadow border border-border-medium"
                  : "text-text-secondary hover:text-white",
              )}
            >
              <ArrowDownToLine size={14} className="text-green-500" /> Acheter
            </button>
            <button
              onClick={() => setTab("cashout")}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1",
                tab === "cashout"
                  ? "bg-bg-panel text-white shadow border border-border-medium"
                  : "text-text-secondary hover:text-white",
              )}
            >
              <ArrowUpFromLine size={14} className="text-red-500" /> Retirer
            </button>
            <button
              onClick={() => setTab("vault_in")}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1",
                tab === "vault_in"
                  ? "bg-bg-panel text-white shadow border border-border-medium"
                  : "text-text-secondary hover:text-white",
              )}
            >
              <Vault size={14} className="text-indigo-400" /> Vers Vault
            </button>
            <button
              onClick={() => setTab("vault_out")}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1",
                tab === "vault_out"
                  ? "bg-bg-panel text-white shadow border border-border-medium"
                  : "text-text-secondary hover:text-white",
              )}
            >
              <Wallet size={14} className="text-accent" /> Vers Jeu
            </button>
          </div>

          {(tab === "buy" || tab === "cashout") && (
            <div className="flex flex-col gap-4">
               <div className="flex gap-2">
                 {(["crypto", "card", "bank"] as const).map((m) => (
                   <button
                     key={m}
                     onClick={() => setMethod(m)}
                     className={cn(
                       "flex-1 py-3 rounded-xl flex flex-col items-center gap-2 border transition-all",
                       method === m
                         ? "bg-accent/10 border-accent text-accent"
                         : "bg-bg-inner border-border-medium text-text-secondary hover:text-white",
                     )}
                   >
                     {m === "crypto" && <Bitcoin size={20} />}
                     {m === "card" && <CreditCard size={20} />}
                     {m === "bank" && <Landmark size={20} />}
                     <span className="text-xs font-bold uppercase">{m}</span>
                   </button>
                 ))}
               </div>

               {method === "crypto" && (
                  <div className="bg-bg-base border border-border-medium rounded-xl p-3 flex flex-wrap gap-2">
                     <div className="w-full text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                        Sélectionner une crypto
                     </div>
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
                           {renderCryptoIcon(crypto, "w-5 h-5")}
                           <span className="text-sm font-bold text-white">{crypto.symbol}</span>
                        </button>
                     ))}
                  </div>
               )}
            </div>
          )}

          {(tab === "buy" && user?.permissions?.canDeposit === false) ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm font-medium">Les dépôts sont actuellement bloqués par l'administration sur votre compte.</div>
            </div>
          ) : (tab === "cashout" && user?.permissions?.canWithdraw === false) ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-sm font-medium">Les retraits sont actuellement bloqués par l'administration sur votre compte.</div>
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Montant ($)
                </label>
                {(tab === "vault_in" || tab === "cashout") && (
                  <span className="text-xs text-text-secondary font-mono">
                    Max: ${formatCurrency(balance)}
                  </span>
                )}
                {tab === "vault_out" && (
                  <span className="text-xs text-text-secondary font-mono">
                    Max: ${formatCurrency(vault)}
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-bg-inner border border-border-medium rounded-xl p-4 pl-10 text-white font-mono font-bold focus:outline-none focus:border-accent transition-colors"
                  placeholder="0.00"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {["10", "50", tab === "buy" ? "100" : "Max"].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        if (m === "Max")
                          setAmount(
                            tab === "vault_out"
                              ? String(vault || 0)
                              : String(balance),
                          );
                        else setAmount(m);
                      }}
                      className="text-xs font-bold bg-bg-panel hover:bg-border-medium text-text-secondary hover:text-white px-2 py-1.5 rounded transition-colors"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <span className="text-xs text-red-500 font-semibold mt-1">
                  {error}
                </span>
              )}
              {successMsg && (
                <span className="text-xs text-[#00e676] font-semibold mt-1">
                  {successMsg}
                </span>
              )}
            </div>

            {tab === "buy" && (
              <label className="flex items-center gap-3 p-3 mt-2 mb-2 border border-border-medium rounded-lg bg-bg-inner cursor-pointer hover:border-text-secondary transition-colors">
                 <input 
                   type="checkbox"
                   className="w-5 h-5 accent-accent bg-bg-base border-border-medium rounded"
                   checked={isVerified}
                   onChange={(e) => setIsVerified(e.target.checked)}
                 />
                 <span className="text-sm font-semibold text-text-secondary">Je ne suis pas un robot</span>
                 <div className="ml-auto opacity-50">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                 </div>
              </label>
            )}

            <button
              onClick={handleAction}
              disabled={loading || (tab === "buy" && !isVerified)}
              className={cn(
                "w-full font-bold py-4 rounded-xl mt-2 transition-all flex justify-center items-center gap-2",
                tab === "buy"
                  ? "bg-[#00e676] hover:bg-[#00c853] text-[#0a1e12] shadow-[0_0_15px_rgba(0,230,118,0.2)]"
                  : tab === "cashout"
                    ? "bg-bg-inner hover:bg-border-subtle border border-border-medium text-white"
                    : tab === "vault_out"
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-[#1475e1] hover:bg-[#1b80f0] text-white",
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : tab === "buy" ? (
                "Acheter depuis le compte"
              ) : tab === "cashout" ? (
                "Encaisser (Retirer sur compte)"
              ) : tab === "vault_out" ? (
                "Transférer vers Solde de Jeu"
              ) : (
                "Mettre au coffre (Vault)"
              )}
            </button>
          </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
