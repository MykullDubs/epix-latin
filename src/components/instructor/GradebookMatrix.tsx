// src/components/instructor/GradebookMatrix.tsx
import React, { useState, useMemo } from 'react';
import { 
    TrendingUp, AlertCircle, Download, Settings2, 
    Search, Clock, BookOpen
} from 'lucide-react';

export default function GradebookMatrix({ classData, lessons, activityLogs }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    
    const [weights, setWeights] = useState({ exam: 50, trivia: 30, activity: 20 });
    const students = classData?.students || [];

    const categories = useMemo(() => [
        { id: 'exam', label: 'Exams', color: 'text-indigo-600 dark:text-indigo-400' },
        { id: 'trivia', label: 'Live Activities', color: 'text-amber-600 dark:text-amber-400' },
        { id: 'activity', label: 'Assignments', color: 'text-emerald-600 dark:text-emerald-400' }
    ], []);

    const gradedItems = useMemo(() => {
        if (!classData?.assignments) return [];
        return classData.assignments.map((assign: any) => {
            const lessonData = lessons.find((l: any) => l.id === assign.id);
            const type = lessonData?.type || assign.contentType;
            return { id: assign.id, title: assign.title, category: (type === 'exam' || type === 'test') ? 'exam' : type === 'game' ? 'trivia' : 'activity' };
        });
    }, [classData, lessons]);

    const matrixData = useMemo(() => {
        return students.map((studentObj: any) => {
            const studentEmail = typeof studentObj === 'string' ? studentObj : studentObj.email;
            const studentName = typeof studentObj === 'string' ? studentEmail.split('@')[0] : (studentObj.name || studentEmail.split('@')[0]);

            const studentLogs = activityLogs.filter((log: any) => log.studentEmail === studentEmail);
            
            const categoryScores: any = { exam: [], trivia: [], activity: [] };
            const itemData: any = {};

            gradedItems.forEach((item: any) => {
                const itemLogs = studentLogs.filter((log: any) => log.itemId === item.id || log.itemTitle === item.title);
                const bestLog = itemLogs.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
                
                if (bestLog) {
                    const status = bestLog.scoreDetail?.status || 'graded';
                    const pct = bestLog.scoreDetail?.finalScorePct ?? (bestLog.scoreDetail?.total > 0 ? Math.round((bestLog.scoreDetail.score / bestLog.scoreDetail.total) * 100) : (bestLog.score || 0));
                    itemData[item.id] = { score: pct, status };
                    if (status === 'graded') categoryScores[item.category].push(pct);
                } else {
                    itemData[item.id] = null; 
                }
            });

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

            return { email: studentEmail, name: studentName, itemData, finalGrade, hasPending: Object.values(itemData).some((d: any) => d?.status === 'pending_review') };
        }).filter((s:any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [students, activityLogs, gradedItems, weights, searchQuery]);

    const getHeatmapClass = (data: any) => {
        if (!data) return "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-transparent";
        if (data.status === 'pending_review') return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 animate-pulse";
        if (data.score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 hover:border-emerald-400";
        if (data.score >= 70) return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30 hover:border-indigo-400";
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 hover:border-rose-400";
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-500 relative transition-colors duration-300">
            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <BookOpen size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Gradebook Matrix</h2>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Class Performance Overview</p>
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="hidden lg:flex flex-wrap gap-2 items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                        <Settings2 size={16} className="text-slate-400 mx-2 shrink-0" />
                        {categories.map((cat: any) => (
                            <div key={cat.id} className="flex items-center gap-2 pr-4 border-r last:border-0 border-slate-200 dark:border-slate-800">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</label>
                                <div className="relative flex items-center">
                                    <input 
                                        type="number" 
                                        value={weights[cat.id as keyof typeof weights]} 
                                        onChange={(e) => setWeights({...weights, [cat.id]: parseInt(e.target.value) || 0})}
                                        className="bg-transparent rounded-lg w-10 font-bold text-sm outline-none text-slate-700 dark:text-slate-200 text-center"
                                    />
                                    <span className="text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative flex-1 md:flex-none hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            placeholder="Search Students..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 w-full md:w-48 font-bold focus:w-full md:focus:w-64 transition-all outline-none text-slate-700 dark:text-white shadow-inner text-xs"
                        />
                    </div>
                    <button className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm active:scale-95 shrink-0">
                        <Download size={16} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-auto custom-scrollbar relative p-4 md:p-8 pb-32">
                <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-5 sticky left-0 z-50 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-w-[250px] shadow-[5px_0_15px_rgba(0,0,0,0.05)] dark:shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student Name</span>
                                    </th>
                                    <th className="p-5 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-500/5 min-w-[120px]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Overall Grade</span>
                                    </th>
                                    {gradedItems.map((item: any) => (
                                        <th key={item.id} className="p-5 min-w-[160px] border-r border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group align-bottom">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${categories.find(c => c.id === item.category)?.color}`}>
                                                    {categories.find(c => c.id === item.category)?.label}
                                                </span>
                                                <span className="text-[11px] font-bold truncate block w-32 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white" title={item.title}>{item.title}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {matrixData.map((student: any) => (
                                    <tr key={student.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-3 pl-5 sticky left-0 z-30 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 transition-colors shadow-[5px_0_15px_rgba(0,0,0,0.02)] dark:shadow-[5px_0_15px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${student.hasPending ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ring-2 ring-amber-400/50' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-700'}`}>
                                                    {student.name[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{student.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium truncate">{student.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                            <div className={`inline-flex items-center justify-center w-14 py-1.5 rounded-lg text-sm font-black shadow-sm ${
                                                student.finalGrade >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                student.finalGrade >= 70 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                                                'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                            }`}>
                                                {student.finalGrade}%
                                            </div>
                                        </td>

                                        {gradedItems.map((item: any) => {
                                            const data = student.itemData[item.id];
                                            return (
                                                <td key={item.id} className="p-3 border-r border-slate-100 dark:border-slate-800 text-center align-middle">
                                                    <div className={`py-1.5 px-2 mx-auto rounded-lg border font-black text-xs transition-all hover:scale-105 cursor-default flex items-center justify-center gap-1.5 max-w-[70px] shadow-sm ${getHeatmapClass(data)}`}>
                                                        {data?.status === 'pending_review' ? (
                                                            <><Clock size={12} /> Review</>
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

                        {matrixData.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400 dark:text-slate-500">
                                <AlertCircle size={48} className="mb-4 opacity-50" />
                                <p className="text-sm font-black uppercase tracking-widest">No Students Found</p>
                            </div>
                        )}
                    </div>
                    
                    <footer className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                        <div className="flex flex-wrap gap-4 md:gap-6">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500" /> Excellent (90%+)</div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-500" /> Satisfactory (70%+)</div>
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500" /> Needs Improvement</div>
                            <div className="flex items-center gap-2 ml-0 md:ml-4"><Clock size={12} className="text-amber-500" /> Pending Review</div>
                        </div>
                        <div className="hidden sm:block bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            Total Students: <span className="font-black text-indigo-600 dark:text-indigo-400">{students.length}</span>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
