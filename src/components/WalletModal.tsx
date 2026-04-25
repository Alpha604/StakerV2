import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ArrowDownToLine, ArrowUpFromLine, Bitcoin, Landmark, CreditCard, History, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { cn } from '../lib/utils';

export function WalletModal({ onClose }: { onClose: () => void }) {
  const { balance, addBalance, subtractBalance, user } = useUser();
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState<string>('50');
  const [method, setMethod] = useState<'crypto' | 'card' | 'bank'>('crypto');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTransaction = async () => {
    if (!user) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    setLoading(true);
    setSuccess(false);

    // Simulate network delay
    setTimeout(async () => {
      if (tab === 'deposit') {
        await addBalance(val);
        setSuccess(true);
      } else if (tab === 'withdraw') {
        const ok = await subtractBalance(val);
        setSuccess(ok);
      }
      setLoading(false);
      setAmount('');
      
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-bg-panel border border-border-medium rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-bg-base">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            Wallet <span className="text-text-secondary font-mono bg-bg-inner px-2 py-1 rounded text-sm">${balance.toFixed(2)}</span>
          </h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-white rounded-full hover:bg-bg-inner transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-border-subtle bg-bg-base">
          <button 
            onClick={() => setTab('deposit')}
            className={cn("flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors", tab === 'deposit' ? "text-accent border-accent" : "text-text-secondary border-transparent hover:text-white hover:bg-bg-inner")}
          >
            <ArrowDownToLine size={16} /> Dépôt
          </button>
          <button 
            onClick={() => setTab('withdraw')}
            className={cn("flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors", tab === 'withdraw' ? "text-accent border-accent" : "text-text-secondary border-transparent hover:text-white hover:bg-bg-inner")}
          >
            <ArrowUpFromLine size={16} /> Retrait
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex gap-2">
            {(['crypto', 'card', 'bank'] as const).map(m => (
              <button 
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 py-3 rounded-lg flex flex-col items-center gap-2 border transition-all",
                  method === m 
                    ? "bg-accent/10 border-accent text-accent" 
                    : "bg-bg-inner border-border-medium text-text-secondary hover:text-white"
                )}
              >
                {m === 'crypto' && <Bitcoin size={24} />}
                {m === 'card' && <CreditCard size={24} />}
                {m === 'bank' && <Landmark size={24} />}
                <span className="text-xs font-bold uppercase">{m}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-text-secondary">Montant (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">$</span>
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-bg-inner border border-border-medium rounded-lg py-3 pl-8 pr-4 text-white font-mono text-lg focus:outline-none focus:border-accent"
              />
            </div>
            {tab === 'deposit' && (
              <div className="flex gap-2 mt-2">
                {[50, 100, 250, 1000].map(v => (
                  <button 
                    key={v} 
                    onClick={() => setAmount(v.toString())}
                    className="flex-1 py-1 bg-bg-inner hover:bg-border-subtle rounded border border-border-medium text-text-secondary hover:text-white transition-colors text-sm font-mono"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            )}
            {tab === 'withdraw' && (
              <div className="flex gap-2 mt-2">
                 <button 
                    onClick={() => setAmount(balance.toString())}
                    className="flex-1 py-1 bg-bg-inner hover:bg-border-subtle rounded border border-border-medium text-text-secondary hover:text-white transition-colors text-sm font-bold uppercase"
                  >
                    Max (${balance.toFixed(2)})
                  </button>
              </div>
            )}
          </div>

          <button 
            disabled={loading || !amount || parseFloat(amount) <= 0 || (tab === 'withdraw' && parseFloat(amount) > balance)}
            onClick={handleTransaction}
            className="w-full py-4 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : success ? (
               <><CheckCircle2 size={20} /> Succès !</>
            ) : (
              tab === 'deposit' ? 'Confirmer le Dépôt' : 'Demander le Retrait'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
