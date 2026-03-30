// src/components/FlashcardView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, X, Library, Layers, HelpCircle, Puzzle, Flame, 
    Filter, ChevronRight, Archive, Plus, Loader2,
    MoreVertical, FolderPlus, Trash2, Folder, FolderOpen, Edit3, Infinity,
    HeartPulse, Cpu, Briefcase, Palette, Utensils, Globe2, Activity, ShieldAlert, MonitorPlay,
    Calculator, FlaskConical, Plane, BookText, Code, BrainCircuit, Music, CheckCircle2
} from 'lucide-react';
import { Toast } from './Toast'; 
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { saveDeckToCache, getDeckFromCache } from '../utils/localCache';

// 🔥 IMPORT THE ISOLATED ENGINES
import ContextualBuilder from './ContextualBuilder';
import { StudyModePlayer, MatchingGame, QuizSessionView } from './StudyEngines';

// 🔥 JUICED FOLDER COLORS
const FOLDER_COLORS: Record<string, any> = {
    indigo: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-indigo-300 dark:hover:border-indigo-500/50', textColor: 'text-indigo-500 dark:text-indigo-400', iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-indigo-500', hex: 'bg-indigo-500' },
    rose: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-rose-300 dark:hover:border-rose-500/50', textColor: 'text-rose-500 dark:text-rose-400', iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-rose-500', hex: 'bg-rose-500' },
    emerald: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-emerald-300 dark:hover:border-emerald-500/50', textColor: 'text-emerald-500 dark:text-emerald-400', iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-emerald-500', hex: 'bg-emerald-500' },
    amber: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-amber-300 dark:hover:border-amber-500/50', textColor: 'text-amber-500 dark:text-amber-400', iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-amber-500', hex: 'bg-amber-500' },
    sky: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-sky-300 dark:hover:border-sky-500/50', textColor: 'text-sky-500 dark:text-sky-400', iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-sky-500', hex: 'bg-sky-500' },
    fuchsia: { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', hover: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-500/50', textColor: 'text-fuchsia-500 dark:text-fuchsia-400', iconBg: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 shadow-lg shadow-fuchsia-500/30', iconColor: 'text-white', badge: 'bg-slate-100 dark:bg-slate-800 text-fuchsia-500', hex: 'bg-fuchsia-500' }
};

// 🔥 UNIFIED DISCOVERY THEMES
const getDeckTheme = (title: string = '') => {
    const str = title.toLowerCase();
    
    if (str.match(/stem|medical|anatomy|bio|health|doctor|sci|chem|phys|cell/)) return { icon: HeartPulse, gradient: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/30' };
    if (str.match(/tech|logic|code|comp|program|software/)) return { icon: Cpu, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' };
    if (str.match(/business|commerce|trade|finance|corporate/)) return { icon: Briefcase, gradient: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/30' };
    if (str.match(/art|culture|history|design|draw|paint|color/)) return { icon: Palette, gradient: 'from-fuchsia-500 to-purple-600', shadow: 'shadow-fuchsia-500/30' };
    if (str.match(/culinary|hospitality|food|kitchen|cook|eat/)) return { icon: Utensils, gradient: 'from-orange-400 to-rose-500', shadow: 'shadow-orange-500/30' };
    if (str.match(/society|politics|law|ethics|government/)) return { icon: Globe2, gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30' };
    if (str.match(/linguistics|phonetics|grammar|syntax|verb|read|english|vocab|word|lit/)) return { icon: Activity, gradient: 'from-violet-500 to-indigo-500', shadow: 'shadow-violet-500/30' };
    if (str.match(/survival|emergency|navigate|travel|place|city|country/)) return { icon: ShieldAlert, gradient: 'from-rose-400 to-red-600', shadow: 'shadow-rose-500/30' };
    if (str.match(/media|entertainment|movie|game|music|play|audio|song|sound/)) return { icon: MonitorPlay, gradient: 'from-pink-500 to-rose-400', shadow: 'shadow-pink-500/30' };
    if (str.match(/math|calc|num|algebra|geometry/)) return { icon: Calculator, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30' };
    
    return { icon: Layers, gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/30' };
};

export default function FlashcardView({ allDecks, selectedDeckKey, onSelectDeck, onLogActivity, userData, onSaveCard, onToggleStar, onToggleArchive, onCreateFolder, onAssignToFolder, onHideDeck, onUpdateFolder, onDeleteFolder, onReorderFolders, onReorderDecks, user }: any) {
    const [internalMode, setInternalMode] = useState<'library' | 'menu' | 'playing' | 'create'>('library');
    const [activeGame, setActiveGame] = useState<'standard' | 'quiz' | 'match' | 'tower'>('standard');
    
    const [deckFilter, setDeckFilter] = useState<string>('all');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    const [activeOptionsDeck, setActiveOptionsDeck] = useState<any>(null);
    const [activeOptionsFolder, setActiveOptionsFolder] = useState<string | null>(null);
    const [menuView, setMenuView] = useState<'main' | 'folders'>('main'); 
    
    const [showFolderModal, setShowFolderModal] = useState<{isOpen: boolean, editMode: boolean, oldName: string}>({isOpen: false, editMode: false, oldName: ''});
    
    const [fetchedCards, setFetchedCards] = useState<any[]>([]);
    const [cardStats, setCardStats] = useState<Record<string, any>>({});
    const [isFetchingCards, setIsFetchingCards] = useState(false);
    
    const [sessionCards, setSessionCards] = useState<any[]>([]);
    const [libTouchStart, setLibTouchStart] = useState<{x: number, y: number} | null>(null);
    const [touchStartCoords, setTouchStartCoords] = useState<{x: number, y: number} | null>(null);
    const [builderConfig, setBuilderConfig] = useState<{type: 'new_deck', folder: string | null} | {type: 'add_card', deck: any} | null>(null);

    const [omniDeck, setOmniDeck] = useState<any>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const filterBarRef = useRef<HTMLDivElement>(null);

    const resolvedDeck = omniDeck || (selectedDeckKey ? allDecks[selectedDeckKey] : null);
    const cards = omniDeck ? omniDeck.cards : fetchedCards;
    const deckTitle = resolvedDeck ? (resolvedDeck.id === 'custom' ? "My Study Cards" : resolvedDeck.title) : "";

    const customFolders: string[] = userData?.studyFolders || [];
    const folderColors: Record<string, string> = userData?.folderColors || {};

    const filteredDecks = useMemo(() => {
        return Object.entries(allDecks).filter(([key, deck]: any) => {
            const isCustom = key === 'custom';
            const isAuthor = deck.authorId === user?.uid || deck.ownerId === user?.uid;
            
            const isUnlocked = 
                userData?.unlocks?.[key] || 
                (Array.isArray(userData?.unlocks) && userData.unlocks.includes(key)) ||
                (Array.isArray(userData?.inventory) && userData.inventory.includes(key));
            
            const hasPrefs = !!userData?.deckPrefs?.[key]; 
            const inMyVault = isCustom || isAuthor || isUnlocked || hasPrefs;
            
            if (!inMyVault) return false; 

            const isArchived = userData?.deckPrefs?.[key]?.archived || false;
            const currentFolder = userData?.deckPrefs?.[key]?.folder || null;
            
            if (deckFilter === 'archived') return isArchived;
            if (isArchived) return false; 

            if (deckFilter === 'all') return currentFolder === null;
            if (deckFilter === 'created') return (isCustom || isAuthor) && currentFolder === null;
            if (deckFilter === 'downloaded') return (!isCustom && !isAuthor) && currentFolder === null;
            
            if (customFolders.includes(deckFilter)) return currentFolder === deckFilter;
            return true;
        });
    }, [allDecks, deckFilter, user?.uid, userData?.unlocks, userData?.inventory, userData?.deckPrefs, customFolders]);

    const [localFolders, setLocalFolders] = useState<string[]>([]);
    const [localDecks, setLocalDecks] = useState<any[]>([]);

    const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'folder' | 'deck' } | null>(null);
    const [dragOverGapId, setDragOverGapId] = useState<string | null>(null); 
    const [dragOverFolderCatch, setDragOverFolderCatch] = useState<string | null>(null); 
    
    useEffect(() => {
        setLocalFolders(userData?.studyFolders || []);
    }, [userData?.studyFolders]);

    useEffect(() => {
        const order = userData?.deckOrder || [];
        const sorted = [...filteredDecks].sort((a, b) => {
            const aIdx = order.indexOf(a[0]);
            const bIdx = order.indexOf(b[0]);
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });
        setLocalDecks(sorted);
    }, [filteredDecks, userData?.deckOrder]);

    const displayItemCount = (deckFilter === 'all' ? localFolders.length : 0) + localDecks.length;
    const isDense = displayItemCount > 6;

    const handleBack = () => {
        if (activeOptionsDeck) { setActiveOptionsDeck(null); return; }
        if (activeOptionsFolder) { setActiveOptionsFolder(null); return; }
        if (showFolderModal.isOpen) { setShowFolderModal({isOpen: false, editMode: false, oldName: ''}); return; }
        if (internalMode === 'playing') { setInternalMode('menu'); return; }
        if (internalMode === 'create') {
            setInternalMode(builderConfig?.type === 'add_card' ? 'menu' : 'library');
            return;
        }
        if (internalMode === 'menu') {
            setInternalMode('library');
            setOmniDeck(null);
            return;
        }
        if (deckFilter !== 'all') { setDeckFilter('all'); return; }
        if (onSelectDeck) onSelectDeck(null);
    };

    const handleBackRef = useRef(handleBack);
    useEffect(() => {
        handleBackRef.current = handleBack;
    }, [activeOptionsDeck, activeOptionsFolder, showFolderModal, internalMode, builderConfig, deckFilter, onSelectDeck]);

    useEffect(() => {
        const handleNativeBack = (e: PopStateEvent) => handleBackRef.current();
        window.addEventListener('popstate', handleNativeBack);
        return () => window.removeEventListener('popstate', handleNativeBack);
    }, []);

    useEffect(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }, [deckFilter, internalMode]);

    useEffect(() => {
        if (filterBarRef.current) {
            const activeTab = filterBarRef.current.querySelector('[data-active="true"]');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [deckFilter]);

    useEffect(() => {
        const fetchDeckCards = async () => {
            if (!selectedDeckKey || omniDeck) return;
            
            if (selectedDeckKey === 'custom') {
                setFetchedCards(allDecks['custom']?.cards || []);
                return;
            }

            setIsFetchingCards(true);
            try {
                const masterDeck = allDecks[selectedDeckKey];
                const masterUpdatedAt = masterDeck?.updatedAt || 0;
                const cachedData = await getDeckFromCache(selectedDeckKey);

                let finalCards = [];
                if (cachedData && cachedData.updatedAt >= masterUpdatedAt) {
                    finalCards = cachedData.cards;
                } else {
                    const cardsRef = collection(db, 'artifacts', appId, 'decks', selectedDeckKey, 'cards');
                    const snap = await getDocs(cardsRef);
                    finalCards = snap.docs.map(doc => doc.data());
                    await saveDeckToCache(selectedDeckKey, finalCards, masterUpdatedAt);
                }
                setFetchedCards(finalCards);

                if (user?.uid) {
                    const statsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'deck_progress', selectedDeckKey, 'card_stats');
                    const statsSnap = await getDocs(statsRef);
                    const statsMap: Record<string, any> = {};
                    statsSnap.docs.forEach(d => { statsMap[d.id] = d.data(); });
                    setCardStats(statsMap);
                }

            } catch (err) {
                console.error("Failed to load cards:", err);
                setToastMsg("Failed to download deck. Check connection.");
            } finally {
                setIsFetchingCards(false);
            }
        };

        fetchDeckCards();
    }, [selectedDeckKey, omniDeck, allDecks, user?.uid]);

    const dueCards = useMemo(() => {
        return cards.filter((c: any) => {
            const stat = cardStats[c.id];
            return !stat?.nextReviewDate || stat.nextReviewDate <= Date.now();
        });
    }, [cards, cardStats]);

    const launchGame = (mode: 'standard' | 'quiz' | 'match' | 'tower') => {
        if (cards.length === 0) {
            setToastMsg("This deck has no cards.");
            return;
        }

        window.history.pushState({ view: 'playing' }, ''); 
        let studySnapshot = [];
        
        if (mode === 'standard') {
            if (dueCards.length > 0) {
                studySnapshot = [...dueCards];
            } else {
                studySnapshot = [...cards];
            }

            if (resolvedDeck?.isSequential) {
                studySnapshot.sort((a, b) => (a.order || 0) - (b.order || 0));
            } else if (dueCards.length === 0) {
                studySnapshot.sort(() => Math.random() - 0.5);
            }
        } else {
            studySnapshot = [...cards];
        }

        setSessionCards(studySnapshot);
        setActiveGame(mode);
        setInternalMode('playing');
    };

    const handleGameFinish = (scorePct: number) => {
        const baseMultiplier = activeGame === 'quiz' ? 10 : activeGame === 'match' ? 15 : 5;
        const earnedXP = Math.round((cards.length * baseMultiplier) * (scorePct / 100)); 
        onLogActivity(resolvedDeck?.id || 'custom', earnedXP, `${deckTitle} (${activeGame})`, { scorePct, mode: activeGame });
        
        window.history.back(); 
        setTimeout(() => setToastMsg(`Protocol Complete! +${earnedXP} XP Earned!`), 100);
    };

    const handleSwipeStart = (e: React.TouchEvent) => {
        setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleMenuSwipeEnd = (e: React.TouchEvent) => {
        if (!touchStartCoords) return;
        const deltaX = touchStartCoords.x - e.changedTouches[0].clientX;
        const deltaY = touchStartCoords.y - e.changedTouches[0].clientY;

        if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY)) {
            window.history.back(); 
        }
        setTouchStartCoords(null);
    };

    const handleLibrarySwipeStart = (e: React.TouchEvent) => {
        setLibTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleLibrarySwipeEnd = (e: React.TouchEvent) => {
        if (!libTouchStart) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = libTouchStart.x - touchEndX; 
        const deltaY = libTouchStart.y - touchEndY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const allFilters = ['all', 'created', 'downloaded', 'archived', ...localFolders];
            const currentIndex = allFilters.indexOf(deckFilter);

            if (deltaX > 0 && currentIndex < allFilters.length - 1) {
                setDeckFilter(allFilters[currentIndex + 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            } else if (deltaX < 0 && currentIndex > 0) {
                setDeckFilter(allFilters[currentIndex - 1]);
                if ("vibrate" in navigator) navigator.vibrate(15); 
            }
        }
        setLibTouchStart(null);
    };

    const launchOmniMode = async (folderName: string) => {
        const folderDecks = Object.values(allDecks).filter((d: any) => userData?.deckPrefs?.[d.id]?.folder === folderName && !userData?.deckPrefs?.[d.id]?.archived);
        
        if (folderDecks.length === 0) {
            setToastMsg("Folder has no decks to study.");
            return;
        }

        setIsFetchingCards(true);
        setToastMsg("Compiling Omni-Deck...");
        
        try {
            const allPromises = folderDecks.map(async (deck: any) => {
                if (deck.id === 'custom') return deck.cards || [];
                
                const cachedData = await getDeckFromCache(deck.id);
                if (cachedData && cachedData.updatedAt >= (deck.updatedAt || 0)) {
                    return cachedData.cards;
                }

                const cardsRef = collection(db, 'artifacts', appId, 'decks', deck.id, 'cards');
                const snap = await getDocs(cardsRef);
                const loadedCards = snap.docs.map(doc => doc.data());
                
                await saveDeckToCache(deck.id, loadedCards, deck.updatedAt || 0);
                return loadedCards;
            });

            const statsPromises = folderDecks.map(async (deck: any) => {
                if (deck.id === 'custom') return [];
                const statsRef = collection(db, 'artifacts', appId, 'users', user?.uid, 'deck_progress', deck.id, 'card_stats');
                const snap = await getDocs(statsRef);
                return snap.docs.map(d => ({ id: d.id, ...d.data() }));
            });

            const [allResults, allStats] = await Promise.all([Promise.all(allPromises), Promise.all(statsPromises)]);
            
            const allCards = allResults.flat();
            
            const statsMap: Record<string, any> = {};
            allStats.flat().forEach((stat: any) => { statsMap[stat.id] = stat; });
            setCardStats(statsMap);

            if (allCards.length === 0) {
                setToastMsg("No cards found inside these decks.");
                setIsFetchingCards(false);
                return;
            }

            window.history.pushState({ view: 'menu' }, ''); 
            setOmniDeck({
                id: `omni_${folderName}`,
                title: `${folderName} (Omni-Mode)`,
                cards: allCards.sort(() => Math.random() - 0.5) 
            });
            setInternalMode('menu');
        } catch (err) {
            console.error("Omni-Fetch failed:", err);
            setToastMsg("Failed to compile Omni-Deck.");
        } finally {
            setIsFetchingCards(false);
        }
    };

    const handleSaveFromBuilder = async (cardData: any, folderToAssign: string | null) => {
        await onSaveCard(cardData.deckId, cardData);
        if (folderToAssign && onAssignToFolder) {
            await onAssignToFolder(cardData.deckId, folderToAssign);
        }
    };

    if (internalMode === 'create' && builderConfig) {
        return (
            <ContextualBuilder 
                config={builderConfig}
                onSave={handleSaveFromBuilder} 
                onCancel={(success?: boolean) => {
                    window.history.back();
                    if (success) setTimeout(() => setToastMsg(builderConfig.type === 'new_deck' ? "Deck Forged." : "Card Appended."), 100);
                }} 
            />
        );
    }

    if (internalMode === 'library') {

        const handleSaveNewFolder = async (folderName: string, color: string) => {
            if (!folderName.trim()) return;
            if (showFolderModal.editMode && onUpdateFolder) {
                await onUpdateFolder(showFolderModal.oldName, folderName.trim(), color);
                setToastMsg("Folder updated.");
                if (deckFilter === showFolderModal.oldName) setDeckFilter(folderName.trim()); 
            } else if (onCreateFolder) {
                await onCreateFolder(folderName.trim(), color);
                setToastMsg(`Folder "${folderName.trim()}" created.`);
            }
            window.history.back(); 
        };

        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
                
                {showFolderModal.isOpen && (
                    <FolderModal 
                        initialName={showFolderModal.editMode ? showFolderModal.oldName : ''}
                        initialColor={showFolderModal.editMode ? folderColors[showFolderModal.oldName] : 'indigo'}
                        isEdit={showFolderModal.editMode}
                        onSave={handleSaveNewFolder}
                        onClose={() => window.history.back()}
                    />
                )}

                <div className="sticky top-0 z-30 w-full flex flex-col shrink-0">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-5 flex justify-between items-center pt-safe">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white p-2.5 rounded-xl shadow-md shadow-orange-500/20"><Library size={22} strokeWidth={3}/></div>
                            <span className="font-black text-slate-800 dark:text-white text-2xl uppercase tracking-tighter">Study Hub</span>
                        </div>
                        <button 
                            onClick={() => {
                                window.history.pushState({ view: 'create' }, ''); 
                                setBuilderConfig({ type: 'new_deck', folder: null });
                                setInternalMode('create');
                            }} 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} /> New Deck
                        </button>
                    </div>

                    <div ref={filterBarRef} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-2 overflow-x-auto custom-scrollbar overscroll-x-contain scroll-smooth">
                        <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
                        
                        {['all', 'created', 'downloaded', 'archived'].map((f: any) => (
                            <button 
                                key={f} 
                                onClick={() => {
                                    if (deckFilter === 'all') window.history.pushState({ view: 'folder' }, '');
                                    setDeckFilter(f);
                                }} 
                                data-active={deckFilter === f} 
                                className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${deckFilter === f ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                        
                        {localFolders.length > 0 && <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-2 shrink-0" />}
                        {localFolders.map((folderName: string) => {
                            const cTheme = FOLDER_COLORS[folderColors[folderName] || 'indigo'];
                            return (
                                <button 
                                    key={folderName} 
                                    onClick={() => {
                                        if (deckFilter === 'all') window.history.pushState({ view: 'folder' }, '');
                                        setDeckFilter(folderName);
                                    }} 
                                    data-active={deckFilter === folderName} 
                                    className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${deckFilter === folderName ? `${cTheme.hex} text-white shadow-md` : `${cTheme.bg} ${cTheme.textColor}`}`}
                                >
                                    <Folder size={12} fill="currentColor" /> {folderName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div 
                    ref={scrollContainerRef} 
                    onTouchStart={handleLibrarySwipeStart}
                    onTouchEnd={handleLibrarySwipeEnd}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-28 relative z-10 custom-scrollbar overscroll-y-contain h-full"
                >
                    <div className={`grid ${isDense ? 'grid-cols-3 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                        
                        {localFolders.includes(deckFilter) && (
                            <div className="col-span-full animate-in fade-in duration-300 mb-2 mt-2 px-2">
                                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors w-fit bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95">
                                    <ArrowLeft size={14} /> Back to Library
                                </button>
                                
                                <div className="flex items-center gap-3 mt-6 mb-4">
                                    <FolderOpen size={28} className={FOLDER_COLORS[folderColors[deckFilter] || 'indigo'].textColor} />
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{deckFilter}</h2>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            window.history.pushState({ view: 'create' }, ''); 
                                            setBuilderConfig({ type: 'new_deck', folder: deckFilter });
                                            setInternalMode('create');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all hover:border-indigo-200"
                                    >
                                        <Plus size={16} /> New Deck
                                    </button>
                                    <button 
                                        onClick={() => launchOmniMode(deckFilter)}
                                        disabled={isFetchingCards}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all disabled:opacity-50 ${FOLDER_COLORS[folderColors[deckFilter] || 'indigo'].hex}`}
                                    >
                                        {isFetchingCards ? <Loader2 size={16} className="animate-spin" /> : <Infinity size={16} />} 
                                        Omni-Study
                                    </button>
                                </div>
                            </div>
                        )}

                        {deckFilter === 'all' && localFolders.map((folderName: string) => {
                            const itemCount = Object.keys(allDecks).filter(key => userData?.deckPrefs?.[key]?.folder === folderName && !userData?.deckPrefs?.[key]?.archived).length;
                            const theme = FOLDER_COLORS[folderColors[folderName] || 'indigo'];
                            
                            const isDragged = draggedItem?.id === folderName;
                            const isGap = dragOverGapId === folderName && draggedItem?.type === 'folder';
                            const isCatchingDeck = dragOverFolderCatch === folderName && draggedItem?.type === 'deck';
                            
                            return (
                                <div 
                                    key={`folder-${folderName}`} 
                                    className={`relative group transition-all duration-300 h-full ${
                                        isDragged ? 'opacity-40 scale-95 z-0' : 'z-10'
                                    } ${
                                        isGap ? 'translate-x-4 scale-[0.90] opacity-60 border-indigo-300 dark:border-indigo-700' : ''
                                    } ${
                                        isCatchingDeck ? 'scale-105 ring-4 ring-indigo-500 shadow-xl' : ''
                                    }`}
                                    draggable={true}
                                    onDragStart={(e) => {
                                        setDraggedItem({ id: folderName, type: 'folder' });
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragEnd={() => {
                                        setDraggedItem(null);
                                        setDragOverGapId(null);
                                        setDragOverFolderCatch(null);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedItem?.type === 'folder' && draggedItem.id !== folderName) {
                                            setDragOverGapId(folderName);
                                        } else if (draggedItem?.type === 'deck') {
                                            setDragOverFolderCatch(folderName);
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverGapId === folderName) setDragOverGapId(null);
                                        if (dragOverFolderCatch === folderName) setDragOverFolderCatch(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedItem?.type === 'folder') {
                                            const draggedIdx = localFolders.indexOf(draggedItem.id);
                                            const targetIdx = localFolders.indexOf(folderName);
                                            if (draggedIdx !== -1 && targetIdx !== -1) {
                                                const newFolders = [...localFolders];
                                                newFolders.splice(draggedIdx, 1);
                                                newFolders.splice(targetIdx, 0, draggedItem.id);
                                                setLocalFolders(newFolders);
                                                if (onReorderFolders) onReorderFolders(newFolders); 
                                            }
                                        } else if (draggedItem?.type === 'deck') {
                                            if (onAssignToFolder) onAssignToFolder(draggedItem.id, folderName);
                                            setToastMsg(`Moved to ${folderName}`);
                                        }
                                        setDraggedItem(null);
                                        setDragOverGapId(null);
                                        setDragOverFolderCatch(null);
                                    }}
                                >
                                    <button 
                                        onClick={() => {
                                            window.history.pushState({ view: 'folder' }, '');
                                            setDeckFilter(folderName);
                                        }} 
                                        className={`w-full bg-white dark:bg-slate-900 rounded-[2rem] ${isDense ? 'p-4 sm:p-5' : 'p-5'} border-2 border-slate-100 dark:border-slate-800 transition-all text-left flex flex-col h-full relative cursor-grab active:cursor-grabbing ${!isGap && !isCatchingDeck ? `hover:-translate-y-1 shadow-sm hover:shadow-xl ${theme.hover}` : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4 pointer-events-none">
                                            <div className={`${isDense ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'} ${theme.iconBg} ${theme.iconColor} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                                                <Folder size={isDense ? 20 : 24} fill="currentColor" className={isCatchingDeck ? 'animate-bounce' : ''} />
                                            </div>
                                        </div>
                                        <h3 className={`font-black ${theme.text} ${isDense ? 'text-sm' : 'text-base'} leading-snug line-clamp-3 pr-4 mb-auto pointer-events-none`}>{folderName}</h3>
                                        <div className="mt-3 pointer-events-none">
                                            <span className={`text-[9px] uppercase font-black tracking-widest ${theme.badge} px-2.5 py-1 rounded-md shadow-sm`}>
                                                {itemCount} Decks
                                            </span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault(); e.stopPropagation(); 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsFolder(folderName);
                                        }}
                                        className={`absolute ${isDense ? 'top-3 right-2' : 'top-3 right-3'} p-2 rounded-full ${theme.iconColor} hover:bg-white/50 transition-colors active:bg-white/80 z-20`}
                                        aria-label="Folder Options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            );
                        })}

                        {localDecks.length === 0 && deckFilter !== 'all' && localFolders.includes(deckFilter) && (
                             <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] mt-4 text-slate-400 font-bold text-sm uppercase tracking-widest flex flex-col items-center gap-3">
                                 <FolderPlus size={32} className="opacity-20" />
                                 Folder is empty
                             </div>
                        )}

                        {localDecks.map(([key, deck]: any) => {
                            const displayTitle = deck.id === 'custom' ? "My Study Cards" : deck.title;
                            const theme = getDeckTheme(displayTitle);
                            const DeckIcon = deck.icon || theme.icon;
                            const cardCount = deck.id === 'custom' ? (deck.cards?.length || 0) : (deck.stats?.cardCount || 0);
                            
                            // 🔥 GRAB THE LANGUAGES (Fallback to empty array if none)
                            const languages = deck.languages || [];
                            
                            const isDragged = draggedItem?.id === key;
                            const isGap = dragOverGapId === key && draggedItem?.type === 'deck';

                            return (
                                <div 
                                    key={key} 
                                    className={`relative group transition-all duration-300 h-full pt-3 ${
                                        isDragged ? 'opacity-40 scale-95 z-0' : 'z-10'
                                    } ${
                                        isGap ? 'scale-[0.90] translate-x-6 opacity-50 blur-[1px] border-indigo-300 dark:border-indigo-700' : ''
                                    }`}
                                    draggable={true}
                                    onDragStart={(e) => {
                                        setDraggedItem({ id: key, type: 'deck' });
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragEnd={() => {
                                        setDraggedItem(null);
                                        setDragOverGapId(null);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedItem?.type === 'deck' && draggedItem.id !== key) {
                                            setDragOverGapId(key);
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverGapId === key) setDragOverGapId(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedItem?.type === 'deck') {
                                            const draggedIdx = localDecks.findIndex(d => d[0] === draggedItem.id);
                                            const targetIdx = localDecks.findIndex(d => d[0] === key);
                                            if (draggedIdx !== -1 && targetIdx !== -1) {
                                                const newDecks = [...localDecks];
                                                const [removed] = newDecks.splice(draggedIdx, 1);
                                                newDecks.splice(targetIdx, 0, removed);
                                                setLocalDecks(newDecks);
                                                if (onReorderDecks) onReorderDecks(newDecks.map(d => d[0]));
                                            }
                                        }
                                        setDraggedItem(null);
                                        setDragOverGapId(null);
                                    }}
                                >
                                    {/* 🔥 VISUALS: THE DECK STACK EFFECT */}
                                    <div className="absolute inset-x-3 top-1 bottom-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200 dark:border-slate-700 -rotate-2 transition-transform duration-300 group-hover:-rotate-3 group-hover:translate-y-1 pointer-events-none" />
                                    <div className="absolute inset-x-1.5 top-2 bottom-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-[2rem] border border-slate-200 dark:border-slate-700 rotate-1 transition-transform duration-300 group-hover:rotate-2 group-hover:translate-y-0.5 pointer-events-none" />

                                    <button 
                                        onClick={() => { 
                                            window.history.pushState({ view: 'menu' }, ''); 
                                            onSelectDeck(key); 
                                            setInternalMode('menu'); 
                                        }} 
                                        className={`w-full h-full bg-white dark:bg-slate-900 rounded-[2rem] ${isDense ? 'p-4 sm:p-5' : 'p-5'} border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left shadow-sm relative z-10 flex flex-col cursor-grab active:cursor-grabbing ${!isGap ? 'group-hover:-translate-y-1' : ''}`}
                                    > 
                                        <div className={`flex justify-between items-start ${isDense ? 'mb-3' : 'mb-4'} pointer-events-none`}>
                                            <div className={`${isDense ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-[1rem]'} flex items-center justify-center text-white text-xl border shadow-inner transition-transform bg-gradient-to-br ${theme.gradient} ${theme.shadow} group-hover:scale-110`}>
                                                {typeof DeckIcon === 'string' ? DeckIcon : <DeckIcon size={isDense ? 20 : 24}/>}
                                            </div>

                                            {/* 🔥 LANGUAGE BUBBLES */}
                                            {languages.length > 0 && (
                                                <div className="flex flex-wrap justify-end gap-1 mr-6 mt-1">
                                                    {languages.map((lang: string, idx: number) => (
                                                        <span key={idx} className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                            {lang.substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h3 className={`font-black text-slate-800 dark:text-white ${isDense ? 'text-sm' : 'text-base'} leading-snug line-clamp-3 pr-4 mb-2 pointer-events-none`}>{displayTitle}</h3>
                                        
                                        <div className="mt-auto pt-1 flex flex-col gap-2 pointer-events-none">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1">
                                                    <Layers size={10} /> {cardCount}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault(); e.stopPropagation(); 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsDeck(deck);
                                            setMenuView('main'); 
                                        }}
                                        className={`absolute ${isDense ? 'top-3 right-1' : 'top-4 right-2'} p-2 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20`}
                                        aria-label="Deck Options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {activeOptionsFolder && (
                    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => window.history.back()} />
                        <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe-6">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${FOLDER_COLORS[folderColors[activeOptionsFolder] || 'indigo'].bg} ${FOLDER_COLORS[folderColors[activeOptionsFolder] || 'indigo'].iconColor}`}>
                                    <Folder size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight line-clamp-1">{activeOptionsFolder}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Folder Settings</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button 
                                    onClick={() => { 
                                        window.history.pushState({ view: 'modal' }, '');
                                        setActiveOptionsFolder(null); 
                                        setShowFolderModal({isOpen: true, editMode: true, oldName: activeOptionsFolder}); 
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Edit3 size={20} className="text-indigo-500" /> Edit Folder
                                </button>
                                <button 
                                    onClick={() => { 
                                        window.history.back(); 
                                        setTimeout(() => launchOmniMode(activeOptionsFolder), 50); 
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Infinity size={20} className="text-emerald-500" /> Study Omni-Mode
                                </button>
                                <div className="h-4" />
                                <button 
                                    onClick={() => { 
                                        window.history.back(); 
                                        setTimeout(() => {
                                            if(onDeleteFolder) onDeleteFolder(activeOptionsFolder); 
                                            setToastMsg("Folder deleted."); 
                                        }, 50);
                                    }} 
                                    className="w-full text-left px-5 py-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                >
                                    <Trash2 size={20} /> Delete Folder
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeOptionsDeck && (
                    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => window.history.back()} />
                        <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe-6">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
                            <div className="flex items-center gap-4 mb-6 px-2">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    {activeOptionsDeck.icon || <Layers size={24} className="text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight line-clamp-1">
                                        {activeOptionsDeck.id === 'custom' ? "My Study Cards" : activeOptionsDeck.title}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deck Options</p>
                                </div>
                            </div>

                            {menuView === 'main' ? (
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setMenuView('folders')} 
                                        className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center transition-colors active:scale-[0.98]"
                                    >
                                        <span className="flex items-center gap-3"><FolderPlus size={20} className="text-indigo-500" /> Move to Folder</span>
                                        <ChevronRight size={18} className="text-slate-400" />
                                    </button>
                                    {onToggleArchive && (
                                        <button 
                                            onClick={() => { 
                                                window.history.back(); 
                                                setTimeout(() => onToggleArchive(activeOptionsDeck.id, userData?.deckPrefs?.[activeOptionsDeck.id]?.archived || false), 50); 
                                            }} 
                                            className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                        >
                                            <Archive size={20} className="text-amber-500" /> 
                                            {userData?.deckPrefs?.[activeOptionsDeck.id]?.archived ? 'Unarchive Deck' : 'Archive Deck'}
                                        </button>
                                    )}
                                    <div className="h-4" />
                                    <button 
                                        onClick={() => { 
                                            window.history.back(); 
                                            setTimeout(() => {
                                                if (onHideDeck) onHideDeck(activeOptionsDeck.id);
                                                setToastMsg("Deck banished."); 
                                            }, 50);
                                        }} 
                                        className="w-full text-left px-5 py-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Trash2 size={20} /> Remove Deck
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button onClick={() => setMenuView('main')} className="px-3 py-3 w-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mb-2">
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                        <button 
                                            onClick={() => { 
                                                window.history.back(); 
                                                setTimeout(() => { onAssignToFolder(activeOptionsDeck.id, null); setToastMsg("Removed from folder."); }, 50);
                                            }}
                                            className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all active:scale-[0.98] ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === null || !userData?.deckPrefs?.[activeOptionsDeck.id]?.folder ? 'bg-indigo-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600'}`} />
                                            None (Main Library)
                                        </button>

                                        {localFolders.map(folderName => (
                                            <button 
                                                key={folderName}
                                                onClick={() => { 
                                                    window.history.back(); 
                                                    setTimeout(() => { onAssignToFolder(activeOptionsDeck.id, folderName); setToastMsg(`Moved to ${folderName}`); }, 50); 
                                                }}
                                                className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all active:scale-[0.98] ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'bg-indigo-500 shadow-sm' : 'border-2 border-slate-300 dark:border-slate-600'}`} />
                                                <FolderOpen size={18} className={userData?.deckPrefs?.[activeOptionsDeck.id]?.folder === folderName ? 'text-indigo-500' : 'text-slate-400'} />
                                                {folderName}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-4" />
                                    <button 
                                        onClick={() => { 
                                            window.history.pushState({ view: 'modal' }, '');
                                            setActiveOptionsDeck(null); 
                                            setShowFolderModal({isOpen: true, editMode: false, oldName: ''}); 
                                        }}
                                        className="w-full text-left px-5 py-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-3 transition-colors active:scale-[0.98]"
                                    >
                                        <Plus size={20} strokeWidth={3} /> Create New Folder
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (internalMode === 'menu') {
        const displayMenuTitle = deckTitle.includes('(Omni-Mode)') ? deckTitle.replace(' (Omni-Mode)', '') : deckTitle;
        
        return (
            <div 
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleMenuSwipeEnd}
                className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors"
            >
                <div className="px-6 pt-8 pb-4">
                    <button onClick={() => window.history.back()} className="flex items-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 mb-6 text-xs font-black uppercase tracking-widest transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm w-fit active:scale-95">
                        <ArrowLeft size={16} className="mr-2"/> Back
                    </button>
                    
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{displayMenuTitle}</h1>
                        {!omniDeck && (
                            <button 
                                onClick={() => {
                                    window.history.pushState({ view: 'create' }, '');
                                    setBuilderConfig({ type: 'add_card', deck: resolvedDeck });
                                    setInternalMode('create');
                                }} 
                                className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/30 active:scale-95 transition-all"
                            >
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        )}
                    </div>
                    
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2 w-fit mt-3 transition-colors ${
                        isFetchingCards ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                        dueCards.length === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                    }`}>
                        {isFetchingCards ? (
                            <><Loader2 size={12} className="animate-spin" /> Calculating Matrix...</>
                        ) : dueCards.length === 0 ? (
                            <><CheckCircle2 size={12} /> All Caught Up • {cards.length} Total</>
                        ) : (
                            <><BrainCircuit size={12} className="animate-pulse" /> {dueCards.length} Due for Review • {cards.length} Total</>
                        )}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                    {isFetchingCards ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
                            <p className="font-black uppercase tracking-widest text-slate-500 text-xs">Decrypting Cards...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => launchGame('standard')} 
                                className={`p-6 rounded-[2.5rem] border-[3px] shadow-sm hover:-translate-y-1 transition-all group text-left ${
                                    dueCards.length > 0 
                                        ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50' 
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform ${dueCards.length > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
                                    {dueCards.length > 0 ? <BrainCircuit size={28}/> : <Layers size={28}/>}
                                </div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">
                                    {dueCards.length > 0 ? 'Review Due' : 'Browse Deck'}
                                </h4>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${dueCards.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {dueCards.length > 0 ? 'Spaced Repetition' : 'Standard Mode'}
                                </p>
                            </button>

                            <button onClick={() => launchGame('quiz')} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:-translate-y-1 transition-all group text-left">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-6 transition-transform"><HelpCircle size={28}/></div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">Quiz</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Multiple Choice</p>
                            </button>

                            <button onClick={() => launchGame('match')} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-100 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-1 transition-all group text-left">
                                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform"><Puzzle size={28}/></div>
                                <h4 className="font-black text-slate-800 dark:text-white text-xl leading-none mb-2">Match</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Speed Pairs</p>
                            </button>

                            <button className="bg-slate-900 p-6 rounded-[2.5rem] border-[3px] border-slate-800 shadow-xl opacity-50 cursor-not-allowed group text-left relative overflow-hidden">
                                <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-4"><Flame size={28} fill="currentColor"/></div>
                                <h4 className="font-black text-white text-xl leading-none mb-2">Tower</h4>
                                <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Survival</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div 
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleMenuSwipeEnd}
            className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-bottom-8 duration-500 relative z-[100] transition-colors pb-safe"
        >
            <div className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <button onClick={() => window.history.back()} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} strokeWidth={3}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-0.5">{activeGame} Protocol</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{deckTitle}</span>
                </div>
                <div className="w-11"></div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {activeGame === 'standard' && <StudyModePlayer deckCards={sessionCards} initialSrbData={cardStats} setParentCardStats={setCardStats} user={user} userData={userData} onToggleStar={onToggleStar} deckId={selectedDeckKey} onFinish={handleGameFinish} />}
                {activeGame === 'quiz' && <div className="h-full overflow-y-auto"><QuizSessionView deckCards={sessionCards} onGameEnd={(res: any) => handleGameFinish(res.score ? (res.score/res.total)*100 : 0)} /></div>}
                {activeGame === 'match' && <div className="h-full overflow-y-auto pt-6"><MatchingGame deckCards={sessionCards} onGameEnd={(scorePct: number) => handleGameFinish(scorePct)} /></div>}
            </div>
        </div>
    );
}

function FolderModal({ initialName, initialColor, isEdit, onSave, onClose }: any) {
    const [name, setName] = useState(initialName || '');
    const [color, setColor] = useState(initialColor || 'indigo');

    return (
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-6 text-center">
                {isEdit ? 'Edit Folder' : 'New Folder'}
            </h3>
            <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Midterm Prep"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-800 dark:text-white focus:border-indigo-500 outline-none mb-6 text-lg text-center"
                autoFocus
            />
            <div className="mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3 text-center">Select Theme Color</span>
                <div className="flex justify-center gap-3">
                    {Object.keys(FOLDER_COLORS).map(c => (
                        <button 
                            key={c} 
                            onClick={(e) => { e.preventDefault(); setColor(c); }}
                            className={`w-8 h-8 rounded-full shadow-sm transition-all active:scale-90 ${FOLDER_COLORS[c].hex} ${color === c ? 'ring-4 ring-indigo-500/30 scale-110' : 'ring-2 ring-transparent opacity-70 hover:opacity-100'}`} 
                        />
                    ))}
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={(e) => { e.preventDefault(); onClose(); }} className="flex-1 px-4 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
                <button onClick={(e) => { e.preventDefault(); onSave(name, color); }} disabled={!name.trim()} className="flex-1 px-4 py-4 rounded-2xl font-black text-white bg-indigo-600 disabled:bg-indigo-400 active:scale-95 transition-all">Save</button>
            </div>
        </div>
    );
}
