// src/components/instructor/CurriculumBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { Map, Plus, X, Save, BookOpen, ChevronRight, FileText, Gamepad2, Layers } from 'lucide-react';
import { Toast } from '../Toast';

export default function CurriculumBuilderView({ onSaveCurriculum, availableLessons }: any) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'Beginner',
        themeColor: '#4f46e5',
        coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000'
    });
    
    // This holds the exact sequence of lesson IDs the teacher chooses
    const [timeline, setTimeline] = useState<any[]>([]);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addToTimeline = (lesson: any) => {
        setTimeline([...timeline, lesson]);
    };

    const removeFromTimeline = (index: number) => {
        setTimeline(timeline.filter((_, i) => i !== index));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newTimeline = [...timeline];
        const temp = newTimeline[index - 1];
        newTimeline[index - 1] = newTimeline[index];
        newTimeline[index] = temp;
        setTimeline(newTimeline);
    };

    const moveDown = (index: number) => {
        if (index === timeline.length - 1) return;
        const newTimeline = [...timeline];
        const temp = newTimeline[index + 1];
        newTimeline[index + 1] = newTimeline[index];
        newTimeline[index] = temp;
        setTimeline(newTimeline);
    };

    const handleSubmit = async () => {
        if (!formData.title) return alert("Please give your pathway a title.");
        if (timeline.length === 0) return alert("Please add at least one module to the timeline.");

        const payload = {
            ...formData,
            id: `curriculum_${Date.now()}`,
            lessonIds: timeline.map(l => l.id), // We only save the IDs to the database
            createdAt: Date.now()
        };

        await onSaveCurriculum(payload);
        setToastMsg("Curriculum Pathway Forged Successfully! 🗺️");
        
        // Reset form
        setFormData({ title: '', description: '', level: 'Beginner', themeColor: '#4f46e5', coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000' });
        setTimeline([]);
    };

    const getIconForType = (type: string) => {
        if (type === 'exam' || type === 'test') return <FileText size={16} className="text-rose-500" />;
        if (type === 'arcade_game') return <Gamepad2 size={16} className="text-amber-500" />;
        return <BookOpen size={16} className="text-emerald-500" />;
    };

    return (
        <div className="space-y-6 relative pb-12 font-sans animate-in fade-in slide-in-from-bottom-4">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 mb-4 text-sm text-cyan-800 flex justify-between items-center">
                <p className="font-bold flex items-center gap-2"><Map size={16}/> Pathway Builder</p>
                <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-200/50 px-2 py-1 rounded-md">{timeline.length} Modules Set</span>
            </div>

            {/* METADATA CONFIG */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Core Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 font-black focus:border-cyan-500 outline-none transition-colors" placeholder="Pathway Title (e.g., Latin 101)" />
                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 font-bold text-sm focus:border-cyan-500 outline-none transition-colors resize-none h-24" placeholder="Brief description of this learning journey..." />
                    </div>
                    <div className="space-y-4">
                        <select name="level" value={formData.level} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-200 font-black text-slate-600 focus:border-cyan-500 outline-none cursor-pointer">
                            <option value="Beginner">Beginner Level</option>
                            <option value="Intermediate">Intermediate Level</option>
                            <option value="Advanced">Advanced Level</option>
                            <option value="Mastery">Mastery Level</option>
                        </select>
                        <div className="flex gap-4">
                            <input type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} className="h-14 w-14 rounded-xl cursor-pointer border-2 border-slate-200 p-1" />
                            <input name="coverImage" value={formData.coverImage} onChange={handleChange} className="flex-1 p-4 rounded-xl border-2 border-slate-200 font-bold text-sm focus:border-cyan-500 outline-none" placeholder="Cover Image URL..." />
                        </div>
                    </div>
                </div>
            </section>

            {/* DUAL PANE BUILDER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                
                {/* PANE 1: AVAILABLE LESSONS */}
                <section className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Library (Click to Inject)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/50">
                        {availableLessons?.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                                <Layers size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase">No lessons built yet.</p>
                            </div>
                        ) : (
                            availableLessons?.map((lesson: any) => (
                                <button 
                                    key={lesson.id} 
                                    onClick={() => addToTimeline(lesson)}
                                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-cyan-400 hover:shadow-md transition-all active:scale-[0.98] group text-left"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                            {getIconForType(lesson.type)}
                                        </div>
                                        <div className="truncate">
                                            <h4 className="font-black text-slate-800 text-sm truncate">{lesson.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lesson.type || 'Lesson'}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus size={16} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                {/* PANE 2: THE TIMELINE */}
                <section className="bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-xl flex flex-col overflow-hidden relative">
                    <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
                    <div className="p-4 border-b border-slate-800 bg-slate-950 shrink-0 flex justify-between items-center z-10">
                        <h3 className="font-black text-white text-xs uppercase tracking-widest">Active Sequence</h3>
                        <span className="text-[10px] text-cyan-400 font-bold tracking-widest">{timeline.length} Nodes</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar z-10">
                        {timeline.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                                <Map size={40} className="mb-4 opacity-50" />
                                <p className="text-xs font-black uppercase tracking-widest text-center max-w-[200px]">Timeline empty.<br/>Inject modules from the left.</p>
                            </div>
                        ) : (
                            timeline.map((node: any, index: number) => (
                                <div key={`${node.id}_${index}`} className="relative flex items-center gap-3 group animate-in slide-in-from-right-4">
                                    {/* Connection Line */}
                                    {index !== timeline.length - 1 && <div className="absolute left-6 top-10 bottom-[-20px] w-1 bg-slate-800 z-0" />}
                                    
                                    {/* Number Node */}
                                    <div className="w-12 h-12 bg-slate-950 border-2 border-slate-700 text-slate-300 rounded-2xl flex items-center justify-center font-black z-10 shrink-0">
                                        {index + 1}
                                    </div>

                                    {/* The Card */}
                                    <div className="flex-1 bg-slate-800 border-2 border-slate-700 p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex flex-col overflow-hidden pr-2">
                                            <span className="font-black text-white text-sm truncate">{node.title}</span>
                                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{node.type || 'Lesson'}</span>
                                        </div>
                                        
                                        {/* Ordering Controls */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <div className="flex flex-col gap-1 mr-2">
                                                <button onClick={() => moveUp(index)} disabled={index === 0} className="text-slate-400 hover:text-white disabled:opacity-30">▲</button>
                                                <button onClick={() => moveDown(index)} disabled={index === timeline.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30">▼</button>
                                            </div>
                                            <button onClick={() => removeFromTimeline(index)} className="w-8 h-8 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </div>

            <button 
                onClick={handleSubmit} 
                className="w-full text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/30"
            >
                <Save size={20}/> Publish Pathway Sequence
            </button>
        </div>
    );
}
