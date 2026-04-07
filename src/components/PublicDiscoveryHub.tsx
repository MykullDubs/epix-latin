// src/components/PublicDiscoveryHub.tsx
import React, { useState, useEffect } from 'react';
import { 
    Search, MonitorPlay, Star, Clock, Users, 
    BookOpen, Sparkles, Zap, ChevronRight, GraduationCap, ArrowRight, Loader2 
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, appId } from '../config/firebase'; // Adjust path if needed

// Fallback images to keep the UI looking premium if a teacher doesn't upload one
const getFallbackImage = (domain: string) => {
    const d = domain?.toLowerCase() || '';
    if (d.includes('stem') || d.includes('science')) return "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop";
    if (d.includes('culinary')) return "https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=600&auto=format&fit=crop";
    if (d.includes('linguistics') || d.includes('esl')) return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop";
    if (d.includes('arts') || d.includes('history')) return "https://images.unsplash.com/photo-1460518451285-97b6aa326961?q=80&w=600&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop"; // Default Engineering/General
};

export default function PublicDiscoveryHub({ onAuthenticateToLaunch }: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPublishedNetwork = async () => {
            try {
                // 1. Query all globally published decks
                const decksRef = collection(db, 'artifacts', appId, 'decks');
                const q = query(decksRef, where('isPublished', '==', true), limit(50));
                const snap = await getDocs(q);
                
                const allDecks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Group them by their Macro Domain (domainPath[0])
                const grouped: Record<string, any[]> = {};
                
                allDecks.forEach((deck: any) => {
                    const macroDomain = (deck.domainPath && deck.domainPath[0]) || 'General Studies';
                    if (!grouped[macroDomain]) grouped[macroDomain] = [];
                    grouped[macroDomain].push(deck);
                });

                // 3. Format into the "Streaming Row" array structure
                const formattedCategories = Object.keys(grouped).map(domain => ({
                    title: domain,
                    subtitle: `Top curated curriculum for ${domain}.`,
                    lessons: grouped[domain].map(d => ({
                        id: d.id,
                        title: d.title,
                        subject: (d.domainPath && d.domainPath[1]) || domain,
                        grade: "All Levels", // You can add this to your schema later
                        duration: `${(d.stats?.cardCount || 10) * 2}m`, // Guesstimate duration based on card count
                        rating: (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1), // Mock rating for now
                        plays: d.stats?.plays ? `${d.stats.plays}` : 'New',
                        image: d.imageUrl || getFallbackImage(domain)
                    }))
                }));

                // 4. Force "Linguistics & Phonetics" to the top if it exists (since you focus on ESL)
                formattedCategories.sort((a, b) => {
                    if (a.title.includes('Linguistics')) return -1;
                    if (b.title.includes('Linguistics')) return 1;
                    return 0;
                });

                setCategories(formattedCategories);
            } catch (error) {
                console.error("Failed to fetch public network:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublishedNetwork();
    }, []);

    return (
        <div className="min-h-[100dvh] bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/50 overflow-x-hidden">
            
            <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 text-white p-2 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <GraduationCap size={20} strokeWidth={2.5}/>
                    </div>
                    <span className="font-black tracking-tighter text-xl text-white">Magister OS</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onAuthenticateToLaunch} className="hidden sm:block text-xs font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">
                        Educator Login
                    </button>
                    <button onClick={onAuthenticateToLaunch} className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                        Get Started <ArrowRight size={14}/>
                    </button>
                </div>
            </header>

            <main className="pb-24">
                
                <section className="relative pt-24 pb-32 px-6 md:px-10 overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-bottom-4">
                        <Sparkles size={14} /> 100% Free For Educators
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.95] max-w-4xl mx-auto mb-6 animate-in slide-in-from-bottom-6 delay-100">
                        Stop Planning. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Start Teaching.</span>
                    </h1>

                    <p className="text-lg md:text-xl font-medium text-slate-400 max-w-2xl mx-auto mb-12 animate-in slide-in-from-bottom-8 delay-200">
                        Launch fully interactive, gamified lessons to your smartboard in seconds. Search the global network of ready-to-play curriculum below.
                    </p>

                    <div className="w-full max-w-2xl relative animate-in slide-in-from-bottom-10 delay-300 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
                        <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl">
                            <Search className="text-slate-400 ml-4" size={24} />
                            <input 
                                type="text"
                                placeholder="What are you teaching tomorrow?"
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

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Global Network...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-bold">No public curriculum found yet. Be the first to publish!</p>
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
                                                <img src={lesson.image} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                        {lesson.subject}
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                    <button className="bg-white text-indigo-900 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-90 group-hover:scale-100 transition-all duration-300">
                                                        <MonitorPlay size={16}/> Project Now
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                    <span className="text-emerald-400 flex items-center gap-1"><Star size={10} fill="currentColor"/> {lesson.rating}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span>{lesson.duration}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">{lesson.title}</h3>
                                                <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-1.5"><Users size={12}/> {lesson.plays} Classrooms Reached</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <section className="mt-20 px-6 max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-10 md:p-16 border border-white/10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                            <BookOpen size={200} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 relative z-10">Can't find your topic?</h2>
                        <p className="text-indigo-200 font-medium mb-8 max-w-xl mx-auto relative z-10">
                            Log in to access the Magic Generator. Upload your own PDFs or lecture notes and our AI will build a custom interactive unit in 15 seconds.
                        </p>
                        <button onClick={onAuthenticateToLaunch} className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
                            Create Free Educator Profile
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
