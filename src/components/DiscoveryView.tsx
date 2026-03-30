// src/components/DiscoveryView.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Search, Globe, BookOpen, Utensils, HeartPulse, 
    Briefcase, Plane, Palette, ChevronRight, ArrowLeft, 
    Map, Compass, Sparkles, Activity, Layers, Download, Lock,
    MonitorPlay, Globe2, ShieldAlert, Cpu, GraduationCap,
    Clock, SignalHigh, PlayCircle, FileText, CheckCircle2, Zap,
    HelpCircle, X 
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

const MOCK_COURSES = [
    {
        id: 'course_kitchen_span',
        title: 'KitchenComm: Advanced Line Spanish',
        description: 'Master the chaotic, high-speed vocabulary required to run a quick-service kitchen line without translation delays.',
        domainPath: ['Culinary & Hospitality'],
        difficulty: 'B2 Intermediate',
        duration: '4 Hours',
        price: 2500,
        features: { decks: 4, quizzes: 8, audio: true },
        gradient: 'from-orange-500 to-rose-600',
        syllabus: [
            { title: 'Station Prep & Ingredients', type: 'deck' },
            { title: 'The Heat of the Rush (Audio Quiz)', type: 'quiz' },
            { title: 'Allergies & Cross-Contamination', type: 'deck' },
            { title: 'Line Cook Commands: Speed Test', type: 'match' }
        ]
    },
    {
        id: 'course_esl_pitch',
        title: 'The Silicon Pitch: ESL for Founders',
        description: 'Drop the textbook English. Learn the exact phrasing, pacing, and idioms used by startup founders to raise capital.',
        domainPath: ['Linguistics & Phonetics'],
        difficulty: 'C1 Advanced',
        duration: '6 Hours',
        price: 4000,
        features: { decks: 5, quizzes: 10, audio: true },
        gradient: 'from-indigo-500 to-purple-600',
        syllabus: [
            { title: 'Deconstructing the Elevator Pitch', type: 'deck' },
            { title: 'Financial Metrics & Burn Rate', type: 'deck' },
            { title: 'Handling Q&A (Simulated Pressure)', type: 'quiz' },
            { title: 'The Closing Ask', type: 'deck' }
        ]
    }
];

export default function DiscoveryView({ networkDecks = {}, onDownloadDeck, userData, activeOrg }: any) {
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

        MOCK_COURSES.forEach((course: any) => {
            const path = course.domainPath || [];
            const matchesPath = domainPath.every((p, i) => path[i] === p);
            if (matchesPath && path.length === domainPath.length) courses.push(course);
        });

        return { 
            currentFolders: Array.from(folders).sort(), 
            currentDecks: decks.sort((a, b) => b.updatedAt - a.updatedAt),
            currentCourses: courses
        };
    }, [globalDecks, domainPath]);

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

    if (domainPath.length === 0) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        {activeOrg?.logoUrl ? (
                            <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-8 h-8 object-contain rounded-md" />
                        ) : (
                            <div className="text-white p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: themeColor }} aria-hidden="true">
                                <GraduationCap size={18} strokeWidth={3}/>
                            </div>
                        )}
                        <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>Radar</span>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors duration-300">
                        <Globe size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true"/>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{targetLang}</span>
                    </div>
                </header>

                <div className="px-6 pt-6 pb-2 shrink-0">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Global Lexicon</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1"><Map size={12}/> Content Network</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm border border-amber-200 dark:border-amber-500/20">
                            <Sparkles size={14}/> {userData?.flux || 0} Flux
                        </div>
                    </div>
                    
                    <div className="relative group mt-4">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-[2rem] blur-lg group-focus-within:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
                        <div className="relative flex items-center">
                            <Search className="absolute left-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search the global network..." 
                                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-[2rem] font-bold text-slate-800 dark:text-white outline-none shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-32">
                    
                    {/* 🔥 THE JUICED FRONTIER */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-center mb-4 ml-1">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} className="text-amber-500 animate-pulse"/> The Frontier
                            </h4>
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Live Sector</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleNavigateIn('Linguistics & Phonetics')}
                            className="w-full relative overflow-hidden rounded-[2.5rem] p-[2px] active:scale-[0.98] transition-all group"
                        >
                            {/* Animated Border Shimmer (Requires Tailwind Config Extension) */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_8s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative bg-slate-950 p-6 rounded-[2.4rem] text-left flex flex-col h-full overflow-hidden">
                                {/* Holographic Glows */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="bg-white/5 backdrop-blur-xl w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-300 border border-white/10 group-hover:scale-110 transition-transform shadow-2xl shadow-indigo-500/20">
                                        <BookOpen size={28} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active Scholars</span>
                                        <span className="text-xl font-black text-white tabular-nums tracking-tight">
                                            {scholarsCount.toLocaleString()} <span className="text-[10px] text-slate-500 ml-0.5 italic lowercase">syncing...</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="font-black text-white text-2xl md:text-3xl leading-tight mb-2 tracking-tight group-hover:text-indigo-300 transition-colors">
                                        Future Ethics & Tech
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium line-clamp-2 max-w-[90%] leading-relaxed mb-8">
                                        Decrypt the vocabulary of AI disruption and master the grammar of high-stakes technological debate.
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                                <SignalHigh size={12} className="text-indigo-400" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">Tier IV</span>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
                                                <Zap size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-tighter">+500 Flux</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                                            Initiate <ChevronRight size={14}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe2 size={14}/> Lexicon Sectors</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {MACRO_DOMAINS.map((domain) => {
                                const Icon = domain.icon;
                                const hasContent = globalDecks.some((d: any) => d.domainPath?.[0] === domain.title) || MOCK_COURSES.some(c => c.domainPath?.[0] === domain.title);
                                return (
                                    <button 
                                        key={domain.id}
                                        onClick={() => hasContent ? handleNavigateIn(domain.title) : setToastMsg(`The ${domain.title} sector is currently uncharted.`)}
                                        className={`w-full bg-white dark:bg-slate-900 rounded-[2rem] p-5 border-2 border-slate-100 dark:border-slate-800 text-left transition-all flex flex-col h-full group relative overflow-hidden ${hasContent ? 'shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/50 active:scale-[0.98]' : 'opacity-40 cursor-not-allowed grayscale'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${domain.gradient} text-white shadow-lg ${domain.shadow} ${hasContent ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 pr-2 relative z-10">{domain.title}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 mt-auto relative z-10 leading-snug">{domain.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentDomainTitle = domainPath[domainPath.length - 1];

    return (
        <div 
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-right-8 duration-300 pb-safe relative"
        >
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            <div className="px-6 pt-safe-8 pb-6 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                    <ArrowLeft size={14} className="mr-2"/> Back
                </button>
                
                <div className="flex items-center gap-4 mb-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${themeGradient} ${themeShadow}`}>
                        <ThemeIcon size={28} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-1 overflow-x-auto custom-scrollbar hide-scrollbar whitespace-nowrap">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Radar</span>
                            {domainPath.map((node, idx) => (
                                <React.Fragment key={idx}>
                                    <ChevronRight size={10} className="text-slate-300 shrink-0" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${idx === domainPath.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{node}</span>
                                </React.Fragment>
                            ))}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight truncate">{currentDomainTitle}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                
                {currentCourses.length > 0 && (
                    <section className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end mb-4 ml-1">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                <GraduationCap size={16} className="text-indigo-500" /> Featured Electives
                            </h3>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-2 -mx-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="w-6 shrink-0" /> 
                            {currentCourses.map((course: any) => (
                                <button 
                                    key={course.id}
                                    onClick={() => handleOpenCourse(course)}
                                    className="snap-start shrink-0 w-[300px] text-left bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col active:scale-[0.98] shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500/50 group overflow-hidden"
                                >
                                    <div className={`w-full h-24 bg-gradient-to-br ${course.gradient} p-4 flex justify-between items-start relative`}>
                                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm relative z-10">
                                            {course.difficulty}
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5 relative z-10">
                                            <Clock size={12} /> {course.duration}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 mb-2">{course.title}</h3>
                                        <p className="text-xs font-bold text-slate-400 line-clamp-2 mb-6">{course.description}</p>
                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                                    <Layers size={12}/> {course.features.decks}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                                    <HelpCircle size={12}/> {course.features.quizzes}
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm border border-amber-200 dark:border-amber-500/20 group-hover:scale-105 transition-transform">
                                                <Lock size={10} /> {course.price} Flux
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <div className="w-6 shrink-0" />
                        </div>
                    </section>
                )}
                
                {currentFolders.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Map size={14}/> Pathways</h4>
                        <div className="space-y-3">
                            {currentFolders.map((folderName, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleNavigateIn(folderName)}
                                    className="w-full bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left shadow-sm flex items-center justify-between group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                                            <BookOpen size={18}/>
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{folderName}</h3>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {currentDecks.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> Base Modules</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentDecks.map((deck) => {
                                const isUnlocked = userData?.unlocks?.[deck.id];
                                const cardCount = deck.stats?.cardCount || deck.cards?.length || 0;
                                return (
                                    <div key={deck.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${themeGradient}`}>
                                                <Layers size={20} />
                                            </div>
                                            {!isUnlocked && deck.price > 0 ? (
                                                <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-amber-200 dark:border-amber-500/30">
                                                    <Lock size={12} /> {deck.price} Flux
                                                </div>
                                            ) : (
                                                <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    {cardCount} Targets
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">{deck.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 mb-6 line-clamp-2">{deck.description || `Premium vocabulary and grammar targets mapped to this specific domain.`}</p>
                                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        if (isUnlocked || !deck.price) {
                                                            onDownloadDeck(deck);
                                                            setToastMsg(`Downloading ${deck.title} to Vault...`);
                                                        } else {
                                                            setToastMsg(`Paywall Triggered: This module costs ${deck.price} Flux.`);
                                                        }
                                                    }}
                                                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 ${isUnlocked || !deck.price ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md hover:bg-slate-800 dark:hover:bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    {isUnlocked || !deck.price ? <><Download size={14}/> Download</> : <><Lock size={14}/> Unlock</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {previewCourse && (
                <div className="fixed inset-0 z-[6000] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={() => window.history.back()} />
                    <div className="bg-white dark:bg-slate-950 w-full h-[85vh] rounded-t-[2.5rem] shadow-2xl relative z-10 animate-in slide-in-from-bottom-full duration-300 overflow-hidden flex flex-col border-t border-slate-200 dark:border-slate-800">
                        <div className={`shrink-0 w-full h-32 bg-gradient-to-br ${previewCourse.gradient} relative flex items-end p-6`}>
                            <button onClick={() => window.history.back()} className="absolute top-6 right-6 p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors active:scale-95">
                                <X size={20} strokeWidth={3} />
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex gap-2 w-full">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5">
                                    <SignalHigh size={12} /> {previewCourse.difficulty}
                                </span>
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm flex items-center gap-1.5">
                                    <Clock size={12} /> {previewCourse.duration}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-3">{previewCourse.title}</h2>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{previewCourse.description}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Course Contents</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                                        <Layers size={20} className="text-indigo-500" />
                                        <div>
                                            <span className="block text-lg font-black text-slate-800 dark:text-white leading-none">{previewCourse.features.decks}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Decks</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                                        <HelpCircle size={20} className="text-emerald-500" />
                                        <div>
                                            <span className="block text-lg font-black text-slate-800 dark:text-white leading-none">{previewCourse.features.quizzes}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Quizzes</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 opacity-50">
                                        <CheckCircle2 size={20} className="text-amber-500" />
                                        <div>
                                            <span className="block text-lg font-black text-slate-800 dark:text-white leading-none">1</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Certificate</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Syllabus Path</h4>
                                <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-[27px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                    {previewCourse.syllabus.map((node: any, idx: number) => {
                                        const Icon = node.type === 'deck' ? Layers : node.type === 'quiz' ? HelpCircle : PlayCircle;
                                        return (
                                            <div key={idx} className="relative flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm z-10">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border-4 border-white dark:border-slate-950">
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex-1 pr-4">
                                                    <h5 className="font-black text-sm text-slate-700 dark:text-slate-300 leading-tight mb-1 opacity-80">{node.title}</h5>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{node.type}</span>
                                                </div>
                                                <Lock size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pb-safe-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={() => {
                                    if ((userData?.flux || 0) >= previewCourse.price) {
                                        setToastMsg("Purchasing infrastructure in development!");
                                    } else {
                                        setToastMsg("Insufficient Flux balance.");
                                    }
                                }}
                                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Lock size={16} /> Unlock for {previewCourse.price} <Zap size={14} className="fill-current text-amber-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
