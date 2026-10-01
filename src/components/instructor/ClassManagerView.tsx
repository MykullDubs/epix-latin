// src/components/instructor/ClassManagerView.tsx
import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, X, BookOpen, Edit3, Trash2, Mail, 
    Activity, Search, Monitor, Package, Puzzle, Play, Zap, Swords, AlertTriangle, School, ChevronRight
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
    onRemoveStudent, 
    onStartPresentation,
    onStartVocabGame,
    onStartConnectFour 
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    const [assignMode, setAssignMode] = useState<'packages' | 'standalone' | 'vocab'>('packages');
    
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 
    const [lessonSearch, setLessonSearch] = useState(''); 
    const [activeSubjectFilter, setActiveSubjectFilter] = useState('All'); 

    const [confirmDelete, setConfirmDelete] = useState<{cid: string, email: string} | null>(null);

    // Auto-select the first class if none is selected
    useEffect(() => {
        if (!selectedClassId && classes.length > 0) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

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

    const handleCreateSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedName = newCohortName.trim();
        if (!trimmedName) return;
        
        if (typeof onCreateClass === 'function') {
            onCreateClass(trimmedName);
        } else {
            console.error("onCreateClass prop is missing or not a function in ClassManagerView.");
        }
        setNewCohortName('');
        setIsCreatingCohort(false);
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentEmail.trim() || !activeClass) return;
        if (typeof onAddStudent === 'function') onAddStudent(activeClass.id, newStudentEmail);
        setNewStudentEmail('');
    };

    const handleBulkAssign = (curriculum: any) => {
        if (!window.confirm(`Assign the Pathway "${curriculum.title}" to this cohort?`)) return;
        if (onAssignCurriculum) onAssignCurriculum(activeClass.id, curriculum.id);
        else curriculum.lessonIds.forEach((id: string) => onAssign(activeClass.id, id));
    };

    const defaultDeckKey = Object.keys(allDecks)[0] || 'custom';

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative transition-colors duration-300">
            
            {/* CONFIRMATION OVERLAY */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 pointer-events-auto">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Remove Student?</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            This will remove <span className="font-bold text-indigo-500">{confirmDelete.email}</span> from the cohort.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (typeof onRemoveStudent === 'function') onRemoveStudent(confirmDelete.cid, confirmDelete.email);
                                    setConfirmDelete(null);
                                }}
                                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300 select-none">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <School size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Cohort Manager</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Manage Rosters & Content</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-12">
                
                {/* LEFT PANE: THE COHORT LIST */}
                <div className="w-full md:w-[360px] h-full flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-colors select-none">
                    
                    <div className="p-6 shrink-0 border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Cohorts</h3>
                                <span className="text-xs font-medium text-slate-500">{classes.length} Active Classes</span>
                            </div>
                            <button 
                                onClick={() => { setIsCreatingCohort(!isCreatingCohort); setNewCohortName(''); }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isCreatingCohort ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'}`}
                            >
                                {isCreatingCohort ? <X size={20} /> : <Plus size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {isCreatingCohort && (
                            <form onSubmit={handleCreateSubmit} className="p-5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300 mb-4">
                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 block">Create New Cohort</label>
                                <input 
                                    autoFocus 
                                    value={newCohortName} 
                                    onChange={e => setNewCohortName(e.target.value)} 
                                    placeholder="e.g. Bio 101..." 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors shadow-sm" 
                                />
                                <button type="submit" disabled={!newCohortName.trim()} className="w-full py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">Create</button>
                            </form>
                        )}

                        {classes.length === 0 && !isCreatingCohort ? (
                            <div className="text-center p-8 mt-10">
                                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><School size={24}/></div>
                                <p className="text-slate-500 font-medium text-sm">Create a cohort to begin managing students and content.</p>
                            </div>
                        ) : (
                            classes.map((cls: any) => (
                                <button 
                                    key={cls.id} 
                                    onClick={() => setSelectedClassId(cls.id)} 
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group relative overflow-hidden flex flex-col gap-1.5 ${selectedClassId === cls.id ? 'bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900/50 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
                                >
                                    <div className="flex justify-between items-center relative z-10 w-full">
                                        <h3 className={`text-sm font-bold truncate pr-3 ${selectedClassId === cls.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{cls.name}</h3>
                                        <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${selectedClassId === cls.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-500 relative z-10 w-full">
                                        <span className="flex items-center gap-1.5"><Users size={14} /> {cls.students?.length || 0} Students</span>
                                        <span className="flex items-center gap-1.5"><Activity size={14} /> {cls.pulse || 85}%</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: DETAIL VIEW */}
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors h-full">
                    {!activeClass ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
                            <School size={48} className="text-slate-300 dark:text-slate-700 mb-6" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Select a Cohort</h2>
                            <p className="text-slate-500 font-medium max-w-sm text-sm">Choose a class from the list to manage its roster and curriculum.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 h-full">
                            
                            <header className="px-8 md:px-12 pt-10 pb-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex-1 pr-8">
                                        <span className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm">ID: {activeClass.id.substring(0, 8)}</span>
                                        <div className="flex items-center gap-3 group">
                                            <input className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 outline-none w-full truncate focus:text-indigo-600 dark:focus:text-indigo-400 transition-colors" value={activeClass.name} onChange={(e) => typeof onRenameClass === 'function' && onRenameClass(activeClass.id, e.target.value)} />
                                            <Edit3 size={20} className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                    </div>
                                    <button onClick={() => { if(window.confirm('Delete this cohort permanently?')) { if(typeof onDeleteClass === 'function') onDeleteClass(activeClass.id); setSelectedClassId(null); } }} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm"><Trash2 size={20} /></button>
                                </div>
                                <div className="flex gap-8 relative bottom-[-1px]">
                                    <button onClick={() => setActiveTab('roster')} className={`pb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'roster' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Roster</button>
                                    <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Curriculum</button>
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 transition-colors">
                                {activeTab === 'roster' && (
                                    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300 mx-auto">
                                        <form onSubmit={handleAddStudent} className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 rounded-2xl p-2 transition-all shadow-sm">
                                            <div className="pl-4 pr-3 text-slate-400"><Mail size={20} /></div>
                                            <input type="email" placeholder="Invite student via email..." value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="flex-1 bg-transparent border-none py-2.5 text-sm font-semibold outline-none text-slate-800 dark:text-white placeholder:text-slate-400" />
                                            <button type="submit" disabled={!newStudentEmail.trim()} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-sm">Enroll</button>
                                        </form>
                                        
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 select-none">
                                                    <tr>
                                                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Profile</th>
                                                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                    {(!activeClass.students || activeClass.students.length === 0) ? (
                                                        <tr>
                                                            <td colSpan={2} className="p-16 text-center text-slate-500 font-medium">
                                                                <Users size={32} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                                                Roster is currently empty.<br/>
                                                                <span className="text-sm">Use the input above or share the join code <strong className="text-slate-700 dark:text-slate-300">{activeClass.id.substring(0,6).toUpperCase()}</strong></span>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        activeClass.students.map((s: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                                                                            {(s.name?.[0] || s.email[0]).toUpperCase()}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-base truncate">{s.name || s.email.split('@')[0]}</span>
                                                                            <span className="text-xs font-medium text-slate-500 truncate mt-0.5">{s.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <button 
                                                                        onClick={() => setConfirmDelete({ cid: activeClass.id, email: s.email })}
                                                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all md:opacity-0 group-hover:opacity-100"
                                                                        title="Remove from class"
                                                                    >
                                                                        <UserMinus size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
                                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner border border-slate-200 dark:border-slate-800 select-none [&::-webkit-scrollbar]:hidden">
                                            {[
                                                { id: 'packages', label: 'Pathways', icon: <Package size={16} /> },
                                                { id: 'standalone', label: 'Modules', icon: <Puzzle size={16} /> },
                                                { id: 'vocab', label: 'Games', icon: <Monitor size={16} /> }
                                            ].map(m => (
                                                <button key={m.id} onClick={() => setAssignMode(m.id as any)} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${assignMode === m.id ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{m.icon} {m.label}</button>
                                            ))}
                                        </div>

                                        {assignMode === 'packages' && (
                                            <div className="space-y-6">
                                                <div className="relative w-full select-none">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                    <input type="text" placeholder="Search Pathways..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-12 pr-4 py-3.5 rounded-xl font-semibold text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                                                    {filteredCurriculums.map((curr: any) => (
                                                        <div key={curr.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start gap-5 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-lg group">
                                                            <div className="w-full sm:w-24 aspect-video sm:aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                                {curr.coverImage ? <img src={curr.coverImage} className="w-full h-full object-cover" /> : <BookOpen className="text-slate-300 dark:text-slate-600" size={32}/>}
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center w-full">
                                                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1.5 text-lg">{curr.title}</h4>
                                                                <p className="text-xs font-medium text-slate-500 mb-4">{curr.lessonIds?.length || 0} Modules Included</p>
                                                                <button onClick={() => handleBulkAssign(curr)} className="w-full sm:w-fit px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors shadow-sm active:scale-95">Assign Pathway</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {assignMode === 'vocab' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                                                {Object.entries(allDecks).map(([key, deck]: [string, any]) => (
                                                    <div key={key} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-lg overflow-hidden group">
                                                        <div className="flex items-center gap-5 p-6 text-left border-b border-slate-100 dark:border-slate-800/50">
                                                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-105 transition-transform shadow-sm shrink-0"><Zap size={24} fill="currentColor" /></div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1 truncate">{deck.title || 'Untitled'}</h4>
                                                                <p className="text-xs font-medium text-slate-500">{deck.cards?.length || 0} Terms Available</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex bg-slate-50 dark:bg-slate-950/50">
                                                            <button onClick={() => typeof onStartVocabGame === 'function' && onStartVocabGame(key, activeClass.id)} className="flex-1 p-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border-r border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2">
                                                                <Zap size={16} /> Arena
                                                            </button>
                                                            <button onClick={() => typeof onStartConnectFour === 'function' && onStartConnectFour(key, activeClass.id)} className="flex-1 p-4 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2">
                                                                <Swords size={16} /> Connect 4
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Assigned Lessons Section */}
                                        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mt-12 select-none">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <CheckCircle2 size={18} className="text-emerald-500" /> Active Roster Syllabus
                                                </h3>
                                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm w-fit">{assignedLessons.length} Modules</span>
                                            </div>

                                            <div className="space-y-4">
                                                {assignedLessons.length === 0 ? (
                                                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
                                                        <Package size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                                        <p className="text-slate-500 font-bold text-sm">Syllabus is empty</p>
                                                    </div>
                                                ) : (
                                                    assignedLessons.map((l: any, idx: number) => (
                                                        <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-sm">
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-500 flex items-center justify-center text-sm font-bold shrink-0 border border-slate-100 dark:border-slate-800">{idx + 1}</div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 truncate">{l.title}</h4>
                                                                    <span className="text-xs font-medium text-slate-500 truncate mt-0.5">{l.subject || 'Standard Module'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0 sm:ml-auto">
                                                                <button onClick={() => typeof onStartPresentation === 'function' && onStartPresentation(l.id, activeClass.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-indigo-100 dark:border-indigo-500/20 active:scale-95"><Play size={16} fill="currentColor" /> Present</button>
                                                                <button onClick={() => typeof onRevoke === 'function' && onRevoke(activeClass.id, l.id)} className="w-11 h-11 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-all flex items-center justify-center active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm" title="Remove from syllabus"><Trash2 size={18} /></button>
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
        </div>
    );
}
