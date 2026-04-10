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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* LEFT SIDEBAR: Class List */}
                <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="text-indigo-500" /> My Cohorts
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {classes.length === 0 ? (
                            <p className="text-sm text-slate-500 font-medium text-center mt-10">No cohorts yet.</p>
                        ) : (
                            classes.map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveClassId(c.id)}
                                    className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeClass?.id === c.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300 border border-slate-200 dark:border-slate-800'}`}
                                >
                                    <div className="line-clamp-1">{c.name}</div>
                                    <div className={`text-[10px] uppercase tracking-widest mt-1 flex items-center gap-1 ${activeClass?.id === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        <Users size={12} /> {c.students?.length || 0} Students
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-2">
                            {atCohortLimit ? (
                                /* 🔥 THE UPGRADE BUTTON (Replaces the input if they hit the limit) */
                                <div className="space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 text-center">
                                        Free Tier Limit Reached (2/2)
                                    </div>
                                    <button 
                                        onClick={onUpgradeClick}
                                        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Crown size={16} strokeWidth={3} /> Unlock Unlimited
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
                                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                    />
                                    <button 
                                        onClick={handleCreate}
                                        disabled={!newClassName.trim()}
                                        className="w-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 disabled:opacity-50 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-500/40 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Create Cohort
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Class Details & Roster */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full transition-colors z-10">
                        <X size={20} />
                    </button>

                    {activeClass ? (
                        <>
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6 pr-12">{activeClass.name}</h1>
                                
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                                    <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl"><Key size={24} /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Student Join Code</p>
                                        <p className="text-3xl font-mono font-black text-indigo-600 tracking-[0.2em] leading-none">{activeClass.id.substring(0,6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Student Roster</h3>
                                    <span className="text-sm font-bold text-slate-400">{activeClass.students?.length || 0} enrolled</span>
                                </div>

                                <div className="space-y-3">
                                    {!activeClass.students || activeClass.students.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
                                            <p className="text-slate-500 font-medium">No students have joined this cohort yet.</p>
                                            <p className="text-sm text-slate-400 mt-2">Give them the join code above to get started!</p>
                                        </div>
                                    ) : (
                                        activeClass.students.map((student: any) => (
                                            <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black">
                                                        {student.name?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{student.name}</span>
                                                </div>
                                                <button 
                                                    onClick={() => onRemoveStudent(activeClass.id, student.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                    title="Remove Student"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this cohort? This cannot be undone.')) {
                                            onDeleteClass(activeClass.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    <Trash2 size={14} /> Delete this Cohort
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
                            Select or create a cohort to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
