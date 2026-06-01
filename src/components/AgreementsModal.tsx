import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { CheckCircle, ShieldAlert, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Toaster } from "react-hot-toast";

export const AgreementsModal = () => {
  const { user, appSettings, updateUserData } = useUser() as any;
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [termsConfirm, setTermsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const version = appSettings?.agreementsConfig?.termsVersion || 1;
  const termsText = appSettings?.agreementsConfig?.termsText || "En utilisant cette application, vous acceptez nos conditions générales d'utilisation. Le jeu comporte des risques, ne misez que ce que vous pouvez vous permettre de perdre.";
  const minAge = appSettings?.agreementsConfig?.ageMinimum || 18;

  const handleAccept = async () => {
    if (!ageConfirm || !termsConfirm) return;
    setLoading(true);
    await updateUserData({
      agreements: {
        ageVerified: true,
        termsAccepted: true,
        termsVersion: Number(version),
        needsReverification: false,
        agreedAt: Date.now()
      }
    }, false);
    setLoading(false);
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#0f212e] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShieldAlert className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Vérification Requise</h2>
            <p className="text-gray-400 font-medium text-sm">Veuillez confirmer vos informations et accepter nos conditions pour continuer.</p>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-5 mb-6 border border-gray-800/50 max-h-48 overflow-y-auto custom-scrollbar">
          <div className="markdown-body max-w-none text-sm text-gray-300">
            <ReactMarkdown>{termsText}</ReactMarkdown>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${ageConfirm ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#0c0c0e] border-gray-800 hover:border-gray-700'}`}>
            <div className="flex-shrink-0 mt-0.5">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 bg-[#1a2c38] checked:bg-emerald-500"
                checked={ageConfirm}
                onChange={(e) => setAgeConfirm(e.target.checked)}
              />
            </div>
            <div>
              <p className={`font-bold text-sm ${ageConfirm ? 'text-emerald-400' : 'text-white'}`}>Je certifie avoir plus de {minAge} ans.</p>
              <p className="text-xs text-gray-500 mt-1">Les jeux d'argent sont strictement interdits aux mineurs. Des vérifications d'identité pourront être demandées.</p>
            </div>
          </label>

          <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${termsConfirm ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#0c0c0e] border-gray-800 hover:border-gray-700'}`}>
            <div className="flex-shrink-0 mt-0.5">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 bg-[#1a2c38] checked:bg-blue-500"
                checked={termsConfirm}
                onChange={(e) => setTermsConfirm(e.target.checked)}
              />
            </div>
            <div>
              <p className={`font-bold text-sm ${termsConfirm ? 'text-blue-400' : 'text-white'}`}>J'accepte les conditions générales d'utilisation.</p>
              <p className="text-xs text-gray-500 mt-1">J'ai lu et compris le règlement de la plateforme et accepte de m'y conformer.</p>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAccept}
            disabled={!ageConfirm || !termsConfirm || loading}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${(!ageConfirm || !termsConfirm || loading) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white shadow-lg shadow-blue-500/25'}`}
          >
            {loading ? "Validation..." : "J'accepte et je continue"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
