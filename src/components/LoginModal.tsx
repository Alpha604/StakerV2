import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        onClose();
      } else {
        setError('Identifiants incorrects.');
      }
    } catch (err) {
      setError('Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-panel border border-border-medium rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-border-medium bg-bg-base/50">
          <h2 className="text-white font-bold text-lg">Connexion</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3 rounded text-sm">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-secondary">Nom d'utilisateur</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-bg-inner border border-border-medium rounded p-3 text-white focus:outline-none focus:border-accent"
              placeholder="Ex: romeo59"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-secondary">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-bg-inner border border-border-medium rounded p-3 text-white focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#1475e1] hover:bg-[#1b80f0] text-white font-bold py-3 rounded mt-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
