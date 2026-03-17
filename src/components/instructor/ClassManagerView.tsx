// src/components/instructor/ClassManagerView.tsx
import React, { useState } from 'react';
import { 
    Users, Plus, X, Flame, BookOpen, Edit3, Trash2, Mail, 
    Activity, Search, Gamepad2, CheckCircle2, Monitor, Filter, Library, Package, Puzzle, Play, Zap 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

// ============================================================================
//  CLASS MANAGER VIEW (Strict Type Safe & Live Arena Enabled)
// ============================================================================
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
    onStartPresentation,
    onStartVocabGame 
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    const [assignMode, setAssignMode] = useState<'packages' | 'standalone' | 'vocab'>('packages');
    
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false); 
    
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 
    const [lessonSearch, setLessonSearch] = useState(''); 
    const [activeSubjectFilter, setActiveSubjectFilter] = useState('All'); 

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

    // --- DATA LOGIC (Strict Type Fix Applied) ---
    const availableSubjects: string[] = [
        'All', 
        ...Array.from(new Set(curriculums.map((c: any) => (c.subject as string) || 'General')))
    ];

    const assignedLessons = lessons.filter((l: any) => activeClass?.assignments?.includes(l.id));
    const unassignedLessons = lessons.filter((l: any) => !activeClass?.assignments?.includes(l.id));
    
    const filteredCurriculums = curriculums.filter((c: any) => {
        const title = (c.title as string) || '';
        const description = (c.description as string) || '';
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

    return (
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-24 animate-in fade-in duration-500 font-sans min-h-0">
            
            {/* LEFT PANE: THE COHORT LIST */}
            <div className="w-full md:w-[340px] flex flex-col gap-6 shrink-0 min-h-0">
                <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group shrink-0">
                    <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cohorts</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{classes.length} Active</span>
                    </div>
                    <button 
                        onClick={() => { setIsCreatingCohort(!isCreatingCohort); setNewCohortName(''); }}
                        className={`relative z-10 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all active:scale-95 ${isCreatingCohort ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        {isCreatingCohort ? <X size={24} /> : <Plus size={24} />}
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {isCreatingCohort && (
                        <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 animate-in slide-in-from-top-4 duration-300">
                            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Forge New Cohort</label>
                            <input autoFocus value={newCohortName} onChange={e => setNewCohortName(e.target.value)} placeholder="e.g. Bio 101..." className="w-full bg-white/10 border-2 border-indigo-400/50 rounded-xl px-4 py-3 mb-3 text-sm font-black text-white placeholder:text-indigo-300 focus:outline-none focus:border-white transition-all" onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()} />
                            <button disabled={!newCohortName.trim()} onClick={handleCreateSubmit} className="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"><Flame size={16} /> Deploy</button>
                        </div>
                    )}

                    {classes.map((cls: any) => (
                        <button key={cls.id} onClick={() => setSelectedClassId(cls.id)} className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${selectedClassId === cls.id ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h3 className={`text-lg font-black leading-tight pr-4 ${selectedClassId === cls.id ? 'text-white' : 'text-slate-800'}`}>{cls.name}</h3>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedClassId === cls.id ? 'bg-indigo-500 text-indigo-50' : 'bg-slate-100 text-slate-400'}`}><Users size={14} /></div>
                            </div>
                            <div className={`flex items-center justify-between text-xs font-bold relative z-10 ${selectedClassId === cls.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                <span>{cls.students?.length || 0} Enrolled</span>
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${selectedClassId === cls.id ? 'bg-indigo-500/50 text-white' : 'bg-emerald-50 text-emerald-600'}`}><Activity size={12} /> {cls.pulse || 85}%</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: DETAIL VIEW */}
            <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative min-h-0">
                {!activeClass ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
                        <BookOpen size={40} className="text-slate-300 mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select a Cohort</h2>
                        <p className="text-slate-500 font-bold max-w-sm text-center">Manage student rosters and curriculum assignments.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 min-h-0">
                        <header className="px-8 md:px-10 pt-10 pb-0 border-b border-slate-100 bg-slate-50/50 relative shrink-0">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex-1 pr-8">
                                    <span className="inline-block px-3 py-1 bg-slate-200/50 text-slate-500 rounded-lg text-[10px] font-black uppercase mb-3">ID: {activeClass.id}</span>
                                    <div className="flex items-center gap-3 group">
                                        <input className="text-3xl md:text-4xl font-black text-slate-900 bg-transparent border-none p-0 outline-none w-full" value={activeClass.name} onChange={(e) => onRenameClass(activeClass.id, e.target.value)} />
                                        <Edit3 size={18} className="text-slate-300" />
                                    </div>
                                </div>
                                <button onClick={() => { onDeleteClass(activeClass.id); setSelectedClassId(null); }} className="p-3 text-slate-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all shadow-sm bg-white border border-slate-200"><Trash2 size={18} /></button>
                            </div>
                            <div className="flex gap-6 relative bottom-[-1px]">
                                <button onClick={() => setActiveTab('roster')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 ${activeTab === 'roster' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Roster</button>
                                <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-sm font-black uppercase tracking-widest border-b-4 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Curriculum Hub</button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 pb-20 bg-white relative">
                            {/* ROSTER CONTENT */}
                            {activeTab === 'roster' && (
                                <div className="space-y-8">
                                    <form onSubmit={handleAddStudent} className="flex items-center bg-white border-2 border-slate-200 focus-within:border-indigo-500 rounded-2xl p-1.5 transition-colors">
                                        <div className="pl-4 pr-2 text-slate-400"><Mail size={18} /></div>
                                        <input type="email" placeholder="Invite student..." value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} className="flex-1 bg-transparent border-none py-3 text-sm font-bold outline-none" />
                                        <button type="submit" disabled={!newStudentEmail.trim()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-600 transition-all">Enroll</button>
                                    </form>
                                    <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b-2 border-slate-100">
                                                <tr><th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Student</th><th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Actions</th></tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-slate-50">
                                                {activeClass.students?.map((s: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl font-black flex items-center justify-center bg-indigo-50 text-indigo-600 border">{(s.name?.[0] || s.email[0]).toUpperCase()}</div><div><span className="font-bold text-slate-800 block">{s.name || 'Scholar'}</span><span className="text-xs font-bold text-slate-400">{s.email}</span></div></div></td>
                                                        <td className="px-6 py-4 text-right"><button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={16} /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ASSIGNMENTS CONTENT */}
                            {activeTab === 'assignments' && (
                                <div className="space-y-10">
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                                        {[
                                            { id: 'packages', label: 'Full Packages', icon: <Package size={14} /> },
                                            { id: 'standalone', label: 'Modules', icon: <Puzzle size={14} /> },
                                            { id: 'vocab', label: 'Live Arena', icon: <Monitor size={14} /> }
                                        ].map(m => (
                                            <button key={m.id} onClick={() => setAssignMode(m.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${assignMode === m.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{m.icon} {m.label}</button>
                                        ))}
                                    </div>

                                    {assignMode === 'packages' && (
                                        <div className="space-y-8 animate-in zoom-in-95 duration-300">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Search library..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-3 rounded-xl font-bold outline-none" /></div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                                    <Filter size={16} className="text-slate-400" />
                                                    {availableSubjects.map((sub: string) => (
                                                        <button key={sub} onClick={() => setActiveSubjectFilter(sub)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-colors ${activeSubjectFilter === sub ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{sub}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {filteredCurriculums.map((curr: any) => (
                                                    <div key={curr.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-indigo-300 transition-colors">
                                                        <div className="w-16 h-16 rounded-xl bg-indigo-600 shrink-0 overflow-hidden shadow-md">{curr.coverImage && <img src={curr.coverImage} className="w-full h-full object-cover" />}</div>
                                                        <div className="flex-1"><h4 className="font-black text-slate-800 leading-tight mb-1">{curr.title}</h4><p className="text-xs text-slate-400 font-bold mb-4">{curr.lessonIds?.length} Units</p>
                                                            <button onClick={() => handleBulkAssign(curr)} className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Deploy</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {assignMode === 'standalone' && (
                                        <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                            <div className="relative group">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input type="text" placeholder="Search modules..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl font-bold text-slate-800 outline-none transition-colors" />
                                                {lessonSearch.trim() && (
                                                    <div className="absolute top-[110%] left-0 right-0 bg-white border-2 border-slate-100 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto z-50">
                                                        {filteredUnassigned.map((l: any) => (
                                                            <button key={l.id} onClick={() => { onAssign(activeClass.id, l.id); setLessonSearch(''); }} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 text-left">
                                                                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><BookOpen size={18} /></div><p className="font-bold text-sm text-slate-800">{l.title}</p></div>
                                                                <Plus size={16} className="text-slate-300" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {assignMode === 'vocab' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                                            {Object.entries(allDecks).map(([key, deck]: [string, any]) => (
                                                <button key={key} onClick={() => onStartVocabGame(key, activeClass.id)} className="flex items-center gap-4 p-5 bg-slate-900 border-2 border-slate-800 rounded-[2rem] hover:border-indigo-500 transition-all text-left shadow-xl group">
                                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"><Zap size={24} fill="currentColor" /></div>
                                                    <div><h4 className="font-black text-white text-base leading-tight mb-1">{deck.title || 'Untitled'}</h4><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{deck.cards?.length || 0} Targets • Launch</p></div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="shrink-0 pt-8 border-t-2 border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Active Playlist</h3>
                                        <div className="space-y-3">
                                            {assignedLessons.length === 0 ? (
                                                <p className="text-slate-300 font-bold text-center py-8">Playlist is empty.</p>
                                            ) : (
                                                assignedLessons.map((l: any, idx: number) => (
                                                    <div key={l.id} className="flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white group">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black mr-4">{idx + 1}</div>
                                                        <div className="flex-1 pr-4"><h4 className="font-black text-sm text-slate-800">{l.title}</h4><span className="text-[10px] font-black uppercase text-slate-400">{l.subject || 'Module'}</span></div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => onStartPresentation(l.id, activeClass.id)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors"><Play size={14} fill="currentColor" /> Present</button>
                                                            <button onClick={() => onRevoke(activeClass.id, l.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"><Trash2 size={16} /></button>
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
