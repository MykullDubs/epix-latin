// src/components/instructor/InstructorDashboard.tsx
import React, { useState } from 'react';
import { 
    GraduationCap, ChevronLeft, Menu, Activity, PenTool, 
    School, Layers, Inbox, BarChart2, Shield, User, 
    LogOut, BookOpen, CheckCircle2, Briefcase, ArrowLeft
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
  onPublishDeck, 
  onSwitchView, 
  onLogout,
  AdminDashboardView 
}: any) {
  // 🔥 THE NEW ROUTING ENGINE: Stack-based History
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const activeTab = tabHistory[tabHistory.length - 1] || 'dashboard';

  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(''); 
  const [dashCohortId, setDashCohortId] = useState<string>(userData?.classes?.[0]?.id || '');
  
  const [gradebookClassId, setGradebookClassId] = useState<string>(userData?.classes?.[0]?.id || '');
  const [gradeView, setGradeView] = useState<'matrix' | 'speedmoderator'>('matrix');

  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [preselectedContent, setPreselectedContent] = useState<{id: string, type: string} | null>(null);

  // --- NAVIGATION HANDLERS ---
  
  // 1. Root Navigation (Clicking the Sidebar) resets the stack
  const handleSidebarNav = (tab: string) => {
      setTabHistory([tab]);
      if (window.innerWidth < 768) {
          setIsRailExpanded(false); // Auto-close rail on mobile
      }
  };

  // 2. Drill-down Navigation (Clicking Action Cards) builds the stack
  const handleDrillDown = (tab: string) => {
      setTabHistory(prev => {
          if (prev[prev.length - 1] === tab) return prev; // Prevent duplicates
          return [...prev, tab];
      });
  };

  // 3. Popping the Stack (Clicking Back)
  const handleGoBack = () => {
      setTabHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const NavItem = ({ id, icon, label, badge }: { id: string; icon: React.ReactNode; label: string; badge?: boolean }) => {
    const isActive = activeTab === id;
    
    return (
      <button 
        onClick={() => handleSidebarNav(id)}
        role="tab"
        aria-selected={isActive}
        className={`relative flex items-center h-14 w-full rounded-[1.5rem] transition-all duration-300 ease-out group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.96] ${
          isActive ? '' : 'hover:bg-slate-900/60 dark:hover:bg-slate-800/60'
        }`}
      >
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 rounded-[1.5rem] shadow-lg shadow-indigo-900/50 dark:shadow-indigo-900/30 animate-in fade-in zoom-in-95 duration-300 border border-indigo-400/20" />
        )}

        <div className="relative z-10 flex items-center w-full">
            <div className="w-20 shrink-0 flex items-center justify-center relative">
                {React.cloneElement(icon as React.ReactElement, { 
                    size: 22, 
                    strokeWidth: isActive ? 2.5 : 2,
                    className: `transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`
                })}
                
                {badge && !isActive && (
                    <span className="absolute top-3 right-5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-slate-950 dark:border-slate-900"></span>
                    </span>
                )}
            </div>

            <span className={`font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ease-out ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            } ${
                isRailExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}>
                {label}
            </span>
        </div>

        {isActive && !isRailExpanded && (
          <div className="absolute left-1.5 w-1 h-8 bg-white rounded-full z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-in slide-in-from-left-full duration-300" />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans select-none transition-colors duration-300">
      
    <aside 
        className={`bg-slate-950 dark:bg-black flex flex-col overflow-x-hidden transition-all duration-500 ease-in-out z-50 shadow-[20px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[20px_0_40px_rgba(0,0,0,0.4)] ${
          isRailExpanded ? 'w-72' : 'w-20'
        }`}
      >
        <div className="h-24 flex items-center border-b border-slate-900 dark:border-slate-800/60 overflow-hidden shrink-0">
          <div className="w-20 flex items-center justify-center shrink-0">
            <div className={`w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-all duration-700 ${isRailExpanded ? 'rotate-0' : 'rotate-12 scale-90 hover:scale-100 hover:rotate-0 cursor-pointer'}`} onClick={() => !isRailExpanded && setIsRailExpanded(true)}>
              <GraduationCap size={24} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className={`flex-1 flex items-center justify-between pr-4 transition-opacity duration-300 ${isRailExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-white font-black text-lg tracking-tighter uppercase italic">Magister</span>
            <button 
              onClick={() => setIsRailExpanded(false)}
              className="p-2 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 dark:hover:bg-slate-900 rounded-xl transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {!isRailExpanded && (
            <button 
              onClick={() => setIsRailExpanded(true)}
              className="absolute -right-3 top-10 w-6 h-12 bg-slate-800 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-400 border border-slate-700 dark:border-slate-800 active:scale-95 shadow-lg md:hidden"
            >
              <Menu size={12} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavItem id="dashboard" icon={<Activity />} label="Live Feed" />
          <NavItem id="studio" icon={<PenTool />} label="Studio Hub" />
          <NavItem id="classes" icon={<School />} label="Cohort Manager" />
          <NavItem id="vault" icon={<Layers />} label="Global Vault" />
          <NavItem id="gradebook" icon={<BookOpen />} label="Gradebook" badge={true} />
          <NavItem id="analytics" icon={<BarChart2 />} label="Analytics" />
          <NavItem id="inbox" icon={<Inbox />} label="Comms Inbox" />
        </nav>

        <div className="p-4 border-t border-slate-900 dark:border-slate-800/60 space-y-2 shrink-0 bg-slate-950/50 dark:bg-black/50">
         {(userData?.role === 'admin' || userData?.role === 'org_admin') && (
            <button 
              onClick={() => handleSidebarNav('admin')}
              className={`relative flex items-center h-14 w-full rounded-[1.5rem] transition-all duration-300 active:scale-[0.96] group overflow-hidden ${activeTab === 'admin' ? 'bg-emerald-500/20 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.5)]' : 'hover:bg-slate-900 dark:hover:bg-slate-900'}`}
            >
              <div className="w-14 flex items-center justify-center shrink-0 ml-1">
                <Shield size={20} className={activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'} />
              </div>
              <span className={`font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${activeTab === 'admin' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} ${isRailExpanded ? 'opacity-100' : 'opacity-0 -translate-x-4'}`}>
                 Command Center
              </span>
            </button>
          )}

          <button 
            onClick={onSwitchView}
            className="flex items-center h-14 w-full rounded-[1.5rem] text-slate-500 hover:bg-slate-900 dark:hover:bg-slate-900 hover:text-indigo-400 transition-all active:scale-[0.96] group"
          >
            <div className="w-14 flex items-center justify-center shrink-0 ml-1">
              <User size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            {isRailExpanded && <span className="font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap opacity-100 transition-opacity">Student View</span>}
          </button>

          <button 
            onClick={onLogout}
            className="flex items-center h-14 w-full rounded-[1.5rem] text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-all active:scale-[0.96] group"
          >
            <div className="w-14 flex items-center justify-center shrink-0 ml-1">
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            {isRailExpanded && <span className="font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap opacity-100 transition-opacity">Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* 🔥 THE GLOBAL RETURN BUTTON (Only shows if there is history) */}
        {tabHistory.length > 1 && (
            <div className="shrink-0 px-4 md:px-8 pt-4 pb-2 z-10 flex items-center animate-in slide-in-from-top-4 duration-300">
                <button
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[1rem] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all hover:-translate-x-1 active:scale-95 group"
                >
                    <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
                </button>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative w-full h-full">
            
           {activeTab === 'admin' && AdminDashboardView && (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <AdminDashboardView user={userData} />
             </div>
           )}

           {activeTab === 'studio' && (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <BuilderHub 
                 onSaveLesson={onSaveLesson} 
                 onSaveCard={onSaveCard} 
                 onUpdateCard={onUpdateCard} 
                 onDeleteCard={onDeleteCard} 
                 onSaveCurriculum={onSaveCurriculum} 
                 lessons={lessons} 
                 allDecks={allDecks} 
                 onPublishDeck={onPublishDeck} 
                 instructorClasses={userData?.classes || []}
                 curriculums={curriculums}
               />
             </div>
           )}

           {activeTab === 'classes' && (
             <div className="h-full p-6 md:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-6 duration-500">
               <ClassManagerView 
                  user={user} 
                  classes={userData?.classes || []} 
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
               />
             </div>
           )}

           {/* 🔥 PRO-LMS: THE NEW INSTRUCTOR VAULT */}
           {activeTab === 'vault' && (
             <div className="h-full animate-in zoom-in-95 duration-500">
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
                       // Drill down into the studio so clicking 'Back' returns them to the Vault
                       handleDrillDown('studio');
                   }}
               />
             </div>
           )}

           {/* 🔥 PRO-LMS: THE GRADEBOOK HUB */}
           {activeTab === 'gradebook' && (
             <div className="h-full flex flex-col animate-in slide-in-from-bottom-6 duration-500">
                <div className="flex-none p-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex bg-slate-200/50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <button onClick={() => setGradeView('matrix')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gradeView === 'matrix' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Performance Matrix</button>
                        <button onClick={() => setGradeView('speedmoderator')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gradeView === 'speedmoderator' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>SpeedModerator</button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Cohort</span>
                        <select 
                            value={gradebookClassId}
                            onChange={(e) => setGradebookClassId(e.target.value)}
                            className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl px-6 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm"
                        >
                            {userData?.classes?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden p-6 md:p-8 bg-slate-100 dark:bg-slate-950">
                    {gradebookClassId ? (
                        gradeView === 'matrix' ? (
                            <GradebookMatrix 
                                classData={userData?.classes?.find((c: any) => c.id === gradebookClassId)} 
                                lessons={lessons} 
                                activityLogs={activityLogs} 
                            />
                        ) : (
                            <InstructorGradebook 
                                classData={userData?.classes?.find((c: any) => c.id === gradebookClassId)} 
                            />
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold uppercase tracking-widest opacity-50">
                            <BookOpen size={48} className="mb-4" />
                            Select a cohort to initialize grading engine
                        </div>
                    )}
                </div>
             </div>
           )}

           {/* Dashboard, Analytics, and Inbox */}
           {['dashboard', 'analytics', 'inbox'].includes(activeTab) && (
             <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
                {activeTab === 'dashboard' && (
                  <CommandCenter 
                      classes={userData?.classes || []}
                      selectedClassId={dashCohortId}
                      setSelectedClassId={setDashCohortId}
                      logs={activityLogs} 
                      lessons={lessons} 
                      allDecks={allDecks} 
                      curriculums={curriculums}
                      onAssign={onAssign}
                      onLaunchLive={() => setIsLiveModalOpen(true)} 
                      setActiveTab={handleDrillDown} // 🔥 We pass drill-down here so clicking a card pushes history!
                      onStartHUD={onStartHUD} 
                  />
                )}
                
                {activeTab === 'analytics' && <AnalyticsDashboard classes={userData?.classes} />}
                
                {/* 🔥 PRO-LMS: Fully Wired Inbox */}
                {activeTab === 'inbox' && (
                    <InstructorInbox 
                        user={user} 
                        classes={userData?.classes || []} 
                        decks={allDecks} 
                        lessons={lessons} 
                    />
                )}
             </div>
           )}

           {/* 🔥 LIVE ARENA MODAL */}
           <LiveSetupModal 
               isOpen={isLiveModalOpen}
               onClose={() => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
               }}
               preselectedContent={preselectedContent}
               classes={userData?.classes || []}
               decks={allDecks}
               lessons={lessons}
               onDeploy={(config: any) => {
                   setIsLiveModalOpen(false);
                   setPreselectedContent(null);
                   
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

        </div>
      </main>
    </div> 
  );
}
