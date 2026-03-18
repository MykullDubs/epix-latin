// src/components/LiveSlipstreamProjector.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { 
    X, Zap, Shield, Crown, Gauge, Rocket, Activity, AlertTriangle, Users // 🔥 ADDED Users
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export default function LiveSlipstreamProjector({ deck, classId, activeClass, onExit }: any) {
    const { liveState } = useLiveClass(classId, true);
    
    const [raceState, setRaceState] = useState<'booting' | 'lobby' | 'countdown' | 'racing' | 'finished'>('booting');
    const [countdown, setCountdown] = useState(3);
    const totalQuestions = deck?.cards?.length || 10;
    
    // Boot Sequence
    useEffect(() => {
        const timer = setTimeout(() => setRaceState('lobby'), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Countdown Sequence
    useEffect(() => {
        if (raceState === 'countdown') {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                startRace();
            }
        }
    }, [raceState, countdown]);

    const startCountdown = () => setRaceState('countdown');

    const startRace = async () => {
        setRaceState('racing');
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { 
            quizState: 'racing',
            totalQuestions: totalQuestions,
            progress: {}, // Students will write their progress here: { "email@...": 4 }
            startTime: Date.now()
        });
    };

    const handleFinishRace = async () => {
        setRaceState('finished');
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { quizState: 'finished' });
    };

    // Calculate Racer Positions
    const racers = useMemo(() => {
        const joined = liveState?.joined || {};
        const progress = liveState?.progress || {}; // Number of correct answers per student
        
        return Object.keys(joined).map(email => {
            const s = activeClass?.students?.find((st: any) => st.email.replace(/\./g, ',') === email || st.email === email);
            const currentQ = progress[email] || 0;
            const pct = Math.min(100, (currentQ / totalQuestions) * 100);
            
            // Assign neon colors based on join order or hash
            const colorPalette = [
                'from-cyan-400 to-blue-600 border-cyan-300 shadow-cyan-500/50',
                'from-fuchsia-500 to-purple-600 border-fuchsia-400 shadow-fuchsia-500/50',
                'from-emerald-400 to-teal-600 border-emerald-300 shadow-emerald-500/50',
                'from-amber-400 to-orange-600 border-amber-300 shadow-amber-500/50',
                'from-rose-500 to-red-600 border-rose-400 shadow-rose-500/50'
            ];
            const colorHash = email.length % colorPalette.length;

            return {
                id: email,
                name: s?.name || email.split('@')[0],
                progress: currentQ,
                pct: pct,
                colorClass: colorPalette[colorHash],
                isFinished: currentQ >= totalQuestions
            };
        }).sort((a, b) => b.progress - a.progress); // Sort by who is furthest ahead
    }, [liveState?.joined, liveState?.progress, activeClass?.students, totalQuestions]);

    // Auto-finish when everyone crosses the line
    useEffect(() => {
        if (raceState === 'racing' && racers.length > 0) {
            const allFinished = racers.every(r => r.isFinished);
            if (allFinished) handleFinishRace();
        }
    }, [racers, raceState]);

    if (raceState === 'booting') {
        return (
            <div className="h-full bg-slate-950 flex flex-col items-center justify-center font-mono text-cyan-500 overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-30" />
                <div className="space-y-4 animate-pulse text-center relative z-10">
                    <p className="text-xs tracking-[0.5em] uppercase opacity-50 text-fuchsia-500">Establishing Grid Uplink...</p>
                    <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">Slipstream Run</h2>
                </div>
            </div>
        );
    }

    if (raceState === 'finished') {
        return (
            <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950 pointer-events-none" />
                <Crown size={80} className="text-cyan-400 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]" />
                <h1 className="text-8xl font-black uppercase tracking-tighter italic mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Race Concluded</h1>
                
                <div className="w-full max-w-4xl bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-[3rem] p-10 shadow-[0_0_50px_rgba(6,182,212,0.1)] z-10">
                    <h3 className="text-center text-cyan-500 font-black uppercase tracking-widest mb-8">Final Standings</h3>
                    <div className="space-y-4">
                        {racers.slice(0, 5).map((racer, i) => (
                            <div key={racer.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                                        {i + 1}
                                    </div>
                                    <span className="font-black text-white uppercase tracking-wider">{racer.name}</span>
                                </div>
                                <span className="text-fuchsia-500 font-black italic">{racer.pct >= 100 ? 'FINISHED' : 'DNF'}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onExit} className="mt-12 bg-transparent border-2 border-cyan-500 text-cyan-400 px-12 py-4 rounded-full font-black text-xl hover:bg-cyan-500 hover:text-slate-950 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">Disconnect Grid</button>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
            {/* 🔥 TRON 3D GRID BACKGROUND */}
            <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                <div className="flex-1 bg-slate-950" />
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.2)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.2)_2px,transparent_2px)] bg-[size:50px_50px] [transform:perspective(400px)_rotateX(70deg)] origin-top opacity-60 animate-[grid-scroll_20s_linear_infinite]" />
                    {/* Horizon Glow */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/20 to-transparent blur-xl" />
                </div>
            </div>

            {/* HEADER */}
            <header className="flex items-center justify-between z-20 p-10 shrink-0 bg-gradient-to-b from-slate-950 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-cyan-500/10 border-2 border-cyan-400 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                        <Gauge size={32} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-3xl uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">{deck.title || 'Magister Deck'}</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.4em] flex items-center gap-2"><Shield size={12} className="text-fuchsia-500" /> Slipstream Protocol</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900/80 border border-slate-800 px-6 py-2 rounded-full flex items-center gap-3 backdrop-blur-md">
                        <Users size={16} className="text-cyan-500" />
                        <span className="font-black tabular-nums">{racers.length} Racers Active</span>
                    </div>
                    <button onClick={onExit} className="p-3 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors backdrop-blur-md"><X size={20} /></button>
                </div>
            </header>

            <main className="flex-1 flex flex-col z-10 px-10 pb-10">
                {raceState === 'lobby' ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <AlertTriangle size={60} className="text-fuchsia-500 mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]" />
                        <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">Awaiting Grid Sync</h1>
                        <p className="text-slate-400 font-black tracking-widest uppercase mb-12">Scholars, connect your devices to enter the slipstream.</p>
                        <button 
                            onClick={startCountdown}
                            disabled={racers.length === 0}
                            className="bg-cyan-500 text-slate-950 px-16 py-6 rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            Initialize Grid
                        </button>
                    </div>
                ) : raceState === 'countdown' ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-[15rem] font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 drop-shadow-[0_0_50px_rgba(34,211,238,0.8)] animate-in zoom-in duration-300">
                            {countdown}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center gap-2 max-w-6xl w-full mx-auto">
                        {/* RACE TRACKS */}
                        {racers.map((racer) => (
                            <div key={racer.id} className="relative h-12 w-full bg-slate-900/50 border-y border-slate-800/50 overflow-hidden rounded-r-full flex items-center backdrop-blur-sm">
                                {/* The Lightcycle Trail */}
                                <div 
                                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${racer.colorClass} border-r-4 transition-all duration-1000 ease-out`} 
                                    style={{ width: `${Math.max(2, racer.pct)}%` }} // Minimum 2% so the bike head is visible
                                >
                                    {/* The Bike Head */}
                                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-14 bg-white rounded-full shadow-[0_0_15px_white] z-20" />
                                </div>
                                
                                {/* Racer Nameplate */}
                                <div className="absolute left-6 font-black text-white uppercase tracking-widest text-xs z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mix-blend-difference">
                                    {racer.name}
                                </div>
                                
                                {/* Finish Line Marker */}
                                <div className="absolute right-0 h-full w-8 border-l-4 border-dashed border-white/20" />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 🔥 FIXED: dangerouslySetInnerHTML used instead of dangerouslySetInlineStyle */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes grid-scroll {
                    0% { transform: perspective(400px) rotateX(70deg) translateY(0); }
                    100% { transform: perspective(400px) rotateX(70deg) translateY(50px); }
                }
            `}} />
        </div>
    );
}
