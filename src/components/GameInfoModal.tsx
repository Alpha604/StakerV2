import React from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fictive mock data for games info
export const GAME_INFO = {
   mines: { name: 'Mines', edge: '1.00%', desc: 'Plus vous découvrez de diamants, plus votre multiplicateur augmente. Mais attention ! Si vous tombez sur une mine, vous perdez votre mise.' },
   roulette: { name: 'Roulette', edge: '2.70%', desc: 'Le grand classique des casinos ! Placez vos jetons sur les numéros, couleurs (Rouge/Noir), ou d\'autres combinaisons, et regardez la roue tourner.' },
   dice: { name: 'Dice', edge: '1.00%', desc: 'Dice est le jeu original et le plus populaire. Choisissez votre chance de gagner cible. Gagnez en obtenant un résultat supérieur ou inférieur au seuil que vous avez choisi.' },
   limbo: { name: 'Limbo', edge: '1.00%', desc: 'Définissez un multiplicateur cible. Si le résultat généré est supérieur ou égal à votre cible, vous gagnez le paiement correspondant ! Il permet de viser des multiplicateurs extrêmes.' },
   crash: { name: 'Crash', edge: '4.00%', desc: 'Le multiplicateur augmente à partir de 1.00x jusqu\'à ce qu\'il "crash" aléatoirement. Encaissez avant le crash pour remporter le montant affiché !' },
   plinko: { name: 'Plinko', edge: '1.00%', desc: 'Le jeu Plinko classique. Les billes tombent à travers une planche à clous. Regardez-les rebondir aléatoirement vers les multiplicateurs en bas !' },
   keno: { name: 'Keno', edge: '1.00%', desc: 'Sélectionnez jusqu\'à 10 numéros sur la grille de 40. La maison tirera 10 numéros. Plus vous avez de correspondances, plus le multiplicateur sera élevé.' },
   wheel: { name: 'Wheel', edge: '1.00%', desc: 'Faites tourner la roue pour multiplier votre mise ! Choisissez le niveau de risque pour modifier les multiplicateurs présents sur la roue.' },
   hilo: { name: 'Hilo', edge: '1.00%', desc: 'Devinez si la prochaine carte sera supérieure ou inférieure. Un jeu de probabilités simple et addictif.' },
   'dragon-tower': { name: 'Dragon Tower', edge: '1.00%', desc: 'Gravissez la tour en évitant les dragons. Plus vous montez, plus le trésor est grand !' },
   flip: { name: 'Flip', edge: '1.00%', desc: 'Pile ou face classique avec une interface polie. Une chance sur deux de doubler votre mise.' },
   slide: { name: 'Slide', edge: '1.00%', desc: 'Ciblez un multiplicateur gagnant. Regardez glisser le multiplicateur final !' },
   baccarat: { name: 'Baccarat', edge: '1.06%', desc: 'Le classique jeu de cartes asiatique: pariez sur le Joueur, le Banquier, ou sur une Égalité.' },
   'video-poker': { name: 'Video Poker', edge: '1.00%', desc: 'Retenez les bonnes cartes pour former la main de poker la plus forte !' },
   'tome-of-life': { name: 'Tome of life', edge: '3.00%', desc: 'Lancez les rouleaux dans notre machine à sous mystèrieuse et remportez le gros lot.' }
};

interface GameInfoModalProps {
   isOpen: boolean;
   onClose: () => void;
   gameId: keyof typeof GAME_INFO | null;
}

export function GameInfoModal({ isOpen, onClose, gameId }: GameInfoModalProps) {
   if (!isOpen || !gameId) return null;
   
   const info = GAME_INFO[gameId];
   if (!info) return null;

   return (
      <AnimatePresence>
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               onClick={e => e.stopPropagation()}
               className="bg-bg-panel border border-border-medium rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
               <div className="flex items-center justify-between p-4 border-b border-border-medium bg-bg-inner/50">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                     <Search size={20} className="text-accent" />
                     <span>Informations du jeu</span>
                  </div>
                  <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors bg-bg-base p-1.5 rounded-md hover:bg-bg-inner">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 flex flex-col gap-6">
                  <div>
                     <h3 className="text-white font-black text-2xl mb-2">{info.name}</h3>
                     <p className="text-text-secondary text-sm leading-relaxed">{info.desc}</p>
                  </div>
                  <div className="flex bg-bg-inner rounded-lg p-4 gap-8 border border-border-medium">
                     <div>
                        <span className="block text-xs uppercase text-text-secondary font-bold mb-1">Avantage Maison (RTP)</span>
                        <span className="text-[#00e676] font-mono font-bold text-lg">{info.edge}</span>
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </AnimatePresence>
   );
}
