// src/components/CelebrationScreen.tsx
import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Flame, Star, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function CelebrationScreen({ data, userData, onComplete }: any) {
    const [stage, setStage] = useState(0);
    const [displayXp, setDisplayXp] = useState(0);
    
    // The target XP they earned (defaults to 50 if not passed)
    const targetXp = data?.xp || 50;

    // Stagger the animations
    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 400);  // Show XP Box
        const t2 = setTimeout(() => setStage(2), 1200); // Show Streak
        const t3 = setTimeout(() => setStage(3), 1800); // Show Continue Button
        
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    // Animate the XP rolling up
    useEffect(() => {
        if (stage >= 1) {
            let current = 0;
            const interval = setInterval(() => {
                current += Math.ceil(targetXp / 20); // Speed of count-up
                if (current >= targetXp) {
                    setDisplayXp(targetXp);
                    clearInterval(interval);
                } else {
                    setDisplayXp(current);
                }
            }, 30);
            return () => clearInterval(interval);
        }
    }, [stage, targetXp]);

    return (
        <div className="absolute inset-0 z-[6000] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
            
            {/* Background Beams & Particles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay animate-[spin_120s_linear_infinite]" />

            <div className="relative z-10 flex flex-col items-center w-full px-6 max-w-md mx-auto">
                
                {/* 1. Header (Always visible, slides in) */}
                <div className="text-center mb-12 animate-in slide-in-from-top-12 fade-in duration-700">
                    <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)] transform rotate-12">
                        <CheckCircle2 size={40} className="text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-2">Lesson Complete!</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest">{data?.title || 'Great job'}</p>
                </div>

                {/* 2. The XP Reward (Stage 1) */}
                <div className={`w-full transition-all duration-700 transform ${stage >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'}`}>
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] relative overflow-hidden mb-4">
                        {/* Shimmer effect */}
                        <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                    <Zap size={28} className="text-white fill-white" />
                                </div>
                                <div>
                                    <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">XP Earned</p>
                                    <h3 className="text-4xl font-black text-white leading-none">+{displayXp}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1">Total</span>
                                <span className="text-xl font-black text-white">{(userData?.xp || 0) + displayXp}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. The Streak Reward (Stage 2) */}
                <div className={`w-full transition-all duration-700 transform ${stage >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'}`}>
                    <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-1 rounded-[2.5rem] shadow-2xl shadow-orange-500/20">
                        <div className="bg-slate-900 rounded-[2.25rem] p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Flame size={32} className="text-orange-500 fill-orange-500 animate-bounce" />
                                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-lg">Day Streak Extended!</h4>
                                    <p className="text-orange-400 text-xs font-bold uppercase tracking-widest">You're on fire!</p>
                                </div>
                            </div>
                            <span className="text-3xl font-black text-white">{(userData?.streak || 0) + 1}</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* 4. Continue Button (Stage 3) */}
            <div className={`absolute bottom-10 left-0 w-full px-6 transition-all duration-700 transform ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <button 
                    onClick={onComplete}
                    className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95"
                >
                    Continue <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { left: 200%; }
                }
            `}</style>
        </div>
    );
}
