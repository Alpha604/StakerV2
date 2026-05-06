import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { CRYPTOS, renderCryptoIcon, useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export function CryptoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { activeCrypto, setActiveCrypto } = useUser();
  const [search, setSearch] = useState("");

  const filtered = CRYPTOS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-bg-panel rounded-2xl shadow-2xl border border-border-medium overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-inner">
            <h2 className="text-lg font-bold text-white">Sélectionner une Cryptomonnaie</h2>
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-border-subtle bg-bg-panel">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-inner text-white border border-border-medium rounded-lg pl-10 pr-4 py-3 outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="p-2 overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
            {filtered.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => {
                  setActiveCrypto(crypto);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 hover-fx",
                  activeCrypto.symbol === crypto.symbol
                    ? "bg-accent/10 border border-accent border-opacity-50"
                    : "hover:bg-bg-inner border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  {renderCryptoIcon(crypto, "w-8 h-8")}
                  <div className="flex flex-col items-start">
                    <span className="text-white font-bold">{crypto.symbol}</span>
                    <span className="text-text-secondary text-xs">{crypto.name}</span>
                  </div>
                </div>
                {activeCrypto.symbol === crypto.symbol && (
                  <div className="w-3 h-3 rounded-full bg-accent" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-text-secondary text-sm">
                Aucune crypto trouvée.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
