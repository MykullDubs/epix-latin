// src/components/instructor/InstructorGradebook.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { ChevronDown } from 'lucide-react';
import { JuicyToast } from '../Toast';

export default function InstructorGradebook({ classData }: any) {
    const [logs, setLogs] = useState<any[]>([]);
    const [viewType, setViewType] = useState<'exams' | 'all'>('exams'); 
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [editingCell, setEditingCell] = useState<{ student: string; assignId: string; logId: string } | null>(null);
    const [scoreInput, setScoreInput] = useState<string>("");

    useEffect(() => {
        if(!classData.assignments || !classData.students) return;
        
        const q = query(
            collection(db, 'artifacts', appId, 'activity_logs'), 
            where('type', '==', 'completion'),
            where('studentEmail', 'in', classData.students.slice(0, 10)),
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

    const handleReleaseGrade = async (logId: string) => {
        const numericScore = parseInt(scoreInput, 10);
        if (isNaN(numericScore) || !logId) {
            setEditingCell(null);
            return;
        }

        try {
            const logRef = doc(db, 'artifacts', appId, 'activity_logs', logId);
            await setDoc(logRef, {
                scoreDetail: { finalScorePct: numericScore, status: 'graded' },
                lastUpdated: Date.now()
            }, { merge: true });

            setToastMsg("Grade Released! 🎯");
            setEditingCell(null);
        } catch (error) {
            setToastMsg("Error saving grade.");
        }
    };

    const getScoreCell = (studentEmail: string, assign: any) => {
        let log = logs.find(l => l.studentEmail === studentEmail && (l.itemId === assign.id || l.itemTitle === assign.title));
        if (!log) return <span className="text-slate-200">-</span>;
        
        const pct = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
        const isEditing = editingCell?.student === studentEmail && editingCell?.assignId === assign.id;

        if (isEditing) {
            return (
                <input
                    autoFocus value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReleaseGrade(log.id);
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                    className="w-14 p-1 text-center font-black text-xs bg-white border-2 border-indigo-500 rounded-lg outline-none"
                />
            );
        }

        if (log.scoreDetail?.status === 'pending_review') {
            return (
                <button 
                    onClick={() => { setEditingCell({ student: studentEmail, assignId: assign.id, logId: log.id }); setScoreInput(pct.toString()); }} 
                    className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-black uppercase hover:bg-amber-200 transition-all shadow-sm"
                >
                    Review
                </button>
            );
        }
        
        const color = pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 70 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50';
        return (
            <button 
                onClick={() => { setEditingCell({ student: studentEmail, assignId: assign.id, logId: log.id }); setScoreInput(pct.toString()); }}
                className={`text-xs font-black px-2.5 py-1.5 rounded-xl cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all ${color}`}
            >
                {pct}%
            </button>
        );
    };

    return (
        <div className="relative animate-in fade-in duration-500">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            <div className="flex justify-between items-center mb-6">
                <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                    <button onClick={() => setViewType('exams')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${viewType === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Exams Only</button>
                    <button onClick={() => setViewType('all')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${viewType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Show Lessons</button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-10 border-r border-white/5">Student</th>
                            {displayedAssignments.map((a: any) => (
                                <th key={a.id} className="p-5 text-[10px] font-black uppercase tracking-widest text-center min-w-[140px] border-r border-white/5">
                                    <div className={`text-[8px] mb-1 ${a.contentType === 'test' ? 'text-rose-400' : 'text-indigo-300'}`}>{a.contentType}</div>
                                    {a.title}
                                </th>
                            ))}
                            <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right sticky right-0 bg-slate-900 z-10 border-l border-white/5">GPA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {classData.students.map((student: string) => (
                            <tr key={student} className="hover:bg-slate-50/50 group">
                                <td className="p-5 font-bold text-slate-700 text-sm sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10">
                                    {student.split('@')[0]}
                                    <div className="text-[9px] text-slate-300 font-medium lowercase">{student}</div>
                                </td>
                                {displayedAssignments.map((a: any) => (
                                    <td key={a.id} className="p-4 text-center align-middle border-r border-slate-50">
                                        {getScoreCell(student, a)}
                                    </td>
                                ))}
                                <td className="p-5 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10">
                                    {(() => {
                                        let total = 0, count = 0;
                                        displayedAssignments.forEach((a: any) => {
                                            const log = logs.find(l => l.studentEmail === student && (l.itemId === a.id || l.itemTitle === a.title));
                                            if (log) {
                                                const p = log.scoreDetail?.finalScorePct ?? (log.scoreDetail?.total > 0 ? Math.round((log.scoreDetail.score / log.scoreDetail.total) * 100) : 0);
                                                total += p; count++;
                                            }
                                        });
                                        return count === 0 ? <span className="text-slate-200">--</span> : <span className="font-black text-slate-900 text-sm">{Math.round(total / count)}%</span>;
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
