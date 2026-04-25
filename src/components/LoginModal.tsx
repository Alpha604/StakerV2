import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { X, User, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useUser();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const success = await login(username, password, isRegister);
      if (success) {
        onClose();
      } else {
        setError(
          isRegister
            ? "Ce nom d'utilisateur est déjà pris"
            : "Identifiants incorrects. Veuillez réessayer.",
        );
      }
    } catch (err) {
      setError("Une erreur est survenue.");
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
        className="bg-bg-panel border border-border-medium rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-border-medium bg-bg-base/50 relative">
          {/* Active Tab Indicator */}
          <div className="absolute bottom-0 left-6 right-16 flex gap-4">
            <div className="w-1/2 flex justify-center pb-2 relative">
              {isRegister ? (
                <div className="absolute -bottom-px w-full h-0.5 bg-transparent" />
              ) : (
                <motion.div
                  layoutId="login-tab"
                  className="absolute -bottom-px w-full h-0.5 bg-accent"
                />
              )}
            </div>
            <div className="w-1/2 flex justify-center pb-2 relative">
              {!isRegister ? (
                <div className="absolute -bottom-px w-full h-0.5 bg-transparent" />
              ) : (
                <motion.div
                  layoutId="login-tab"
                  className="absolute -bottom-px w-full h-0.5 bg-accent"
                />
              )}
            </div>
          </div>
          <div className="flex gap-4 w-full">
            <button
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 font-bold transition-colors pb-2 ${!isRegister ? "text-white" : "text-text-secondary hover:text-white"}`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`flex-1 font-bold transition-colors pb-2 ${isRegister ? "text-white" : "text-text-secondary hover:text-white"}`}
            >
              Créer un compte
            </button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors bg-bg-inner hover:bg-border-subtle p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: -10 }}
                animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded-lg text-sm flex items-center gap-2"
              >
                <X size={16} className="shrink-0" /> <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                Nom d'utilisateur
              </label>
              <div className="relative flex items-center bg-bg-inner rounded-lg border border-border-medium hover:border-text-secondary focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <span className="pl-4 text-text-secondary">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-white font-medium p-3 outline-none"
                  placeholder="Votre pseudo"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                Mot de passe
              </label>
              <div className="relative flex items-center bg-bg-inner rounded-lg border border-border-medium hover:border-text-secondary focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <span className="pl-4 text-text-secondary">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-white font-medium p-3 outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {!isRegister && (
                <button
                  type="button"
                  className="text-xs text-text-secondary hover:text-white mt-1 self-end transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {isRegister && (
              <div className="flex items-start gap-2 bg-accent/10 border border-accent/20 p-3 rounded-lg">
                <ShieldCheck
                  size={18}
                  className="text-accent shrink-0 mt-0.5"
                />
                <p className="text-xs text-text-secondary">
                  En créant un compte, vous acceptez nos conditions
                  d'utilisations. Votre progression sera sauvegardée via votre
                  navigateur.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || username.length < 3 || password.length < 6}
            className="w-full bg-accent hover:bg-accent-hover text-white font-extrabold py-4 rounded-lg mt-2 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-accent/20 disabled:opacity-50 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isRegister ? "S'inscrire & Jouer" : "Se Connecter"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
