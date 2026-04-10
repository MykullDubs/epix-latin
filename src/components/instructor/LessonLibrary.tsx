// src/components/instructor/LessonLibrary.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, BookOpen, Clock, Play, PenTool, Trash2, 
    ArrowLeft, Filter, Plus, Zap, MoreVertical
} from 'lucide-react';

export default function LessonLibrary({ 
    lessons, 
    onNavigateBack, 
    onEditLesson, 
    onPlayLesson, 
    onDeleteLesson,
    onCreateNew
}: any) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z'>('newest');

    // Filter and Sort Logic
    const filteredAndSortedLessons = useMemo(() => {
        let result = [...(lessons || [])];

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(l => 
                (l.title || '').toLowerCase().includes(query) || 
                (l.subtitle || '').toLowerCase().includes(query)
            );
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'a-z') {
                return (a.title || '').localeCompare(b.title || '');
            }
            // Fallback to timestamp sorting (assuming they have an updatedAt or id timestamp)
            const timeA = a.updatedAt || a.createdAt || 0;
            const timeB = b.updatedAt || b.createdAt || 0;
            return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [lessons, searchQuery, sortBy]);

    // Helper to grab the hero image just like the Lobby does
    const getHeroImage = (lesson: any) => {
        if (!lesson?.blocks) return null;
        const imgBlock = lesson.blocks.find((b: any) => String(b.type) === 'image');
        return imgBlock ? (imgBlock.url || imgBlock.imageUrl) : null;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in duration-500">
            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onNavigateBack}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-md">
                                <BookOpen size={20} />
                            </div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest hidden sm:block">
                                Lesson Library
                            </h1>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your lessons..."
                                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none transition-all shadow-inner"
                            />
                        </div>
                        
                        <div className="relative hidden md:block">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="a-z">Alphabetical</option>
                            </select>
                            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <button 
                        onClick={onCreateNew}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
                    >
                        <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">New Lesson</span>
                    </button>
                </div>
            </header>

            {/* MAIN GRID */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
                {filteredAndSortedLessons.length === 0 ? (
                    <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                            <Search className="text-slate-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-2">No lessons found</h2>
                        <p className="text-slate-500 font-medium max-w-md mb-8">
                            {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : "Your library is empty. Let's create your first interactive lesson!"}
                        </p>
                        {!searchQuery && (
                            <button 
                                onClick={onCreateNew}
                                className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:-translate-y-1 transition-all"
                            >
                                <Zap size={20} fill="currentColor" /> Generate with AI
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAndSortedLessons.map((lesson: any, i: number) => {
                            const heroImg = getHeroImage(lesson);
                            const blockCount = Array.isArray(lesson.blocks) ? lesson.blocks.length : 0;
                            
                            return (
                                <div 
                                    key={lesson.id || i} 
                                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    {/* IMAGE HEADER */}
                                    <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                        {heroImg ? (
                                            <img src={heroImg} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-105 transition-transform duration-700">
                                                <BookOpen size={48} strokeWidth={1} />
                                            </div>
                                        )}
                                        
                                        {/* QUICK PLAY OVERLAY */}
                                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onPlayLesson(lesson.id); }}
                                                className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <Play size={24} fill="currentColor" className="ml-1" />
                                            </button>
                                        </div>

                                        <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-lg">
                                            <Layers size={12} /> {blockCount} Blocks
                                        </div>
                                    </div>

                                    {/* CARD BODY */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
                                            {lesson.title || 'Untitled Lesson'}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1">
                                            {lesson.subtitle || 'No description provided.'}
                                        </p>

                                        {/* ACTIONS FOOTER */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={12} /> 
                                                {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString() : 'Recently'}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEditLesson(lesson.id); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
                                                    title="Edit Lesson"
                                                >
                                                    <PenTool size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors"
                                                    title="Delete Lesson"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

// Keep this local import if Layers isn't exported above
import { Layers } from 'lucide-react';
