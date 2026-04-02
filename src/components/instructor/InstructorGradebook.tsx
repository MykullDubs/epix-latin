// src/components/instructor/InstructorGradebook.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { ChevronDown, X, CheckCircle2, MessageSquare, AlertTriangle, FileText, Target } from 'lucide-react';
import { JuicyToast } from '../Toast';

export default function InstructorGradebook({ classData }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'exams' | 'all'>('exams'); 
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    // 🔥 PRO-LMS: SpeedModerator State
    const [reviewingLog, setReviewingLog] = useState<any | null>(null);
    const [localScoreDetails, setLocalScoreDetails] = useState<any | null>(null);

    useEffect(() => {
        if(!classData.assignments || !classData.students) return;
        
        // Map out just the emails for the query if students are objects
        const studentEmails = classData.students.map((s: any) => typeof s === 'string' ? s : s.email).slice(0, 10);
        
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('type', '==', 'completion'),
            where('studentEmail', 'in', studentEmails),
            orderBy('timestamp', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        });
        return () => unsub();
    }, [classData]);

    const displayedAssignments = classData.assignments.filter((a: any) => 
        viewType === 'all' || a.contentType === 'test' || a.contentType === 'exam'
    );

    // --- SPEED MODERATOR LOGIC ---
    const openModerator = (log: any) => {
        setReviewingLog(log);
        // Create a deep copy of the details so we can edit them before saving
        setLocalScoreDetails(JSON.parse(JSON.stringify(log.scoreDetail)));
    };

    const updateQuestionScore = (qId: string, newPoints: number) => {
        if (!localScoreDetails) return;
        const updatedDetails = localScoreDetails.details.map((q: any) => {
            if (q.qId === qId) {
                return { ...q, awardedPoints: Math.min(Math.max(0, newPoints), q.maxPoints) }; // Constrain 0 to Max
            }
            return q;
        });

        // Recalculate Totals
        const newScore = updatedDetails.reduce((sum: number, q: any) => sum + q.awardedPoints, 0);
        const newPct = localScoreDetails.total > 0 ? Math.round((newScore / localScoreDetails.total) * 100) : 0;

        setLocalScoreDetails({
            ...localScoreDetails,
            score: newScore,
            finalScorePct: newPct,
            details: updatedDetails
        });
    };

    const updateQuestionFeedback = (qId: string, text: string) => {
        if (!localScoreDetails) return;
        const updatedDetails = localScoreDetails.details.map((q: any) => {
            if (q.qId === qId) return { ...q, teacherFeedback: text };
            return q;
        });
        setLocalScoreDetails({ ...localScoreDetails, details: updatedDetails });
    };

    const releaseGrade = async () => {
        if (!reviewingLog || !localScoreDetails) return;

        try {
            const logRef = doc(db, 'artifacts', appId, 'activity_logs', reviewingLog.id);
            await setDoc(logRef, {
                scoreDetail: { 
                    ...localScoreDetails, 
                    status: 'graded' // Flips the switch from pending_review
                },
                lastUpdated: Date.now()
            }, { merge: true });

            setToastMsg("Grade Released & Feedback Sent! 🎯");
            setReviewingLog(null);
            setLocalScoreDetails(null);
        } catch (error) {
            setToastMsg("Error saving grade.");
        }
    };

    // --- TABLE CELL RENDERER ---
    const getScoreCell = (studentEmail: string, assign: any) => {
        let log = logs.find(l => l.studentEmail === studentEmail && (l.itemId === assign.id || l.itemTitle === assign.title));
        if (!log) return <span className="text-slate-200">-</span>;
        
        const pct = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
        
        if (log.scoreDetail?.status === 'pending_review') {
            return (
                <button 
                    onClick={() => openModerator(log)} 
                    className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-amber-200 transition-all shadow-sm border border-amber-200 flex items-center justify-center gap-1 w-full"
                >
                    <AlertTriangle size={12} /> Needs Review
                </button>
            );
        }
        
        const color = pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50';
        return (
            <button 
                onClick={() => openModerator(log)}
                className={`text-xs font-black px-2.5 py-1.5 rounded-xl cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all w-full ${color}`}
            >
                {pct}%
            </button>
        );
    };

    return (
        <div className="relative animate-in fade-in duration-500 h-full flex overflow-hidden">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* MAIN TABLE AREA */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ${reviewingLog ? 'mr-[500px]' : ''}`}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                        <button onClick={() => setViewType('exams')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Exams Only</button>
                        <button onClick={() => setViewType('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Show All</button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar flex-1 relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-900 shadow-sm">
                            <tr className="text-white">
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-30 border-r border-white/5">Student</th>
                                {displayedAssignments.map((a: any) => (
                                    <th key={a.id} className="p-5 text-[10px] font-black uppercase tracking-widest text-center min-w-[160px] border-r border-white/5 hover:bg-slate-800 transition-colors">
                                        <div className={`text-[8px] mb-1 ${a.contentType === 'test' ? 'text-rose-400' : 'text-indigo-300'}`}>{a.contentType}</div>
                                        <span className="truncate block w-full px-2" title={a.title}>{a.title}</span>
                                    </th>
                                ))}
                                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right sticky right-0 bg-slate-900 z-30 border-l border-white/5">GPA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classData.students.map((studentObj: any) => {
                                // 🔥 FIX: Extract email and name safely
                                const studentEmail = typeof studentObj === 'string' ? studentObj : studentObj.email;
                                const studentName = typeof studentObj === 'string' ? studentEmail.split('@')[0] : (studentObj.name || studentEmail.split('@')[0]);

                                return (
                                    <tr key={studentEmail} className="hover:bg-slate-50/50 group transition-colors">
                                        <td className="p-5 font-bold text-slate-700 text-sm sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10 transition-colors">
                                            {studentName}
                                            <div className="text-[9px] text-slate-300 font-medium lowercase truncate max-w-[120px]">{studentEmail}</div>
                                        </td>
                                        {displayedAssignments.map((a: any) => (
                                            <td key={a.id} className="p-4 text-center align-middle border-r border-slate-50">
                                                {getScoreCell(studentEmail, a)}
                                            </td>
                                        ))}
                                        <td className="p-5 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10 transition-colors">
                                            {(() => {
                                                let total = 0, count = 0;
                                                displayedAssignments.forEach((a: any) => {
                                                    const log = logs.find(l => l.studentEmail === studentEmail && (l.itemId === a.id || l.itemTitle === a.title));
                                                    if (log) {
                                                        const p = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
                                                        total += p; count++;
                                                    }
                                                });
                                                return count === 0 ? <span className="text-slate-200">--</span> : <span className="font-black text-slate-900 text-sm">{Math.round(total / count)}%</span>;
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 PRO-LMS SPEED MODERATOR SIDE-PANEL */}
            {reviewingLog && localScoreDetails && (
                <aside className="absolute top-0 bottom-0 right-0 w-[500px] bg-white border-l border-slate-200 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300 z-50">
                    <header className="p-6 bg-slate-900 text-white flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                <FileText size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{reviewingLog.itemTitle}</span>
                            </div>
                            <h2 className="text-xl font-black">{reviewingLog.studentEmail.split('@')[0]}</h2>
                        </div>
                        <button onClick={() => { setReviewingLog(null); setLocalScoreDetails(null); }} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"><X size={20} /></button>
                    </header>

                    {/* HUD Overview */}
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</span>
                            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                                {localScoreDetails.score} <span className="text-lg text-slate-400">/ {localScoreDetails.total}</span>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl font-black text-2xl border-4 ${
                            localScoreDetails.finalScorePct >= 90 ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                            localScoreDetails.finalScorePct >= 70 ? 'bg-indigo-100 text-indigo-600 border-indigo-200' :
                            'bg-rose-100 text-rose-600 border-rose-200'
                        }`}>
                            {localScoreDetails.finalScorePct}%
                        </div>
                    </div>

                    {/* Submission Details List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
                        {localScoreDetails.details?.map((q: any, i: number) => {
                            const isEssay = q.type === 'essay';
                            const needsGrading = isEssay && reviewingLog.scoreDetail.status === 'pending_review';

                            return (
                                <div key={i} className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${needsGrading ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${needsGrading ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            Q{i + 1} • {q.type}
                                        </span>
                                        {/* Point Adjuster */}
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                min="0"
                                                max={q.maxPoints}
                                                value={q.awardedPoints}
                                                onChange={(e) => updateQuestionScore(q.qId, parseInt(e.target.value) || 0)}
                                                className={`w-14 h-8 text-center font-black rounded-lg border-2 outline-none focus:border-indigo-500 ${needsGrading ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            />
                                            <span className="text-xs font-bold text-slate-400">/ {q.maxPoints}</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm font-bold text-slate-800 mb-4">{q.prompt}</p>
                                    
                                    <div className={`p-4 rounded-xl mb-4 ${isEssay ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 font-serif' : (q.isCorrect ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-rose-50 border border-rose-100 text-rose-700')}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Student Answer</span>
                                        {q.studentVal}
                                    </div>

                                    {!isEssay && !q.isCorrect && q.correctVal && (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">Correct Answer</span>
                                            {q.correctVal}
                                        </div>
                                    )}

                                    {/* Feedback Box */}
                                    <div className="mt-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-2">
                                            <MessageSquare size={12} /> Instructor Feedback
                                        </label>
                                        <textarea 
                                            placeholder="Leave feedback for the student..."
                                            value={q.teacherFeedback || ''}
                                            onChange={(e) => updateQuestionFeedback(q.qId, e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:border-indigo-500 outline-none resize-none h-20 transition-colors"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <footer className="p-6 bg-white border-t border-slate-200 shrink-0">
                        <button 
                            onClick={releaseGrade}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                        >
                            <Target size={18} /> Release Grade to Student
                        </button>
                    </footer>
                </aside>
            )}
        </div>
    );
}
