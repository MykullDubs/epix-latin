// src/components/instructor/ClassManagerView.tsx
import React, { useState } from 'react';
import { 
    Users, Plus, X, Flame, BookOpen, Edit3, Trash2, Mail, 
    Activity, Search, Gamepad2, CheckCircle2, Monitor, Filter, 
    Library, Package, Puzzle, Play, Zap, Swords 
} from 'lucide-react';

export default function ClassManagerView({ 
    user, 
    classes = [], 
    lessons = [], 
    curriculums = [], 
    allDecks = {}, 
    onAssign, 
    onAssignCurriculum, 
    onRevoke, 
    onCreateClass, 
    onDeleteClass, 
    onRenameClass, 
    onUpdateClassDescription,
    onAddStudent,
    onRemoveStudent, // 🔥 Added Prop
    onStartPresentation,
    onStartVocabGame,
    onStartConnectFour 
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    const [assignMode, setAssignMode] = useState<'packages' | 'standalone' | 'vocab'>('packages');
    
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); 
    const [lessonSearch, setLessonSearch] = useState(''); 
    const [activeSubjectFilter, setActiveSubjectFilter] = useState('All'); 

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

    // --- DATA LOGIC ---
    const rawSubjects = curriculums.map((c: any) => String(c.subject || 'General'));
    const uniqueSubjects = new Set<string>(rawSubjects);
    const availableSubjects: string[] = ['All', ...Array.from(uniqueSubjects)];

    const assignedLessons = lessons.filter((l: any) => activeClass?.assignments?.includes(l.id));
    const unassignedLessons = lessons.filter((l: any) => !activeClass?.assignments?.includes(l.id));
    
    const filteredCurriculums = curriculums.filter((c: any) => {
        const title = String(c.title || '');
        const description = String(c.description || '');
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = activeSubjectFilter === 'All' || c.subject === activeSubjectFilter;
        return matchesSearch && matchesSubject;
    });

    const filteredUnassigned = unassignedLessons.filter((l: any) => {
        if (!lessonSearch.trim()) return true;
        const searchStr = `${l.title || 'Untitled'} ${l.type === 'arcade_game' ? 'arcade' : 'unit'} ${l.subject || ''}`.toLowerCase();
        return searchStr.includes(lessonSearch.toLowerCase());
    });

    const handleCreateSubmit = () => {
        if (!newCohortName.trim()) return;
        onCreateClass(newCohortName.trim());
        setNewCohortName('');
        setIsCreatingCohort(false);
    };

    const [newCohortName, setNewCohortName] = useState('');

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentEmail.trim() || !activeClass) return;
        onAddStudent(activeClass.id, newStudentEmail);
        setNewStudentEmail('');
    };

    const handleBulkAssign = (curriculum: any) => {
        if (!window.confirm(`Deploy ${curriculum.title} to this cohort?`)) return;
        if (onAssignCurriculum) onAssignCurriculum(activeClass.id, curriculum.id);
        else curriculum.lessonIds.forEach((id: string) => onAssign(activeClass.id, id));
    };

    const defaultDeckKey = Object.keys(allDecks)[0] || 'custom';

    return (
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-24 animate-in fade-in duration-500 font-sans min-h-0 transition-colors">
            
            {/* LEFT PANE: THE COHORT LIST */}
            <div className="w-full md:w-[340px] flex flex-col gap-6 shrink-0 min-h-0">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group shrink-0 transition-colors">
                    <div className="absolute -right-4 -top-4 text-indigo-50 dark:text-indigo-900/10 opacity-50 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Cohorts</h2>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{classes.length} Active</span>
                    </div>
                    <button 
                        onClick={() => { setIsCreatingCohort(!isCreatingCohort); setNewCohortName(''); }}
                        className={`relative z-10 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all active:scale-95 ${isCreatingCohort ? 'bg-rose-500 text-white shadow-rose-200 dark:shadow-none' : 'bg-slate-900 dark:bg-indigo-600 text-white shadow-slate-200 dark:shadow-none'}`}
                    >
                        {isCreatingCohort ? <X size={24} /> : <Plus size={24} />}
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {isCreatingCohort && (
                        <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl animate-in slide-in-from-top-4 duration-300">
                            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Forge New Cohort</label>
                            <input autoFocus value={newCohortName} onChange={e => setNewCohortName(e.target.value)} placeholder="e.g. Bio 101..." className="w-full bg-white/10 border-2 border-indigo-400/50 rounded-xl px-4 py-3 mb-3 text-sm font-black text-white placeholder:text-indigo-300 focus:outline-none focus:border-white transition-all" onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()} />
                            <button disabled={!newCohortName.trim()} onClick={handleCreateSubmit} className="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"><Flame size={16} /> Deploy</button>
                        </div>
                    )}

                    {classes.map((cls: any) => (
                        <button key={cls.id} onClick={() => setSelectedClassId(cls.id)} className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${selectedClassId === cls.id ? 'bg-indigo-600 border-indigo-600 shadow-xl dark:shadow-indigo-900/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h3 className={`text-lg font-black leading-tight pr-4 ${selectedClassId === cls.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{cls.name}</h3>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedClassId === cls.id ? 'bg-indigo-500 text-indigo-50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><Users size={14} /></div>
                            </div>
                            <div className={`flex items-center justify-between text-xs font-bold relative z-10 ${selectedClassId === cls.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                <span>{cls.students?.length || 0} Enrolled</span>
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${selectedClassId === cls.id ? 'bg-indigo-500/50 text-white' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}><Activity size={12} /> {cls.pulse || 85}%</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: DETAIL VIEW */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative min-h-0 transition-colors">
                {!activeClass ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/20">
                        <BookOpen size={40} className="text-slate-300 dark:text-slate-700 mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Select a Cohort</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm text-center uppercase tracking-widest text-xs">Manage student rosters and curriculum assignments.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 min-h-0">
                        <header className="px-8 md:px-10 pt-10 pb-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 relative shrink-0">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex-1 pr-8">
                                    <span className="inline-block px-3 py-1 bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase mb-3">ID: {activeClass.id}</span>
                                    <div className="flex items-center gap-3 group">
                                        <input className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white bg-transparent border-none p-0 outline-none w-full italic tracking-tighter focus:text-indigo-600 dark:focus:text-indigo-400 transition-colors" value={activeClass.name} onChange={(e) => onRenameClass(activeClass.id, e.target.value)} />
                                        <Edit3 size={18} className="text-slate-300 dark:text-slate-700" />
                                    </div>
                                </div>
                                <button onClick={() => { if(window.confirm('Delete this cohort permanently?')) { onDeleteClass(activeClass.id); setSelectedClassId(null); } }} className="p-3 text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-2xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><Trash2 size={18} /></button>
                            </div>
                            <div className="flex gap-6 relative bottom-[-1px]">
                                <button onClick={() => setActiveTab('roster')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'roster' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}>Roster</button>
                                <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 transition-colors ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-400'}`}>Curriculum Hub</button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 pb-20 bg-white dark:bg-slate-950 relative transition-colors">
                            {activeTab === 'roster' && (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <form onSubmit={handleAddStudent} className="flex items-center bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 rounded-2xl p-1.5 transition-colors">
                                        <div className="pl-4 pr-2 text-slate-400"><Mail size={18} /></div>
                                        <input type="email" placeholder="Invite student email..." value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="flex-1 bg-transparent border-none py-3 text-sm font-bold outline-none dark:text-white" />
                                        <button type="submit" disabled={!newStudentEmail.trim()} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all disabled:opacity-50">Enroll</button>
                                    </form>
                                    
                                    <div className="border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Scholar</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Protocol</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-slate-50 dark:divide-slate-900">
                                                {activeClass.students?.map((s: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl font-black flex items-center justify-center text-sm bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                                                    {(s.name?.[0] || s.email[0]).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="font-black text-slate-800 dark:text-white block">{s.name || 'Anonymous Scholar'}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            {/* 🔥 FIXED: WIRE UP THE REMOVE STUDENT ACTION */}
                                                            <button 
                                                                onClick={() => { if(window.confirm(`Remove ${s.email} from cohort?`)) onRemoveStudent(activeClass.id, s.email); }}
                                                                className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X size={18} strokeWidth={3} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(!activeClass.students || activeClass.students.length === 0) && (
                                            <div className="p-20 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-widest text-xs">
                                                Roster is currently empty
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ASSIGNMENTS CONTENT */}
                            {activeTab === 'assignments' && (
                                <div className="space-y-10 animate-in fade-in duration-300">
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
                                        {[
                                            { id: 'packages', label: 'Packages', icon: <Package size={14} /> },
                                            { id: 'standalone', label: 'Modules', icon: <Puzzle size={14} /> },
                                            { id: 'vocab', label: 'Arena', icon: <Monitor size={14} /> }
                                        ].map(m => (
                                            <button key={m.id} onClick={() => setAssignMode(m.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignMode === m.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{m.icon} {m.label}</button>
                                        ))}
                                    </div>

                                    {/* MAPPING REMAINS LARGELY SAME BUT WITH DARK MODE CLASSES */}
                                    {assignMode === 'packages' && (
                                        <div className="space-y-8">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input type="text" placeholder="Scan library..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-12 pr-4 py-3 rounded-xl font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {filteredCurriculums.map((curr: any) => (
                                                    <div key={curr.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 flex items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
                                                        <div className="w-20 h-20 rounded-2xl bg-indigo-600 shrink-0 overflow-hidden shadow-lg border-2 border-white dark:border-slate-800">{curr.coverImage && <img src={curr.coverImage} className="w-full h-full object-cover" />}</div>
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-slate-800 dark:text-white leading-tight mb-1">{curr.title}</h4>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">{curr.lessonIds?.length} Mission Units</p>
                                                            <button onClick={() => handleBulkAssign(curr)} className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all">Assign Protocol</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {assignMode === 'vocab' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {Object.entries(allDecks).map(([key, deck]: [string, any]) => (
                                                <div key={key} className="flex flex-col bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] hover:border-indigo-500 transition-all shadow-xl overflow-hidden group">
                                                    <div className="flex items-center gap-4 p-6 text-left border-b border-slate-800">
                                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><Zap size={24} fill="currentColor" /></div>
                                                        <div>
                                                            <h4 className="font-black text-white text-base leading-tight mb-1">{deck.title || 'Untitled'}</h4>
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{deck.cards?.length || 0} Battle Targets</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex bg-black/50">
                                                        <button onClick={() => onStartVocabGame(key, activeClass.id)} className="flex-1 p-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors border-r border-slate-800 flex items-center justify-center gap-2">
                                                            <Zap size={14} /> Classic Arena
                                                        </button>
                                                        <button onClick={() => onStartConnectFour(key, activeClass.id)} className="flex-1 p-4 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                                                            <Swords size={14} /> Connect 4
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="shrink-0 pt-10 border-t-2 border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-500" /> Active Roster Playlist
                                            </h3>
                                            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20">{assignedLessons.length} Modules Active</span>
                                        </div>

                                        <div className="space-y-4">
                                            {assignedLessons.length === 0 ? (
                                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                                                    <Package size={40} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                                                    <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">Playlist is currently empty.</p>
                                                </div>
                                            ) : (
                                                assignedLessons.map((l: any, idx: number) => (
                                                    <div key={l.id} className="flex items-center p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex items-center justify-center text-[10px] font-black mr-4 shadow-inner">{idx + 1}</div>
                                                        <div className="flex-1 pr-4">
                                                            <h4 className="font-black text-sm text-slate-800 dark:text-white">{l.title}</h4>
                                                            <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-widest">{l.subject || 'Standard Module'}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => onStartPresentation(l.id, activeClass.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"><Play size={14} fill="currentColor" /> Present</button>
                                                            <button onClick={() => onRevoke(activeClass.id, l.id)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"><Trash2 size={18} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
