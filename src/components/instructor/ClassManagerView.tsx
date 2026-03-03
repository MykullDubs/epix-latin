// src/components/instructor/ClassManagerView.tsx
import React, { useState } from 'react';
import { 
  Users, Plus, X, Flame, BookOpen, Edit3, Trash2, Mail, 
  Activity, Search, Gamepad2, CheckCircle2, Monitor 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

// ============================================================================
//  CLASS MANAGER VIEW (Search Dropdown & Active Playlist)
// ============================================================================
export default function ClassManagerView({ 
    user, 
    classes = [], 
    lessons = [], 
    allDecks = [],
    onAssign, 
    onRevoke, 
    onCreateClass, 
    onDeleteClass, 
    onRenameClass, 
    onUpdateClassDescription, // <--- NEW PROP ADDED
    onAddStudent,
    onStartPresentation
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    
    // Form States
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false); // <--- NEW STATE ADDED
    
    // Creation & Search States
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [lessonSearch, setLessonSearch] = useState('');

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

    // --- ASSIGNMENT DATA LOGIC ---
    const assignedLessons = lessons.filter((l: any) => activeClass?.assignments?.includes(l.id));
    const unassignedLessons = lessons.filter((l: any) => !activeClass?.assignments?.includes(l.id));
    
    const filteredUnassigned = unassignedLessons.filter((l: any) => {
        if (!lessonSearch.trim()) return true;
        const searchStr = `${l.title || 'Untitled'} ${l.type === 'arcade_game' ? 'arcade' : 'unit'}`.toLowerCase();
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

    return (
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-32 animate-in fade-in duration-500 font-sans">
            
            {/* LEFT PANE: THE COHORT LIST (MASTER) */}
            <div className="w-full md:w-[340px] flex flex-col gap-6 shrink-0">
                <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Users size={100} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cohorts</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                            {classes.length} Active
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setIsCreatingCohort(!isCreatingCohort);
                            setNewCohortName('');
                        }}
                        className={`relative z-10 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all active:scale-95 ${isCreatingCohort ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        {isCreatingCohort ? <X size={24} /> : <Plus size={24} />}
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-12">
                    {isCreatingCohort && (
                        <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-200 animate-in slide-in-from-top-4 fade-in duration-300">
                            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Forge New Cohort</label>
                            <input 
                                autoFocus
                                value={newCohortName}
                                onChange={e => setNewCohortName(e.target.value)}
                                placeholder="e.g. KitchenComm Beta..."
                                className="w-full bg-white/10 border-2 border-indigo-400/50 rounded-xl px-4 py-3 mb-3 text-sm font-black text-white placeholder:text-indigo-300 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
                            />
                            <button 
                                disabled={!newCohortName.trim()}
                                onClick={handleCreateSubmit}
                                className="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Flame size={16} /> Deploy
                            </button>
                        </div>
                    )}

                    {classes.length === 0 && !isCreatingCohort ? (
                        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50">
                            <Users size={32} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-500">No cohorts deployed.</p>
                        </div>
                    ) : (
                        classes.map((cls: any) => {
                            const isSelected = selectedClassId === cls.id;
                            const pulse = cls.pulse || Math.floor(Math.random() * 40) + 60; 
                            return (
                                <button 
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <h3 className={`text-lg font-black leading-tight pr-4 ${isSelected ? 'text-white' : 'text-slate-800 group-hover:text-indigo-900'}`}>{cls.name}</h3>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 text-indigo-50 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}><Users size={14} /></div>
                                    </div>
                                    <div className={`flex items-center justify-between text-xs font-bold relative z-10 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        <span>{cls.students?.length || 0} Students</span>
                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isSelected ? 'bg-indigo-500/50 text-white' : pulse >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><Activity size={12} /> {pulse}%</span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANE: COHORT DETAILS (DETAIL) */}
            <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative min-h-[600px]">
                {!activeClass ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select a Cohort</h2>
                        <p className="text-slate-500 font-bold max-w-sm">Manage assignments, rosters, and track progress.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 fade-in">
                        <header className="px-8 pt-8 pb-0 border-b border-slate-100 bg-slate-50/50 relative">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex-1 pr-8">
                                    <span className="inline-block px-3 py-1 bg-slate-200/50 text-slate-500 rounded-lg text-[10px] font-black uppercase mb-3">ID: {activeClass.id}</span>
                                    
                                    {/* TITLE INPUT */}
                                    <div className="flex items-center gap-3 group">
                                        <input 
                                            className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter bg-transparent border-b-2 border-transparent focus:border-indigo-500 p-0 focus:ring-0 w-full max-w-lg transition-colors outline-none"
                                            value={activeClass.name}
                                            onChange={(e) => onRenameClass(activeClass.id, e.target.value)}
                                            onFocus={() => setIsEditingTitle(true)}
                                            onBlur={() => setIsEditingTitle(false)}
                                        />
                                        <Edit3 size={18} className={`text-slate-300 ${isEditingTitle ? 'opacity-0' : 'group-hover:text-indigo-400'}`} />
                                    </div>

                                    {/* DESCRIPTION / SUBTITLE INPUT */}
                                    <div className="flex items-center gap-3 group mt-1">
                                        <input 
                                            className="text-sm font-bold text-slate-400 bg-transparent border-b-2 border-transparent focus:border-indigo-500 p-0 focus:ring-0 w-full max-w-xl transition-colors outline-none placeholder:text-slate-300"
                                            value={activeClass.description || ''}
                                            onChange={(e) => onUpdateClassDescription && onUpdateClassDescription(activeClass.id, e.target.value)}
                                            onFocus={() => setIsEditingDesc(true)}
                                            onBlur={() => setIsEditingDesc(false)}
                                            placeholder="Add a cohort description or welcome message..."
                                        />
                                        <Edit3 size={14} className={`text-slate-300 ${isEditingDesc ? 'opacity-0' : 'group-hover:text-indigo-400'}`} />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { onDeleteClass(activeClass.id); setSelectedClassId(null); }}
                                    className="p-3 text-slate-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all shadow-sm bg-white border border-slate-200 hover:border-rose-500"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="flex gap-6 relative bottom-[-1px]">
                                <button onClick={() => setActiveTab('roster')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'roster' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Roster</button>
                                <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Curriculum</button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white relative">
                            {activeTab === 'roster' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <form onSubmit={handleAddStudent} className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-indigo-500 rounded-2xl p-1.5 shadow-sm transition-colors">
                                        <div className="pl-4 pr-2 text-slate-400"><Mail size={18} /></div>
                                        <input 
                                            type="email" 
                                            placeholder="Enter student email..." 
                                            value={newStudentEmail}
                                            onChange={e => setNewStudentEmail(e.target.value)}
                                            className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-800 outline-none"
                                        />
                                        <button type="submit" disabled={!newStudentEmail.trim()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all">Enroll</button>
                                    </form>
                                    <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Status</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {activeClass.students?.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-sm font-bold text-slate-500">The roster is empty.</td></tr>
                                                ) : (
                                                    activeClass.students.map((student: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 group transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-[1rem] font-black flex items-center justify-center text-sm shadow-inner border ${!student.name ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>{(student.name?.[0] || 'S').toUpperCase()}</div>
                                                                    <div><span className={`font-bold mb-0.5 ${!student.name ? 'text-slate-400 italic' : 'text-slate-800'}`}>{student.name || 'Pending'}</span><span className="text-xs font-bold text-slate-400 block">{student.email}</span></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4"><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full w-[45%] rounded-full ${!student.name ? 'bg-slate-300' : 'bg-emerald-500'}`} /></div></td>
                                                            <td className="px-6 py-4 text-right"><button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={16} strokeWidth={3} /></button></td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'assignments' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 flex flex-col h-full">
                                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 relative z-20">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Add to Curriculum</h3>
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={18} />
                                            <input 
                                                type="text"
                                                placeholder="Search library to add..."
                                                value={lessonSearch}
                                                onChange={(e) => setLessonSearch(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-bold text-slate-800 outline-none"
                                            />
                                            {lessonSearch.trim() && (
                                                <div className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto z-50">
                                                    {filteredUnassigned.length === 0 ? (
                                                        <div className="p-6 text-center text-sm font-bold text-slate-400">No unassigned lessons found.</div>
                                                    ) : (
                                                        filteredUnassigned.map((lesson: any) => (
                                                            <button
                                                                key={lesson.id}
                                                                onClick={() => { onAssign(activeClass.id, lesson.id); setLessonSearch(''); }}
                                                                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 text-left group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">{lesson.type === 'arcade_game' ? <Gamepad2 size={18} /> : <BookOpen size={18} />}</div>
                                                                    <div><p className="font-bold text-sm text-slate-800">{lesson.title || 'Untitled'}</p><p className="text-[10px] font-black text-slate-400 uppercase">{lesson.type === 'arcade_game' ? 'Arcade' : 'Standard'} • {lesson.blocks?.length || 0} Blocks</p></div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-transparent group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plus size={16} strokeWidth={3} /></div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Active Playlist</h3>
                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{assignedLessons.length} Items</span>
                                        </div>
                                        {assignedLessons.length === 0 ? (
                                            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem]"><BookOpen size={32} className="mx-auto text-slate-200 mb-3" /><p className="text-sm font-bold text-slate-500">Playlist is empty.</p></div>
                                        ) : (
                                            <div className="space-y-3">
                                                {assignedLessons.map((lesson: any, idx: number) => (
                                                    <div key={lesson.id} className="flex items-center p-4 rounded-2xl border-2 border-slate-100 bg-white shadow-sm hover:border-slate-200 group animate-in fade-in">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black mr-4 shrink-0">{idx + 1}</div>
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${lesson.type === 'arcade_game' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>{lesson.type === 'arcade_game' ? <Gamepad2 size={20} /> : <BookOpen size={20} />}</div>
                                                        <div className="flex-1 pr-4"><h4 className="font-black text-slate-800 text-sm mb-0.5">{lesson.title}</h4><span className="text-[10px] font-black uppercase text-slate-400">{lesson.type === 'arcade_game' ? 'Arcade Game' : 'Standard Unit'}</span></div>
                                                        
                                                        {/* --- ACTION BUTTON GROUP --- */}
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button 
                                                                onClick={() => onStartPresentation && onStartPresentation(lesson.id)}
                                                                className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                                title="Launch Projector Mode"
                                                            >
                                                                <Monitor size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => onRevoke(activeClass.id, lesson.id)} 
                                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                                                title="Revoke Assignment"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
