// src/components/DiscoveryView.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, Sparkles, BarChart3, ArrowDown, Star, Gamepad2, 
    BookOpen, Layers, Globe, Target, Check, Zap, Map, Trophy, ChevronRight 
} from 'lucide-react';

// ============================================================================
//  SUB-COMPONENTS (With Dynamic Type Styling)
// ============================================================================

// Helper to get visual theme based on content type
const getTypeStyles = (type: string) => {
    switch(type) {
        case 'arcade': return { 
            bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600', hover: 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500', 
            icon: Gamepad2, label: 'Arcade Game', border: 'border-amber-200' 
        };
        case 'deck': return { 
            bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600', hover: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500', 
            icon: Layers, label: 'Practice Deck', border: 'border-rose-200' 
        };
        default: return { // Lesson
            bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500', 
            icon: BookOpen, label: 'Standard Unit', border: 'border-indigo-200' 
        };
    }
};

const DeckGroup = ({ title, items, onClick, icon }: any) => (
    <div>
        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">{icon} {title}</h4>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 custom-scrollbar snap-x">
            {items.map((item: any) => <DiscoveryCard key={item.id} item={item} onClick={() => onClick(item)} compact />)}
        </div>
    </div>
);

const DiscoveryCard = ({ item, onClick, compact = false }: any) => {
    const style = getTypeStyles(item.contentType);
    const Icon = style.icon;

    return (
        <button 
            onClick={onClick} 
            className={`snap-start bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col overflow-hidden ${compact ? 'min-w-[240px] max-w-[240px] h-48' : 'h-56'}`}
        >
            {/* Top Half (Title & Meta) */}
            <div className="p-5 flex-1 w-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300 ${style.bg} ${style.text} ${style.hover} shadow-inner`}>
                        <Icon size={24}/>
                    </div>
                    {item.contentType === 'arcade' && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md animate-pulse">
                            <Zap size={10} className="fill-amber-500" /> Hot
                        </span>
                    )}
                </div>
                <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
            </div>

            {/* Bottom Glassmorphism Bar */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-slate-400"/>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[100px]">{item.targetLanguage || 'General'}</p>
                </div>
                
                {/* The Call to Action Pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${style.bg} ${style.text}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
                    <ChevronRight size={12} strokeWidth={3} />
                </div>
            </div>
        </button>
    );
};

// ============================================================================
//  STUDENT DISCOVERY VIEW (Baptized in Juice)
// ============================================================================
export default function DiscoveryView({ allDecks, lessons, user, onSelectDeck, onSelectLesson, onLogActivity, userData }: any) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortMode, setSortMode] = useState<'relevance' | 'size' | 'alpha'>('relevance');

    // --- 1. THE FUZZY BRAIN ---
    const { processedItems, categories, difficultyGroups } = useMemo(() => {
        
        // A. Normalize Decks (ROSE THEME)
        const deckEntries = Object.entries(allDecks || {})
            .filter(([, deck]: any) => !deck.isAssignment)
            .map(([id, deck]: any) => ({
                id,
                ...deck,
                contentType: 'deck',
                magnitude: (deck.cards?.length || 0), 
                displayCount: `${deck.cards?.length || 0} Cards`,
                _searchStr: `${deck.title} ${deck.targetLanguage || ''} ${deck.description || ''} vocab flashcards`.toLowerCase()
            }));

        // B. Normalize Lessons & Arcade Games (INDIGO & AMBER THEMES)
        const lessonEntries = (lessons || [])
            .map((lesson: any) => ({
                ...lesson,
                contentType: lesson.type === 'arcade_game' ? 'arcade' : 'lesson',
                magnitude: (lesson.blocks?.length || 0) * 3, 
                displayCount: lesson.type === 'arcade_game' ? `Target: ${lesson.targetScore} Pts` : `${lesson.blocks?.length || 0} Blocks`,
                _searchStr: `${lesson.title} ${lesson.subtitle || ''} ${lesson.description || ''} ${lesson.type === 'arcade_game' ? 'game arcade' : 'reading lesson'}`.toLowerCase()
            }));

        // C. Merge
        let entries = [...deckEntries, ...lessonEntries];

        // D. Extract Categories
        const uniqueLangs = Array.from(new Set(entries.map((d: any) => d.targetLanguage || 'General')));
        const cats = ['All', ...uniqueLangs];

        // E. Filter Logic
        if (activeCategory !== 'All') {
            entries = entries.filter((d: any) => (d.targetLanguage || 'General') === activeCategory);
        }

        // F. Fuzzy Search Scoring
        if (searchTerm.trim()) {
            const tokens = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
            entries = entries.map((d: any) => {
                let score = 0;
                if (d.title.toLowerCase().includes(searchTerm.toLowerCase())) score += 10;
                tokens.forEach(token => { if (d._searchStr.includes(token)) score += 2; });
                return { ...d, _score: score };
            }).filter((d: any) => d._score > 0);
        } else {
            entries = entries.map((d: any) => ({ ...d, _score: Math.random() }));
        }

        // G. Sorting Logic
        entries.sort((a: any, b: any) => {
            if (sortMode === 'size') return b.magnitude - a.magnitude;
            if (sortMode === 'alpha') return a.title.localeCompare(b.title);
            return b._score - a._score;
        });

        const groups = {
            quick: entries.filter((d: any) => d.magnitude < 10),
            standard: entries.filter((d: any) => d.magnitude >= 10 && d.magnitude < 30),
            master: entries.filter((d: any) => d.magnitude >= 30)
        };

        return { processedItems: entries, categories: cats, difficultyGroups: groups };
    }, [allDecks, lessons, searchTerm, activeCategory, sortMode]);

    // --- 2. LIVE DAILY QUEST DATA ---
    const todayStr = new Date().toDateString();
    const isToday = userData?.lastActivityDate === todayStr;
    const todayXp = isToday ? (userData?.dailyXp || 0) : 0;
    const todayLessons = isToday ? (userData?.dailyLessons || 0) : 0;

    const quests = [
        { id: 'q_cards', label: "Earn 50 Daily XP", target: 50, current: Math.min(todayXp, 50), xp: 50, icon: <Zap size={14}/> },
        { id: 'q_quiz',  label: "Complete 1 Unit", target: 1, current: Math.min(todayLessons, 1), xp: 100, icon: <BookOpen size={14}/> },
    ].map(q => ({
        ...q,
        done: q.current >= q.target,
        percent: Math.min(100, (q.current / q.target) * 100)
    }));

    // Calculate hours remaining until midnight for the reset label
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const hoursRemaining = Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

    // Handler
    const handleItemClick = (item: any) => {
        if (onLogActivity) onLogActivity(`explore_${item.contentType}`, 0, "Exploration");
        
        if (item.contentType === 'lesson' || item.contentType === 'arcade') {
            onSelectLesson(item);
        } else {
            onSelectDeck(item);
        }
    };

    const isSearching = searchTerm.length > 0;

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500">
            
            {/* ============================================================== */}
            {/* FLOATING HEADER AREA */}
            {/* ============================================================== */}
            <div className="px-6 pt-12 pb-4 bg-slate-50/80 backdrop-blur-2xl z-20 sticky top-0 transition-all">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-100 px-2 py-1 rounded-md mb-2 inline-block">Curriculum Library</span>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-2 tracking-tighter leading-none">
                            Explore
                        </h1>
                    </div>
                    
                    <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        <button onClick={() => setSortMode('relevance')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'relevance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="Smart Sort"><Sparkles size={16}/></button>
                        <button onClick={() => setSortMode('size')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'size' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="Sort by Size"><BarChart3 size={16}/></button>
                        <button onClick={() => setSortMode('alpha')} className={`p-2.5 rounded-xl transition-all active:scale-95 ${sortMode === 'alpha' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`} title="A-Z"><ArrowDown size={16}/></button>
                    </div>
                </div>
                
                {/* Search Bar - Deeply Interactive */}
                <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-[1.5rem] blur-xl group-focus-within:bg-indigo-500/20 transition-all duration-500" />
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Find a game, unit, or deck..." 
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 focus:border-indigo-500/50 rounded-[1.5rem] font-black text-slate-700 placeholder:text-slate-300 placeholder:font-bold focus:ring-0 outline-none transition-all shadow-sm focus:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Squishy Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 custom-scrollbar snap-x">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)} 
                            className={`snap-start px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-90 border-2 ${
                                activeCategory === cat 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============================================================== */}
            {/* SCROLLABLE MAIN CONTENT */}
            {/* ============================================================== */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                
                {/* 1. MARKETING SECTION (Only shows when not searching) */}
                {!isSearching && activeCategory === 'All' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* THE GLOWING SPOTLIGHT HERO */}
                        {processedItems.length > 0 && (
                            <div className="px-6 mb-10 mt-2">
                                <button 
                                    onClick={() => handleItemClick(processedItems[0])} 
                                    className="w-full relative h-64 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10 group text-left transition-transform active:scale-[0.97]"
                                >
                                    {/* Dynamic Background based on content type */}
                                    <div className={`absolute inset-0 transition-transform duration-1000 group-hover:scale-105 ${
                                        processedItems[0].contentType === 'arcade' ? 'bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-500' :
                                        processedItems[0].contentType === 'deck' ? 'bg-gradient-to-tr from-rose-500 via-pink-600 to-purple-600' :
                                        'bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500'
                                    }`} />
                                    
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                                    
                                    {/* Dynamic Badge */}
                                    <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-xl border border-white/30 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                        <Star size={12} className="fill-white" /> Featured
                                    </div>
                                    
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner">
                                                {processedItems[0].contentType === 'arcade' ? <Gamepad2 size={24}/> : processedItems[0].contentType === 'lesson' ? <BookOpen size={24}/> : <Layers size={24}/>}
                                            </div>
                                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                                                {processedItems[0].contentType === 'arcade' ? 'Live Arcade' : processedItems[0].contentType === 'lesson' ? 'Unit' : 'Practice Deck'}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">{processedItems[0].title}</h2>
                                        <div className="flex items-center gap-3 text-white/80 text-xs font-bold">
                                            <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md"><Globe size={12}/> {processedItems[0].targetLanguage || 'General'}</span>
                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                                            <span>{processedItems[0].displayCount}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* GAMIFIED DAILY QUESTS */}
                        <div className="px-6 mb-12">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={18} className="text-rose-500"/> Daily Quests
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-2 py-1 rounded-md">Resets in {hoursRemaining}h</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {quests.map((q: any) => (
                                    <div key={q.id} className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${q.done ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-100'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${q.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400'}`}>
                                                    {q.done ? <Check size={20} strokeWidth={4}/> : q.icon}
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-black block ${q.done ? 'text-emerald-700' : 'text-slate-800'}`}>{q.label}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${q.done ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        {q.done ? 'Done' : `${q.current} / ${q.target} Completed`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Progress Bar for Incomplete Quests */}
                                        {!q.done && (
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${q.percent}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. DYNAMIC RESULTS GRID */}
                <div className="px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            {isSearching ? <Search size={18} className="text-indigo-500"/> : <Map size={18} className="text-indigo-500"/>} 
                            {isSearching ? `Found ${processedItems.length} Matches` : 'Browse Collection'}
                        </h3>
                    </div>

                    {sortMode === 'size' && !isSearching ? (
                        <div className="space-y-8">
                            {difficultyGroups.master.length > 0 && <DeckGroup title="Master Class (Long)" items={difficultyGroups.master} onClick={handleItemClick} icon={<Trophy size={18} className="text-yellow-500"/>}/>}
                            {difficultyGroups.standard.length > 0 && <DeckGroup title="Standard" items={difficultyGroups.standard} onClick={handleItemClick} icon={<Layers size={18} className="text-indigo-500"/>}/>}
                            {difficultyGroups.quick.length > 0 && <DeckGroup title="Quick Bites" items={difficultyGroups.quick} onClick={handleItemClick} icon={<Zap size={18} className="text-orange-500"/>}/>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {processedItems.map((item: any) => (
                                <DiscoveryCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {processedItems.length === 0 && (
                        <div className="text-center py-16 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 mt-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Search size={40}/>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Nothing found</h3>
                            <p className="text-slate-400 text-sm font-bold mb-6">Try adjusting your filters or searching for a different topic.</p>
                            <button onClick={() => {setSearchTerm(''); setActiveCategory('All');}} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
