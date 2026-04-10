// src/components/instructor/MagisterHub.tsx
import React, { useState, useMemo } from 'react';
import { 
    Wand2, MonitorPlay, Users, BookOpen, Plus, 
    Sparkles, Clock, ChevronRight, Play, MoreVertical, 
    Search, FolderOpen, Crown, PenTool, ArrowLeft,
    LogOut, Settings, User, Share2, Trash2
} from 'lucide-react';
import LiveSetupModal from './LiveSetupModal';
import BuilderHub from './BuilderHub'; 
import LessonLibrary from './LessonLibrary'; 
import CohortManagerModal from './CohortManagerModal'; 
import { JuicyToast } from '../Toast'; 
import ProUpgradeModal from '../ProUpgradeModal'; // 🔥 IMPORTED THE NEW MODAL

export default function MagisterHub({ 
    userData, 
    classes = [], 
    lessons = [],
    decks = {}, 
    curriculums = [],
    onAssign,   
    onStartPresentation, 
    onStartHUD,
    onStartVocabGame,
    onStartConnectFour,
    onStartSlipstream,
    onSaveLesson,     
    onSaveCard,       
    onUpdateCard,     
    onDeleteCard, 
    onDeleteLesson,   
    onSaveCurriculum, 
    onPublishDeck, 
    onCreateClass,     
    onDeleteClass,     
    onRemoveStudent,
    onLogout,          
    onSwitchToAdvancedView 
}: any) {
    const [localView, setLocalView] = useState<'hub' | 'builder' | 'library'>('hub');
    const [studioTargetId, setStudioTargetId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [libraryInitialSearch, setLibraryInitialSearch] = useState(''); 
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [isCohortManagerOpen, setIsCohortManagerOpen] = useState(false); 
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); 
    
    const [openLessonMenuId, setOpenLessonMenuId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null); 
    
    // 🔥 HUB-LEVEL UPGRADE MODAL STATE
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const [preselectedContent, setPreselectedContent] = useState<{id: string, type: string} | null>(null);
    const [preselectedClassId, setPreselectedClassId] = useState<string | null>(null);

    const isPro = userData?.subscriptionTier === 'pro';

    const userInitials = userData?.name 
        ? userData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
        : 'M';

    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return 'Recently';
        const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const activeLessons = useMemo(() => {
        return lessons
            .filter((l: any) => l.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
            .slice(0, 6);
    }, [lessons, searchQuery]);

    const activeClasses = useMemo(() => {
        return classes.slice(0, 4);
    }, [classes]);

    const handleOpenBuilder = (targetId: string) => {
        setStudioTargetId(targetId);
        setLocalView('builder');
    };

    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            setLibraryInitialSearch(searchQuery);
            setLocalView('library');
            setSearchQuery(''); 
        }
    };

    // ========================================================================
    // 🔥 LESSON LIBRARY VIEW
    // ========================================================================
    if (localView === 'library') {
        return (
            <LessonLibrary 
                lessons={lessons}
                initialSearch={libraryInitialSearch} 
                onNavigateBack={() => setLocalView('hub')}
                onEditLesson={handleOpenBuilder}
                onPlayLesson={(id: string) => {
                    setPreselectedContent({ id, type: 'lesson' });
                    setIsLiveModalOpen(true);
                }}
                onDeleteLesson={onDeleteLesson}
                onCreateNew={() => handleOpenBuilder('new')}
            />
        );
    }

    // ========================================================================
    // 🔥 FREEMIUM BUILDER VIEW 
    // ========================================================================
    if (localView === 'builder') {
        return (
            <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors animate-in fade-in duration-300">
                 <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 shadow-sm z-50">
                     <button 
                         onClick={() => setLocalView('hub')} 
                         className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-black text-xs uppercase tracking-widest"
                     >
                         <ArrowLeft size={16} strokeWidth={3} /> Return to Hub
                     </button>
                     <button 
                         onClick={onSwitchToAdvancedView}
                         className="flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 active:scale-95 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm border border-amber-200 cursor-pointer"
                     >
                         <Crown size={14} /> Pro Active
                     </button>
                 </div>

                 <div className="flex-1 overflow-hidden relative">
                     <BuilderHub 
                         userData={userData} 
                         onSaveLesson={onSaveLesson}
                         onSaveCard={onSaveCard}
                         onUpdateCard={onUpdateCard}
                         onDeleteCard={onDeleteCard}
                         onSaveCurriculum={onSaveCurriculum}
                         lessons={lessons}
                         allDecks={decks}
                         onPublishDeck={onPublishDeck}
                         instructorClasses={classes}
                         curriculums={curriculums}
                         targetLessonId={studioTargetId}
                         clearTargetLesson={() => setStudioTargetId(null)}
                     />
                 </div>
            </div>
        );
    }

    // ========================================================================
    // 🔥 STANDARD HUB DASHBOARD
    // ========================================================================
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* 🔥 HUB-LEVEL PAYWALL MODAL INJECTED HERE */}
            <ProUpgradeModal 
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onCheckout={(cycle: 'monthly' | 'annual') => {
                    console.log(`Initiating Stripe checkout for ${cycle} plan...`);
                    // TODO: Wire this up to the Stripe Redirect logic in App.tsx!
                }}
            />

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
                            placeholder="Search (Press Enter for library)..." 
                            className="bg-transparent border-none outline-none text-sm font-medium w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchSubmit} 
                        />
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden md:block" />
                    
                    {isPro && (
                        <button 
                            onClick={onSwitchToAdvancedView}
                            className="hidden md:flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 active:scale-95 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm border border-amber-200 cursor-pointer"
                        >
                            <Crown size={14} /> Pro Active
                        </button>
                    )}

                    <div className="relative">
                        <div 
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-black shadow-md cursor-pointer hover:scale-105 transition-transform" 
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            {userInitials}
                        </div>

                        {isProfileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    
                                    <div className="px-4 py-4 border-b border-slate-100">
                                        <p className="text-sm font-black text-slate-900 truncate">{userData?.name || 'Instructor'}</p>
                                        <p className="text-xs font-bold text-slate-500 truncate mb-3">{userData?.email || 'Instructor Account'}</p>
                                        {isPro ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                                <Crown size={12} /> Magister Pro Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                Free Plan
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="py-2">
                                        {!isPro && (
                                            <div className="px-3 pb-3 mb-2 border-b border-slate-100">
                                                {/* 🔥 NOW TRIGGERS THE LOCAL UPGRADE MODAL */}
                                                <button 
                                                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black uppercase text-[11px] tracking-widest py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                    onClick={() => { 
                                                        setIsProfileMenuOpen(false); 
                                                        setIsUpgradeModalOpen(true); 
                                                    }}
                                                >
                                                    <Crown size={16} /> Upgrade to Pro
                                                </button>
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => { setIsProfileMenuOpen(false); setLocalView('library'); }} 
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                                        >
                                            <FolderOpen size={16} /> Lesson Library
                                        </button>
                                        <button 
                                            onClick={() => { setIsProfileMenuOpen(false); onSwitchToAdvancedView(); }} 
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                                        >
                                            <Settings size={16} /> Advanced Hub
                                        </button>
                                    </div>
                                    
                                    <div className="border-t border-slate-100 py-2">
                                        <button 
                                            onClick={() => { setIsProfileMenuOpen(false); if(onLogout) onLogout(); }} 
                                            className="w-full px-4 py-2.5 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 pt-10">
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
                            onClick={() => handleOpenBuilder('generate')} 
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Wand2 size={18} /> Magic Generate Lesson
                        </button>
                        <button 
                            onClick={() => handleOpenBuilder('new')} 
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} /> Blank Canvas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FolderOpen size={20} className="text-indigo-500" /> Recent Lessons
                            </h2>
                            <button onClick={() => setLocalView('library')} className="text-sm font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                                View Entire Library <ChevronRight size={16} />
                            </button>
                        </div>

                        {activeLessons.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
                                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-black text-slate-700 mb-2">No lessons found</h3>
                                <p className="text-slate-500 font-medium mb-6">You haven't created any curriculum yet.</p>
                                <button onClick={() => handleOpenBuilder('generate')} className="text-indigo-600 font-bold hover:underline">
                                    Generate your first lesson with AI →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {activeLessons.map((lesson: any) => {
                                    const heroImage = lesson.blocks?.find((b: any) => b.type === 'image')?.url;

                                    return (
                                        <div 
                                            key={lesson.id} 
                                            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden" 
                                            onClick={() => {
                                                setPreselectedContent({ id: lesson.id, type: 'lesson' });
                                                setIsLiveModalOpen(true);
                                            }}
                                        >
                                            <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
                                                {heroImage ? (
                                                    <img src={heroImage} alt="Lesson Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                                                        <BookOpen size={32} className="text-indigo-200 dark:text-indigo-800/50" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                                
                                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest line-clamp-1 max-w-[120px] border border-white/20 shadow-sm">
                                                            {lesson.subject || 'General'}
                                                        </span>
                                                        {lesson.generatedByAI && (
                                                            <span className="px-2 py-1 bg-indigo-500/80 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm border border-indigo-400/30">
                                                                <Sparkles size={10} /> AI
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <button 
                                                            className="text-white/70 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full backdrop-blur-md" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setOpenLessonMenuId(openLessonMenuId === lesson.id ? null : lesson.id); 
                                                            }}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {openLessonMenuId === lesson.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setOpenLessonMenuId(null); }} />
                                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                                                    <button 
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setOpenLessonMenuId(null); 
                                                                            handleOpenBuilder(lesson.id); 
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <PenTool size={14} /> Edit Lesson
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setOpenLessonMenuId(null); 
                                                                            navigator.clipboard.writeText(`${window.location.origin}/?lessonId=${lesson.id}`);
                                                                            setToastMsg("Share link copied to clipboard! ✨");
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Share2 size={14} /> Copy Share Link
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                                                    <button 
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setOpenLessonMenuId(null); 
                                                                            if (window.confirm('Are you sure you want to delete this lesson? This cannot be undone.')) {
                                                                                onDeleteLesson(lesson.id); 
                                                                            }
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Trash2 size={14} /> Delete Lesson
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-1">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 relative z-10">
                                                    {lesson.title}
                                                </h3>
                                                
                                                <div className="mt-auto pt-4 flex items-center justify-between text-xs font-bold text-slate-500 relative z-10">
                                                    <span className="flex items-center gap-1.5"><BookOpen size={14} /> {lesson.cards?.length || lesson.blocks?.length || 0} Blocks</span>
                                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTimeAgo(lesson.updatedAt || lesson.createdAt)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex justify-center pointer-events-none z-20">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleOpenBuilder(lesson.id);
                                                    }} 
                                                    className="pointer-events-auto bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg transition-colors border border-indigo-100 dark:border-indigo-500/30 hover:border-indigo-600"
                                                >
                                                    <PenTool size={14} /> Edit Canvas
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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
                                    <div 
                                        key={cohort.id} 
                                        onClick={() => {
                                            setPreselectedClassId(cohort.id);
                                            setIsLiveModalOpen(true);
                                        }}
                                        className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl p-5 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-white text-sm line-clamp-1">{cohort.name}</h4>
                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                                <Users size={10} /> {cohort.students?.length || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-4">
                                            <Clock size={12} /> {cohort.schedule || 'Active Status'}
                                        </p>
                                        <button className="w-full bg-indigo-600 group-hover:bg-indigo-500 text-white py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 pointer-events-none">
                                            <Play size={14} fill="currentColor" /> Launch Arena
                                        </button>
                                    </div>
                                ))}
                                {activeClasses.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 font-medium text-sm">No cohorts created yet.</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsCohortManagerOpen(true)} className="w-full mt-6 py-3 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 relative z-10">
                                <Plus size={16} /> Manage Roster
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <LiveSetupModal 
               isOpen={isLiveModalOpen}
               onClose={() => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
                   setPreselectedClassId(null);
               }}
               preselectedContent={preselectedContent}
               preselectedClassId={preselectedClassId} 
               classes={classes}
               decks={decks}
               lessons={lessons}
               onDeploy={(config: any) => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
                   setPreselectedClassId(null);
                   
                   if (onAssign && config.classId !== 'sandbox') {
                       onAssign(config.classId, config.contentId);
                   }
                   
                   setTimeout(() => {
                       if (config.mode === 'connect_four') {
                           if (onStartConnectFour) onStartConnectFour(config.contentId, config.classId);
                       } else if (config.mode === 'trivia') {
                           if (onStartVocabGame) onStartVocabGame(config.contentId, config.classId);
                       } else if (config.mode === 'slipstream') {
                           if (onStartSlipstream) onStartSlipstream(config.contentId, config.classId);
                       } else if (config.mode === 'presentation') {
                           if (onStartPresentation) onStartPresentation(config.contentId, config.classId);
                       } else if (config.mode === 'hud') {
                           if (onStartHUD) onStartHUD(config.contentId, config.classId);
                       }
                   }, 300);
               }}
            />

            <CohortManagerModal 
                isOpen={isCohortManagerOpen}
                onClose={() => setIsCohortManagerOpen(false)}
                classes={classes}
                onCreateClass={onCreateClass}
                onDeleteClass={onDeleteClass}
                onRemoveStudent={onRemoveStudent}
                isPro={isPro}
                onUpgradeClick={() => {
                    setIsCohortManagerOpen(false);
                    setIsUpgradeModalOpen(true);
                }}
            />
        </div>
    );
}
