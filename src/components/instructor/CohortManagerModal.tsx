// src/components/instructor/CohortManagerModal.tsx
import React, { useState } from 'react';
import { X, Users, Plus, Trash2, UserMinus, Key, Crown } from 'lucide-react';

export default function CohortManagerModal({ 
    isOpen, 
    onClose, 
    classes, 
    onCreateClass, 
    onDeleteClass, 
    onRemoveStudent,
    isPro,            // 🔥 NEW PROP
    onUpgradeClick    // 🔥 NEW PROP
}: any) {
    const [newClassName, setNewClassName] = useState('');
    const [activeClassId, setActiveClassId] = useState<string | null>(classes?.[0]?.id || null);

    if (!isOpen) return null;

    const activeClass = classes?.find((c: any) => c.id === activeClassId) || classes?.[0];
    
    // 🔥 THE GATEKEEPER CHECK
    const atCohortLimit = !isPro && (classes?.length || 0) >= 2;

    const handleCreate = () => {
        if (!newClassName.trim() || atCohortLimit) return;
        onCreateClass(newClassName);
        setNewClassName('');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 font-sans">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* LEFT SIDEBAR: Class List */}
                <div className="w-1/3 border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950 flex flex-col relative z-10">
                    <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <Users size={20} className="text-indigo-500" /> My Cohorts
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {classes.length === 0 ? (
                            <p className="text-sm text-slate-500 font-medium text-center mt-10">No cohorts yet.</p>
                        ) : (
                            classes.map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveClassId(c.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group ${activeClass?.id === c.id ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-500/50' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm hover:-translate-y-0.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
                                >
                                    <div className="font-bold line-clamp-1">{c.name}</div>
                                    <div className={`text-[10px] uppercase tracking-wider mt-1.5 flex items-center gap-1.5 font-semibold ${activeClass?.id === c.id ? 'text-indigo-400 dark:text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                        <Users size={12} /> {c.students?.length || 0} Students
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
                        <div className="flex flex-col gap-3">
                            {atCohortLimit ? (
                                /* 🔥 THE UPGRADE BUTTON (Replaces the input if they hit the limit) */
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 text-center">
                                        Free Tier Limit Reached (2/2)
                                    </div>
                                    <button 
                                        onClick={onUpgradeClick}
                                        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Crown size={16} strokeWidth={2.5} /> Unlock Unlimited
                                    </button>
                                </div>
                            ) : (
                                /* STANDARD CREATION INPUT */
                                <>
                                    <input 
                                        type="text"
                                        placeholder="New cohort name..."
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-800 dark:text-white shadow-sm transition-all"
                                    />
                                    <button 
                                        onClick={handleCreate}
                                        disabled={!newClassName.trim()}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:opacity-50 disabled:shadow-none px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <Plus size={16} strokeWidth={2.5} /> Create Cohort
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Class Details & Roster */}
                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-all shadow-sm hover:shadow z-20 hover:scale-110">
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {activeClass ? (
                        <>
                            <div className="p-8 md:p-10 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-6 pr-12 tracking-tight">{activeClass.name}</h1>
                                
                                <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm inline-flex">
                                    <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-500/20 shadow-sm shrink-0">
                                        <Key size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Student Join Code</p>
                                        <p className="text-2xl md:text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] leading-none">{activeClass.id.substring(0,6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Student Roster</h3>
                                    <span className="text-xs font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md shadow-sm">{activeClass.students?.length || 0} enrolled</span>
                                </div>

                                <div className="space-y-3">
                                    {!activeClass.students || activeClass.students.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-slate-950 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                                                <Users size={24} />
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">No students yet.</p>
                                            <p className="text-sm text-slate-400 mt-1.5 font-medium">Give them the join code above to get started!</p>
                                        </div>
                                    ) : (
                                        activeClass.students.map((student: any) => (
                                            <div key={student.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center font-bold shadow-inner shrink-0">
                                                        {student.name?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{student.name}</span>
                                                </div>
                                                <button 
                                                    onClick={() => onRemoveStudent(activeClass.id, student.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 opacity-100 md:opacity-0 group-hover:opacity-100"
                                                    title="Remove Student"
                                                >
                                                    <UserMinus size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0 flex justify-end">
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this cohort? This cannot be undone.')) {
                                            onDeleteClass(activeClass.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/30 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                                >
                                    <Trash2 size={14} strokeWidth={2.5} /> Delete Cohort
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-medium p-10">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-300 dark:text-slate-500">
                                <Users size={24} />
                            </div>
                            Select or create a cohort to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
