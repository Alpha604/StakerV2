import React, { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useUser, renderCryptoIcon } from "../context/UserContext";

interface WinPopupProps {
  multiplier: number;
  payout: number;
  onClose?: () => void;
}

let sharedAudioCtx: AudioContext | null = null;


const playWinSound = () => {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioCtx = sharedAudioCtx;
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Very soft, low-pitched chord (G3, C4, E4, G4)
    const frequencies = [196.0, 261.63, 329.63, 392.0];

    frequencies.forEach((freq, index) => {
      const time = audioCtx.currentTime + index * 0.1;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.02, time + 0.05); // Barely audible, pleasant chime
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + 0.6);
    });
  } catch (e) {
    console.warn("Audio play restricted", e);
  }
};

export function WinPopup({ multiplier, payout, onClose }: WinPopupProps) {
  const { activeCrypto } = useUser();
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
    } else {
      setIsVisible(false);
    }
  }, [multiplier, payout, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div key="win-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-pointer"
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 1,
            }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="bg-[#0f212e] border-2 border-[#00e701]/30 rounded-3xl p-8 flex flex-col items-center justify-center min-w-[320px] shadow-[0_30px_60px_rgba(0,231,1,0.2)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-t before:from-[#00e701]/10 before:to-transparent z-10"
          >
            {/* Background glow animated */}
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,231,1,0.2)] z-[-1] pointer-events-none"
            />

            <h3 className="text-[#8b9ba5] uppercase tracking-[0.25em] font-black text-xs mb-3 z-10 relative">Vous avez gagné</h3>
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="text-[#00e701] text-6xl font-black mb-6 drop-shadow-[0_0_20px_rgba(0,231,1,0.4)] flex items-center justify-center gap-1 z-10 relative tracking-tighter"
            >
              {multiplier.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-3xl ml-1">×</span>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 bg-[#1a2c38] px-8 py-4 rounded-xl border border-white/5 z-10 relative w-full shadow-inner shadow-black/50"
            >
              <span className="text-white text-3xl font-black tracking-tight flex items-center justify-center gap-2">
                {payout.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
                {renderCryptoIcon(activeCrypto, "w-7 h-7 text-[#00e701]")}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
