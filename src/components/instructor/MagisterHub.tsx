// src/components/instructor/MagisterHub.tsx
import React, { useState, useMemo } from 'react';
import { 
    Wand2, MonitorPlay, Users, BookOpen, Plus, 
    Sparkles, Clock, ChevronRight, Play, MoreVertical, 
    Search, FolderOpen, Crown
} from 'lucide-react';

export default function MagisterHub({ 
    userData, 
    classes = [], 
    lessons = [], 
    onLaunchClass, 
    onLaunchContent, // 🔥 IMPORTED THE CONTENT LAUNCHER FOR SMARTBOARDS
    onOpenGenerator, 
    onNavigateToEditor, 
    onSwitchToAdvancedView 
}: any) {
    const [searchQuery, setSearchQuery] = useState('');

    // Extract initials for the avatar
    const userInitials = userData?.name 
        ? userData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
        : 'M';

    // Format dates to "2 days ago", "Yesterday", etc.
    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return 'Recently';
        const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    // Safely map and filter the live lessons data
    const activeLessons = useMemo(() => {
        return lessons
            .filter((l: any) => l.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
            .slice(0, 6); // Show top 6 most recent
    }, [lessons, searchQuery]);

    // Format upcoming classes
    const activeClasses = useMemo(() => {
        return classes.slice(0, 4); // Show top 4 active cohorts
    }, [classes]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
            
            {/* ── HEADER ── */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-[1rem] flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                        <span className="font-black text-xl">M</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-800">Magister<span className="text-indigo-600">OS</span></span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white transition-all w-64">
                        <Search size={16} className="text-slate-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search your library..." 
                            className="bg-transparent border-none outline-none text-sm font-medium w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden md:block" />
                    
                    <button 
                        onClick={onSwitchToAdvancedView}
                        className="flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 active:scale-95 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm border border-amber-200 cursor-pointer"
                    >
                        <Crown size={14} /> Pro Active
                    </button>

                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-black shadow-md">
                        {userInitials}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 pt-10">
                
                {/* ── WELCOME & QUICK ACTIONS ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                            Welcome back, {userData?.name?.split(' ')[0] || 'Instructor'}.
                        </h1>
                        <p className="text-slate-500 font-medium">
                            You have {activeClasses.length} active cohorts right now. What are we building today?
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={onOpenGenerator}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Wand2 size={18} /> Magic Generate Lesson
                        </button>
                        <button 
                            onClick={() => onNavigateToEditor('new')}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} /> Blank Canvas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* ── LEFT COLUMN: THE LIBRARY ── */}
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FolderOpen size={20} className="text-indigo-500" /> Recent Lessons
                            </h2>
                            <button onClick={onSwitchToAdvancedView} className="text-sm font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                                View Entire Library <ChevronRight size={16} />
                            </button>
                        </div>

                        {activeLessons.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
                                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-black text-slate-700 mb-2">No lessons found</h3>
                                <p className="text-slate-500 font-medium mb-6">You haven't created any curriculum yet.</p>
                                <button onClick={onOpenGenerator} className="text-indigo-600 font-bold hover:underline">
                                    Generate your first lesson with AI →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {activeLessons.map((lesson: any) => (
                                    <div key={lesson.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group flex flex-col cursor-pointer" onClick={() => onNavigateToEditor(lesson.id)}>
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest line-clamp-1 max-w-[120px]">
                                                    {lesson.subject || 'General'}
                                                </span>
                                                {lesson.generatedByAI && (
                                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <Sparkles size={10} /> AI
                                                    </span>
                                                )}
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onSwitchToAdvancedView(); }}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {lesson.title}
                                        </h3>
                                        
                                        <div className="mt-auto pt-6 flex items-center justify-between text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {lesson.cards?.length || 0} Slides</span>
                                            <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTimeAgo(lesson.updatedAt || lesson.createdAt)}</span>
                                        </div>
                                        
                                        {/* Quick Launch Hover Action */}
                                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex justify-center pointer-events-none">
                                            <button 
                                                // 🔥 NOW USING THE DEDICATED CONTENT LAUNCHER
                                                onClick={(e) => { e.stopPropagation(); onLaunchContent(lesson.id); }} 
                                                className="pointer-events-auto bg-slate-900 text-white w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-600 transition-colors"
                                            >
                                                <MonitorPlay size={14} /> Project to Smartboard
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: ACTIVE ROSTER ── */}
                    <div className="lg:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h2 className="text-xl font-black text-white flex items-center gap-2">
                                    <Users size={20} className="text-indigo-400" /> Active Cohorts
                                </h2>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {activeClasses.map((cohort: any) => (
                                    <div key={cohort.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl p-5 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-white text-sm line-clamp-1">{cohort.name}</h4>
                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                                <Users size={10} /> {cohort.students?.length || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-4">
                                            <Clock size={12} /> {cohort.schedule || 'Active Status'}
                                        </p>
                                        <button 
                                            // 🔥 USING THE CLASS LAUNCHER FOR COHORTS
                                            onClick={() => onLaunchClass(cohort.id)} 
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                                        >
                                            <Play size={14} fill="currentColor" /> Start Session
                                        </button>
                                    </div>
                                ))}

                                {activeClasses.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 font-medium text-sm">No cohorts created yet.</p>
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={onSwitchToAdvancedView} className="w-full mt-6 py-3 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 relative z-10">
                                <Plus size={16} /> Manage Roster
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
