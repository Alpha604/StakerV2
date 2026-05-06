import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { loginWithGoogle } = useUser();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const success = await loginWithGoogle();
      if (success) {
        onClose();
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-panel border border-border-medium rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors bg-bg-inner hover:bg-border-subtle p-1 rounded-full"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6 text-center mt-2">Connectez-vous</h2>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error-message"
              initial={{ opacity: 0, height: 0, marginTop: -10 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-lg text-sm flex items-center mb-4 gap-2"
            >
              <X size={16} className="shrink-0" /> <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="connexion-btn w-full relative disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center bg-white text-black hover:bg-gray-100 rounded-lg py-3 font-semibold transition-all h-12"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
             <>
              <svg width="18" height="18" viewBox="0 0 18 18" className="absolute left-6">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"></path>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"></path>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"></path>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"></path>
              </svg>
              <span>Continuer avec Google</span>
             </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
