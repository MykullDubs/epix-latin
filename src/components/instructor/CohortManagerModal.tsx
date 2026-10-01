// src/components/instructor/CohortManagerModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, UserMinus, Key, Crown, School } from 'lucide-react';

export default function CohortManagerModal({ 
    isOpen, 
    onClose, 
    classes, 
    onCreateClass, 
    onDeleteClass, 
    onRemoveStudent,
    isPro,            
    onUpgradeClick    
}: any) {
    const [newClassName, setNewClassName] = useState('');
    const [activeClassId, setActiveClassId] = useState<string | null>(classes?.[0]?.id || null);

    // Keep active class synced if classes load asynchronously
    useEffect(() => {
        if (!activeClassId && classes?.length > 0) {
            setActiveClassId(classes[0].id);
        }
    }, [classes, activeClassId]);

    if (!isOpen) return null;

    const activeClass = classes?.find((c: any) => c.id === activeClassId) || classes?.[0];
    
    // THE GATEKEEPER CHECK
    const atClassLimit = !isPro && (classes?.length || 0) >= 2;

    const handleCreate = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newClassName.trim() || atClassLimit) return;
        onCreateClass(newClassName);
        setNewClassName('');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 font-sans">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* LEFT SIDEBAR: Class List */}
                <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col relative z-10">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <School size={22} className="text-indigo-500" /> My Classes
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {!classes || classes.length === 0 ? (
                            <p className="text-sm text-slate-500 font-medium text-center mt-10">No classes yet.</p>
                        ) : (
                            classes.map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveClassId(c.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group ${activeClass?.id === c.id ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <div className="font-bold line-clamp-1">{c.name}</div>
                                    <div className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${activeClass?.id === c.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        <Users size={14} /> {c.students?.length || 0} Students
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex flex-col gap-3">
                            {atClassLimit ? (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-amber-600 dark:text-amber-500 text-center">
                                        Free tier limit reached (2/2)
                                    </div>
                                    <button 
                                        onClick={onUpgradeClick}
                                        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Crown size={18} strokeWidth={2.5} /> Unlock Unlimited
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCreate} className="space-y-3">
                                    <input 
                                        type="text"
                                        placeholder="New class name..."
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-800 dark:text-white transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!newClassName.trim()}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                                    >
                                        <Plus size={18} strokeWidth={2.5} /> Create Class
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Class Details & Roster */}
                <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-all shadow-sm z-20">
                        <X size={20} strokeWidth={2.5} />
                    </button>

                    {activeClass ? (
                        <>
                            <div className="p-8 md:p-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6 pr-12">{activeClass.name}</h1>
                                
                                <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm inline-flex">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm shrink-0">
                                        <Key size={24} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Student Join Code</p>
                                        <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest leading-none">{activeClass.id.substring(0,6).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Class Roster</h3>
                                    <span className="text-xs font-medium text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg shadow-sm">{activeClass.students?.length || 0} enrolled</span>
                                </div>

                                <div className="space-y-3">
                                    {!activeClass.students || activeClass.students.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                <Users size={24} />
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">No students yet</p>
                                            <p className="text-sm text-slate-500 mt-1 font-medium">Give them the join code above to get started.</p>
                                        </div>
                                    ) : (
                                        activeClass.students.map((student: any) => (
                                            <div key={student.id || student.email} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0">
                                                        {student.name?.[0]?.toUpperCase() || student.email?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{student.name || student.email.split('@')[0]}</span>
                                                        <span className="text-xs font-medium text-slate-500 mt-0.5">{student.email}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => onRemoveStudent(activeClass.id, student.email)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                                    title="Remove Student"
                                                >
                                                    <UserMinus size={18} strokeWidth={2} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end">
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete "${activeClass.name}"? This cannot be undone.`)) {
                                            onDeleteClass(activeClass.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-slate-500 hover:text-rose-600 bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                >
                                    <Trash2 size={16} /> Delete Class
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-medium p-10">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-4 shadow-sm text-slate-400">
                                <School size={28} />
                            </div>
                            Select or create a class to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
