// src/components/LandingPage.tsx
import React, { useEffect, useState } from 'react';
import { 
    ArrowRight, Sparkles, Wand2, MonitorPlay, 
    Smartphone, Zap, CheckCircle2, GraduationCap, 
    QrCode, BrainCircuit, Shield, Layers, Play, X
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onLogin }: any) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
            
            {/* FLOATING NAVBAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-[1rem] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <GraduationCap size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">Magister<span className="text-indigo-400">OS</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="hidden md:block text-sm font-bold text-slate-300 hover:text-white transition-colors">Instructor Login</button>
                        <button onClick={onGetStarted} className="bg-white text-slate-900 hover:bg-indigo-50 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
                            Start Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-2xl">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Introducing the Next Generation LMS</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400">
                        Teach at the speed of <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">thought.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Magister OS transforms static PDFs and Wikipedia articles into gamified, highly interactive live classroom experiences in under 10 seconds using AI.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={onGetStarted} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3">
                            Launch Your Classroom <ArrowRight size={18} />
                        </button>
                        <button onClick={onLogin} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
                            <Play size={18} fill="currentColor" className="text-slate-300" /> View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* BENTO BOX FEATURE GRID */}
            <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
                    
                    {/* BENTO 1: AI Magic Generator (Spans 2 columns on desktop) */}
                    <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                                    <Wand2 size={28} />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight text-white mb-4">The Magic Generator</h3>
                                <p className="text-slate-400 font-medium text-lg max-w-md">
                                    Paste a Wikipedia link or YouTube transcript. Magister's AI instantly forges a complete interactive curriculum with vocab lists, quizzes, and fill-in-the-blanks.
                                </p>
                            </div>
                            <div className="mt-8 flex gap-3">
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Powered by Gemini</span>
                                <span className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">10 Second Generation</span>
                            </div>
                        </div>
                    </div>

                    {/* BENTO 2: Frictionless Entry */}
                    <div className="bg-gradient-to-bl from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-500 flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                                <QrCode size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white mb-3">Frictionless Entry</h3>
                            <p className="text-slate-400 font-medium text-sm">
                                No accounts required for live games. Display the QR code on your smartboard and watch 30 students join your arena in under 10 seconds.
                            </p>
                        </div>
                    </div>

                    {/* BENTO 3: Smartboard Projector Mode */}
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden group hover:border-fuchsia-500/50 transition-colors duration-500 flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl flex items-center justify-center mb-6 border border-fuchsia-500/30">
                                <MonitorPlay size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white mb-3">Projector Mode</h3>
                            <p className="text-slate-400 font-medium text-sm">
                                Reclaim your classroom. The gorgeous, distraction-free smartboard view includes floating tool palettes, focus timers, and digital whiteboards.
                            </p>
                        </div>
                    </div>

                    {/* BENTO 4: Student HUD (Spans 2 columns) */}
                    <div className="md:col-span-2 bg-gradient-to-tl from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-500 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 relative z-10">
                            <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
                                <Smartphone size={28} />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight text-white mb-4">Mobile-First Student HUD</h3>
                            <p className="text-slate-400 font-medium text-lg">
                                Learning shouldn't feel like homework. The student app acts as a tactile wireless controller during live presentations, and transforms into a spaced-repetition study engine at home.
                            </p>
                            <ul className="mt-6 space-y-3">
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 size={16} className="text-cyan-500"/> Connect-4 Multiplayer</li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 size={16} className="text-cyan-500"/> Spaced Repetition Flashcards</li>
                                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><CheckCircle2 size={16} className="text-cyan-500"/> Pronunciation Lab Matrix</li>
                            </ul>
                        </div>
                        <div className="w-full md:w-[250px] shrink-0 aspect-[9/16] bg-black border-4 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex items-center justify-center">
                            {/* Mock Mobile Screen */}
                            <div className="absolute inset-0 bg-slate-950 flex flex-col p-4">
                                <div className="w-full h-3 bg-slate-800 rounded-full mb-4 mt-6" />
                                <div className="flex-1 bg-indigo-600 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                                    <BrainCircuit size={40} className="text-white mb-4" />
                                    <span className="text-white font-black text-xl">Lock In!</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="h-16 bg-rose-500 rounded-xl" />
                                    <div className="h-16 bg-blue-500 rounded-xl" />
                                    <div className="h-16 bg-amber-500 rounded-xl" />
                                    <div className="h-16 bg-emerald-500 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* PRICING SECTION */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center">
                <h2 className="text-4xl font-black tracking-tight text-white mb-4">Simple, transparent pricing.</h2>
                <p className="text-slate-400 font-medium mb-12">Stop paying for legacy software. Upgrade your classroom today.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {/* FREE TIER */}
                    <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 flex flex-col">
                        <h3 className="text-2xl font-black text-white mb-2">Basic Scholar</h3>
                        <div className="text-4xl font-black text-white mb-6">$0 <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">/ forever</span></div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> 1 Active Cohort</li>
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> Max 30 Students</li>
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> Standard Flashcards</li>
                            <li className="flex items-center gap-3 text-slate-500 font-bold opacity-50"><X size={18} className="text-slate-700"/> No AI Generation</li>
                        </ul>
                        <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs transition-colors">Start Free</button>
                    </div>

                    {/* PRO TIER */}
                    <div className="bg-gradient-to-b from-indigo-900 to-slate-900 rounded-[2.5rem] border-2 border-indigo-500 p-8 flex flex-col relative shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Most Popular</div>
                        <h3 className="text-2xl font-black text-white mb-2">Pro Instructor</h3>
                        <div className="text-4xl font-black text-white mb-6">$15 <span className="text-sm text-indigo-300 uppercase tracking-widest font-bold">/ month</span></div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Unlimited Cohorts</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Unlimited Students</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Gemini AI Magic Generator</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Advanced Arena Games</li>
                        </ul>
                        <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-indigo-500/30">Upgrade to Pro</button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/10 mt-12 py-12 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <GraduationCap size={20} className="text-indigo-500" />
                    <span className="font-black tracking-tighter text-white">Magister<span className="text-indigo-400">OS</span></span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Built for modern educators.</p>
            </footer>
        </div>
    );
}
