// src/components/instructor/InstructorDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    GraduationCap, ChevronLeft, Menu, Activity, PenTool, 
    School, Layers, Inbox, BarChart2, Shield, User, 
    LogOut, BookOpen, ChevronUp, ArrowLeft, LayoutGrid, Home, Play
} from 'lucide-react';

// Import the specialized views
import BuilderHub from './BuilderHub';
import ClassManagerView from './ClassManagerView';
import InstructorInbox from './InstructorInbox';
import { AnalyticsDashboard } from './InstructorTools';
import CommandCenter from './CommandCenter';
import LiveSetupModal from './LiveSetupModal';
import InstructorVault from './InstructorVault'; 
import GradebookMatrix from './GradebookMatrix';
import InstructorGradebook from './InstructorGradebook';

// ============================================================================
//  INSTRUCTOR DASHBOARD (Main Navigation & Hub)
// ============================================================================
export default function InstructorDashboard({ 
  user, 
  userData, 
  allDecks, 
  lessons, 
  curriculums,
  activityLogs,
  onAssignCurriculum,
  onSaveCurriculum, 
  onSaveLesson, 
  onSaveCard,
  onUpdateCard,
  onDeleteCard,
  onDeleteArtifact,
  onMoveToFolder,
  onAssign,               
  onRevoke,               
  onCreateClass,  
  onDeleteClass,  
  onRenameClass,
  onUpdateClassDescription,
  onAddStudent,
  onRemoveStudent,   
  onStartPresentation, 
  onStartHUD,
  onStartVocabGame,
  onStartConnectFour,
  onStartSlipstream, 
  onStartMarbleScrabble,
  onPublishDeck, 
  onSwitchView, 
  onLogout,
  onSwitchToBasicView, 
  proIntent,         
  clearProIntent,    
  AdminDashboardView 
}: any) {
  // --- STATE ---
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const activeTab = tabHistory[tabHistory.length - 1] || 'dashboard';

  // Persist rail state
  const [isRailExpanded, setIsRailExpanded] = useState(() => {
      const saved = localStorage.getItem('magisterRailExpanded');
      return saved ? JSON.parse(saved) : true;
  });

  // Global Active Class
  const [activeClassId, setActiveClassId] = useState<string>('');

  // Modals & UI
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [preselectedContent, setPreselectedContent] = useState<{id: string, type: string} | null>(null);
  const [studioTargetId, setStudioTargetId] = useState<string | null>(null);
  const [gradeView, setGradeView] = useState<'matrix' | 'speedmoderator'>('matrix');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- DERIVED DATA ---
  const classes = userData?.classes || [];
  
  // Data-driven Badges
  const ungradedCount = useMemo(() => {
      if (!activityLogs) return 0;
      return activityLogs.filter((l: any) => l.scoreDetail?.status === 'pending_review').length;
  }, [activityLogs]);
  
  const unreadCount = 0; // Hook up to real message data when available

  // --- NAVIGATION CONFIG ---
  const NAV_SECTIONS = [
    { 
      label: 'Teach', 
      items: [
        { id: 'dashboard', icon: <Home />, label: 'Home' },
        { id: 'studio', icon: <PenTool />, label: 'Create' },
        { id: 'vault', icon: <Layers />, label: 'Library' },
      ]
    },
    { 
      label: 'Manage', 
      items: [
        { id: 'classes', icon: <School />, label: 'Classes' },
        { id: 'gradebook', icon: <BookOpen />, label: 'Gradebook', badge: ungradedCount },
        { id: 'inbox', icon: <Inbox />, label: 'Messages', badge: unreadCount },
      ]
    },
    { 
      label: 'Review', 
      items: [
        { id: 'analytics', icon: <BarChart2 />, label: 'Insights' },
      ]
    }
  ];

  const getTabLabel = (id: string) => {
      if (id === 'admin') return 'Admin';
      for (const section of NAV_SECTIONS) {
          const item = section.items.find(i => i.id === id);
          if (item) return item.label;
      }
      return 'Dashboard';
  };

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('magisterRailExpanded', JSON.stringify(isRailExpanded));
  }, [isRailExpanded]);

  useEffect(() => {
    if (!activeClassId && classes.length > 0) {
        setActiveClassId(classes[0].id);
    }
  }, [classes, activeClassId]);

  useEffect(() => {
      if (proIntent) {
          setTabHistory([proIntent.tab]);
          if (proIntent.action === 'launch_content' && proIntent.targetId) {
              setPreselectedContent({ id: proIntent.targetId, type: 'lesson' });
              setIsLiveModalOpen(true);
          } else if (proIntent.action === 'launch_class' && proIntent.targetId) {
              setActiveClassId(proIntent.targetId);
              setIsLiveModalOpen(true); 
          } else if (proIntent.action === 'edit' && proIntent.targetId) {
              setStudioTargetId(proIntent.targetId); 
          } else if (proIntent.action === 'generate') {
              setStudioTargetId('generate'); 
          }
          if (clearProIntent) clearProIntent();
      }
  }, [proIntent, clearProIntent]);

  // --- HANDLERS ---
  const handleSidebarNav = (tab: string) => {
      setTabHistory([tab]);
      if (window.innerWidth < 768) setIsRailExpanded(false);
  };

  const handleDrillDown = (tab: string) => {
      setTabHistory(prev => prev[prev.length - 1] === tab ? prev : [...prev, tab]);
  };

  const handleGoBack = () => {
      setTabHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const selectedClass = classes.find((c: any) => c.id === activeClassId) || classes[0] || null;

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* --- MOBILE OVERLAY BACKDROP --- */}
      {isRailExpanded && (
        <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[40] md:hidden"
            onClick={() => setIsRailExpanded(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside 
        className={`absolute md:relative bg-slate-950 dark:bg-black flex flex-col h-full overflow-x-hidden transition-all duration-300 ease-in-out z-50 border-r border-slate-900 dark:border-slate-800/50 shadow-2xl md:shadow-[20px_0_40px_rgba(0,0,0,0.1)] select-none ${
          isRailExpanded ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="h-16 flex items-center border-b border-slate-900 dark:border-slate-800/60 overflow-hidden shrink-0 px-4 mt-2">
          <div className="w-12 flex items-center justify-center shrink-0">
            <div className={`w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-transform ${isRailExpanded ? '' : 'cursor-pointer hover:scale-105'}`} onClick={() => !isRailExpanded && setIsRailExpanded(true)}>
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className={`flex-1 flex items-center justify-between pl-3 transition-opacity duration-300 ${isRailExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-bold text-lg tracking-tight">Magister</span>
            <button 
              onClick={() => setIsRailExpanded(false)}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors md:flex hidden"
            >
              <ChevronLeft size={18} strokeWidth={2.5}/>
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden" aria-label="Main">
            {NAV_SECTIONS.map((section, idx) => (
                <div key={idx} className="space-y-1">
                    {isRailExpanded ? (
                        <div className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-4">{section.label}</div>
                    ) : (
                        <div className="w-8 h-px bg-slate-800 mx-auto my-4" />
                    )}
                    
                    {section.items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button 
                                key={item.id}
                                onClick={() => handleSidebarNav(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                title={!isRailExpanded ? item.label : undefined}
                                className={`relative flex items-center h-12 w-full rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] group ${
                                    isActive ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                            >
                                <div className="w-14 shrink-0 flex items-center justify-center relative">
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
                                    {!!item.badge && (
                                        <span className={`absolute top-2 right-3 flex items-center justify-center h-4 min-w-[16px] rounded-full text-[9px] font-bold px-1 border-2 border-slate-950 ${isActive ? 'bg-white text-indigo-600' : 'bg-amber-500 text-white'}`}>
                                            {item.badge > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${isRailExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            ))}
        </nav>

        {/* PROFILE & UTILITIES POPOVER */}
        <div className="relative p-3 border-t border-slate-900 dark:border-slate-800/60 bg-slate-950/50 dark:bg-black/50 shrink-0">
            {showProfileMenu && (
                <div className="absolute bottom-full left-4 mb-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="p-4 border-b border-slate-800">
                        <p className="font-bold text-sm text-white truncate">{userData?.name || user?.email}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                        {(userData?.role === 'admin' || userData?.role === 'org_admin') && (
                            <button onClick={() => { handleSidebarNav('admin'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors">
                                <Shield size={16} /> Admin
                            </button>
                        )}
                        <button onClick={() => { onSwitchToBasicView(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                            <LayoutGrid size={16} /> Simple Mode
                        </button>
                        <button onClick={() => { onSwitchView(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                            <User size={16} /> Preview as Student
                        </button>
                        <div className="h-px bg-slate-800 my-1"/>
                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                            <LogOut size={16} /> Log out
                        </button>
                    </div>
                </div>
            )}

            <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center h-12 rounded-xl hover:bg-slate-900 transition-colors"
            >
                <div className="w-14 shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {(userData?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                </div>
                <div className={`flex-1 flex items-center justify-between pr-3 overflow-hidden transition-opacity duration-200 ${isRailExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="font-medium text-sm text-slate-300 truncate">Settings</span>
                    <ChevronUp size={16} className={`text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </div>
            </button>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* --- GLOBAL TOP BAR --- */}
        <header className="h-16 px-4 md:px-8 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-30 select-none">
            <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                {!isRailExpanded && (
                    <button onClick={() => setIsRailExpanded(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white md:hidden">
                        <Menu size={20} />
                    </button>
                )}
                
                {tabHistory.length > 1 ? (
                    <button onClick={handleGoBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors group whitespace-nowrap">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Back to {getTabLabel(tabHistory[tabHistory.length - 2])}</span>
                        <span className="sm:hidden">Back</span>
                    </button>
                ) : (
                    <h1 className="text-lg font-bold truncate">{getTabLabel(activeTab)}</h1>
                )}
            </div>

            <div className="flex items-center gap-4 shrink-0 pl-4">
                <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class</span>
                    <select 
                        value={activeClassId}
                        onChange={(e) => setActiveClassId(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[150px] md:max-w-[200px] truncate"
                    >
                        {classes.length ? (
                            classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)
                        ) : (
                            <option value="">No Classes</option>
                        )}
                    </select>
                </div>
                
                <button 
                    onClick={() => setIsLiveModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    <Play size={16} fill="currentColor" /> <span className="hidden sm:inline">Start Live Session</span><span className="sm:hidden">Start</span>
                </button>
            </div>
        </header>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden relative w-full h-full animate-in fade-in duration-300">
            
           {activeTab === 'admin' && AdminDashboardView && (
             <AdminDashboardView user={userData} />
           )}

           {activeTab === 'studio' && (
             <BuilderHub 
                 onSaveLesson={onSaveLesson} 
                 onSaveCard={onSaveCard} 
                 onUpdateCard={onUpdateCard} 
                 onDeleteCard={onDeleteCard} 
                 onSaveCurriculum={onSaveCurriculum} 
                 lessons={lessons} 
                 allDecks={allDecks} 
                 onPublishDeck={onPublishDeck} 
                 instructorClasses={classes}
                 curriculums={curriculums}
                 targetLessonId={studioTargetId} 
                 clearTargetLesson={() => setStudioTargetId(null)}
             />
           )}

           {activeTab === 'classes' && (
             <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
               <ClassManagerView 
                  user={user} 
                  classes={classes} 
                  lessons={lessons} 
                  allDecks={allDecks} 
                  curriculums={curriculums}
                  onAssign={onAssign} 
                  onAssignCurriculum={onAssignCurriculum}
                  onRevoke={onRevoke} 
                  onCreateClass={onCreateClass} 
                  onDeleteClass={onDeleteClass} 
                  onRenameClass={onRenameClass} 
                  onUpdateClassDescription={onUpdateClassDescription} 
                  onAddStudent={onAddStudent} 
                  onRemoveStudent={onRemoveStudent} 
                  onStartPresentation={onStartPresentation} 
                  onStartVocabGame={onStartVocabGame}
                  onStartConnectFour={onStartConnectFour} 
                  onStartMarbleScrabble={onStartMarbleScrabble}
               />
             </div>
           )}

           {activeTab === 'vault' && (
             <InstructorVault 
                  decks={allDecks} 
                  lessons={lessons} 
                  onDeleteArtifact={onDeleteArtifact} 
                  onMoveToFolder={onMoveToFolder} 
                  onLaunchLive={(id: string, type: string) => {
                     setPreselectedContent({ id, type });
                     setIsLiveModalOpen(true);
                  }}
                  onEditArtifact={(id: string, type: string) => {
                     setStudioTargetId(id); 
                     handleDrillDown('studio'); 
                  }}
             />
           )}

           {activeTab === 'gradebook' && (
             <div className="h-full flex flex-col">
                <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit shadow-inner">
                        <button onClick={() => setGradeView('matrix')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${gradeView === 'matrix' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Grid</button>
                        <button onClick={() => setGradeView('speedmoderator')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${gradeView === 'speedmoderator' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Quick Grade</button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden p-6 bg-slate-50 dark:bg-slate-950">
                    {selectedClass ? (
                        gradeView === 'matrix' ? (
                            <GradebookMatrix 
                                classData={selectedClass} 
                                lessons={lessons} 
                                activityLogs={activityLogs} 
                            />
                        ) : (
                            <InstructorGradebook 
                                classData={selectedClass} 
                            />
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Class Selected</h3>
                            <p className="text-slate-500 text-sm">Choose a class from the top menu or create a new one in the Classes tab to see grades.</p>
                            <button onClick={() => handleSidebarNav('classes')} className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-colors">Go to Classes</button>
                        </div>
                    )}
                </div>
             </div>
           )}

           {/* Dashboard, Analytics, and Inbox */}
           {['dashboard', 'analytics', 'inbox'].includes(activeTab) && (
             <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {activeTab === 'dashboard' && (
                  <CommandCenter 
                      classes={classes}
                      selectedClassId={activeClassId}
                      setSelectedClassId={setActiveClassId}
                      logs={activityLogs} 
                      lessons={lessons} 
                      allDecks={allDecks} 
                      curriculums={curriculums}
                      onAssign={onAssign}
                      onLaunchLive={() => setIsLiveModalOpen(true)} 
                      setActiveTab={handleDrillDown} 
                      onStartHUD={onStartHUD} 
                  />
                )}
                
                {activeTab === 'analytics' && <AnalyticsDashboard classes={classes} />}
                
                {activeTab === 'inbox' && (
                    <InstructorInbox 
                        user={user} 
                        classes={classes} 
                        decks={allDecks} 
                        lessons={lessons} 
                    />
                )}
             </div>
           )}

           {/* LIVE ARENA MODAL */}
           <LiveSetupModal 
               isOpen={isLiveModalOpen}
               onClose={() => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
               }}
               preselectedContent={preselectedContent}
               classes={classes}
               decks={allDecks}
               curriculums={curriculums}
               lessons={lessons}
               onDeploy={(config: any) => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
                   
                   if (config.mode === 'assign' && config.classId !== 'sandbox') {
                       const isCurriculum = curriculums?.some((c: any) => c.id === config.contentId);
                       if (isCurriculum) {
                           if (onAssignCurriculum) onAssignCurriculum(config.classId, config.contentId);
                       } else {
                           if (onAssign) onAssign(config.classId, config.contentId);
                       }
                   } else {
                       setTimeout(() => {
                           if (config.mode === 'connect_four' && onStartConnectFour) onStartConnectFour(config.contentId, config.classId);
                           else if (config.mode === 'marble_scrabble' && onStartMarbleScrabble) onStartMarbleScrabble(config.contentId, config.classId);
                           else if (config.mode === 'trivia' && onStartVocabGame) onStartVocabGame(config.contentId, config.classId);
                           else if (config.mode === 'slipstream' && onStartSlipstream) onStartSlipstream(config.contentId, config.classId);
                           else if (config.mode === 'presentation' && onStartPresentation) onStartPresentation(config.contentId, config.classId);
                           else if (config.mode === 'hud' && onStartHUD) onStartHUD(config.contentId, config.classId);
                       }, 300);
                   }
               }}
           />

        </div>
      </main>
    </div> 
  );
}
