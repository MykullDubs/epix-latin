// src/hooks/useArenaAudio.ts
import { useCallback, useRef } from 'react';

export function useArenaAudio() {
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize (or resume) the audio context. Browsers require a user click before audio plays!
    const initCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // The core synthesizer function
    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
        const ctx = initCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Smooth envelope to prevent audio "clicking"
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [initCtx]);

    // 🔊 SFX: Deep, ominous inception bass drop (3... 2... 1...)
    const playCountdown = useCallback(() => {
        const ctx = initCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
    }, [initCtx]);

    // 🔊 SFX: High energy start chime
    const playStart = useCallback(() => {
        playTone(440, 'square', 0.1, 0.05);
        setTimeout(() => playTone(660, 'square', 0.3, 0.1), 100);
        setTimeout(() => playTone(880, 'square', 0.5, 0.1), 200);
    }, [playTone]);

    // 🔊 SFX: The ticking clock
    const playTick = useCallback((urgent = false) => {
        playTone(urgent ? 880 : 440, 'triangle', 0.05, urgent ? 0.1 : 0.02);
    }, [playTone]);

    // 🔊 SFX: Triumphant Reveal Arpeggio (C Major)
    const playReveal = useCallback(() => {
        playTone(523.25, 'sine', 0.1, 0.1); // C5
        setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
        setTimeout(() => playTone(783.99, 'sine', 0.2, 0.1), 200); // G5
        setTimeout(() => playTone(1046.50, 'sine', 0.5, 0.15), 300); // C6
    }, [playTone]);

    // 🔊 SFX: Student locked in (High blip)
    const playLockIn = useCallback(() => {
        playTone(880, 'sine', 0.1, 0.05);
        setTimeout(() => playTone(1760, 'sine', 0.15, 0.05), 50);
    }, [playTone]);

    return { initCtx, playCountdown, playStart, playTick, playReveal, playLockIn };
}
