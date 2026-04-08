// src/components/PublicDiscoveryHub.tsx
import React, { useState, useEffect } from 'react';
import { 
    Search, MonitorPlay, Star, Clock, Users, 
    BookOpen, Sparkles, Zap, ChevronRight, GraduationCap, ArrowRight, Loader2, Mic, Crown, Play, ShieldCheck
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, appId } from '../config/firebase'; // Adjust path if needed

// Fallback images to keep the UI looking premium
const getFallbackImage = (domain: string) => {
    const d = domain?.toLowerCase() || '';
    if (d.includes('survival') || d.includes('esl')) return "https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=600&auto=format&fit=crop";
    if (d.includes('professional') || d.includes('culinary')) return "https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=600&auto=format&fit=crop";
    if (d.includes('grammar')) return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"; 
};

// ─────────────────────────────────────────────────────────────
// PREMIUM CATALOG DATA
// ─────────────────────────────────────────────────────────────
const featuredCourse = {
    id: 'kitchen-comm-pro',
    title: 'Kitchen Communication Pro',
    subtitle: 'Master Back-of-House Spanish & English',
    description: 'Survive your first week on the line. Learn essential prep commands, safety callouts, and run live audio roleplays with our AI Executive Chef.',
    level: 'Beginner to Intermediate',
    duration: '4 Hours',
    rating: 4.9,
    students: 1205,
    price: '$14.99',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=1200&auto=format&fit=crop'
};

const premiumCategories = [
    {
        title: "Survival English",
        subtitle: "Essential language skills for navigating daily life.",
        lessons: [
            { id: '1', title: 'Border Customs Survival', subject: 'Survival', duration: '45m', rating: '4.8', plays: '3.2k', image: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=600&auto=format&fit=crop', ai: true, price: '$4.99', level: 'A2' },
            { id: '4', title: 'Medical Emergency Vocab', subject: 'Survival', duration: '60m', rating: '4.9', plays: '1.5k', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop', ai: true, price: '$9.99', level: 'B2' },
            { id: '7', title: 'Grocery Shopping Basics', subject: 'Survival', duration: '30m', rating: '4.7', plays: '4.1k', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop', ai: false, price: '$2.99', level: 'A1' },
        ]
    },
    {
        title: "Professional & Career",
        subtitle: "Advance your career with industry-specific vocabulary.",
        lessons: [
            { id: '2', title: 'The Angry Customer', subject: 'Professional', duration: '55m', rating: '4.9', plays: '2.8k', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop', ai: true, price: '$7.99', level: 'B1' },
            { id: '5', title: 'Acing the Tech Interview', subject: 'Professional', duration: '90m', rating: '5.0', plays: '890', image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=600&auto=format&fit=crop', ai: true, price: '$19.99', level: 'C1' },
            { id: '8', title: 'Office Small Talk', subject: 'Professional', duration: '40m', rating: '4.6', plays: '5.5k', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop', ai: true, price: '$5.99', level: 'B1' },
        ]
    },
    {
        title: "Grammar Deep-Dives",
        subtitle: "Master the mechanics of the English language.",
        lessons: [
            { id: '3', title: 'Past Tense Mastery', subject: 'Grammar', duration: '35m', rating: '4.8', plays: '12k', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop', ai: false, price: 'Free', level: 'A1' },
            { id: '6', title: 'Prepositions of Place', subject: 'Grammar', duration: '30m', rating: '4.7', plays: '8.2k', image: 'https://images.unsplash.com/photo-1503694978374-8a2fb5a0a0b1?q=80&w=600&auto=format&fit=crop', ai: false, price: '$2.99', level: 'A2' },
            { id: '9', title: 'Conditionals (If/Then)', subject: 'Grammar', duration: '50m', rating: '4.9', plays: '3.1k', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop', ai: false, price: '$4.99', level: 'B2' },
        ]
    }
];

export default function PublicDiscoveryHub({ onAuthenticateToLaunch }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<any[]>(premiumCategories);
    const [isLoading, setIsLoading] = useState(false); // Set to false since we are using static premium data for now

    // Optional: Keep the Firebase fetch if you still want to pull UGC lessons at the bottom!
    // useEffect(() => { ... }, []);

    return (
        <div className="min-h-[100dvh] bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/50 overflow-x-hidden pb-24">
            
            {/* ── HEADER ── */}
            <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 text-white p-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <GraduationCap size={20} strokeWidth={2.5}/>
                    </div>
                    <span className="font-black tracking-tighter text-xl text-white">Nexus<span className="text-indigo-400">English</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onAuthenticateToLaunch} className="hidden sm:block text-xs font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">
                        Educator Login
                    </button>
                    <button onClick={onAuthenticateToLaunch} className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                        Log In <ArrowRight size={14}/>
                    </button>
                </div>
            </header>

            {/* ── HERO SECTION ── */}
            <section className="relative pt-24 pb-12 px-6 md:px-10 overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-bottom-4">
                    <Crown size={14} /> Premium Language Curriculum
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.95] max-w-4xl mx-auto mb-6 animate-in slide-in-from-bottom-6 delay-100">
                    Fluency in the <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Real World.</span>
                </h1>

                <p className="text-lg md:text-xl font-medium text-slate-400 max-w-2xl mx-auto mb-12 animate-in slide-in-from-bottom-8 delay-200">
                    Stop studying textbooks. Start practicing real-world scenarios with our live AI voice actors. Explore the premium catalog below.
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-2xl relative animate-in slide-in-from-bottom-10 delay-300 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
                    <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl">
                        <Search className="text-slate-400 ml-4" size={24} />
                        <input 
                            type="text"
                            placeholder="What do you want to learn today?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none text-white px-4 py-4 font-bold text-lg outline-none placeholder:text-slate-500"
                        />
                        <button onClick={onAuthenticateToLaunch} className="hidden sm:flex bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-colors items-center gap-2">
                            <Zap size={16}/> Search
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FEATURED PREMIUM COURSE (A La Carte Push) ── */}
            <div className="max-w-7xl mx-auto px-6 pb-20 animate-in fade-in duration-1000 delay-500">
                <div className="relative w-full rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl flex flex-col md:flex-row group border border-white/10 hover:border-indigo-500/50 transition-colors duration-500 cursor-pointer" onClick={onAuthenticateToLaunch}>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10 md:w-2/3" />
                    
                    <div className="absolute inset-0 md:left-1/3 z-0 overflow-hidden">
                        <img src={featuredCourse.imageUrl} alt="Featured Course" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    </div>

                    <div className="relative z-20 w-full md:w-3/5 p-10 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-4 py-1.5 bg-amber-500 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                                <Crown size={12} /> Bestseller
                            </span>
                            <span className="px-4 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Mic size={12} /> Live AI Roleplay
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{featuredCourse.title}</h2>
                        <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-xl">{featuredCourse.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm font-bold text-slate-400 mb-10">
                            <span className="flex items-center gap-1.5 text-amber-400"><Star size={16} fill="currentColor" /> {featuredCourse.rating} ({featuredCourse.students})</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> {featuredCourse.level}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-3">
                                Buy Now — {featuredCourse.price} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── THE NETFLIX ROWS: CATALOG BROWSING ── */}
            <main>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Catalog...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-bold">No curriculum found.</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {categories.map((category, idx) => (
                            <section key={idx} className="animate-in fade-in duration-700" style={{ animationDelay: `${(idx + 2) * 100}ms` }}>
                                <div className="px-6 md:px-10 mb-6 flex justify-between items-end max-w-[1600px] mx-auto">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{category.title}</h2>
                                        <p className="text-sm font-medium text-slate-400 mt-1">{category.subtitle}</p>
                                    </div>
                                    <button className="hidden sm:flex items-center gap-1 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                                        View All <ChevronRight size={14}/>
                                    </button>
                                </div>

                                <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 md:px-10 pb-8 gap-6 max-w-[1600px] mx-auto">
                                    {category.lessons.filter((l: any) => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map((lesson: any) => (
                                        <div key={lesson.id} onClick={onAuthenticateToLaunch} className="snap-start shrink-0 w-[280px] sm:w-[320px] group cursor-pointer">
                                            <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden relative mb-4 border border-white/10 shadow-lg bg-slate-900 flex items-center justify-center">
                                                <img src={lesson.image} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-70 group-hover:opacity-100" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />
                                                
                                                {/* Top Tags */}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                        {lesson.level}
                                                    </span>
                                                </div>
                                                {lesson.ai && (
                                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                        <Mic size={12} className="text-cyan-400" />
                                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Live AI</span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                    <button className="bg-white text-indigo-900 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-90 group-hover:scale-100 transition-all duration-300">
                                                        <MonitorPlay size={16}/> View Course
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <span className="text-amber-400 flex items-center gap-1"><Star size={10} fill="currentColor"/> {lesson.rating}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                        <span>{lesson.duration}</span>
                                                    </div>
                                                    <span className="text-white font-black text-sm">{lesson.price}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">{lesson.title}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {/* ── CALL TO ACTION: SUBSCRIPTION PUSH ── */}
                <section className="mt-20 px-6 max-w-5xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-[3rem] p-10 md:p-16 border border-indigo-500/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.15)]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-inner">
                                <Sparkles size={32} className="text-amber-300" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">Unlock the Entire Library</h2>
                            <p className="text-indigo-200 text-lg font-medium mb-10 max-w-2xl mx-auto">
                                Stop buying piecemeal. Get unlimited access to every survival scenario, grammar lab, and live AI speaking practice for one flat monthly rate.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                                <button onClick={onAuthenticateToLaunch} className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-xl">
                                    Start 7-Day Free Trial
                                </button>
                                <span className="text-indigo-300 font-bold text-sm">Then just $9.99/mo. Cancel anytime.</span>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
