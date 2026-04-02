// src/components/instructor/GradebookMatrix.tsx
import React, { useState, useMemo } from 'react';
import { 
    TrendingUp, AlertCircle, Download, Settings2, 
    Search, Clock, Zap
} from 'lucide-react';

export default function GradebookMatrix({ classData, lessons, activityLogs }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    
    // Configurable weights for different assignment types
    const [weights, setWeights] = useState({
        exam: 50,
        trivia: 30,
        activity: 20
    });

    const students = classData?.students || [];

    // 1. Define the gradebook categories
    const categories = useMemo(() => [
        { id: 'exam', label: 'Exams', color: 'text-indigo-500' },
        { id: 'trivia', label: 'Live Arena', color: 'text-amber-500' },
        { id: 'activity', label: 'Activities', color: 'text-emerald-500' }
    ], []);

    // 2. Filter lessons to only those assigned to this class
    const gradedItems = useMemo(() => {
        if (!classData?.assignments) return [];
        return classData.assignments.map((assign: any) => {
            const lessonData = lessons.find((l: any) => l.id === assign.id);
            const type = lessonData?.type || assign.contentType;
            
            return {
                id: assign.id,
                title: assign.title,
                category: (type === 'exam' || type === 'test') ? 'exam' : type === 'game' ? 'trivia' : 'activity',
            };
        });
    }, [classData, lessons]);

    // 3. The Heavy-Duty Matrix Calculation Engine
    const matrixData = useMemo(() => {
        return students.map((studentEmail: string) => {
            const studentLogs = activityLogs.filter((log: any) => log.studentEmail === studentEmail);
            
            const categoryScores: any = { exam: [], trivia: [], activity: [] };
            const itemData: any = {};

            gradedItems.forEach((item: any) => {
                // Find the most recent/best log for this item
                const itemLogs = studentLogs.filter((log: any) => log.itemId === item.id || log.itemTitle === item.title);
                const bestLog = itemLogs.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
                
                if (bestLog) {
                    const status = bestLog.scoreDetail?.status || 'graded';
                    const pct = bestLog.scoreDetail?.finalScorePct ?? 
                               (bestLog.scoreDetail?.total > 0 ? Math.round((bestLog.scoreDetail.score / bestLog.scoreDetail.total) * 100) : 
                               (bestLog.score || 0));

                    itemData[item.id] = { score: pct, status };
                    
                    // Only count fully graded items toward the final GPA
                    if (status === 'graded') {
                        categoryScores[item.category].push(pct);
                    }
                } else {
                    itemData[item.id] = null; // Not attempted
                }
            });

            // Calculate Weighted Average
            let totalWeighted = 0;
            let totalWeightUsed = 0;

            Object.entries(weights).forEach(([cat, weight]) => {
                if (categoryScores[cat].length > 0) {
                    const avg = categoryScores[cat].reduce((a:any, b:any) => a + b, 0) / categoryScores[cat].length;
                    totalWeighted += (avg * (weight / 100));
                    totalWeightUsed += (weight / 100);
                }
            });

            const finalGrade = totalWeightUsed > 0 ? Math.round(totalWeighted / totalWeightUsed) : 0;
            const name = studentEmail.split('@')[0];

            return {
                email: studentEmail,
                name,
                itemData,
                finalGrade,
                hasPending: Object.values(itemData).some((d: any) => d?.status === 'pending_review')
            };
        }).filter((s:any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [students, activityLogs, gradedItems, weights, searchQuery]);

    // Color logic for individual cells
    const getHeatmapClass = (data: any) => {
        if (!data) return "bg-slate-800/20 text-slate-600";
        if (data.status === 'pending_review') return "bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse";
        if (data.score >= 90) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:border-emerald-400";
        if (data.score >= 70) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-400";
        return "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:border-rose-400";
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden rounded-[3rem] border border-slate-800 shadow-2xl">
            {/* Header: Controls & Weights */}
            <header className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                            <TrendingUp className="text-indigo-500" /> Performance Matrix
                        </h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Institutional Analytics</p>
                    </div>

                    <div className="flex gap-4 items-center bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
                        <Settings2 size={20} className="text-slate-500 mr-2" />
                        {categories.map(cat => (
                            <div key={cat.id} className="flex flex-col gap-1">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label} %</label>
                                <input 
                                    type="number" 
                                    value={weights[cat.id as keyof typeof weights]} 
                                    onChange={(e) => setWeights({...weights, [cat.id]: parseInt(e.target.value) || 0})}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 w-16 font-bold text-sm focus:border-indigo-500 outline-none text-white transition-all"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all shadow-sm active:scale-95"><Download size={20} /></button>
                        <div className="relative flex-1 md:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                placeholder="Search Scholars..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 w-full md:w-64 font-bold focus:w-full md:focus:w-80 transition-all outline-none text-white shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* The Matrix Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 z-40 bg-slate-900 shadow-sm">
                        <tr>
                            <th className="p-6 sticky left-0 z-50 bg-slate-900 border-r border-slate-800/50 min-w-[250px] shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Scholar Identity</span>
                            </th>
                            <th className="p-6 text-center border-r border-slate-800/50 bg-slate-800/30 min-w-[120px]">
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Final GPA</span>
                            </th>
                            {gradedItems.map(item => (
                                <th key={item.id} className="p-6 min-w-[160px] border-r border-slate-800/50 hover:bg-slate-800 transition-colors group">
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${categories.find(c => c.id === item.category)?.color}`}>
                                            {item.category}
                                        </span>
                                        <span className="text-[11px] font-bold truncate block w-32 text-slate-300 group-hover:text-white" title={item.title}>{item.title}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {matrixData.map((student: any) => (
                            <tr key={student.email} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4 pl-6 sticky left-0 z-30 bg-slate-950 group-hover:bg-slate-900 border-r border-slate-800/50 transition-colors shadow-[5px_0_15px_rgba(0,0,0,0.1)]">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 transition-all ${student.hasPending ? 'bg-amber-900/30 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-indigo-400'}`}>
                                            {student.name[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm truncate pr-2">{student.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono truncate">{student.email}</span>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="p-4 text-center border-r border-slate-800/50 bg-slate-900/20">
                                    <div className={`inline-flex items-center justify-center w-16 py-2 rounded-xl text-lg font-black shadow-lg ${
                                        student.finalGrade >= 90 ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                        student.finalGrade >= 70 ? 'bg-indigo-500 text-white shadow-indigo-500/20' :
                                        'bg-rose-600 text-white shadow-rose-500/20'
                                    }`}>
                                        {student.finalGrade}%
                                    </div>
                                </td>

                                {gradedItems.map(item => {
                                    const data = student.itemData[item.id];
                                    return (
                                        <td key={item.id} className="p-4 border-r border-slate-800/30 text-center align-middle">
                                            <div className={`py-2 px-3 mx-auto rounded-xl border-2 font-black text-sm transition-all hover:scale-105 cursor-default flex items-center justify-center gap-2 max-w-[80px] ${getHeatmapClass(data)}`}>
                                                {data?.status === 'pending_review' ? (
                                                    <><Clock size={14} /> Review</>
                                                ) : data !== null ? (
                                                    `${data.score}%`
                                                ) : '—'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {matrixData.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-32 opacity-30">
                        <AlertCircle size={64} className="mb-4" />
                        <p className="text-xl font-black uppercase tracking-widest">No Scholars Found</p>
                    </div>
                )}
            </div>
            
            {/* Quick Action Footer */}
            <footer className="p-5 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Mastered (90%+)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Passing (70%+)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /> Critical Gap</div>
                    <div className="flex items-center gap-2 ml-4"><Clock size={14} className="text-amber-500" /> Needs Grading</div>
                </div>
                <div>Total Scholars: {students.length}</div>
            </footer>
        </div>
    );
}
