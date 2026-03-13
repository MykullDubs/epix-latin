// src/components/instructor/ClassManagerView.tsx
import React, { useState } from 'react';
import { 
    Users, Plus, X, Flame, BookOpen, Edit3, Trash2, Mail, 
    Activity, Search, Gamepad2, CheckCircle2, Monitor, Filter, Library, Package, Puzzle 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

// ============================================================================
//  CLASS MANAGER VIEW (Scroll Bug Fixed)
// ============================================================================
export default function ClassManagerView({ 
    user, 
    classes = [], 
    lessons = [], 
    curriculums = [], 
    allDecks = [],
    onAssign, 
    onAssignCurriculum, 
    onRevoke, 
    onCreateClass, 
    onDeleteClass, 
    onRenameClass, 
    onUpdateClassDescription,
    onAddStudent,
    onStartPresentation
}: any) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'roster' | 'assignments'>('roster');
    
    // Toggle between bulk assign and single assign
    const [assignMode, setAssignMode] = useState<'packages' | 'standalone'>('packages');
    
    // Form States
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false); 
    
    // Creation & Search States
    const [isCreatingCohort, setIsCreatingCohort] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 
    const [lessonSearch, setLessonSearch] = useState(''); 
    const [activeSubjectFilter, setActiveSubjectFilter] = useState('All'); 

    const activeClass = classes.find((c: any) => c.id === selectedClassId);

    // --- ASSIGNMENT DATA LOGIC ---
    const availableSubjects = ['All', ...Array.from(new Set(curriculums.map((c: any) => c.subject || 'General')))];

    const assignedLessons = lessons.filter((l: any) => activeClass?.assignments?.includes(l.id));
    const unassignedLessons = lessons.filter((l: any) => !activeClass?.assignments?.includes(l.id));
    
    // Filter Curriculums
    const filteredCurriculums = curriculums.filter((c: any) => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = activeSubjectFilter === 'All' || c.subject === activeSubjectFilter;
        return matchesSearch && matchesSubject;
    });

    // Filter Individual Lessons
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
        if (!window.confirm(`Deploy ${curriculum.title} (${curriculum.lessonIds.length} items) to this cohort?`)) return;
        if (onAssignCurriculum) {
            onAssignCurriculum(activeClass.id, curriculum);
        } else {
            curriculum.lessonIds.forEach((id: string) => onAssign(activeClass.id, id));
        }
    };

    return (
        // FIXED: Added min-h-0 to the master container to establish scroll boundaries
        <div className="h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-24 animate-in fade-in duration-500 font-sans min-h-0">
            
            {/* LEFT PANE: THE COHORT LIST (MASTER) */}
            {/* FIXED: Added min-h-0 here as well so the roster list scrolls perfectly */}
            <div className="w-full md:w-[340px] flex flex-col gap-6 shrink-0 min-h-0">
                <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group shrink-0">
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

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {isCreatingCohort && (
                        <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 animate-in slide-in-from-top-4 fade-in duration-300">
                            <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Forge New Cohort</label>
                            <input 
                                autoFocus
                                value={newCohortName}
                                onChange={e => setNewCohortName(e.target.value)}
                                placeholder="e.g. Bio 101 - Fall..."
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
                        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
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
                                    className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <h3 className={`text-lg font-black leading-tight pr-4 ${isSelected ? 'text-white' : 'text-slate-800 group-hover:text-indigo-900'}`}>{cls.name}</h3>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-500 text-indigo-50 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}><Users size={14} /></div>
                                    </div>
                                    <div className={`flex items-center justify-between text-xs font-bold relative z-10 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        <span>{cls.students?.length || 0} Enrolled</span>
                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isSelected ? 'bg-indigo-500/50 text-white' : pulse >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><Activity size={12} /> {pulse}%</span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANE: COHORT DETAILS (DETAIL) */}
            {/* FIXED: Replaced min-h-[600px] with min-h-0 to force internal scrolling */}
            <div className="flex-1 flex flex-col bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden relative min-h-0">
                {!activeClass ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select a Cohort</h2>
                        <p className="text-slate-500 font-bold max-w-sm">Manage subject assignments, class rosters, and live sessions.</p>
                    </div>
                ) : (
                    // FIXED: Added min-h-0 to the inner flex container
                    <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 fade-in min-h-0">
                        
                        {/* FIXED: Added shrink-0 to the header so it doesn't compress */}
                        <header className="px-8 md:px-10 pt-10 pb-0 border-b border-slate-100 bg-slate-50/50 relative shrink-0">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex-1 pr-8">
                                    <span className="inline-block px-3 py-1 bg-slate-200/50 text-slate-500 rounded-lg text-[10px] font-black uppercase mb-3">ID: {activeClass.id}</span>
                                    
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

                                    <div className="flex items-center gap-3 group mt-1">
                                        <input 
                                            className="text-sm font-bold text-slate-400 bg-transparent border-b-2 border-transparent focus:border-indigo-500 p-0 focus:ring-0 w-full max-w-xl transition-colors outline-none placeholder:text-slate-300"
                                            value={activeClass.description || ''}
                                            onChange={(e) => onUpdateClassDescription && onUpdateClassDescription(activeClass.id, e.target.value)}
                                            onFocus={() => setIsEditingDesc(true)}
                                            onBlur={() => setIsEditingDesc(false)}
                                            placeholder="Add a syllabus description or welcome message..."
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
                                <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Curriculum Hub</button>
                            </div>
                        </header>

                        {/* FIXED: The actual scrolling container. Added pb-10 so the bottom items aren't cut off */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 pb-20 bg-white relative">
                            
                            {/* --- TAB: ROSTER --- */}
                            {activeTab === 'roster' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <form onSubmit={handleAddStudent} className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-indigo-500 rounded-2xl p-1.5 shadow-sm transition-colors">
                                        <div className="pl-4 pr-2 text-slate-400"><Mail size={18} /></div>
                                        <input 
                                            type="email" 
                                            placeholder="Invite student by email..." 
                                            value={newStudentEmail}
                                            onChange={e => setNewStudentEmail(e.target.value)}
                                            className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-800 outline-none"
                                        />
                                        <button type="submit" disabled={!newStudentEmail.trim()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all">Enroll</button>
                                    </form>
                                    <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/80 border-b-2 border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Status</th>
                                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-slate-50">
                                                {activeClass.students?.length === 0 ? (
                                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-sm font-bold text-slate-500">The roster is empty.</td></tr>
                                                ) : (
                                                    activeClass.students.map((student: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 group transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-[1rem] font-black flex items-center justify-center text-sm shadow-inner border ${!student.name ? 'bg-slate-50 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>{(student.name?.[0] || 'S').toUpperCase()}</div>
                                                                    <div><span className={`font-bold mb-0.5 ${!student.name ? 'text-slate-400 italic' : 'text-slate-800'}`}>{student.name || 'Pending Install'}</span><span className="text-xs font-bold text-slate-400 block">{student.email}</span></div>
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

                            {/* --- TAB: CURRICULUM HUB --- */}
                            {activeTab === 'assignments' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
                                    
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
                                        <button 
                                            onClick={() => setAssignMode('packages')}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignMode === 'packages' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Package size={14} /> Full Packages
                                        </button>
                                        <button 
                                            onClick={() => setAssignMode('standalone')}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assignMode === 'standalone' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Puzzle size={14} /> Standalone Modules
                                        </button>
                                    </div>

                                    {/* MODE 1: CURRICULUM PACKAGES (BULK) */}
                                    {assignMode === 'packages' && (
                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 shrink-0">
                                            <div className="absolute top-0 right-0 p-10 opacity-5"><Library size={120} /></div>
                                            <div className="relative z-10">
                                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Curriculum Library</h3>
                                                <p className="text-slate-400 font-medium mb-8">Deploy full-year curriculums to this cohort in one click.</p>
                                                
                                                <div className="flex flex-col md:flex-row gap-4 mb-8">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                        <input 
                                                            type="text"
                                                            placeholder="Search subjects, topics, or grades..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 pl-12 pr-4 py-3 rounded-xl font-bold focus:outline-none focus:border-indigo-400 focus:bg-white/20 transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                                                        <Filter size={16} className="text-slate-500 mr-1 shrink-0" />
                                                        {availableSubjects.map(sub => (
                                                            <button 
                                                                key={sub as string}
                                                                onClick={() => setActiveSubjectFilter(sub as string)}
                                                                className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shrink-0 transition-colors ${activeSubjectFilter === sub ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                            >
                                                                {sub as string}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {filteredCurriculums.map((curr: any) => (
                                                        <div key={curr.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors flex items-start gap-4">
                                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shrink-0 overflow-hidden shadow-inner">
                                                                {curr.coverImage && <img src={curr.coverImage} alt={curr.title} className="w-full h-full object-cover mix-blend-overlay" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block mb-1">{curr.subject || 'General'} • {curr.grade || curr.level}</span>
                                                                <h4 className="text-lg font-black text-white leading-tight mb-1">{curr.title}</h4>
                                                                <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-3">{curr.lessonIds?.length} Modules</p>
                                                                <button 
                                                                    onClick={() => handleBulkAssign(curr)}
                                                                    className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-700 transition-colors active:scale-95"
                                                                >
                                                                    Deploy to Cohort
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {filteredCurriculums.length === 0 && (
                                                        <div className="col-span-full py-8 text-center text-slate-500 font-bold">No curriculums match your search.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* MODE 2: STANDALONE MODULES (INDIVIDUAL) */}
                                    {assignMode === 'standalone' && (
                                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 relative animate-in zoom-in-95 duration-300 shrink-0">
                                            <h3 className="text-lg font-black text-slate-800 mb-1">Add Individual Module</h3>
                                            <p className="text-xs font-bold text-slate-400 mb-5">Search your library for specific lessons, arcades, or exams.</p>
                                            <div className="relative group">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={18} />
                                                <input 
                                                    type="text"
                                                    placeholder="Search standalone modules..."
                                                    value={lessonSearch}
                                                    onChange={(e) => setLessonSearch(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-colors"
                                                />
                                                {lessonSearch.trim() && (
                                                    <div className="absolute top-[110%] left-0 right-0 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto z-50">
                                                        {filteredUnassigned.length === 0 ? (
                                                            <div className="p-6 text-center text-sm font-bold text-slate-400">No unassigned modules found.</div>
                                                        ) : (
                                                            filteredUnassigned.map((lesson: any) => (
                                                                <button
                                                                    key={lesson.id}
                                                                    onClick={() => { onAssign(activeClass.id, lesson.id); setLessonSearch(''); }}
                                                                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 border-b border-slate-50 text-left group"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                                                            {lesson.contentType === 'exam' ? <CheckCircle2 size={18} className="text-rose-500"/> : lesson.type === 'arcade_game' ? <Gamepad2 size={18} /> : <BookOpen size={18} />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-sm text-slate-800">{lesson.title || 'Untitled'}</p>
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">
                                                                                {lesson.contentType === 'exam' ? 'Assessment' : lesson.type === 'arcade_game' ? 'Arcade' : 'Standard'} • {lesson.subject || 'General'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-transparent group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plus size={16} strokeWidth={3} /></div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTIVE PLAYLIST SECTION */}
                                    <div className="shrink-0">
                                        <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-3">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Active Playlist</h3>
                                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">{assignedLessons.length} Modules</span>
                                        </div>
                                        
                                        {assignedLessons.length === 0 ? (
                                            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem]"><BookOpen size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-sm font-bold text-slate-500">Playlist is empty. Add modules above.</p></div>
                                        ) : (
                                            <div className="space-y-3">
                                                {assignedLessons.map((lesson: any, idx: number) => {
                                                    const isExam = lesson.contentType === 'exam';
                                                    
                                                    return (
                                                        <div key={lesson.id} className={`flex items-center p-4 rounded-2xl border-2 bg-white shadow-sm transition-all group animate-in fade-in ${isExam ? 'border-rose-100 hover:border-rose-200' : 'border-slate-100 hover:border-slate-200'}`}>
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black mr-4 shrink-0">{idx + 1}</div>
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${isExam ? 'bg-rose-50 text-rose-500' : lesson.type === 'arcade_game' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                                {isExam ? <CheckCircle2 size={20} /> : lesson.type === 'arcade_game' ? <Gamepad2 size={20} /> : <BookOpen size={20} />}
                                                            </div>
                                                            <div className="flex-1 pr-4">
                                                                <h4 className={`font-black text-sm mb-0.5 ${isExam ? 'text-rose-700' : 'text-slate-800'}`}>{lesson.title}</h4>
                                                                <span className={`text-[10px] font-black uppercase ${isExam ? 'text-rose-400' : 'text-slate-400'}`}>
                                                                    {isExam ? 'High-Stakes Assessment' : lesson.subject || 'Standard Module'}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* ACTION BUTTON GROUP */}
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
                                                    )
                                                })}
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
