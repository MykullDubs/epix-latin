// src/components/DiscoveryView.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, Globe, BookOpen, Utensils, HeartPulse, 
    Briefcase, Plane, Palette, ChevronRight, ArrowLeft, 
    Map, Compass, Sparkles, Activity, Layers, Download, Lock
} from 'lucide-react';
import { Toast } from './Toast';

// 🔥 ONTOLOGY LEVEL 1 (The Macro Domains)
// These titles MUST exactly match the first string in a deck's domainPath array!
const MACRO_DOMAINS = [
    { id: 'culinary', title: 'Culinary & Hospitality', icon: Utensils, color: 'orange', desc: 'Kitchen ops, service, & ingredients' },
    { id: 'medical', title: 'STEM & Medical', icon: HeartPulse, color: 'emerald', desc: 'Anatomy, sciences, & healthcare' },
    { id: 'commerce', title: 'Commerce & Trade', icon: Briefcase, color: 'blue', desc: 'Business, finance, & retail' },
    { id: 'survival', title: 'Daily Survival', icon: Compass, color: 'rose', desc: 'Navigation, emergencies, & basics' },
    { id: 'linguistics', title: 'Linguistics & Phonetics', icon: Activity, color: 'indigo', desc: 'Pronunciation, IPA, & syntax' },
    { id: 'culture', title: 'Arts & Culture', icon: Palette, color: 'fuchsia', desc: 'Literature, media, & history' }
];

// Tailwind color maps for dynamic rendering
const DOMAIN_THEMES: Record<string, any> = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', hover: 'hover:border-orange-300', iconBg: 'bg-orange-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'hover:border-emerald-300', iconBg: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:border-blue-300', iconBg: 'bg-blue-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:border-rose-300', iconBg: 'bg-rose-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', hover: 'hover:border-indigo-300', iconBg: 'bg-indigo-500' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100', hover: 'hover:border-fuchsia-300', iconBg: 'bg-fuchsia-500' },
    default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', hover: 'hover:border-slate-400', iconBg: 'bg-slate-500' }
};

export default function DiscoveryView({ networkDecks = {}, onDownloadDeck, userData }: any) {
    // 1. NAVIGATION STATE
    // [] = Root Radar View. ['STEM & Medical'] = Level 1. ['STEM & Medical', 'Anatomy'] = Level 2.
    const [domainPath, setDomainPath] = useState<string[]>([]);
    const [touchStartCoords, setTouchStartCoords] = useState<{x: number, y: number} | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Convert Firestore object dict to a flat array for the engine to process
    const globalDecks = useMemo(() => Object.values(networkDecks), [networkDecks]);

    // 🔥 2. THE DYNAMIC REDUCER ENGINE
    // This function calculates exactly what folders and decks exist at the user's current depth!
    const { currentFolders, currentDecks } = useMemo(() => {
        const folders = new Set<string>();
        const decks: any[] = [];

        globalDecks.forEach((deck: any) => {
            const path = deck.domainPath || [];
            
            // Does this deck belong in our current path?
            const matchesPath = domainPath.every((p, i) => path[i] === p);
            if (!matchesPath) return; // Skip it, it's in a different branch

            if (path.length > domainPath.length) {
                // There is another layer deeper! Add it as a folder.
                folders.add(path[domainPath.length]);
            } else {
                // This deck lives exactly at this coordinate!
                decks.push(deck);
            }
        });

        return { 
            currentFolders: Array.from(folders), 
            currentDecks: decks 
        };
    }, [globalDecks, domainPath]);

    // Determine the color theme based on the root macro domain they clicked
    const rootDomainName = domainPath[0];
    const rootMacroConfig = MACRO_DOMAINS.find(m => m.title === rootDomainName);
    const theme = rootMacroConfig ? DOMAIN_THEMES[rootMacroConfig.color] : DOMAIN_THEMES.default;
    const DomainIcon = rootMacroConfig ? rootMacroConfig.icon : Layers;

    // --- NAVIGATION GESTURES ---
    const handleNavigateIn = (folderName: string) => {
        setDomainPath(prev => [...prev, folderName]);
    };

    const handleNavigateOut = () => {
        if (domainPath.length > 0) {
            setDomainPath(prev => prev.slice(0, -1));
        }
    };

    const handleSwipeStart = (e: React.TouchEvent) => {
        setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleSwipeEnd = (e: React.TouchEvent) => {
        if (!touchStartCoords) return;
        const deltaX = touchStartCoords.x - e.changedTouches[0].clientX;
        const deltaY = touchStartCoords.y - e.changedTouches[0].clientY;

        // Strict right-swipe detection for "Back"
        if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
            handleNavigateOut();
        }
        setTouchStartCoords(null);
    };

    // --- RENDER: LEVEL 0 (THE RADAR) ---
    if (domainPath.length === 0) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                <div className="px-6 pt-safe-8 pb-4 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">RADAR</h1>
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-1 mt-1"><Map size={12}/> Lexicon Map</p>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/30 transition-all duration-500 pointer-events-none" />
                        <div className="relative flex items-center">
                            <Search className="absolute left-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                            <input 
                                type="text" 
                                placeholder="Search the global network..." 
                                className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-[2rem] font-bold text-slate-800 dark:text-white outline-none shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                    
                    {/* A. THE FRONTIER (Algorithmic Push) */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14}/> The Frontier</h4>
                        <button 
                            onClick={() => handleNavigateIn('Culinary & Hospitality')}
                            className="w-full bg-gradient-to-br from-orange-500 to-rose-500 p-6 rounded-[2rem] text-left shadow-lg shadow-orange-500/20 group active:scale-[0.98] transition-all"
                        >
                            <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 border border-white/20 group-hover:scale-110 transition-transform">
                                <Utensils size={24} />
                            </div>
                            <h3 className="font-black text-white text-2xl leading-tight mb-2">Culinary Operations</h3>
                            <p className="text-orange-50 text-sm font-bold opacity-90 line-clamp-2">You haven't explored the kitchen lexicon yet. Dive into Back of House vocabulary.</p>
                        </button>
                    </div>

                    {/* B. MACRO DOMAINS (The Grid) */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={14}/> Lexicon Domains</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {MACRO_DOMAINS.map((domain) => {
                                const Icon = domain.icon;
                                const themeClasses = DOMAIN_THEMES[domain.color];
                                
                                // Determine if this macro domain actually has content in the database yet
                                const hasContent = globalDecks.some((d: any) => d.domainPath?.[0] === domain.title);
                                
                                return (
                                    <button 
                                        key={domain.id}
                                        onClick={() => hasContent ? handleNavigateIn(domain.title) : setToastMsg(`The ${domain.title} domain is currently empty.`)}
                                        className={`w-full bg-white dark:bg-slate-900 rounded-[2rem] p-5 border-2 border-slate-100 dark:border-slate-800 text-left transition-all flex flex-col h-full ${hasContent ? 'shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${themeClasses.bg} ${themeClasses.text} border shadow-inner`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 pr-2">{domain.title}</h3>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-auto">{domain.desc}</p>
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

            <div className="px-6 pt-safe-8 pb-4 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                <button onClick={handleNavigateOut} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                    <ArrowLeft size={14} className="mr-2"/> Back
                </button>
                
                <div className="flex items-center gap-4 mb-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border-2 ${theme.bg} ${theme.text} ${theme.border}`}>
                        <DomainIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{currentDomainTitle}</h1>
                        <div className="flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <Layers size={12}/> {domainPath.join(' / ')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
                
                {/* 1. RENDER GENERATED FOLDERS (If they exist at this level) */}
                {currentFolders.length > 0 && (
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Map size={14}/> Sub-Domains</h4>
                        <div className="space-y-3">
                            {currentFolders.map((folderName, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleNavigateIn(folderName)}
                                    className={`w-full bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 ${theme.hover} transition-all text-left shadow-sm flex items-center justify-between group active:scale-[0.98]`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text}`}><BookOpen size={18}/></div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{folderName}</h3>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. RENDER ACTUAL DECKS (If they exist at this level) */}
                {currentDecks.length > 0 && (
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> Modules</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentDecks.map((deck) => {
                                const isUnlocked = userData?.unlocks?.[deck.id];
                                const cardCount = deck.stats?.cardCount || deck.cards?.length || 0;

                                return (
                                    <div key={deck.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${theme.iconBg}`}>
                                                <Layers size={20} />
                                            </div>
                                            {!isUnlocked && deck.price > 0 && (
                                                <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                    <Lock size={10} /> {deck.price} Flux
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">{deck.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 mb-4 line-clamp-2">{deck.description || `A targeted vocabulary module containing ${cardCount} concepts.`}</p>
                                            
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    {cardCount} Targets
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        if (isUnlocked || !deck.price) {
                                                            onDownloadDeck(deck);
                                                            setToastMsg(`Downloading ${deck.title} to Vault...`);
                                                        } else {
                                                            setToastMsg(`Paywall Triggered: This deck costs ${deck.price} Flux.`);
                                                        }
                                                    }}
                                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${isUnlocked || !deck.price ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
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

                {/* 3. DEAD END FALLBACK */}
                {currentFolders.length === 0 && currentDecks.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                        <Map size={48} className="text-slate-400 mb-4" />
                        <h3 className="text-lg font-black text-slate-600 dark:text-slate-400">Uncharted Territory</h3>
                        <p className="text-xs font-bold text-slate-500 mt-2 max-w-[200px]">No modules have been mapped to this exact coordinate yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
