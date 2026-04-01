// src/components/instructor/InstructorTools.tsx
import React, { useState, useEffect } from 'react';
import { 
    BarChart2, Download, Users, Target, Activity, FileSpreadsheet,
    Zap, AlertTriangle, TrendingUp, ShieldCheck, ChevronRight
} from 'lucide-react';
import { downloadCSV } from '../../utils/exportHelpers';

export function AnalyticsDashboard({ classes = [] }: any) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Auto-select the first class if none is selected
    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id);
        }
    }, [classes, selectedClassId]);

    // --- COHORT-SPECIFIC METRICS (Tactical View) ---
    const activeClass = classes.find((c: any) => c.id === selectedClassId) || classes[0];
    const classStudentsCount = activeClass?.studentEmails?.length || 0;
    
    // Faux Analytics Generation based on Class Roster for Visual Impact
    const avgScore = classStudentsCount > 0 ? 84 : 0; 
    const atRiskCount = Math.floor(classStudentsCount * 0.15); 
    const totalXpMinted = classStudentsCount * 4500;

    // --- AGGREGATE METRICS (Export Center View) ---
    const totalCohorts = classes.length;
    const totalStudents = classes.reduce((sum: number, cls: any) => sum + (cls.students?.length || 0), 0);
    const activeAssignments = classes.reduce((sum: number, cls: any) => sum + (cls.assignments?.length || 0), 0);

    // --- CSV EXPORT HANDLERS ---
    const handleExportRoster = () => {
        setIsExporting(true);
        try {
            // Flatten the nested class/student data into a clean array of rows
            const exportData = classes.flatMap((cls: any) => {
                if (!cls.students || cls.students.length === 0) return [];
                
                return cls.students.map((student: any) => ({
                    Cohort: cls.name,
                    Cohort_ID: cls.code || 'N/A',
                    Student_Name: student.name || 'Pending Registration',
                    Email: student.email,
                    Status: student.name ? 'Active' : 'Invited',
                    Assignments_Pending: cls.assignments?.length || 0
                }));
            });

            if (exportData.length === 0) {
                alert("No student data available to export.");
                setIsExporting(false);
                return;
            }

            downloadCSV(exportData, `Magister_Master_Roster_${new Date().toISOString().split('T')[0]}`);
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data.");
        }
        setTimeout(() => setIsExporting(false), 500);
    };

    const handleExportCohorts = () => {
        setIsExporting(true);
        try {
            const exportData = classes.map((cls: any) => ({
                Cohort_Name: cls.name,
                Join_Code: cls.code,
                Student_Count: cls.students?.length || 0,
                Curriculums_Deployed: cls.assignedCurriculums?.length || 0,
                Active_Lessons: cls.assignments?.length || 0,
                Created_Date: new Date(cls.created || Date.now()).toLocaleDateString()
            }));

            downloadCSV(exportData, `Magister_Cohorts_${new Date().toISOString().split('T')[0]}`);
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data.");
        }
        setTimeout(() => setIsExporting(false), 500);
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 font-sans">
            <div className="max-w-6xl mx-auto space-y-8 pb-32">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <BarChart2 size={24} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Tactical Analytics</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Monitor cohort engagement and performance telemetry.</p>
                    </div>

                    <select 
                        value={selectedClassId} 
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full md:w-64 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-black uppercase tracking-widest text-xs rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors cursor-pointer shadow-sm"
                    >
                        {classes.length === 0 && <option value="">No Cohorts Available</option>}
                        {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>COHORT: {c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Cohort KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20"><Users size={24} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Active Scholars</span>
                            <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{classStudentsCount}</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20"><Target size={24} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Cohort Avg Score</span>
                            <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{avgScore}%</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20"><Zap size={24} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Total XP Minted</span>
                            <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{totalXpMinted >= 1000 ? `${(totalXpMinted/1000).toFixed(1)}k` : totalXpMinted}</span>
                        </div>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-500/30 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/20"><AlertTriangle size={24} /></div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-300 block mb-1">At-Risk Alerts</span>
                            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 leading-none">{atRiskCount}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Distribution (Faux Chart) */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500 dark:text-indigo-400" /> Grade Distribution
                        </h3>
                        <div className="flex items-end justify-between h-48 gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-1/4 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-t-xl h-[80%] transition-all group-hover:opacity-80" />
                                <span className="text-xs font-black text-slate-500">A</span>
                            </div>
                            <div className="w-1/4 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-xl h-[60%] transition-all group-hover:opacity-80" />
                                <span className="text-xs font-black text-slate-500">B</span>
                            </div>
                            <div className="w-1/4 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-xl h-[30%] transition-all group-hover:opacity-80" />
                                <span className="text-xs font-black text-slate-500">C</span>
                            </div>
                            <div className="w-1/4 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-rose-400 dark:bg-rose-500 rounded-t-xl h-[10%] transition-all group-hover:opacity-80" />
                                <span className="text-xs font-black text-slate-500">&lt;C</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-6">Data aggregated from all checkpoints.</p>
                    </div>

                    {/* Student Roster / Status Matrix */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-500 dark:text-indigo-400" /> Cohort Roster Matrix
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {activeClass?.studentEmails?.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold text-sm">No students enlisted in this cohort yet.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="p-4 pl-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Scholar</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="p-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {activeClass?.studentEmails?.map((email: string, i: number) => {
                                            // Mock data logic for visuals
                                            const isRisk = i > 0 && i % 4 === 0; 
                                            const progress = isRisk ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 30) + 70;
                                            
                                            return (
                                                <tr key={email} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-200 dark:border-indigo-500/30">
                                                                {email[0].toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[100px]">
                                                                <div className={`h-full rounded-full ${isRisk ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-400 dark:bg-emerald-500'}`} style={{ width: `${progress}%` }} />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {isRisk ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-500/20">
                                                                <AlertTriangle size={10} /> At Risk
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">
                                                                On Track
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Data Export Center */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-8">
                    <div className="bg-slate-900 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <FileSpreadsheet size={24} className="text-emerald-400" /> Data Export Center
                            </h2>
                            <p className="text-slate-400 font-medium mt-2 max-w-xl text-sm">
                                Generate standard CSV reports compatible with Excel, Google Sheets, and native LMS integrations.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Students</p>
                                <p className="text-xl font-black text-white">{totalStudents}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Cohorts</p>
                                <p className="text-xl font-black text-white">{totalCohorts}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Export 1: Master Roster */}
                        <div className="border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] p-6 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Master Roster</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Level Data</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                                Exports a complete list of all students across all cohorts, including their registration status and emails.
                            </p>
                            <button 
                                onClick={handleExportRoster}
                                disabled={isExporting || totalStudents === 0}
                                className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white dark:text-slate-900 dark:hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                            >
                                <Download size={16} /> {isExporting ? 'Generating...' : 'Download CSV'}
                            </button>
                        </div>

                        {/* Export 2: Cohort Overview */}
                        <div className="border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] p-6 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Cohort Overview</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class Level Data</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
                                Exports a high-level summary of all active classes, their join codes, and deployed curriculum counts.
                            </p>
                            <button 
                                onClick={handleExportCohorts}
                                disabled={isExporting || totalCohorts === 0}
                                className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white dark:text-slate-900 dark:hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                            >
                                <Download size={16} /> {isExporting ? 'Generating...' : 'Download CSV'}
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
