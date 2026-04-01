// src/components/StudentGradebook.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { 
    X, CheckCircle2, ClipboardList, FileText, MessageCircle, 
    ChevronRight, BarChart3, Hexagon, Zap, Activity, Trophy, Target
} from 'lucide-react';

// ============================================================================
//  GRADE DETAIL MODAL (Student View)
// ============================================================================
function GradeDetailModal({ log, onClose }: any) {
    if (!log) return null;
    const { scoreDetail, itemTitle, xp } = log;
    const isExam = scoreDetail && scoreDetail.details; 

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">{itemTitle}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">{new Date(log.timestamp).toLocaleDateString()} • +{xp} XP</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-950">
                    {/* Score Hero */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className={`text-5xl font-black mb-2 ${scoreDetail?.finalScorePct >= 70 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {scoreDetail?.finalScorePct ?? 100}%
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Score</div>
                        {scoreDetail?.instructorFeedback && (
                            <div className="mt-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl max-w-md w-full text-center">
                                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] block mb-2">Instructor Feedback</span>
                                <p className="text-indigo-900 dark:text-indigo-200 font-medium italic leading-relaxed">"{scoreDetail.instructorFeedback}"</p>
                            </div>
                        )}
                    </div>

                    {/* Question Breakdown (Only if it's an Exam) */}
                    {isExam && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Question Breakdown</h3>
                            {scoreDetail.details.map((q: any, idx: number) => {
                                const isEssay = q.type === 'essay';
                                const hasPoints = q.awardedPoints > 0;
                                const isConsideredCorrect = isEssay ? hasPoints : q.isCorrect;
                                
                                const boxColor = isConsideredCorrect ? 'border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-rose-100 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5';
                                const badgeColor = isConsideredCorrect ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400';
                                const badgeLabel = isEssay ? (hasPoints ? 'Graded' : 'Needs Review') : (q.isCorrect ? 'Correct' : 'Incorrect');

                                return (
                                    <div key={idx} className={`p-5 rounded-2xl border-2 ${boxColor}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${badgeColor}`}>
                                                {badgeLabel}
                                            </span>
                                            <span className="text-xs font-black text-slate-400">
                                                {q.awardedPoints || 0} / {q.maxPoints} pts
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 leading-relaxed">{q.prompt}</p>
                                        
                                        <div className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 mb-3 whitespace-pre-wrap font-serif">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 font-sans">Your Answer</span>
                                            {q.studentVal}
                                        </div>

                                        {!isConsideredCorrect && q.correctVal && !isEssay && (
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-3 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                                <CheckCircle2 size={14}/> Correct Answer: {q.correctVal}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl">
                    <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-transform">Close Report</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  STUDENT GRADEBOOK
// ============================================================================
export default function StudentGradebook({ classData, user }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const studentEmail = user?.email || auth?.currentUser?.email;

    useEffect(() => {
        if(!classData.assignments || classData.assignments.length === 0 || !studentEmail) { 
            setLoading(false); 
            return; 
        }
        
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('studentEmail', '==', studentEmail),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const allLogs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            setLogs(allLogs);
            setLoading(false);
        });
        return () => unsub();
    }, [classData, studentEmail]);

    // --- THE FILTER: Only show high-stakes items ---
    const gradedAssignments = classData.assignments?.filter((a: any) => 
        a.contentType === 'test' || a.contentType === 'exam'
    ) || [];

    const getGradeStatus = (assign: any) => {
        let log = logs.find(l => l.itemId === assign.id && l.type === 'completion');
        if (!log && assign.originalId) log = logs.find(l => l.itemId === assign.originalId && l.type === 'completion');
        if (!log) log = logs.find(l => l.itemTitle === assign.title && l.type === 'completion');
        
        if (!log) return { status: 'missing', label: 'Not Taken', color: 'bg-slate-100 dark:bg-slate-800 text-slate-400', interactable: false };
        
        if (log.scoreDetail?.status === 'pending_review') {
            return { status: 'pending', label: 'In Review', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', interactable: true, log };
        }
              
        const score = log.scoreDetail?.score || 0;
        const total = log.scoreDetail?.total || 100;
        const pct = log.scoreDetail?.finalScorePct ?? (total > 0 ? Math.round((score/total)*100) : 0);
              
        let color = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
        if (pct >= 90) color = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        else if (pct >= 70) color = 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400';
        else color = 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400';

        const hasInstructorGrade = log.scoreDetail?.finalScorePct !== undefined;
        const displayLabel = hasInstructorGrade ? `${pct}%` : `${score}/${total} pts`;

        return { status: 'complete', label: displayLabel, color, interactable: true, log, pct };
    };

    // 🔥 DYNAMIC RPG STATS CALCULATIONS
    const totalXp = user?.xp || user?.profile?.main?.xp || 0;
    
    // Calculate Average Exam Score
    const examStatuses = gradedAssignments.map((a: any) => getGradeStatus(a)).filter((s: any) => s.status === 'complete');
    const avgScore = examStatuses.length > 0 
        ? Math.round(examStatuses.reduce((acc: number, curr: any) => acc + (curr.pct || 0), 0) / examStatuses.length) 
        : 100; // Default to 100 if no exams taken

    // Calculate a letter grade based on average exam score
    let grade = "S";
    let gradeColor = "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]";
    if (avgScore < 100) { grade = "A"; gradeColor = "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]"; }
    if (avgScore < 90) { grade = "B+"; gradeColor = "text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]"; }
    if (avgScore < 80) { grade = "B"; gradeColor = "text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]"; }
    if (avgScore < 70) { grade = "C"; gradeColor = "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]"; }
    if (avgScore < 60) { grade = "D"; gradeColor = "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]"; }

    return (
        <div className="space-y-6 px-2 md:px-6 pb-24 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {selectedLog && <GradeDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            
            <div className="flex items-center justify-between mb-8 px-2 mt-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner border border-indigo-500/30">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Service Record</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Performance Analytics</p>
                    </div>
                </div>
            </div>

            {/* 🔥 TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Standing</span>
                    <h3 className={`text-7xl font-black italic tracking-tighter ${gradeColor}`}>{grade}</h3>
                </div>

                <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white border border-indigo-500/30">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none -mt-10 -mr-10"><Hexagon size={250} /></div>
                    <div className="relative z-10 flex flex-col h-full justify-center">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Exam Average</span>
                                <h3 className="text-4xl font-black">{avgScore}%</h3>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Lifetime XP</span>
                                <div className="text-2xl font-black text-emerald-400 flex items-center gap-2 justify-end">
                                    <Zap size={20} fill="currentColor" /> {totalXp.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-1000" style={{ width: `${avgScore}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔥 DYNAMIC RECENT ACTIVITY LOG */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} /> Recent Engagements
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-sm font-bold">No recent activity found. Jump into a module!</div>
                    ) : (
                        logs.slice(0, 4).map((log, i) => {
                            // Map log properties to UI elements
                            const isArena = log.itemTitle?.toLowerCase().includes('arena') || log.itemTitle?.toLowerCase().includes('battle') || log.details === 'Live Arena Protocol';
                            const isExam = log.scoreDetail !== undefined;
                            
                            let icon = <CheckCircle2 size={20} />;
                            let colorClass = 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500';
                            
                            if (isArena) {
                                icon = <Trophy size={20} />;
                                colorClass = 'bg-amber-100 dark:bg-amber-500/20 text-amber-500';
                            } else if (isExam) {
                                icon = <Target size={20} />;
                                colorClass = 'bg-rose-100 dark:bg-rose-500/20 text-rose-500';
                            }

                            const displayScore = isExam ? `${log.scoreDetail?.finalScorePct || 0}%` : 'Completed';
                            const dateStr = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                            return (
                                <div key={i} className="p-5 md:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-4 overflow-hidden pr-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${colorClass}`}>
                                            {icon}
                                        </div>
                                        <div className="truncate">
                                            <h4 className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100 truncate">{log.itemTitle}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-black text-sm md:text-lg text-slate-800 dark:text-white">{displayScore}</div>
                                        <div className="text-[10px] md:text-xs font-black text-emerald-500 tracking-widest">+{log.xp} XP</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* OFFICIAL REPORT CARD (EXAMS) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><ClipboardList size={20}/></div> 
                        Official Report Card
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-2 ml-12">High-Stakes Assessment Tracking</p>
                </div>
                
                {gradedAssignments.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 text-sm font-bold">
                        No exams have been assigned to this cohort yet.
                    </div> 
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {gradedAssignments.map((assign: any) => {
                            const { label, color, interactable, log } = getGradeStatus(assign);
                            return (
                                <button 
                                    key={assign.id} 
                                    disabled={!interactable} 
                                    onClick={() => interactable && setSelectedLog(log)} 
                                    className={`w-full p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group text-left ${interactable ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm">
                                            <FileText size={24}/>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg mb-1">{assign.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Final Assessment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 md:ml-auto">
                                        <div className="text-right">
                                            <span className={`px-4 py-2 rounded-full text-xs font-black shadow-sm ${color}`}>{label}</span>
                                            {log?.scoreDetail?.instructorFeedback && (
                                                <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest">
                                                    <MessageCircle size={12}/> Feedback Available
                                                </div>
                                            )}
                                        </div>
                                        {interactable && <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors"/>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
