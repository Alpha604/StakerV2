import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface WinPopupProps {
  multiplier: number;
  payout: number;
  onClose?: () => void;
}

const playWinSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Very soft, low-pitched chord (G3, C4, E4, G4)
        const frequencies = [196.00, 261.63, 329.63, 392.00];
        
        frequencies.forEach((freq, index) => {
            const time = audioCtx.currentTime + (index * 0.1);
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.02, time + 0.05); // Barely audible, pleasant chime
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(time);
            osc.stop(time + 0.6);
        });
    } catch(e) {
        console.warn('Audio play restricted', e);
    }
}

export function WinPopup({ multiplier, payout, onClose }: WinPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (multiplier > 0 && payout > 0) {
      setIsVisible(true);
      playWinSound();

      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 4000); // Show for 4 seconds

      return () => clearTimeout(timer);
    }
  }, [multiplier, payout, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div 
            initial={{ scale: 0.5, y: 50, rotateX: 45 }}
            animate={{ 
                scale: 1, 
                y: 0, 
                rotateX: 0 
            }}
            transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 15,
                mass: 1,
            }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            className="bg-[#213743] hover:bg-[#2c4755] border-4 border-[#00e676] rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px] shadow-[0_0_40px_rgba(0,230,118,0.3)] relative overflow-hidden"
          >
            {/* Background glow animated */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 shadow-[0_0_50px_rgba(0,230,118,0.5)] z-[-1]"
            />

            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-[#00e676] text-5xl font-black mb-2 drop-shadow-[0_0_10px_rgba(0,230,118,0.8)]"
            >
              {multiplier.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×
            </motion.span>
            
            <div className="w-20 h-1 bg-[#3a5b6d] rounded-full my-3"></div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <span className="text-[#00e676] text-2xl font-bold tracking-tight">
                €{payout.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
