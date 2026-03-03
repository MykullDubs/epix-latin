// src/components/instructor/InstructorTools.tsx
import React, { useState } from 'react';
import { BarChart2, Download, Users, Target, Activity, FileSpreadsheet } from 'lucide-react';
import { downloadCSV } from '../../utils/exportHelpers';

export function AnalyticsDashboard({ classes = [] }: any) {
    const [isExporting, setIsExporting] = useState(false);

    // --- AGGREGATE METRICS ---
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

            downloadCSV(exportData, `Magister_Master_Roster_${new Date().toISOString().split('T')[0]}`);
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data.");
        }
        setTimeout(() => setIsExporting(false), 500);
    };

    const handleExportCohorts = () => {
        const exportData = classes.map((cls: any) => ({
            Cohort_Name: cls.name,
            Join_Code: cls.code,
            Student_Count: cls.students?.length || 0,
            Curriculums_Deployed: cls.assignedCurriculums?.length || 0,
            Active_Lessons: cls.assignments?.length || 0,
            Created_Date: new Date(cls.created || Date.now()).toLocaleDateString()
        }));

        downloadCSV(exportData, `Magister_Cohorts_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
            
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Total Students</p>
                        <h3 className="text-4xl font-black text-slate-800">{totalStudents}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Target size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Active Cohorts</p>
                        <h3 className="text-4xl font-black text-slate-800">{totalCohorts}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Activity size={32} />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Total Assignments</p>
                        <h3 className="text-4xl font-black text-slate-800">{activeAssignments}</h3>
                    </div>
                </div>
            </div>

            {/* Admin Export Controls */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-slate-900 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <FileSpreadsheet size={24} className="text-emerald-400" /> Data Export Center
                        </h2>
                        <p className="text-slate-400 font-medium mt-2 max-w-xl">
                            Generate standard CSV reports compatible with Excel, Google Sheets, and native LMS integrations.
                        </p>
                    </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Export 1: Master Roster */}
                    <div className="border-2 border-slate-100 rounded-[2rem] p-6 hover:border-indigo-200 transition-colors group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Master Roster</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Level Data</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">
                            Exports a complete list of all students across all cohorts, including their registration status and emails.
                        </p>
                        <button 
                            onClick={handleExportRoster}
                            disabled={isExporting || totalStudents === 0}
                            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Download size={16} /> {isExporting ? 'Generating...' : 'Download CSV'}
                        </button>
                    </div>

                    {/* Export 2: Cohort Overview */}
                    <div className="border-2 border-slate-100 rounded-[2rem] p-6 hover:border-emerald-200 transition-colors group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Target size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Cohort Overview</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Level Data</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">
                            Exports a high-level summary of all active classes, their join codes, and deployed curriculum counts.
                        </p>
                        <button 
                            onClick={handleExportCohorts}
                            disabled={isExporting || totalCohorts === 0}
                            className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Download size={16} /> {isExporting ? 'Generating...' : 'Download CSV'}
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}
