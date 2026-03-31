// src/components/DiscoveryView.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Search, Globe, BookOpen, Utensils, HeartPulse, 
    Briefcase, Plane, Palette, ChevronRight, ArrowLeft, 
    Map, Compass, Sparkles, Activity, Layers, Download, Lock,
    MonitorPlay, Globe2, ShieldAlert, Cpu, GraduationCap,
    Clock, SignalHigh, PlayCircle, FileText, CheckCircle2, Zap,
    HelpCircle, X, Unlock
} from 'lucide-react';
import { Toast } from './Toast';

// 🔥 MACRO DOMAINS
const MACRO_DOMAINS = [
    { id: 'stem', title: 'STEM & Medical', icon: HeartPulse, gradient: 'from-emerald-400 to-teal-600', text: 'text-emerald-500', shadow: 'shadow-emerald-500/30', desc: 'Anatomy, biology, and healthcare' },
    { id: 'tech', title: 'Technology & Logic', icon: Cpu, gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-500', shadow: 'shadow-blue-500/30', desc: 'Software, AI, and engineering' },
    { id: 'business', title: 'Commerce & Trade', icon: Briefcase, gradient: 'from-slate-600 to-slate-800', text: 'text-slate-700', shadow: 'shadow-slate-500/30', desc: 'Corporate jargon and finance' },
    { id: 'culture', title: 'Arts & Culture', icon: Palette, gradient: 'from-fuchsia-500 to-purple-600', text: 'text-fuchsia-500', shadow: 'shadow-fuchsia-500/30', desc: 'History, media, and humanities' },
    { id: 'hospitality', title: 'Culinary & Hospitality', icon: Utensils, gradient: 'from-orange-400 to-rose-500', text: 'text-orange-500', shadow: 'shadow-orange-500/30', desc: 'Kitchen ops and gastronomy' },
    { id: 'society', title: 'Society & Politics', icon: Globe2, gradient: 'from-cyan-500 to-blue-500', text: 'text-cyan-500', shadow: 'shadow-cyan-500/30', desc: 'Law, ethics, and government' },
    { id: 'linguistics', title: 'Linguistics & Phonetics', icon: Activity, gradient: 'from-violet-500 to-indigo-500', text: 'text-violet-500', shadow: 'shadow-violet-500/30', desc: 'Grammar, syntax, and ESL' },
    { id: 'survival', title: 'Daily Survival', icon: ShieldAlert, gradient: 'from-rose-400 to-red-600', text: 'text-rose-500', shadow: 'shadow-rose-500/30', desc: 'Emergencies and navigation' },
    { id: 'media', title: 'Media & Entertainment', icon: MonitorPlay, gradient: 'from-pink-500 to-rose-400', text: 'text-pink-500', shadow: 'shadow-pink-500/30', desc: 'Movies, gaming, and pop culture' },
];

export default function DiscoveryView({ networkDecks = {}, networkClasses = [], onDownloadDeck, onPurchase, onOpenClass, userData, activeOrg }: any) {
    const [domainPath, setDomainPath] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [touchStartCoords, setTouchStartCoords] = useState<{x: number, y: number} | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [previewCourse, setPreviewCourse] = useState<any | null>(null);
    
    // 🔥 LIVE COUNTER FOR THE FRONTIER
    const [scholarsCount, setScholarsCount] = useState(1204);

    useEffect(() => {
        const interval = setInterval(() => {
            setScholarsCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const globalDecks = useMemo(() => Object.values(networkDecks), [networkDecks]);
    
    const themeColor = activeOrg?.themeColor || '#4f46e5'; 
    const themeName = activeOrg?.name || 'Magister';
    const targetLang = userData?.targetLanguage || "English";

    // 🔥 DYNAMIC FILTER ENGINE
    const { currentFolders, currentDecks, currentCourses } = useMemo(() => {
        const folders = new Set<string>();
        const decks: any[] = [];
        const courses: any[] = [];

        globalDecks.forEach((deck: any) => {
            const path = deck.domainPath || [];
            const matchesPath = domainPath.every((p, i) => path[i] === p);
            if (!matchesPath) return; 
            if (path.length > domainPath.length) folders.add(path[domainPath.length]);
            else decks.push(deck);
        });

        // 🔥 Reads directly from Firebase published classes!
        networkClasses.forEach((course: any) => {
            const path = course.domainPath || [course.subject] || [];
            const matchesPath = domainPath.every((p, i) => path[i] === p);
            
            // Check if it belongs in this sector
            if (matchesPath && path.length >= domainPath.length) courses.push(course);
        });

        return { 
            currentFolders: Array.from(folders).sort(), 
            currentDecks: decks.sort((a, b) => b.updatedAt - a.updatedAt),
            currentCourses: courses
        };
    }, [globalDecks, networkClasses, domainPath]);

    const rootDomainName = domainPath[0];
    const rootMacroConfig = MACRO_DOMAINS.find(m => m.title === rootDomainName);
    const ThemeIcon = rootMacroConfig?.icon || Layers;
    const themeGradient = rootMacroConfig?.gradient || 'from-slate-400 to-slate-600';
    const themeShadow = rootMacroConfig?.shadow || 'shadow-slate-500/20';

    const handleBack = () => {
        if (previewCourse) { setPreviewCourse(null); return; }
        if (domainPath.length > 0) setDomainPath(prev => prev.slice(0, -1));
    };

    const handleBackRef = useRef(handleBack);
    useEffect(() => { handleBackRef.current = handleBack; }, [domainPath, previewCourse]);

    useEffect(() => {
        const handleNativeBack = (e: PopStateEvent) => handleBackRef.current();
        window.addEventListener('popstate', handleNativeBack);
        return () => window.removeEventListener('popstate', handleNativeBack);
    }, []);

    const handleNavigateIn = (folderName: string) => {
        window.history.pushState({ view: 'discovery_depth' }, '');
        setDomainPath(prev => [...prev, folderName]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenCourse = (course: any) => {
        window.history.pushState({ view: 'course_preview' }, '');
        setPreviewCourse(course);
    };

    const handleSwipeStart = (e: React.TouchEvent) => setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    const handleSwipeEnd = (e: React.TouchEvent) => {
        if (!touchStartCoords) return;
        const deltaX = touchStartCoords.x - e.changedTouches[0].clientX;
        const deltaY = touchStartCoords.y - e.changedTouches[0].clientY;
        if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (domainPath.length > 0 || previewCourse) window.history.back();
        }
        setTouchStartCoords(null);
    };

    // ============================================================================
    //  ROOT VIEW: THE GLOBAL RADAR
    // ============================================================================
    if (domainPath.length === 0) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative overflow-hidden">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {/* 🔥 THE RADAR AMBIENCE */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[conic-gradient(var(--tw-gradient-stops))] from-indigo-500/5 via-slate-950 to-indigo-500/5 rounded-full pointer-events-none opacity-60 dark:opacity-40 animate-spin-slow z-0" />
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none z-0" />
                
                <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        {activeOrg?.logoUrl ? (
                            <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-8 h-8 object-contain rounded-md shadow-sm" />
                        ) : (
                            <div className="text-white p-1.5 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ backgroundColor: themeColor }} aria-hidden="true">
                                <GraduationCap size={18} strokeWidth={3}/>
                            </div>
                        )}
                        <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>Radar</span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-white/40 dark:border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors duration-300 shadow-inner">
                        <Globe size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true"/>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{targetLang}</span>
                    </div>
                </header>

                <div className="px-6 pt-6 pb-2 shrink-0 relative z-10">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight drop-shadow-sm">Global Lexicon</h2>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1"><Map size={12}/> Content Network</p>
                        </div>
                        <div className="bg-amber-50/80 dark:bg-amber-500/10 backdrop-blur-md text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg border border-amber-200 dark:border-amber-500/20">
                            <Sparkles size={14}/> {userData?.flux || userData?.coins || 0} Flux
                        </div>
                    </div>
                    
                    <div className="relative group mt-4">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/30 transition-all duration-500 pointer-events-none" />
                        <div className="relative flex items-center">
                            <Search className="absolute left-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search the global network..." 
                                className="w-full pl-12 pr-6 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-[2rem] font-bold text-slate-800 dark:text-white outline-none shadow-xl transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-32 space-y-10 custom-scrollbar relative z-10">
                    
                    {/* 🔥 THE JUICED FRONTIER */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-center mb-4 ml-2">
                            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} className="text-amber-500 animate-pulse"/> The Frontier
                            </h4>
                            <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/20 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live Sector</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleNavigateIn('Linguistics & Phonetics')}
                            className="w-full relative overflow-hidden rounded-[2.5rem] p-[2px] active:scale-[0.98] transition-all group shadow-2xl"
                        >
                            {/* Animated Border Shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] animate-[shimmer_8s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl p-6 rounded-[2.4rem] text-left flex flex-col h-full overflow-hidden">
                                {/* Holographic Glows */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-600/40 transition-colors duration-700" />
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="bg-slate-100/50 dark:bg-white/5 backdrop-blur-xl w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300 border border-white/40 dark:border-white/10 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                                        <BookOpen size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-right bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 dark:border-white/5">
                                        <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Active Scholars</span>
                                        <span className="text-xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                                            {scholarsCount.toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-0.5 italic lowercase">syncing...</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="font-black text-slate-900 dark:text-white text-2xl md:text-3xl leading-tight mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                        Future Ethics & Tech
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium line-clamp-2 max-w-[90%] leading-relaxed mb-8">
                                        Decrypt the vocabulary of AI disruption and master the grammar of high-stakes technological debate.
                                    </p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                        <div className="flex gap-2">
                                            <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-white/40 dark:border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                                <SignalHigh size={12} className="text-indigo-500 dark:text-indigo-400" />
                                                <span className="text-[9px] font-black text-slate-700 dark:text-white uppercase tracking-tighter">Tier IV</span>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-500/20 flex items-center gap-1.5 backdrop-blur-sm">
                                                <Zap size={12} className="text-amber-500 fill-amber-500" />
                                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">+500 Flux</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                                            Initiate <ChevronRight size={14}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2"><Globe2 size={14}/> Lexicon Sectors</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {MACRO_DOMAINS.map((domain) => {
                                const Icon = domain.icon;
                                const hasContent = globalDecks.some((d: any) => d.domainPath?.[0] === domain.title) || networkClasses.some((c: any) => c.domainPath?.[0] === domain.title || c.subject === domain.title);
                                return (
                                    <button 
                                        key={domain.id}
                                        onClick={() => hasContent ? handleNavigateIn(domain.title) : setToastMsg(`The ${domain.title} sector is currently uncharted.`)}
                                        className={`w-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/50 dark:border-slate-800 text-left transition-all flex flex-col h-full group relative overflow-hidden ${hasContent ? 'shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-500/50 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed grayscale-[50%]'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${domain.gradient} text-white shadow-lg ${domain.shadow} ${hasContent ? 'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500' : ''}`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 pr-2 relative z-10">{domain.title}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-auto relative z-10 leading-snug">{domain.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    //  NESTED VIEW: SECTOR DEPTH
    // ============================================================================
    const currentDomainTitle = domainPath[domainPath.length - 1];

    return (
        <div 
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-right-8 duration-300 pb-safe relative overflow-hidden"
        >
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            {/* Ambient Backgrounds for Nested View */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -mt-20 -mr-20 z-0" />

            <div className="px-6 pt-safe-8 pb-6 shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                <button onClick={() => window.history.back()} className="flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-6 text-xs font-black uppercase tracking-widest bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                    <ArrowLeft size={14} className="mr-2"/> Retreat
                </button>
                
                <div className="flex items-center gap-4 mb-2 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${themeGradient} ${themeShadow}`}>
                        <ThemeIcon size={28} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-1 overflow-x-auto custom-scrollbar hide-scrollbar whitespace-nowrap">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Radar</span>
                            {domainPath.map((node, idx) => (
                                <React.Fragment key={idx}>
                                    <ChevronRight size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${idx === domainPath.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{node}</span>
                                </React.Fragment>
                            ))}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight truncate drop-shadow-sm">{currentDomainTitle}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 space-y-10 custom-scrollbar pb-32 relative z-10">
                
                {currentCourses.length > 0 && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-4 ml-2">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                <GraduationCap size={16} className="text-indigo-500" /> Featured Modules
                            </h3>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4 -mx-4 px-4 md:-mx-6 md:px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {currentCourses.map((course: any) => (
                                <button 
                                    key={course.id}
                                    onClick={() => handleOpenCourse(course)}
                                    className="snap-start shrink-0 w-[300px] text-left bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-slate-800 transition-all duration-300 flex flex-col active:scale-[0.98] shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 group overflow-hidden"
                                >
                                    <div className={`w-full h-28 bg-gradient-to-br ${course.gradient || course.themeColor || 'from-indigo-500 to-cyan-500'} p-4 flex justify-between items-start relative overflow-hidden`} style={course.themeColor ? { background: `linear-gradient(135deg, ${course.themeColor}, #000)` } : {}}>
                                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
                                        {/* Internal Glow for depth */}
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 blur-2xl rounded-full pointer-events-none" />
                                        
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm relative z-10">
                                            {course.difficulty || course.grade || 'Module'}
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5 relative z-10">
                                            <Clock size={12} /> {course.duration || 'Flexible'}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title || course.name}</h3>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 mb-6">{course.description}</p>
                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                            <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                                    <Layers size={12}/> {course.features?.decks || 0}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                                    <HelpCircle size={12}/> {course.features?.quizzes || 0}
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-500/20 group-hover:scale-105 transition-transform">
                                                <Lock size={10} /> {course.price || 0} Flux
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                
                {currentFolders.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-6 duration-500">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2"><Map size={14}/> Pathways</h4>
                        <div className="space-y-3">
                            {currentFolders.map((folderName, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleNavigateIn(folderName)}
                                    className="w-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/40 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left shadow-lg flex items-center justify-between group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/50 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors shadow-inner">
                                            <BookOpen size={20}/>
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{folderName}</h3>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentDecks.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-8 duration-500">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2"><Layers size={14}/> Data Crystals</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentDecks.map((deck) => {
                                const isUnlocked = userData?.unlocks?.[deck.id];
                                const cardCount = deck.stats?.cardCount || deck.cards?.length || 0;
                                return (
                                    <div key={deck.id} className={`bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border transition-colors flex flex-col justify-between relative overflow-hidden group ${isUnlocked ? 'border-emerald-200 dark:border-emerald-500/30 shadow-md' : 'border-white/40 dark:border-slate-800 shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 ${isUnlocked ? 'bg-emerald-500' : `bg-gradient-to-br ${themeGradient} group-hover:scale-110 group-hover:rotate-3`}`}>
                                                    {isUnlocked ? <Unlock size={24} /> : <Layers size={24} />}
                                                </div>
                                                {!isUnlocked && deck.price > 0 ? (
                                                    <div className="bg-amber-50/80 dark:bg-amber-500/10 backdrop-blur-md text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-amber-200 dark:border-amber-500/30">
                                                        <Lock size={12} /> {deck.price} Flux
                                                    </div>
                                                ) : (
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border backdrop-blur-md ${isUnlocked ? 'text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:text-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'text-slate-500 border-slate-200 bg-white/50 dark:text-slate-400 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                                                        {cardCount} Nodes
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{deck.title}</h3>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2">{deck.description || `Premium data targets mapped to this specific domain.`}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-2 p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                            <button 
                                                onClick={() => {
                                                    if (isUnlocked || !deck.price) {
                                                        onDownloadDeck(deck);
                                                        setToastMsg(`Extracting ${deck.title} to Vault...`);
                                                    } else {
                                                        setToastMsg(`Encryption Active: Costs ${deck.price} Flux.`);
                                                    }
                                                }}
                                                className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border ${isUnlocked || !deck.price ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500' : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-white/40 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                {isUnlocked || !deck.price ? <><Download size={14}/> Assimilate</> : <><Lock size={14}/> Decrypt</>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================================ */}
            {/* MODAL: COURSE PREVIEW (Deep Glassmorphism) */}
            {/* ============================================================================ */}
            {previewCourse && (
                <div className="fixed inset-0 z-[6000] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => window.history.back()} />
                    
                    <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl w-full h-[85vh] rounded-t-[2.5rem] shadow-2xl relative z-10 animate-in slide-in-from-bottom-full duration-500 overflow-hidden flex flex-col border-t border-white/20 dark:border-slate-800">
                        {/* Deep Modal Hero */}
                        <div className={`shrink-0 w-full h-40 bg-gradient-to-br ${previewCourse.gradient || 'from-indigo-500 to-cyan-500'} relative flex items-end p-6 md:p-8 overflow-hidden`} style={previewCourse.themeColor ? { background: `linear-gradient(135deg, ${previewCourse.themeColor}, #000)` } : {}}>
                            <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none" />
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 blur-3xl rounded-full pointer-events-none" />
                            
                            <button onClick={() => window.history.back()} className="absolute top-6 right-6 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white transition-all active:scale-95 z-20">
                                <X size={20} strokeWidth={3} />
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                            
                            <div className="relative z-10 flex gap-2 w-full mt-auto">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5">
                                    <SignalHigh size={12} /> {previewCourse.difficulty || previewCourse.grade || 'Module'}
                                </span>
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5">
                                    <Clock size={12} /> {previewCourse.duration || 'Flexible'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-10 pb-32">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 tracking-tighter drop-shadow-sm">{previewCourse.title || previewCourse.name}</h2>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{previewCourse.description}</p>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Architecture</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-inner">
                                        <Layers size={24} className="text-indigo-500" />
                                        <div>
                                            <span className="block text-xl font-black text-slate-800 dark:text-white leading-none mb-1">{previewCourse.features?.decks || 0}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nodes</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-inner">
                                        <HelpCircle size={24} className="text-emerald-500" />
                                        <div>
                                            <span className="block text-xl font-black text-slate-800 dark:text-white leading-none mb-1">{previewCourse.features?.quizzes || 0}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sims</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-inner opacity-60">
                                        <CheckCircle2 size={24} className="text-amber-500" />
                                        <div>
                                            <span className="block text-xl font-black text-slate-800 dark:text-white leading-none mb-1">1</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Seal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {previewCourse.syllabus && (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Map size={14}/> Syllabus Path</h4>
                                    <div className="space-y-4 relative before:absolute before:inset-y-4 before:left-[27px] before:w-1 before:bg-gradient-to-b before:from-indigo-500/50 before:to-transparent before:rounded-full">
                                        {previewCourse.syllabus.map((node: any, idx: number) => {
                                            const Icon = node.type === 'deck' ? Layers : node.type === 'quiz' ? HelpCircle : PlayCircle;
                                            return (
                                                <div key={idx} className="relative flex items-center gap-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-[2rem] border border-white/50 dark:border-slate-800 shadow-lg z-10 transition-transform hover:-translate-y-1">
                                                    <div className="w-14 h-14 rounded-[1.2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 border border-white dark:border-slate-700 shadow-inner">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1 pr-4">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 block mb-1">{node.type}</span>
                                                        <h5 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight">{node.title}</h5>
                                                    </div>
                                                    <Lock size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🔥 Seductive CTA Button overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 pb-safe-6 pt-16 z-20">
                            <button 
                                onClick={async () => {
                                    const currentFlux = userData?.coins || userData?.profile?.main?.coins || userData?.flux || 0;
                                    if (currentFlux >= (previewCourse.price || 0)) {
                                        const result = await onPurchase(
                                            previewCourse.id, 
                                            previewCourse.price || 0, 
                                            'course', 
                                            { title: previewCourse.title || previewCourse.name, subject: previewCourse.domainPath?.[0] || 'General' }
                                        );
                                        
                                        if (result?.success) {
                                            setToastMsg("Curriculum Decrypted! Routing to Classroom...");
                                            // 🔥 Wait exactly 1 second for the dopamine to hit, then route!
                                            setTimeout(() => {
                                                const courseToOpen = previewCourse;
                                                setPreviewCourse(null);
                                                if (onOpenClass) onOpenClass(courseToOpen);
                                            }, 1000);
                                        } else {
                                            setToastMsg(result?.msg || "Transaction failed.");
                                        }
                                    } else {
                                        setToastMsg("Insufficient Flux balance.");
                                    }
                                }}
                                className="w-full py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] active:scale-95 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <Lock size={18} /> Unlock Access ({previewCourse.price || 0} <Zap size={14} className="fill-current text-amber-400" />)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
