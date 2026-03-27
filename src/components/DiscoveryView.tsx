// src/components/DiscoveryView.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, Sparkles, Lock, Unlock, Hexagon, Layers, 
    BookOpen, Gamepad2, Globe, Target, ArrowLeft, Download, 
    Compass, Users, Zap, CheckCircle2, Loader2, BookText, Activity, ChevronRight
} from 'lucide-react';
import { Toast } from './Toast';

// ============================================================================
//  UI THEME ENGINES
// ============================================================================

// 1. Vault-style Folder Colors for Categories
const CATEGORY_COLORS: Record<string, any> = {
    'Practice Decks': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-500/30', text: 'text-indigo-900 dark:text-indigo-100', iconBg: 'bg-white dark:bg-indigo-500/30', iconColor: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-white/60 dark:bg-black/20 text-indigo-600 dark:text-indigo-300', hex: 'bg-indigo-500', icon: Layers },
    'Core Lessons': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-500/30', text: 'text-emerald-900 dark:text-emerald-100', iconBg: 'bg-white dark:bg-emerald-500/30', iconColor: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-white/60 dark:bg-black/20 text-emerald-600 dark:text-emerald-300', hex: 'bg-emerald-500', icon: BookOpen },
    'Arcade Games': { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-500/30', text: 'text-amber-900 dark:text-amber-100', iconBg: 'bg-white dark:bg-amber-500/30', iconColor: 'text-amber-600 dark:text-amber-400', badge: 'bg-white/60 dark:bg-black/20 text-amber-600 dark:text-amber-300', hex: 'bg-amber-500', icon: Gamepad2 },
    'Grammar': { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-500/30', text: 'text-rose-900 dark:text-rose-100', iconBg: 'bg-white dark:bg-rose-500/30', iconColor: 'text-rose-600 dark:text-rose-400', badge: 'bg-white/60 dark:bg-black/20 text-rose-600 dark:text-rose-300', hex: 'bg-rose-500', icon: BookText },
    'Vocabulary': { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-500/30', text: 'text-sky-900 dark:text-sky-100', iconBg: 'bg-white dark:bg-sky-500/30', iconColor: 'text-sky-600 dark:text-sky-400', badge: 'bg-white/60 dark:bg-black/20 text-sky-600 dark:text-sky-300', hex: 'bg-sky-500', icon: Globe },
    'Default': { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-700/50', text: 'text-slate-800 dark:text-slate-200', iconBg: 'bg-white dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400', badge: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300', hex: 'bg-slate-500', icon: Compass }
};

// 2. Card Styles based on Type
const getTypeStyles = (type: string) => {
    switch(type) {
        case 'arcade': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Gamepad2, label: 'Arcade Game' };
        case 'deck': return { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: Layers, label: 'Practice Deck' };
        default: return { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: BookOpen, label: 'Standard Unit' };
    }
};

// ============================================================================
//  STUDENT DISCOVERY VIEW
// ============================================================================
export default function DiscoveryView({ allDecks, lessons, user, onSelectDeck, onSelectLesson, onLogActivity, userData, onPurchaseItem, onDownloadItem }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'categories' | 'category_detail' | 'preview'>('categories');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Purchase Modal State
    const [purchasePrompt, setPurchasePrompt] = useState<any>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const fluxBalance = userData?.profile?.main?.coins || userData?.coins || 0;
    const targetLanguages = userData?.learningLanguages || [];

    // --- THE FILTER & CATEGORY ENGINE ---
    const categorizedItems = useMemo(() => {
        const normalizeLanguage = (lang?: string) => {
            if (!lang || lang.trim().length === 0) return 'General';
            const cleanLang = lang.trim();
            return cleanLang.charAt(0).toUpperCase() + cleanLang.slice(1).toLowerCase();
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

        // 🔥 Strict Language Filter
        if (targetLanguages.length > 0) {
            allItems = allItems.filter(item => 
                targetLanguages.includes(item.normalizedLanguage) || item.normalizedLanguage === 'General'
            );
        }

        // Search Filter
        if (searchTerm.trim()) {
            allItems = allItems.filter(item => item._searchStr.includes(searchTerm.toLowerCase()));
        }

        // Group into Categories (Smart Fallback if undefined)
        const groups: Record<string, any[]> = {};
        allItems.forEach(item => {
            let cat = item.category;
            if (!cat) {
                // Smart Fallback
                if (item.contentType === 'arcade') cat = 'Arcade Games';
                else if (item.contentType === 'lesson') cat = 'Core Lessons';
                else cat = 'Practice Decks';
            }
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });

        // Sort categories alphabetically
        return Object.keys(groups).sort().reduce((acc: any, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});
    }, [allDecks, lessons, searchTerm, targetLanguages]);

    // --- INTERACTION ROUTERS ---
    const handleItemClick = (item: any) => {
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
        
        if (success) {
            setToastMsg("Added to your Vault!");
            // Auto-launch if you want, or just let them stay on preview
        }
    };

    // --- VIEW RENDERS ---

    // 1. CATEGORY DRILL-DOWN VIEW
    if (viewMode === 'category_detail' && selectedCategory) {
        const categoryItems = categorizedItems[selectedCategory] || [];
        const theme = CATEGORY_COLORS[selectedCategory] || CATEGORY_COLORS.Default;
        const CatIcon = theme.icon;

        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-right-8 duration-300 pb-safe">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                <div className="px-6 pt-safe-8 pb-4 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                    <button onClick={() => { setViewMode('categories'); setSelectedCategory(null); }} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                        <ArrowLeft size={14} className="mr-2"/> Back to Explore
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-inner border-2 ${theme.bg} ${theme.iconColor} ${theme.border}`}>
                            <CatIcon size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{selectedCategory}</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{categoryItems.length} Public Modules</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar pb-32">
                    {categoryItems.map((item: any) => {
                        const style = getTypeStyles(item.contentType);
                        const ItemIcon = style.icon;
                        const isUnlocked = !item.price || item.price === 0 || userData?.unlocks?.[item.id];

                        return (
                            <button 
                                key={item.id} 
                                onClick={() => handleItemClick(item)}
                                className={`w-full bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left shadow-sm flex flex-col group active:scale-[0.98] ${!isUnlocked ? 'grayscale-[0.2]' : ''}`}
                            >
                                <div className="flex items-start justify-between w-full mb-4">
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${style.bg} ${style.text}`}>
                                            <ItemIcon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight line-clamp-1 pr-4">{item.title || item.name}</h3>
                                            <div className="flex items-center gap-3 mt-1 opacity-60">
                                                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-500"><Globe size={10}/> {item.normalizedLanguage}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!isUnlocked ? (
                                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                            <Lock size={12} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{item.price}</span>
                                        </div>
                                    ) : (
                                        <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 2. ITEM PREVIEW (DOWNLOAD TO VAULT SCREEN)
    if (viewMode === 'preview' && selectedItem) {
        const style = getTypeStyles(selectedItem.contentType);
        const Icon = style.icon;

        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in slide-in-from-bottom-8 duration-300 relative z-50 pb-safe">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                <div className="px-6 pt-safe-8 pb-4 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
                    <button onClick={() => { setViewMode('category_detail'); setSelectedItem(null); }} className="flex items-center text-slate-400 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                        <ArrowLeft size={14} className="mr-2"/> Back
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                         <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-inner ${style.bg} ${style.text}`}>
                            <Icon size={32} />
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

    // 3. MAIN EXPLORE HUB (CATEGORIES)
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative pb-safe">
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
                                <button onClick={() => setPurchasePrompt(null)} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
                                <button onClick={handlePurchaseConfirm} disabled={fluxBalance < purchasePrompt.price || isPurchasing} className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isPurchasing ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />} {isPurchasing ? 'Processing' : 'Unlock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-6 pt-safe-8 pb-4 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-10 sticky top-0">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">EXPLORE</h1>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-1 mt-1"><Globe size={12}/> Global Network</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <Hexagon size={14} className="text-indigo-500 fill-indigo-500/20" />
                            <span className="font-black text-slate-800 dark:text-white text-sm">{fluxBalance} <span className="text-[9px] uppercase text-slate-400">Flux</span></span>
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-xl group-focus-within:bg-indigo-500/30 transition-all duration-500 pointer-events-none" />
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
                
                {/* Language Filter Badge */}
                {targetLanguages.length > 0 && !searchTerm && (
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Filtering by:</span>
                        {targetLanguages.map((lang: string) => (
                            <span key={lang} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap">
                                {lang}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32">
                {Object.keys(categorizedItems).length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Compass size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs text-center max-w-[200px]">No modules match your language parameters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(categorizedItems).map(([category, items]: [string, any]) => {
                            const theme = CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
                            const CatIcon = theme.icon;

                            return (
                                <button 
                                    key={category} 
                                    onClick={() => { setViewMode('category_detail'); setSelectedCategory(category); }}
                                    className={`w-full ${theme.bg} rounded-[2rem] p-5 border-4 ${theme.border} hover:-translate-y-1 transition-all text-left shadow-sm hover:shadow-xl flex flex-col h-full active:scale-95 animate-in fade-in zoom-in-95`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 ${theme.iconBg} ${theme.iconColor} rounded-[1rem] flex items-center justify-center text-xl shadow-inner`}>
                                            <CatIcon size={24} />
                                        </div>
                                    </div>
                                    <h3 className={`font-black ${theme.text} text-lg leading-tight line-clamp-2 pr-2 mb-auto`}>{category}</h3>
                                    <div className="mt-3">
                                        <span className={`text-[9px] uppercase font-black tracking-widest ${theme.badge} px-2.5 py-1 rounded-md shadow-sm`}>
                                            {items.length} Modules
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
