// src/components/DiscoveryView.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, Sparkles, BarChart3, ArrowDown, Star, Gamepad2, 
    BookOpen, Layers, Globe, Target, Check, Zap, Map, Trophy, 
    ChevronRight, Play, Hexagon, Lock, Unlock, Loader2
} from 'lucide-react';

// ============================================================================
//  SUB-COMPONENTS
// ============================================================================

const getTypeStyles = (type: string) => {
    switch(type) {
        case 'arcade': return { 
            bg: 'bg-amber-50 dark:bg-amber-500/10', iconBg: 'bg-amber-100', text: 'text-amber-600 dark:text-amber-400', hover: 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-amber-500/20', 
            icon: Gamepad2, label: 'Arcade Game', border: 'border-amber-200 dark:border-amber-500/20' 
        };
        case 'deck': return { 
            bg: 'bg-rose-50 dark:bg-rose-500/10', iconBg: 'bg-rose-100', text: 'text-rose-600 dark:text-rose-400', hover: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 group-hover:shadow-rose-500/20', 
            icon: Layers, label: 'Practice Deck', border: 'border-rose-200 dark:border-rose-500/20' 
        };
        default: return { // Lesson
            bg: 'bg-indigo-50 dark:bg-indigo-500/10', iconBg: 'bg-indigo-100', text: 'text-indigo-600 dark:text-indigo-400', hover: 'group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 group-hover:shadow-indigo-500/20', 
            icon: BookOpen, label: 'Standard Unit', border: 'border-indigo-200 dark:border-indigo-500/20' 
        };
    }
};

const DeckGroup = ({ title, items, onClick, icon, userData }: any) => (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 px-2 uppercase tracking-widest">{icon} {title}</h4>
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 custom-scrollbar snap-x">
            {items.map((item: any) => <DiscoveryCard key={item.id} item={item} onClick={() => onClick(item)} compact userData={userData} />)}
        </div>
    </div>
);

const DiscoveryCard = ({ item, onClick, compact = false, userData }: any) => {
    const style = getTypeStyles(item.contentType);
    const Icon = style.icon;
    const displayTitle = item.title || item.name || "Untitled Resource";

    // 🔥 ECONOMY CHECK
    const price = item.price || 0;
    const isUnlocked = price === 0 || userData?.unlocks?.[item.id];
    const isLocked = !isUnlocked;

    return (
        <button 
            onClick={onClick} 
            className={`snap-start bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left group flex flex-col overflow-hidden ${compact ? 'min-w-[260px] max-w-[260px] h-[220px]' : 'h-64'} relative ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
            
            {/* 🔥 PREMIUM LOCK BADGE */}
            {isLocked && (
                <div className="absolute top-5 right-5 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 z-30 shadow-xl border border-white/10 transition-transform group-hover:scale-110">
                    <Lock size={12} className="text-amber-400" />
                    <span>{price}</span>
                    <Hexagon size={10} className="text-amber-400 fill-amber-400/20" />
                </div>
            )}

            <div className="p-6 flex-1 w-full relative z-20">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${style.bg} ${style.text} ${style.hover} shadow-inner group-hover:rotate-6 group-hover:scale-110`}>
                        <Icon size={24} strokeWidth={2.5}/>
                    </div>
                    {item.contentType === 'arcade' && !isLocked && (
                        <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 dark:border-amber-500/30">
                            <Zap size={10} className="fill-amber-500" /> Hot
                        </span>
                    )}
                </div>
                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-10">{displayTitle}</h4>
                {item.description && !compact && (
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 line-clamp-2">{item.description}</p>
                )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full relative z-20">
                <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-slate-400 dark:text-slate-500"/>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest truncate max-w-[100px]">{item.normalizedLanguage}</p>
                </div>
                
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${style.bg} ${style.text} shadow-sm border border-transparent group-hover:${style.border}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{isLocked ? 'Unlock' : style.label}</span>
                    {isLocked ? <Lock size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
                </div>
            </div>
        </button>
    );
};

// ============================================================================
//  STUDENT DISCOVERY VIEW
// ============================================================================
export default function DiscoveryView({ allDecks, lessons, user, onSelectDeck, onSelectLesson, onLogActivity, userData, onPurchaseItem }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortMode, setSortMode] = useState<'relevance' | 'size' | 'alpha'>('relevance');

    // Purchase Modal State
    const [purchasePrompt, setPurchasePrompt] = useState<any>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const fluxBalance = userData?.profile?.main?.coins || userData?.coins || 0;

    // --- THE REBUILT FUZZY BRAIN ---
    const { processedItems, categories, difficultyGroups } = useMemo(() => {
        
        const normalizeLanguage = (lang?: string) => {
            if (!lang) return 'General';
            const cleanLang = lang.trim();
            if (cleanLang.length === 0) return 'General';
            return cleanLang.charAt(0).toUpperCase() + cleanLang.slice(1).toLowerCase();
        };

        const deckEntries = Object.entries(allDecks || {})
            .filter(([, deck]: any) => !deck.isAssignment)
            .map(([id, deck]: any) => {
                const normLang = normalizeLanguage(deck.targetLanguage);
                return {
                    id, ...deck,
                    contentType: 'deck',
                    magnitude: (deck.cards?.length || 0), 
                    displayCount: `${deck.cards?.length || 0} Targets`,
                    normalizedLanguage: normLang,
                    _searchStr: `${deck.title} ${normLang} ${deck.description || ''} vocab flashcards deck`.toLowerCase()
                };
            });

        const lessonEntries = (lessons || [])
            .map((lesson: any) => {
                const normLang = normalizeLanguage(lesson.targetLanguage);
                return {
                    ...lesson,
                    contentType: lesson.type === 'arcade_game' ? 'arcade' : 'lesson',
                    magnitude: (lesson.blocks?.length || 0) * 3, 
                    displayCount: lesson.type === 'arcade_game' ? `Target: ${lesson.targetScore} Pts` : `${lesson.blocks?.length || 0} Blocks`,
                    normalizedLanguage: normLang,
                    _searchStr: `${lesson.title} ${lesson.name || ''} ${normLang} ${lesson.description || ''} ${lesson.type === 'arcade_game' ? 'game arcade play' : 'reading lesson unit'}`.toLowerCase()
                };
            });

        let entries = [...deckEntries, ...lessonEntries];

        const rawCats = entries.map((d: any) => d.normalizedLanguage);
        const uniqueCats = Array.from(new Set(rawCats)).sort();
        const cats = ['All', ...uniqueCats];

        if (activeCategory !== 'All') {
            entries = entries.filter((d: any) => d.normalizedLanguage === activeCategory);
        }

        if (searchTerm.trim()) {
            const tokens = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
            entries = entries.map((d: any) => {
                let score = 0;
                const titleMatch = (d.title || d.name || "").toLowerCase();
                if (titleMatch.includes(searchTerm.toLowerCase())) score += 20;
                tokens.forEach(token => { 
                    if (d._searchStr.includes(token)) score += 5; 
                });
                return { ...d, _score: score };
            }).filter((d: any) => d._score > 0);
        } else {
            entries = entries.map((d: any) => ({ ...d, _score: Math.random() }));
        }

        entries.sort((a: any, b: any) => {
            if (sortMode === 'size') return b.magnitude - a.magnitude;
            if (sortMode === 'alpha') {
                const titleA = a.title || a.name || "";
                const titleB = b.title || b.name || "";
                return titleA.localeCompare(titleB);
            }
            return b._score - a._score;
        });

        const groups = {
            quick: entries.filter((d: any) => d.magnitude < 10),
            standard: entries.filter((d: any) => d.magnitude >= 10 && d.magnitude < 30),
            master: entries.filter((d: any) => d.magnitude >= 30)
        };

        return { processedItems: entries, categories: cats, difficultyGroups: groups };
    }, [allDecks, lessons, searchTerm, activeCategory, sortMode]);

    // 🔥 SMART CLICK ROUTER (Handles Locks)
    const handleItemClick = (item: any) => {
        const price = item.price || 0;
        const isUnlocked = price === 0 || userData?.unlocks?.[item.id];

        if (!isUnlocked) {
            setPurchasePrompt(item); // Open Storefront Modal
            return;
        }

        if (onLogActivity) onLogActivity(`explore_${item.contentType}`, 0, "Exploration");
        if (item.contentType === 'lesson' || item.contentType === 'arcade') {
            onSelectLesson(item);
        } else {
            onSelectDeck(item);
        }
    };

    // 🔥 CHECKOUT PROCESSOR
    const handlePurchaseConfirm = async () => {
        if (!purchasePrompt || !onPurchaseItem) return;
        setIsPurchasing(true);
        
        const success = await onPurchaseItem(purchasePrompt.id, purchasePrompt.price);
        
        setIsPurchasing(false);
        if (success) {
            const itemToOpen = purchasePrompt;
            setPurchasePrompt(null);
            // Auto-open upon purchase
            if (itemToOpen.contentType === 'lesson' || itemToOpen.contentType === 'arcade') {
                onSelectLesson(itemToOpen);
            } else {
                onSelectDeck(itemToOpen);
            }
        } else {
            alert("Insufficient Flux balance. Keep learning to earn more!");
        }
    };

    const isSearching = searchTerm.length > 0;

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-500 relative transition-colors">
            
            {/* 🔥 VAULT / PURCHASE MODAL */}
            {purchasePrompt && (
                <div className="fixed inset-0 z-[600] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border-4 border-slate-100 dark:border-slate-800 animate-in zoom-in-95 relative overflow-hidden">
                        
                        {/* Decorative Background */}
                        <div className="absolute -top-24 -right-24 text-indigo-50 dark:text-indigo-500/5">
                            <Unlock size={200} />
                        </div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-indigo-100 dark:border-indigo-500/20">
                                <Lock size={32} className="text-indigo-500" />
                            </div>

                            <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-2 leading-tight">Unlock Content</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">
                                You are about to unlock <span className="text-indigo-600 dark:text-indigo-400">{purchasePrompt.title || purchasePrompt.name}</span>.
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 border-2 border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cost</span>
                                    <div className="flex items-center gap-1.5 font-black text-xl text-slate-800 dark:text-white">
                                        {purchasePrompt.price} <Hexagon size={16} className="text-indigo-500 fill-indigo-500/20" />
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Your Balance</span>
                                    <div className={`flex items-center gap-1.5 font-black text-xl justify-end ${fluxBalance >= purchasePrompt.price ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {fluxBalance} <Hexagon size={16} className="fill-current opacity-20" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setPurchasePrompt(null)} 
                                    className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handlePurchaseConfirm} 
                                    disabled={fluxBalance < purchasePrompt.price || isPurchasing}
                                    className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                >
                                    {isPurchasing ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
                                    {isPurchasing ? 'Processing' : 'Unlock Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING HEADER AREA */}
            <div className="px-6 pt-12 pb-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-3xl z-20 sticky top-0 transition-all border-b border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-lg mb-2 inline-flex items-center gap-1 shadow-sm border border-indigo-200 dark:border-indigo-500/30">
                            <Map size={12}/> Global Network
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mt-1">Explore.</h1>
                    </div>
                    
                    {/* 🔥 THE WALLET UI INJECTED */}
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <Hexagon size={16} className="text-indigo-500 fill-indigo-500/20" />
                            <span className="font-black text-slate-800 dark:text-white tracking-tight">{fluxBalance} <span className="text-[10px] uppercase text-slate-400">Flux</span></span>
                        </div>

                        <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <button onClick={() => setSortMode('relevance')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'relevance' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`} title="Smart Sort"><Sparkles size={16}/></button>
                            <button onClick={() => setSortMode('size')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'size' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`} title="Sort by Size"><BarChart3 size={16}/></button>
                            <button onClick={() => setSortMode('alpha')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'alpha' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`} title="A-Z"><ArrowDown size={16}/></button>
                        </div>
                    </div>
                </div>
                
                {/* CYBER-GRID SEARCH BAR */}
                <div className="relative group mb-5">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/40 transition-all duration-500 pointer-events-none" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-6 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={22}/>
                        <input 
                            type="text" 
                            placeholder="Find a module, deck, or arcade..." 
                            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-[2rem] font-black text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 outline-none transition-all shadow-sm focus:shadow-xl text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* SQUISHY CATEGORY FILTERS */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 custom-scrollbar snap-x">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            className={`snap-start px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 border-2 ${
                                activeCategory === cat 
                                    ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-xl scale-105' 
                                    : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* SCROLLABLE MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 pt-4">
                
                {/* MARKETING HERO SECTION */}
                {!isSearching && activeCategory === 'All' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* FEATURED HERO CARD */}
                        {processedItems.length > 0 && (
                            <div className="px-6 mb-12">
                                <button 
                                    onClick={() => handleItemClick(processedItems[0])} 
                                    className={`w-full relative h-[340px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-900/10 dark:shadow-black/50 group text-left transition-all duration-300 active:scale-[0.98] border-4 border-white/10 ${processedItems[0].price && !(processedItems[0].price === 0 || userData?.unlocks?.[processedItems[0].id]) ? 'grayscale-[0.2]' : ''}`}
                                >
                                    <div className={`absolute inset-0 transition-transform duration-1000 group-hover:scale-105 ${
                                        processedItems[0].contentType === 'arcade' ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-500' :
                                        processedItems[0].contentType === 'deck' ? 'bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600' :
                                        'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500'
                                    }`} />
                                    
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                    
                                    <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                        <Star size={12} className="fill-yellow-400 text-yellow-400" /> Featured
                                    </div>

                                    {/* 🔥 HERO LOCK BADGE */}
                                    {processedItems[0].price && !(processedItems[0].price === 0 || userData?.unlocks?.[processedItems[0].id]) && (
                                        <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
                                            <Lock size={14} className="text-amber-400" /> {processedItems[0].price} <Hexagon size={12} className="text-amber-400 fill-amber-400/20" />
                                        </div>
                                    )}
                                    
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner group-hover:rotate-12 transition-transform">
                                                {processedItems[0].contentType === 'arcade' ? <Gamepad2 size={24} strokeWidth={2.5}/> : processedItems[0].contentType === 'lesson' ? <BookOpen size={24} strokeWidth={2.5}/> : <Layers size={24} strokeWidth={2.5}/>}
                                            </div>
                                            <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm">
                                                {processedItems[0].contentType === 'arcade' ? 'Live Arcade' : processedItems[0].contentType === 'lesson' ? 'Learning Unit' : 'Practice Deck'}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black text-white leading-tight mb-3 drop-shadow-lg">{processedItems[0].title || processedItems[0].name}</h2>
                                        <div className="flex items-center gap-3 text-white/80 text-xs font-bold">
                                            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"><Globe size={14}/> {processedItems[0].normalizedLanguage}</span>
                                            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"><Target size={14}/> {processedItems[0].displayCount}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. DYNAMIC RESULTS GRID */}
                <div className="px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                            {isSearching ? <Search size={18} className="text-indigo-500"/> : <Map size={18} className="text-indigo-500"/>} 
                            {isSearching ? `Found ${processedItems.length} Match${processedItems.length === 1 ? '' : 'es'}` : activeCategory !== 'All' ? `${activeCategory} Collection` : 'Available Modules'}
                        </h3>
                    </div>

                    {sortMode === 'size' && !isSearching ? (
                        <div className="space-y-10">
                            {difficultyGroups.master.length > 0 && <DeckGroup title="Master Class (Long)" items={difficultyGroups.master} onClick={handleItemClick} icon={<Trophy size={18} className="text-yellow-500"/>} userData={userData} />}
                            {difficultyGroups.standard.length > 0 && <DeckGroup title="Standard Units" items={difficultyGroups.standard} onClick={handleItemClick} icon={<Layers size={18} className="text-indigo-500"/>} userData={userData} />}
                            {difficultyGroups.quick.length > 0 && <DeckGroup title="Quick Bites" items={difficultyGroups.quick} onClick={handleItemClick} icon={<Zap size={18} className="text-orange-500"/>} userData={userData} />}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {processedItems.map((item: any) => (
                                <DiscoveryCard key={item.id} item={item} onClick={() => handleItemClick(item)} userData={userData} />
                            ))}
                        </div>
                    )}

                    {/* REPOLISHED EMPTY STATE */}
                    {processedItems.length === 0 && (
                        <div className="text-center py-24 px-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 mt-4 shadow-sm">
                            <div className="w-28 h-28 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-600 shadow-inner border border-slate-100 dark:border-slate-700">
                                <Search size={56} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Signal Lost</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-bold mb-10 max-w-[280px] mx-auto leading-relaxed">No modules match your current scan parameters. Try broadening your search.</p>
                            <button 
                                onClick={() => {setSearchTerm(''); setActiveCategory('All');}} 
                                className="bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3 mx-auto"
                            >
                                <Sparkles size={18} /> Reset Scan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
