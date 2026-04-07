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
        if (!log) return <span className="text-slate-300 dark:text-slate-700">-</span>;
        
        const pct = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
        
        if (log.scoreDetail?.status === 'pending_review') {
            return (
                <button 
                    onClick={() => openModerator(log)} 
                    className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all shadow-sm border border-amber-200 dark:border-amber-500/30 flex items-center justify-center gap-1.5 w-full active:scale-95"
                >
                    <AlertTriangle size={12} strokeWidth={3} /> Review
                </button>
            );
        }
        
        const color = pct >= 90 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : pct >= 70 ? 'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20';
        return (
            <button 
                onClick={() => openModerator(log)}
                className={`text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-all w-full border shadow-sm active:scale-95 ${color} hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500/50`}
            >
                {pct}%
            </button>
        );
    };

    return (
        <div className="relative animate-in fade-in duration-500 h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* MAIN TABLE AREA */}
            <div className={`flex-1 flex flex-col p-6 transition-all duration-500 ${reviewingLog ? 'mr-[500px]' : ''}`}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-[1.25rem] border border-slate-300/50 dark:border-slate-700/50 shadow-inner">
                        <button onClick={() => setViewType('exams')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'exams' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Assessments Only</button>
                        <button onClick={() => setViewType('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Show All Logged Data</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden overflow-x-auto custom-scrollbar flex-1 relative transition-colors">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="sticky top-0 z-20 bg-slate-950 shadow-md">
                            <tr className="text-white">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-950 z-30 border-r border-white/10">Roster</th>
                                {displayedAssignments.map((a: any) => (
                                    <th key={a.id} className="p-6 text-[10px] font-black uppercase tracking-widest text-center min-w-[180px] border-r border-white/5 hover:bg-slate-900 transition-colors">
                                        <div className={`text-[8px] mb-1.5 ${a.contentType === 'test' ? 'text-rose-400' : 'text-indigo-400'}`}>{a.contentType}</div>
                                        <span className="truncate block w-full px-2" title={a.title}>{a.title}</span>
                                    </th>
                                ))}
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right sticky right-0 bg-slate-950 z-30 border-l border-white/10">Cumulative GPA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {classData.students.map((studentObj: any) => {
                                const studentEmail = typeof studentObj === 'string' ? studentObj : studentObj.email;
                                const studentName = typeof studentObj === 'string' ? studentEmail.split('@')[0] : (studentObj.name || studentEmail.split('@')[0]);

                                return (
                                    <tr key={studentEmail} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                                        <td className="p-6 font-black text-slate-800 dark:text-slate-200 text-sm sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 border-r border-slate-100 dark:border-slate-800 z-10 transition-colors">
                                            {studentName}
                                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold lowercase truncate max-w-[140px] mt-1">{studentEmail}</div>
                                        </td>
                                        {displayedAssignments.map((a: any) => (
                                            <td key={a.id} className="p-4 text-center align-middle border-r border-slate-50 dark:border-slate-800/30">
                                                {getScoreCell(studentEmail, a)}
                                            </td>
                                        ))}
                                        <td className="p-6 text-right sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800 z-10 transition-colors">
                                            {(() => {
                                                let total = 0, count = 0;
                                                displayedAssignments.forEach((a: any) => {
                                                    const log = logs.find(l => l.studentEmail === studentEmail && (l.itemId === a.id || l.itemTitle === a.title));
                                                    if (log) {
                                                        const p = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
                                                        total += p; count++;
                                                    }
                                                });
                                                return count === 0 ? <span className="text-slate-300 dark:text-slate-700">--</span> : <span className="font-black text-slate-900 dark:text-white text-base bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">{Math.round(total / count)}%</span>;
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
                <div className="absolute inset-0 z-50 pointer-events-none flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => { setReviewingLog(null); setLocalScoreDetails(null); }} />
                    <aside className="w-full max-w-[500px] h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-[-30px_0_60px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto relative z-10 transition-colors">
                        
                        <header className="p-8 bg-slate-950 text-white flex justify-between items-start shrink-0 border-b border-white/10">
                            <div>
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <FileText size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{reviewingLog.itemTitle}</span>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">{reviewingLog.studentEmail.split('@')[0]}</h2>
                            </div>
                            <button onClick={() => { setReviewingLog(null); setLocalScoreDetails(null); }} className="p-2.5 bg-white/10 hover:bg-rose-500 rounded-full transition-colors text-white active:scale-95 shadow-sm"><X size={20} strokeWidth={3} /></button>
                        </header>

                        {/* HUD Overview */}
                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 transition-colors">
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Final Assessed Score</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                    {localScoreDetails.score} <span className="text-lg text-slate-400 dark:text-slate-600">/ {localScoreDetails.total}</span>
                                </div>
                            </div>
                            <div className={`px-5 py-3 rounded-2xl font-black text-2xl border-4 shadow-sm ${
                                localScoreDetails.finalScorePct >= 90 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                localScoreDetails.finalScorePct >= 70 ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' :
                                'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                            }`}>
                                {localScoreDetails.finalScorePct}%
                            </div>
                        </div>

                        {/* Submission Details List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-950 transition-colors">
                            {localScoreDetails.details?.map((q: any, i: number) => {
                                const isEssay = q.type === 'essay';
                                const needsGrading = isEssay && reviewingLog.scoreDetail.status === 'pending_review';

                                return (
                                    <div key={i} className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-6 shadow-sm transition-all ${needsGrading ? 'border-amber-400 dark:border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.2)] dark:shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-200 dark:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm ${needsGrading ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                                                Q{i + 1} • {q.type}
                                            </span>
                                            {/* Point Adjuster */}
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    max={q.maxPoints}
                                                    value={q.awardedPoints}
                                                    onChange={(e) => updateQuestionScore(q.qId, parseInt(e.target.value) || 0)}
                                                    className={`w-16 h-10 text-center font-black rounded-lg border-2 outline-none focus:border-indigo-500 transition-colors shadow-sm ${needsGrading ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white'}`}
                                                />
                                                <span className="text-xs font-black text-slate-400 px-2">/ {q.maxPoints} pts</span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-5 leading-relaxed">{q.prompt}</p>
                                        
                                        <div className={`p-5 rounded-2xl mb-5 shadow-sm border ${isEssay ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-200 font-serif leading-relaxed' : (q.isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-300')}`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-2 flex items-center gap-1"><User size={12}/> Student Answer</span>
                                            {q.studentVal}
                                        </div>

                                        {!isEssay && !q.isCorrect && q.correctVal && (
                                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 mb-5 shadow-sm">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-2 flex items-center gap-1"><Target size={12}/> Correct Answer</span>
                                                {q.correctVal}
                                            </div>
                                        )}

                                        {/* Feedback Box */}
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-3">
                                                <MessageSquare size={14} className="text-indigo-500" /> Instructor Feedback
                                            </label>
                                            <textarea 
                                                placeholder="Leave feedback for the student to review..."
                                                value={q.teacherFeedback || ''}
                                                onChange={(e) => updateQuestionFeedback(q.qId, e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none h-24 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <footer className="p-6 md:p-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
                            <button 
                                onClick={releaseGrade}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-sm"
                            >
                                <Target size={20} /> Release Grade & Publish
                            </button>
                        </footer>
                    </aside>
                </div>
            )}
        </div>
    );
}
