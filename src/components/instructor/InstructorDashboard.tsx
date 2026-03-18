// src/components/instructor/InstructorDashboard.tsx
import React, { useState } from 'react';
import { 
  GraduationCap, ChevronLeft, Menu, Activity, PenTool, 
  School, Layers, Inbox, BarChart2, Shield, User, 
  LogOut, BookOpen, CheckCircle2, Briefcase 
} from 'lucide-react';

// Import the specialized views
import BuilderHub from './BuilderHub';
import ClassManagerView from './ClassManagerView';
import InstructorInbox from './InstructorInbox';
import { AnalyticsDashboard } from './InstructorTools';
import CommandCenter from './CommandCenter';
import LiveSetupModal from './LiveSetupModal'; // 🔥 IMPORTED LIVE SETUP MODAL

// ============================================================================
//  INSTRUCTOR DASHBOARD (Main Navigation & Hub)
// ============================================================================
export default function InstructorDashboard({ 
  user, 
  userData, 
  allDecks, 
  lessons, 
  curriculums,
  onAssignCurriculum,
  onSaveCurriculum, 
  onSaveLesson, 
  onSaveCard, 
  onAssign,            
  onRevoke,            
  onCreateClass,  
  onDeleteClass,  
  onRenameClass,
  onUpdateClassDescription,
  onAddStudent,
  onStartPresentation, 
  onStartVocabGame,
  onStartConnectFour, 
  onPublishDeck, 
  onSwitchView, 
  onLogout,
  AdminDashboardView 
}: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(''); 
  
  // 🔥 STATE FOR LIVE ARENA MODAL
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const NavItem = ({ id, icon, label, badge }: { id: string; icon: React.ReactNode; label: string; badge?: boolean }) => {
    const isActive = activeTab === id;
    
    return (
      <button 
        onClick={() => setActiveTab(id)}
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
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-950 dark:border-slate-900"></span>
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
        className={`bg-slate-950 dark:bg-black flex flex-col transition-all duration-500 ease-in-out z-50 shadow-[20px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[20px_0_40px_rgba(0,0,0,0.4)] ${
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

        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem id="dashboard" icon={<Activity />} label="Live Feed" />
          <NavItem id="studio" icon={<PenTool />} label="Studio Hub" />
          <NavItem id="classes" icon={<School />} label="Cohort Manager" />
          <NavItem id="vault" icon={<Layers />} label="Global Vault" />
          <NavItem id="inbox" icon={<Inbox />} label="Grading Inbox" badge={true} />
          <NavItem id="analytics" icon={<BarChart2 />} label="Analytics" />
        </nav>

        <div className="p-4 border-t border-slate-900 dark:border-slate-800/60 space-y-2 shrink-0 bg-slate-950/50 dark:bg-black/50">
         {(userData?.role === 'admin' || userData?.role === 'org_admin') && (
            <button 
              onClick={() => setActiveTab('admin')}
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
      <main className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="h-full w-full">
            
           {activeTab === 'admin' && AdminDashboardView ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <AdminDashboardView user={userData} />
             </div>
           ) : activeTab === 'studio' ? (
             <div className="h-full animate-in zoom-in-95 duration-500">
               <BuilderHub 
                 onSaveLesson={onSaveLesson} 
                 onSaveCard={onSaveCard} 
                 onSaveCurriculum={onSaveCurriculum} 
                 lessons={lessons} 
                 allDecks={allDecks} 
                 onPublishDeck={onPublishDeck} 
                 instructorClasses={userData?.classes || []}
               />
             </div>
           ) : activeTab === 'classes' ? (
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
                  onStartPresentation={onStartPresentation} 
                  onStartVocabGame={onStartVocabGame}
                  onStartConnectFour={onStartConnectFour} 
               />
             </div>
           ) : activeTab === 'vault' ? (
             <div className="h-full overflow-y-auto p-6 md:p-12 custom-scrollbar animate-in slide-in-from-bottom-6 duration-500">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8 transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Magister Engine</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-4 transition-colors">Global Vault</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl text-lg transition-colors">Deploy comprehensive learning pathways directly to your cohorts.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm min-w-[250px] transition-colors">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Target Cohort</label>
                            <select 
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all"
                            >
                                <option value="" disabled>Select a class...</option>
                                {userData?.classes?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {curriculums?.map((curr: any) => {
                            const activeClass = userData?.classes?.find((c: any) => c.id === selectedClassId);
                            const isAssigned = activeClass?.assignedCurriculums?.includes(curr.id);

                            return (
                                <div key={curr.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-2xl dark:hover:shadow-indigo-900/20 group flex flex-col">
                                    <div className="h-48 relative overflow-hidden bg-slate-900">
                                        <img 
                                            src={curr.coverImage} 
                                            alt={curr.title} 
                                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" 
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span 
                                                className="px-4 py-1.5 bg-white dark:bg-slate-950 font-black text-xs rounded-xl uppercase tracking-widest shadow-lg transition-colors"
                                                style={{ color: curr.themeColor }}
                                            >
                                                {curr.level} Level
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 transition-colors">{curr.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 flex-1 transition-colors">{curr.description}</p>
                                        
                                        <div className="flex items-center gap-2 mb-8 text-slate-400 dark:text-slate-500 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors">
                                            <BookOpen size={18} className="text-indigo-400" />
                                            {curr.lessonIds?.length || 0} Interactive Lessons
                                        </div>

                                        {!selectedClassId ? (
                                            <button disabled className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-black text-xs uppercase cursor-not-allowed transition-colors">Select a class first</button>
                                        ) : isAssigned ? (
                                            <button disabled className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-500/20 transition-colors"><CheckCircle2 size={18} /> Active in {activeClass?.name}</button>
                                        ) : (
                                            <button 
                                                onClick={() => onAssignCurriculum(selectedClassId, curr.id)}
                                                className="w-full py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-xl active:scale-95"
                                            >
                                                Assign to {activeClass?.name}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
           ) : (
             <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
                {activeTab === 'dashboard' && (
                    <CommandCenter 
                        classData={userData?.classes?.[0]} 
                        logs={[]} 
                        onLaunchLive={() => setIsLiveModalOpen(true)} 
                        setActiveTab={setActiveTab} 
                    />
                )}
                
                {activeTab === 'analytics' && <AnalyticsDashboard classes={userData?.classes} />}
                {activeTab === 'inbox' && <InstructorInbox />}
             </div>
           )}

           {/* 🔥 LIVE ARENA MODAL */}
           <LiveSetupModal 
               isOpen={isLiveModalOpen}
               onClose={() => setIsLiveModalOpen(false)}
               classes={userData?.classes || []}
               decks={allDecks}
               onDeploy={(config: any) => {
                   setIsLiveModalOpen(false);
                   // Route to the appropriate game presentation
                   if (config.mode === 'connect_four') {
                       if (onStartConnectFour) onStartConnectFour(config.classId, config.contentId);
                   } else if (config.mode === 'trivia') {
                       if (onStartVocabGame) onStartVocabGame(config.classId, config.contentId);
                   }
               }}
           />

        </div>
      </main>
    </div>
  );
}
