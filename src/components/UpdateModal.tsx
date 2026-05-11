import React from "react";
import { AlertCircle, CheckCircle} from "lucide-react";

export function UpdateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a2c38] w-full max-w-md rounded-xl shadow-2xl border border-emerald-500/30 p-6 relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="text-emerald-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mise à jour (v1.1)</h2>
            <p className="text-emerald-400 text-sm font-medium">Le site a été mis à jour avec succès!</p>
          </div>
        </div>

        <div className="bg-[#0f212e] rounded-lg p-4 mb-6 border border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Nouveautés</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span className="text-gray-300 text-sm">Amélioration majeure de l'interface pour les téléphones avec navigation optimisée.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span className="text-gray-300 text-sm">Modération améliorée sur le chat (limite de temps et anti-spam de mots).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span className="text-gray-300 text-sm">Blocage dynamique des très petits écrans et des adresses IP malveillantes.</span>
            </li>
          </ul>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest py-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
