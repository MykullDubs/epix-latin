// src/components/instructor/LessonLibrary.tsx
import React, { useState, useMemo } from 'react';
import { 
    Search, BookOpen, Clock, Play, PenTool, Trash2, 
    ArrowLeft, Filter, Plus, Zap, MoreVertical, ChevronDown, Layers
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
            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex items-center shrink-0 z-40 shadow-sm transition-colors duration-300">
                <button 
                    onClick={onNavigateBack}
                    className="p-2 mr-4 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                    aria-label="Go Back"
                >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Lesson Library</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Manage and organize your interactive modules</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="relative hidden md:block">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search library..."
                            className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition-all shadow-sm w-64"
                        />
                    </div>
                    
                    <div className="relative hidden sm:block">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="a-z">A-Z</option>
                        </select>
                        <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                        onClick={onCreateNew}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={2.5} /> <span className="hidden lg:inline">Create New</span>
                    </button>
                </div>
            </header>

            {/* MAIN GRID */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
                {/* Mobile Search/Filter Row */}
                <div className="flex flex-col sm:hidden gap-3 mb-8">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search library..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-sm cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="a-z">Alphabetical</option>
                        </select>
                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {filteredAndSortedLessons.length === 0 ? (
                    <div className="w-full h-[50vh] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 select-none">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                            <Search className="text-slate-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No modules found</h2>
                        <p className="text-sm font-medium text-slate-500 max-w-sm mb-8 leading-relaxed">
                            {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : "Your library is empty. Let's create your first interactive lesson!"}
                        </p>
                        {!searchQuery && (
                            <button 
                                onClick={onCreateNew}
                                className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                <Zap size={18} fill="currentColor" /> Generate with AI
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
                                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex flex-col select-none cursor-pointer"
                                    style={{ animationDelay: `${i * 30}ms` }}
                                    onClick={() => onEditLesson(lesson.id)}
                                >
                                    {/* IMAGE HEADER */}
                                    <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                                        {heroImg ? (
                                            <img src={heroImg} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-105 transition-transform duration-700">
                                                <BookOpen size={40} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        
                                        {/* QUICK PLAY OVERLAY */}
                                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onPlayLesson(lesson.id); }}
                                                className="w-14 h-14 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                                title="Preview Module"
                                            >
                                                <Play size={24} fill="currentColor" className="ml-1" />
                                            </button>
                                        </div>

                                        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                            <Layers size={12} /> {blockCount}
                                        </div>
                                    </div>

                                    {/* CARD BODY */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1.5 line-clamp-2">
                                            {lesson.title || 'Untitled Lesson'}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1 leading-relaxed">
                                            {lesson.subtitle || 'No description provided.'}
                                        </p>

                                        {/* ACTIONS FOOTER */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock size={12} /> 
                                                {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString() : 'Recently'}
                                            </span>

                                            <div className="flex items-center gap-1 -mr-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEditLesson(lesson.id); }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Edit Lesson"
                                                >
                                                    <PenTool size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
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
