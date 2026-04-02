// src/hooks/useArenaAudio.ts
import { useCallback, useRef } from 'react';

export function useArenaAudio() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    
    // Refs for the Background Music Sequencer
    const bgmIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const bgmGainRef = useRef<GainNode | null>(null);

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

    // ========================================================================
    //  BACKGROUND MUSIC ENGINE (Procedural Synthwave)
    // ========================================================================
    
    // 🔊 BGM: Driving Cyberpunk Bassline Loop
    const startBGM = useCallback(() => {
        const ctx = initCtx();
        
        // Prevent multiple loops from stacking
        if (bgmIntervalRef.current) return; 

        // Create a dedicated volume knob for the music so it stays in the background
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.03; // Keep it low (3% volume)
        masterGain.connect(ctx.destination);
        bgmGainRef.current = masterGain;

        // A Minor Pentatonic Sequence (A2, A2, A3, A2, C3, A2, E3, D3)
        const sequence = [110.00, 110.00, 220.00, 110.00, 130.81, 110.00, 164.81, 146.83];
        let step = 0;

        // Step through the sequence every 140ms (High tempo!)
        bgmIntervalRef.current = setInterval(() => {
            const freq = sequence[step % sequence.length];
            step++;

            const osc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            
            osc.type = 'sawtooth'; // Gritty synth sound
            
            const startTime = ctx.currentTime;
            osc.frequency.setValueAtTime(freq, startTime);
            
            // Plucky envelope (fast attack, quick decay)
            noteGain.gain.setValueAtTime(0.5, startTime);
            noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.connect(noteGain);
            noteGain.connect(masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        }, 140); 
    }, [initCtx]);

    // 🔊 BGM: Stop and Fade Out
    const stopBGM = useCallback(() => {
        if (bgmIntervalRef.current) {
            clearInterval(bgmIntervalRef.current);
            bgmIntervalRef.current = null;
        }
        
        // Smoothly fade out the music over 1 second
        if (bgmGainRef.current) {
            const ctx = initCtx();
            bgmGainRef.current.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1);
            setTimeout(() => {
                bgmGainRef.current?.disconnect();
                bgmGainRef.current = null;
            }, 1000);
        }
    }, [initCtx]);

    // ========================================================================
    //  SOUND EFFECTS
    // ========================================================================

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

    return { 
        initCtx, 
        startBGM, 
        stopBGM, 
        playCountdown, 
        playStart, 
        playTick, 
        playReveal, 
        playLockIn 
    };
}
