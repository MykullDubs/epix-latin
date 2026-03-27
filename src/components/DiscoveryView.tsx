// src/components/DiscoveryView.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Search, Globe, Layers, BookOpen, Gamepad2, 
    Lock, Unlock, Hexagon, ChevronRight, Zap, 
    Target, ArrowLeft, Download, Compass, Loader2 
} from 'lucide-react';
import { Toast } from './Toast';

// ============================================================================
//  UI THEME ENGINES
// ============================================================================
const getTypeStyles = (type: string) => {
    switch(type) {
        case 'arcade': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Gamepad2, label: 'Arcade Game', border: 'border-amber-200 dark:border-amber-500/20' };
        case 'deck': return { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: Layers, label: 'Practice Deck', border: 'border-rose-200 dark:border-rose-500/20' };
        default: return { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: BookOpen, label: 'Core Lesson', border: 'border-indigo-200 dark:border-indigo-500/20' };
    }
};

const NAV_TABS = ['All', 'Practice Decks', 'Core Lessons', 'Arcade Games'];

// ============================================================================
//  SUB-COMPONENT: DISCOVERY CARD (The Grid Items)
// ============================================================================
const DiscoveryCard = ({ item, onClick, userData }: any) => {
    const style = getTypeStyles(item.contentType);
    const Icon = style.icon;
    const displayTitle = item.title || item.name || "Untitled Resource";

    const price = item.price || 0;
    const isUnlocked = price === 0 || userData?.unlocks?.[item.id];
    const isLocked = !isUnlocked;

    return (
        <button 
            onClick={onClick} 
            className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col overflow-hidden relative active:scale-[0.98] ${isLocked ? 'opacity-90 grayscale-[0.2]' : ''}`}
        >
            {isLocked && (
                <div className="absolute top-4 right-4 bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 z-30 shadow-md border border-white/10 transition-transform group-hover:scale-105">
                    <Lock size={12} className="text-amber-400" />
                    <span>{price}</span>
                    <Hexagon size={10} className="text-amber-400 fill-amber-400/20" />
                </div>
            )}

            <div className="p-5 flex-1 w-full relative z-20">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-transform duration-500 shadow-inner group-hover:rotate-6 group-hover:scale-110 ${style.bg} ${style.text}`}>
                        <Icon size={20} strokeWidth={2.5}/>
                    </div>
                </div>
                <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-4">{displayTitle}</h4>
            </div>

            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full relative z-20 mt-auto">
                <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-slate-400 dark:text-slate-500"/>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest truncate max-w-[80px]">{item.normalizedLanguage}</p>
                </div>
                
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${style.bg} ${style.text} shadow-sm border border-transparent group-hover:${style.border}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest">{isLocked ? 'Unlock' : 'View'}</span>
                    {isLocked ? <Lock size={10} strokeWidth={3} /> : <ChevronRight size={10} strokeWidth={3} />}
                </div>
            </div>
        </button>
    );
};

// ============================================================================
//  MAIN COMPONENT: DISCOVERY VIEW
// ============================================================================
export default function DiscoveryView({ allDecks, lessons, userData, onPurchaseItem, onDownloadItem }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'explore' | 'preview'>('explore');
    const [navFilter, setNavFilter] = useState('All');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Swipe & Scroll States
    const [libTouchStart, setLibTouchStart] = useState<{x: number, y: number} | null>(null);
    const filterBarRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Purchase Modal State
    const [purchasePrompt, setPurchasePrompt] = useState<any>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const fluxBalance = userData?.profile?.main?.coins || userData?.coins || 0;
    const targetLanguages = userData?.learningLanguages || [];

    // --- AUTO-CENTER TABS ---
    useEffect(() => {
        if (filterBarRef.current) {
            const activeTab = filterBarRef.current.querySelector('[data-active="true"]');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [navFilter]);

    // 🔥 1. NATIVE SWIPE TRACKER
    useEffect(() => {
        const handleNativeSwipe = () => {
            // Check what is open and close it in priority order
            if (purchasePrompt) setPurchasePrompt(null);
            else if (viewMode === 'preview') {
                setViewMode('explore');
                setSelectedItem(null);
            }
        };
        window.addEventListener('popstate', handleNativeSwipe);
        return () => window.removeEventListener('popstate', handleNativeSwipe);
    }, [viewMode, purchasePrompt]);
    

    // --- SWIPE LOGIC ---
    const handleSwipeStart = (e: React.TouchEvent) => {
        setLibTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleSwipeEnd = (e: React.TouchEvent) => {
        if (!libTouchStart) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = libTouchStart.x - touchEndX; 
        const deltaY = libTouchStart.y - touchEndY;

        // Ensure it's a horizontal swipe, not a vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const currentIndex = NAV_TABS.indexOf(navFilter);

            if (deltaX > 0 && currentIndex < NAV_TABS.length - 1) {
                setNavFilter(NAV_TABS[currentIndex + 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            } else if (deltaX < 0 && currentIndex > 0) {
                setNavFilter(NAV_TABS[currentIndex - 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            }
        }
        setLibTouchStart(null);
    };

    // --- THE FILTER ENGINE ---
    const processedItems = useMemo(() => {
        const normalizeLanguage = (lang?: string) => {
            if (!lang || lang.trim().length === 0) return 'General';
            return lang.trim().charAt(0).toUpperCase() + lang.trim().slice(1).toLowerCase();
        };

        const rawDecks = Object.entries(allDecks || {}).map(([id, deck]: any) => ({
            id, ...deck, contentType: 'deck', 
            normalizedLanguage: normalizeLanguage(deck.targetLanguage),
            displayCount: `${deck.cards?.length || 0} Targets`,
            _searchStr: `${deck.title} ${deck.targetLanguage} ${deck.description || ''} deck flashcards`.toLowerCase()
        }));

        const rawLessons = (lessons || []).map((lesson: any) => ({
            ...lesson, contentType: lesson.type === 'arcade_game' ? 'arcade' : 'lesson',
            normalizedLanguage: normalizeLanguage(lesson.targetLanguage),
            displayCount: lesson.type === 'arcade_game' ? `Target: ${lesson.targetScore} Pts` : `${lesson.blocks?.length || 0} Blocks`,
            _searchStr: `${lesson.title} ${lesson.name} ${lesson.targetLanguage} ${lesson.description || ''} game lesson`.toLowerCase()
        }));

        let allItems = [...rawDecks, ...rawLessons];

        // 1. Language Filter
        if (targetLanguages.length > 0) {
            allItems = allItems.filter(item => 
                targetLanguages.includes(item.normalizedLanguage) || item.normalizedLanguage === 'General'
            );
        }

        // 2. Tab Filter
        if (navFilter !== 'All') {
            allItems = allItems.filter(item => {
                if (navFilter === 'Practice Decks') return item.contentType === 'deck';
                if (navFilter === 'Core Lessons') return item.contentType === 'lesson';
                if (navFilter === 'Arcade Games') return item.contentType === 'arcade';
                return true;
            });
        }

        // 3. Search Filter
        if (searchTerm.trim()) {
            allItems = allItems.filter(item => item._searchStr.includes(searchTerm.toLowerCase()));
        }

        return allItems;
    }, [allDecks, lessons, searchTerm, targetLanguages, navFilter]);

    // --- INTERACTION ROUTERS ---
    const handleItemClick = (item: any) => {
        window.history.pushState({ modal: true }, '');
        const isUnlocked = !item.price || item.price === 0 || userData?.unlocks?.[item.id];
        if (!isUnlocked) {
            setPurchasePrompt(item);
            return;
        }
        setSelectedItem(item);
        setViewMode('preview');
    };

    const handlePurchaseConfirm = async () => {
        if (!purchasePrompt || !onPurchaseItem) return;
        setIsPurchasing(true);
        const success = await onPurchaseItem(purchasePrompt.id, purchasePrompt.price);
        setIsPurchasing(false);
        if (success) {
            const itemToOpen = purchasePrompt;
            setPurchasePrompt(null);
            setSelectedItem(itemToOpen);
            setViewMode('preview');
            setToastMsg("Module Unlocked!");
        } else {
            setToastMsg("Insufficient Flux balance.");
        }
    };

    const handleDownload = async () => {
        if (!selectedItem || !onDownloadItem) return;
        if ("vibrate" in navigator) navigator.vibrate([40, 30, 40]);
        
        setIsDownloading(true);
        const success = await onDownloadItem(selectedItem);
        setIsDownloading(false);
        
        if (success) setToastMsg("Added to your Vault!");
    };

    // ============================================================================
    //  RENDER: PREVIEW MODAL
    // ============================================================================
    if (viewMode === 'preview' && selectedItem) {
        const style = getTypeStyles(selectedItem.contentType);
        const Icon = style.icon;

        return (
            <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-bottom-8 duration-300 relative z-50 pb-safe">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                <div className="px-6 pt-safe-8 pb-4 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                    <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                        <ArrowLeft size={14} className="mr-2"/> Back to Explore
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                         <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-inner ${style.bg} ${style.text}`}>
                            <Icon size={32} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">{style.label}</span>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight line-clamp-2">{selectedItem.title || selectedItem.name}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                            <Globe size={12}/> {selectedItem.normalizedLanguage}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                            <Target size={12}/> {selectedItem.displayCount}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Module Briefing</h4>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                        {selectedItem.description || "No tactical description provided by the author. Deploy at your own risk."}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <button 
                        onClick={handleDownload} 
                        disabled={isDownloading}
                        className="w-full bg-indigo-600 disabled:bg-indigo-400 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
                        {isDownloading ? 'Decrypting...' : 'Download to Vault'}
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================================
    //  RENDER: MAIN EXPLORE HUB
    // ============================================================================
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            {/* 🔥 PURCHASE MODAL */}
            {purchasePrompt && (
                <div className="fixed inset-0 z-[600] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border-4 border-slate-100 dark:border-slate-800 animate-in zoom-in-95 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 text-indigo-50 dark:text-indigo-500/5"><Unlock size={200} /></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-indigo-100 dark:border-indigo-500/20">
                                <Lock size={32} className="text-indigo-500" />
                            </div>
                            <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-2 leading-tight">Unlock Protocol</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">Decrypting <span className="text-indigo-600 dark:text-indigo-400">{purchasePrompt.title || purchasePrompt.name}</span>.</p>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 border-2 border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cost</span>
                                    <div className="flex items-center gap-1.5 font-black text-xl text-slate-800 dark:text-white">
                                        {purchasePrompt.price} <Hexagon size={16} className="text-indigo-500 fill-indigo-500/20" />
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Wallet</span>
                                    <div className={`flex items-center gap-1.5 font-black text-xl justify-end ${fluxBalance >= purchasePrompt.price ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {fluxBalance} <Hexagon size={16} className="fill-current opacity-20" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => window.history.back()} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
                                <button onClick={handlePurchaseConfirm} disabled={fluxBalance < purchasePrompt.price || isPurchasing} className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isPurchasing ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />} {isPurchasing ? 'Processing' : 'Unlock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 VAULT-MATCHED HEADER & NAV BAR */}
            <div className="sticky top-0 z-30 w-full flex flex-col shrink-0">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-5 flex justify-between items-center pt-safe">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-500/20">
                            <Globe size={22} strokeWidth={3}/>
                        </div>
                        <span className="font-black text-slate-800 dark:text-white text-2xl uppercase tracking-tighter">Explore</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Hexagon size={14} className="text-indigo-500 fill-indigo-500/20" />
                        <span className="font-black text-slate-800 dark:text-white text-sm">{fluxBalance}</span>
                    </div>
                </div>

                <div ref={filterBarRef} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar overscroll-x-contain scroll-smooth">
                    {NAV_TABS.map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setNavFilter(tab)} 
                            data-active={navFilter === tab}
                            className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${navFilter === tab ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🔥 SWIPEABLE CONTENT AREA */}
            <div 
                ref={scrollContainerRef}
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleSwipeEnd}
                className="flex-1 overflow-y-auto p-6 space-y-6 pb-28 relative z-10 custom-scrollbar overscroll-y-contain h-full"
            >
                {/* Search Bar */}
                <div className="relative group mb-2">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Scan the network..." 
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 rounded-[2rem] font-bold text-slate-800 dark:text-white outline-none shadow-sm transition-all"
                        />
                    </div>
                </div>
                
                {/* Results Grid */}
                {processedItems.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Compass size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs text-center max-w-[200px]">No modules found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {processedItems.map((item: any) => (
                            <DiscoveryCard key={item.id} item={item} onClick={() => handleItemClick(item)} userData={userData} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
