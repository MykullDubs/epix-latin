// src/components/StudentGradebook.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { X, CheckCircle2, ClipboardList, FileText, MessageCircle, ChevronRight } from 'lucide-react';

// ============================================================================
//  GRADE DETAIL MODAL (Student View)
// ============================================================================
function GradeDetailModal({ log, onClose }: any) {
    if (!log) return null;
    const { scoreDetail, itemTitle, xp } = log;
    const isExam = scoreDetail && scoreDetail.details; 

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{itemTitle}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{new Date(log.timestamp).toLocaleDateString()} • +{xp} XP</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Score Hero */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className={`text-5xl font-black mb-2 ${scoreDetail?.finalScorePct >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {scoreDetail?.finalScorePct ?? 100}%
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Score</div>
                        {scoreDetail?.instructorFeedback && (
                            <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl max-w-md w-full text-center">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Instructor Feedback</span>
                                <p className="text-indigo-900 font-medium italic">"{scoreDetail.instructorFeedback}"</p>
                            </div>
                        )}
                    </div>

                    {/* Question Breakdown (Only if it's an Exam) */}
                    {isExam && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Question Breakdown</h3>
                            {scoreDetail.details.map((q: any, idx: number) => {
                                // --- THE FIX: SMART STATUS LOGIC ---
                                // If it's an essay and points were awarded, it's considered "Graded" (Good).
                                // Otherwise, fallback to the original isCorrect flag.
                                const isEssay = q.type === 'essay';
                                const hasPoints = q.awardedPoints > 0;
                                const isConsideredCorrect = isEssay ? hasPoints : q.isCorrect;
                                
                                const boxColor = isConsideredCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30';
                                const badgeColor = isConsideredCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                                const badgeLabel = isEssay ? (hasPoints ? 'Graded' : 'Needs Review') : (q.isCorrect ? 'Correct' : 'Incorrect');

                                return (
                                    <div key={idx} className={`p-4 rounded-2xl border-2 ${boxColor}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeColor}`}>
                                                {badgeLabel}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {q.awardedPoints || 0} / {q.maxPoints} pts
                                            </span>
                                        </div>
                                        <p className="font-bold text-slate-800 text-sm mb-2">{q.prompt}</p>
                                        
                                        <div className="text-sm text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-200/50 mb-2 whitespace-pre-wrap font-serif">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Your Answer</span>
                                            {q.studentVal}
                                        </div>

                                        {!isConsideredCorrect && q.correctVal && !isEssay && (
                                            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={12}/> Correct Answer: {q.correctVal}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                    <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-[1.01] transition-transform">Close Report</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
//  STUDENT GRADEBOOK (Filtered: Exams Only)
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
        
        if (!log) return { status: 'missing', label: 'Not Taken', color: 'bg-slate-100 text-slate-400', interactable: false };
        
        if (log.scoreDetail?.status === 'pending_review') {
            return { status: 'pending', label: 'In Review', color: 'bg-amber-100 text-amber-600', interactable: true, log };
        }
              
        const score = log.scoreDetail?.score || 0;
        const total = log.scoreDetail?.total || 100;
        const pct = log.scoreDetail?.finalScorePct ?? (total > 0 ? Math.round((score/total)*100) : 0);
              
        let color = 'bg-slate-100 text-slate-600';
        if (pct >= 90) color = 'bg-emerald-100 text-emerald-600';
        else if (pct >= 70) color = 'bg-indigo-100 text-indigo-600';
        else color = 'bg-rose-100 text-rose-600';

        const hasInstructorGrade = log.scoreDetail?.finalScorePct !== undefined;
        const displayLabel = hasInstructorGrade ? `${pct}%` : `${score}/${total} pts`;

        return { status: 'complete', label: displayLabel, color, interactable: true, log };
    };

    return (
        <>
            {selectedLog && <GradeDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList size={18} className="text-indigo-600"/> Official Report Card
                    </h3>
                </div>
                
                {gradedAssignments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm italic">
                        No exams have been assigned to this cohort yet.
                    </div> 
                ) : (
                    <div className="divide-y divide-slate-100">
                        {gradedAssignments.map((assign: any) => {
                            const { label, color, interactable, log } = getGradeStatus(assign);
                            return (
                                <button 
                                    key={assign.id} 
                                    disabled={!interactable} 
                                    onClick={() => interactable && setSelectedLog(log)} 
                                    className={`w-full p-5 flex items-center justify-between transition-colors group text-left ${interactable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                                            <FileText size={20}/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{assign.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Final Assessment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${color}`}>{label}</span>
                                            {log?.scoreDetail?.instructorFeedback && (
                                                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-indigo-500 font-bold">
                                                    <MessageCircle size={10}/> Feedback
                                                </div>
                                            )}
                                        </div>
                                        {interactable && <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors"/>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
