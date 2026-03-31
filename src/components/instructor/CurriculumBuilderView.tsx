// src/components/instructor/CurriculumBuilderView.tsx
import React, { useState } from 'react';
import { 
    Map, Plus, X, Save, BookOpen, FileText, 
    Gamepad2, Layers, Code, HelpCircle, 
    PlayCircle, Zap, ArrowUpCircle
} from 'lucide-react';
import { writeBatch, doc } from 'firebase/firestore';
import { auth, db, appId } from '../../config/firebase'; 
import { Toast } from '../Toast';

export default function CurriculumBuilderView({ onSaveCurriculum, availableLessons = [], classes = [], curriculums = [] }: any) {
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // 🔥 STATE: Tracks if we are editing an existing class
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'Beginner',
        themeColor: '#4f46e5',
        coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000',
        grade: 'Pathway'
    });
    
    // This holds the exact sequence of lesson objects
    const [timeline, setTimeline] = useState<any[]>([]);
    
    // Holds the raw imported payload so we can push it to Firebase
    const [importedPayload, setImportedPayload] = useState<any>(null);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🔥 ENGINE: Load Existing Class into Builder
    const handleSelectClass = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cid = e.target.value;
        setSelectedClassId(cid);

        if (!cid) {
            setFormData({ title: '', description: '', level: 'Beginner', themeColor: '#4f46e5', coverImage: '', grade: 'Pathway' });
            setTimeline([]);
            setImportedPayload(null);
            return;
        }

        const cls = classes.find((c: any) => c.id === cid);
        if (cls) {
            setFormData({
                title: cls.name || cls.title || '',
                description: cls.description || '',
                level: cls.grade || cls.level || 'Beginner',
                themeColor: cls.themeColor || '#4f46e5',
                coverImage: cls.coverImage || '',
                grade: cls.grade || 'Pathway'
            });

            const currId = cls.assignedCurriculums?.[0];
            const curr = curriculums.find((c: any) => c.id === currId);

            let newTimeline: any[] = [];
            const nodeIds = curr?.lessonIds || cls.assignments || [];
            
            nodeIds.forEach((id: string) => {
                const existingNode = availableLessons.find((l: any) => l.id === id);
                if (existingNode) {
                    newTimeline.push(existingNode);
                } else {
                    let inferredType = 'lesson';
                    if (id.includes('quiz') || id.includes('exam')) inferredType = 'quiz';
                    if (id.includes('deck')) inferredType = 'deck';
                    newTimeline.push({ id, title: `Node Data Encrypted (${id})`, type: inferredType });
                }
            });

            setTimeline(newTimeline);

            setImportedPayload({
                class: { ...cls },
                curriculum: curr ? { ...curr } : null
            });
            
            setToastMsg(`Loaded "${cls.name}" into Architect.`);
        }
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

    // 🔥 JSON IMPORT ENGINE
    const handleImportJSON = () => {
        try {
            let cleanText = jsonText.trim();
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
            }
            
            const data = JSON.parse(cleanText);
            setImportedPayload(data); 
            setSelectedClassId(''); 
            
            const classData = data.class || data;
            const curriculumData = data.curriculum || data;
            
            const newMeta = { ...formData };
            if (classData.title) newMeta.title = classData.title;
            else if (classData.name) newMeta.title = classData.name;
            
            if (classData.description) newMeta.description = classData.description;
            if (classData.themeColor) newMeta.themeColor = classData.themeColor;
            if (classData.grade) newMeta.level = classData.grade;
            else if (classData.level) newMeta.level = classData.level;
            
            setFormData(newMeta);

            let newTimeline: any[] = [];
            
            if (Array.isArray(data.content_nodes) && Array.isArray(curriculumData.lessonIds)) {
                newTimeline = curriculumData.lessonIds.map((id: string) => {
                    const node = data.content_nodes.find((n: any) => n.id === id);
                    if (node) {
                        return { id: node.id, title: node.title, type: node.type || 'lesson', contentType: node.contentType };
                    }
                    return { id, title: `Node: ${id}`, type: 'lesson' };
                });
            }
            else if (Array.isArray(data.content_nodes)) {
                newTimeline = data.content_nodes.map((item: any) => ({
                    id: item.id, title: item.title, type: item.type || 'lesson', contentType: item.contentType
                }));
            }
            else if (Array.isArray(data.syllabus)) {
                newTimeline = data.syllabus.map((item: any, idx: number) => ({
                    id: item.id || `node_${idx}`, title: item.title, type: item.type || 'lesson', contentType: item.contentType
                }));
            } 
            else if (Array.isArray(curriculumData.lessonIds)) {
                newTimeline = curriculumData.lessonIds.map((id: string) => {
                    const existing = availableLessons?.find((l: any) => l.id === id);
                    let inferredType = 'lesson';
                    if (id.includes('quiz') || id.includes('exam')) inferredType = 'quiz';
                    if (id.includes('deck')) inferredType = 'deck';
                    return existing || { id, title: `Node: ${id}`, type: inferredType };
                });
            }

            setTimeline(newTimeline);
            setToastMsg(`Payload Decrypted! Enlisted ${newTimeline.length} Nodes. ⚡`);
            setShowJsonModal(false);
            setJsonText("");
        } catch (e) {
            console.error("Import Error:", e);
            setToastMsg("Encryption Error: Invalid JSON or corrupted payload.");
        }
    };

    // 🔥 BATCH DEPLOYMENT ENGINE
    const handleSubmit = async () => {
        if (!formData.title) return alert("Please give your pathway a title.");
        if (timeline.length === 0) return alert("Please add at least one module to the timeline.");
        
        const uid = auth.currentUser?.uid;
        if (!uid) return alert("Authentication error. Please log in again.");

        try {
            const batch = writeBatch(db);
            const classId = importedPayload?.class?.id || `class_${Date.now()}`;
            const currId = importedPayload?.curriculum?.id || `curr_${Date.now()}`;

            const currRef = doc(db, 'artifacts', appId, 'users', uid, 'custom_curriculums', currId);
            batch.set(currRef, {
                ...formData,
                id: currId,
                instructorId: uid, 
                lessonIds: timeline.map(l => l.id),
                updatedAt: Date.now(),
                ...(importedPayload?.curriculum?.createdAt ? { createdAt: importedPayload.curriculum.createdAt } : { createdAt: Date.now() })
            }, { merge: true });

            const classRef = doc(db, 'artifacts', appId, 'users', uid, 'classes', classId);
            batch.set(classRef, {
                ...(importedPayload?.class || {}),
                id: classId,
                instructorId: uid, 
                name: formData.title,
                description: formData.description,
                subject: importedPayload?.class?.subject || 'General',
                domainPath: importedPayload?.class?.domainPath || [importedPayload?.class?.subject || 'General'],
                themeColor: formData.themeColor,
                assignedCurriculums: [currId],
                assignments: timeline.map(l => l.id),
                isPublished: true, 
                updatedAt: Date.now(),
                ...(importedPayload?.class?.createdAt ? { createdAt: importedPayload.class.createdAt } : { createdAt: Date.now() })
            }, { merge: true });

            if (importedPayload?.content_nodes) {
                importedPayload.content_nodes.forEach((node: any) => {
                    if (node.type === 'deck') {
                        const nodeRef = doc(db, 'artifacts', appId, 'decks', node.id);
                        batch.set(nodeRef, { ...node, authorId: uid, isPublished: true, visibility: 'public' }, { merge: true });
                    } else {
                        const nodeRef = doc(db, 'artifacts', appId, 'users', uid, 'custom_lessons', node.id);
                        batch.set(nodeRef, { ...node, instructorId: uid, isPublished: true }, { merge: true });
                    }
                });
            }

            await batch.commit();
            
            setToastMsg(selectedClassId ? "Pathway Successfully Updated! ♻️" : "Master Payload Deployed to the Global Radar! 🚀");
            setFormData({ title: '', description: '', level: 'Beginner', themeColor: '#4f46e5', coverImage: '', grade: 'Pathway' });
            setTimeline([]);
            setImportedPayload(null);
            setSelectedClassId('');
        } catch (e) {
            console.error("Deploy Error:", e);
            setToastMsg("Deployment failed. Check database permissions.");
        }
    };

    const getIconForType = (type: string) => {
        if (type === 'exam' || type === 'test' || type === 'quiz') return <HelpCircle size={16} className="text-rose-500" />;
        if (type === 'deck') return <Layers size={16} className="text-indigo-500" />;
        if (type === 'arcade_game') return <Gamepad2 size={16} className="text-amber-500" />;
        return <PlayCircle size={16} className="text-emerald-500" />;
    };

    return (
        <div className="space-y-6 relative pb-12 font-sans animate-in fade-in slide-in-from-bottom-4">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                        <Map size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Pathway Architect</h2>
                            
                            {/* Desktop Selector */}
                            <select 
                                value={selectedClassId} 
                                onChange={handleSelectClass}
                                className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg outline-none cursor-pointer border border-transparent focus:border-indigo-500 transition-all hidden sm:block max-w-[200px]"
                            >
                                <option value="">+ CREATE NEW</option>
                                {classes?.map((c: any) => (
                                    <option key={c.id} value={c.id}>EDIT: {c.name || c.title}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{timeline.length} Nodes Configured</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Mobile Selector */}
                    <select 
                        value={selectedClassId} 
                        onChange={handleSelectClass}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg outline-none cursor-pointer sm:hidden"
                    >
                        <option value="">+ CREATE NEW</option>
                        {classes?.map((c: any) => (
                            <option key={c.id} value={c.id}>EDIT: {c.name || c.title}</option>
                        ))}
                    </select>

                    <button 
                        onClick={() => setShowJsonModal(true)}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
                    >
                        <Code size={14} /> Import Payload
                    </button>
                </div>
            </div>

            {/* SINGLE COLUMN VERTICAL LAYOUT */}
            <div className="space-y-6">
                
                {/* 1. METADATA CONFIG */}
                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Module Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <input name="title" value={formData.title} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-black focus:border-indigo-500 outline-none transition-colors" placeholder="Pathway Title (e.g., American Civic Architecture)" />
                            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium text-sm focus:border-indigo-500 outline-none transition-colors resize-none h-24 custom-scrollbar" placeholder="Brief description of this learning journey..." />
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <input type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} className="h-14 w-14 rounded-xl cursor-pointer border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 shrink-0" />
                                <select name="level" value={formData.level} onChange={handleChange} className="flex-1 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-black focus:border-indigo-500 outline-none cursor-pointer">
                                    <option value="Beginner">Beginner Level</option>
                                    <option value="Intermediate">Intermediate Level</option>
                                    <option value="Advanced">Advanced Level</option>
                                    <option value="Mastery">Mastery Level</option>
                                </select>
                            </div>
                            <input name="grade" value={formData.grade} onChange={handleChange} className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-black text-sm focus:border-indigo-500 outline-none" placeholder="Label (e.g., Phase 1, Level 1)" />
                        </div>
                    </div>
                </section>

                {/* 2. THE TIMELINE (ACTIVE SEQUENCE) */}
                <section className="bg-slate-900 dark:bg-black rounded-[2rem] border-4 border-slate-800 shadow-xl flex flex-col overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                    <div className="p-4 border-b border-slate-800 bg-slate-950 shrink-0 flex justify-between items-center z-10">
                        <h3 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} className="text-indigo-500" /> Active Sequence
                        </h3>
                        <span className="text-[10px] bg-slate-800 text-indigo-400 px-3 py-1 rounded-full font-bold tracking-widest">{timeline.length} Nodes</span>
                    </div>
                    
                    <div className="p-6 space-y-3 z-10 min-h-[200px]">
                        {timeline.length === 0 ? (
                            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                                <Map size={40} className="mb-4 opacity-30" />
                                <p className="text-xs font-black uppercase tracking-widest text-center max-w-[250px]">
                                    Timeline is empty.<br/>Select modules from the library below to begin.
                                </p>
                            </div>
                        ) : (
                            timeline.map((node: any, index: number) => (
                                <div key={`${node.id}_${index}`} className="relative flex items-center gap-3 group animate-in slide-in-from-bottom-4">
                                    {/* Connection Line */}
                                    {index !== timeline.length - 1 && <div className="absolute left-6 top-10 bottom-[-20px] w-1 bg-slate-800 z-0" />}
                                    
                                    <div className="w-12 h-12 bg-slate-950 border-2 border-slate-700 text-slate-300 rounded-2xl flex items-center justify-center font-black z-10 shrink-0 shadow-md">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 bg-slate-800 border-2 border-slate-700 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden pr-2">
                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-700">
                                                {getIconForType(node.type)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-black text-white text-sm md:text-base truncate">{node.title}</span>
                                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{node.type || 'Lesson'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 backdrop-blur-md">
                                            <button onClick={() => moveUp(index)} disabled={index === 0} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors">▲</button>
                                            <button onClick={() => moveDown(index)} disabled={index === timeline.length - 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors">▼</button>
                                            <div className="w-px h-6 bg-slate-700 mx-1" />
                                            <button onClick={() => removeFromTimeline(index)} className="w-8 h-8 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                                                <X size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 3. MODULE LIBRARY (Available Lessons) */}
                <section className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
                        <h3 className="font-black text-slate-500 text-xs uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={14} className="text-slate-400" /> Module Library
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Click any module to instantly append it to your active sequence above.</p>
                    </div>
                    
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                        {availableLessons?.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs font-bold uppercase">No lessons built yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {availableLessons?.map((lesson: any) => (
                                    <button 
                                        key={lesson.id} 
                                        onClick={() => addToTimeline(lesson)}
                                        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98] group text-left"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                                {getIconForType(lesson.type)}
                                            </div>
                                            <div className="truncate">
                                                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{lesson.title}</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lesson.type || 'Lesson'}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                            <ArrowUpCircle size={16} strokeWidth={2.5} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <button 
                    onClick={handleSubmit} 
                    className="w-full text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
                >
                    <Save size={20}/> {selectedClassId ? "Update Pathway Sequence" : "Publish Pathway Sequence"}
                </button>
            </div>

            {/* 🔥 THE JSON IMPORT MODAL */}
            {showJsonModal && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowJsonModal(false)} />
                    <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-500 rounded-xl flex items-center justify-center">
                                    <Code size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Inject JSON Payload</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paste Gem Output Below</p>
                                </div>
                            </div>
                            <button onClick={() => setShowJsonModal(false)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <textarea 
                                value={jsonText}
                                onChange={(e) => setJsonText(e.target.value)}
                                placeholder='{\n  "title": "American Civic Architecture",\n  "syllabus": [\n    { "title": "The Executive Branch", "type": "lesson" }\n  ]\n}'
                                className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 resize-none custom-scrollbar"
                            />
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex gap-4">
                            <button onClick={() => setShowJsonModal(false)} className="px-6 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
                            <button onClick={handleImportJSON} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Zap size={16} /> Decrypt & Inject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
