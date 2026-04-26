import { useEffect, useCallback, useRef } from 'react';

// Pre-create audio context to avoid delay
let audioCtx: AudioContext | null = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

export const useSound = () => {
  useEffect(() => {
    initAudio();
    const resumeAudio = () => {
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume();
      }
    };
    window.addEventListener('click', resumeAudio, { once: true });
    return () => window.removeEventListener('click', resumeAudio);
  }, []);

  const playTick = useCallback(() => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
  }, []);

  const playWin = useCallback(() => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
  }, []);

  const playLoss = useCallback(() => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
  }, []);

  const playHit = useCallback(() => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(261.63, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(329.63, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
  }, []);

  const playMiss = useCallback(() => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {}
  }, []);

  return { playTick, playWin, playLoss, playHit, playMiss };
};
