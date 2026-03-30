// src/components/DiscoveryView.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Search, Globe, BookOpen, Utensils, HeartPulse, 
    Briefcase, Plane, Palette, ChevronRight, ArrowLeft, 
    Map, Compass, Sparkles, Activity, Layers, Download, Lock,
    MonitorPlay, Globe2, ShieldAlert, Cpu, GraduationCap
} from 'lucide-react';
import { Toast } from './Toast';

// 🔥 EXPANDED ONTOLOGY LEVEL 1 (The Macro Domains)
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

export default function DiscoveryView({ networkDecks = {}, onDownloadDeck, userData, activeOrg }: any) {
    // 1. NAVIGATION STATE
    const [domainPath, setDomainPath] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [touchStartCoords, setTouchStartCoords] = useState<{x: number, y: number} | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const globalDecks = useMemo(() => Object.values(networkDecks), [networkDecks]);
    
    // UI Metadata
    const themeColor = activeOrg?.themeColor || '#4f46e5'; 
    const themeName = activeOrg?.name || 'Magister';
    const targetLang = userData?.targetLanguage || "English";

    // 🔥 2. THE DYNAMIC REDUCER ENGINE
    const { currentFolders, currentDecks } = useMemo(() => {
        const folders = new Set<string>();
        const decks: any[] = [];

        globalDecks.forEach((deck: any) => {
            const path = deck.domainPath || [];
            
            const matchesPath = domainPath.every((p, i) => path[i] === p);
            if (!matchesPath) return; 

            if (path.length > domainPath.length) {
                folders.add(path[domainPath.length]);
            } else {
                decks.push(deck);
            }
        });

        return { 
            currentFolders: Array.from(folders).sort(), 
            currentDecks: decks.sort((a, b) => b.updatedAt - a.updatedAt) 
        };
    }, [globalDecks, domainPath]);

    const rootDomainName = domainPath[0];
    const rootMacroConfig = MACRO_DOMAINS.find(m => m.title === rootDomainName);
    const ThemeIcon = rootMacroConfig?.icon || Layers;
    const themeGradient = rootMacroConfig?.gradient || 'from-slate-400 to-slate-600';
    const themeShadow = rootMacroConfig?.shadow || 'shadow-slate-500/20';

    // 🔥 3. BULLETPROOF NAVIGATION CONTROLLER
    const handleBack = () => {
        if (domainPath.length > 0) {
            // Peel off the deepest folder layer
            setDomainPath(prev => prev.slice(0, -1));
        }
        // If domainPath.length === 0, the browser will naturally exit back to the Home View!
    };

    // The fresh closure reference to survive the event listener
    const handleBackRef = useRef(handleBack);
    useEffect(() => {
        handleBackRef.current = handleBack;
    }, [domainPath]);

    // Mount the popstate listener ONCE
    useEffect(() => {
        const handleNativeBack = (e: PopStateEvent) => handleBackRef.current();
        window.addEventListener('popstate', handleNativeBack);
        return () => window.removeEventListener('popstate', handleNativeBack);
    }, []);

    // Going deeper: drop a history breadcrumb first!
    const handleNavigateIn = (folderName: string) => {
        window.history.pushState({ view: 'discovery_depth' }, '');
        setDomainPath(prev => [...prev, folderName]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Swipe controls (tied to native back)
    const handleSwipeStart = (e: React.TouchEvent) => {
        setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleSwipeEnd = (e: React.TouchEvent) => {
        if (!touchStartCoords) return;
        const deltaX = touchStartCoords.x - e.changedTouches[0].clientX;
        const deltaY = touchStartCoords.y - e.changedTouches[0].clientY;

        if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
            // Only trigger back if we are deep inside folders
            if (domainPath.length > 0) window.history.back();
        }
        setTouchStartCoords(null);
    };

    // --- RENDER: LEVEL 0 (THE RADAR) ---
    if (domainPath.length === 0) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {/* 🔥 SYNCED GLOBAL HEADER */}
                <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        {activeOrg?.logoUrl ? (
                            <img src={activeOrg.logoUrl} alt={`${themeName} Logo`} className="w-8 h-8 object-contain rounded-md" />
                        ) : (
                            <div className="text-white p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: themeColor }} aria-hidden="true">
                                <GraduationCap size={18} strokeWidth={3}/>
                            </div>
                        )}
                        <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>
                            Radar
                        </span>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors duration-300" aria-label={`Target Language: ${targetLang}`}>
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

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                    
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14} className="text-amber-500"/> The Frontier</h4>
                        <button 
                            onClick={() => handleNavigateIn('Linguistics & Phonetics')}
                            className="w-full bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-indigo-900 dark:to-slate-950 p-6 rounded-[2.5rem] text-left shadow-2xl shadow-indigo-900/20 group active:scale-[0.98] transition-all relative overflow-hidden border border-indigo-500/30"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 blur-3xl rounded-full group-hover:bg-indigo-400/40 transition-colors" />
                            <div className="bg-white/10 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-300 mb-4 border border-white/10 group-hover:scale-110 transition-transform shadow-inner">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="font-black text-white text-2xl leading-tight mb-2 relative z-10">Future Ethics & Tech</h3>
                            <p className="text-indigo-200 text-sm font-bold opacity-90 line-clamp-2 relative z-10">Advanced C1 grammar, debate logic, and the vocabulary of AI disruption.</p>
                            <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                                Discover <ChevronRight size={12}/>
                            </div>
                        </button>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe2 size={14}/> Lexicon Sectors</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {MACRO_DOMAINS.map((domain) => {
                                const Icon = domain.icon;
                                const hasContent = globalDecks.some((d: any) => d.domainPath?.[0] === domain.title);
                                
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

    // --- RENDER: LEVEL 1+ (SUB-DOMAIN DRILL DOWN) ---
    const currentDomainTitle = domainPath[domainPath.length - 1];

    return (
        <div 
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-right-8 duration-300 pb-safe relative"
        >
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            <div className="px-6 pt-safe-8 pb-6 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                {/* 🔥 The Back button now taps into the browser history natively */}
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
                                    <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${idx === domainPath.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                        {node}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight truncate">{currentDomainTitle}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                
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
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors`}>
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
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> Available Modules</h4>
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
                                                            setToastMsg(`Paywall Triggered: This deck costs ${deck.price} Flux.`);
                                                        }
                                                    }}
                                                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 ${isUnlocked || !deck.price ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md hover:bg-slate-800 dark:hover:bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {isUnlocked || !deck.price ? <><Download size={14}/> Download</> : <><Lock size={14}/> Unlock</>}
                                                </button>
                                                <button className="px-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-colors flex items-center justify-center">
                                                    Preview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentFolders.length === 0 && currentDecks.length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 border-4 border-white dark:border-slate-900 shadow-inner">
                            <Compass size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Uncharted Territory</h3>
                        <p className="text-sm font-bold text-slate-500 max-w-[250px] leading-relaxed">No modules have been published to this exact coordinate in the network yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
