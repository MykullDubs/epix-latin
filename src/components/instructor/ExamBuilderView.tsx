// src/components/instructor/ExamBuilderView.tsx
import React, { useState } from 'react';
import { 
    Code, Settings, BarChart, Clock, Tag, X, Trash2, 
    List, Check, CheckCircle2, AlignLeft, Save, Plus,
    FileText, Zap, Edit3
} from 'lucide-react';

// ============================================================================
//  EXAM BUILDER (Unified to Magister OS "Blocks" Architecture)
// ============================================================================
export default function ExamBuilderView({ onSave, initialData }: any) {
    const [examData, setExamData] = useState(initialData || { 
        title: '', 
        description: '', 
        contentType: 'exam', 
        level: 'All',
        duration: 30,
        tags: [],
        blocks: [] // FIXED: Replaced 'questions' with 'blocks'
    });
    
    const [jsonMode, setJsonMode] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');

    // Safely calculate points (Defaulting to 10 per block if not specified)
    const totalPoints = (examData.blocks || []).reduce((sum: number, b: any) => sum + (Number(b.points) || 10), 0);

    const addBlock = (type: 'quiz' | 'fill-blank' | 'essay') => {
        let newBlock: any = { id: `block_${Date.now()}`, type, points: 10 };
        
        if (type === 'quiz') {
            newBlock.content = {
                question: '',
                options: [{ id: 'opt_0', text: 'Option A' }, { id: 'opt_1', text: 'Option B' }],
                correctId: 'opt_0'
            };
        } else if (type === 'fill-blank') {
            newBlock.content = {
                text: 'Type a sentence with [brackets] around the words you want to hide.',
                distractors: ['decoy1', 'decoy2']
            };
        } else if (type === 'essay') {
            newBlock.title = 'Essay Prompt';
            newBlock.content = '';
        }

        setExamData({ ...examData, blocks: [...(examData.blocks || []), newBlock] });
    };

    const updateBlockRoot = (idx: number, field: string, val: any) => {
        const newBlocks = [...examData.blocks];
        newBlocks[idx] = { ...newBlocks[idx], [field]: val };
        setExamData({ ...examData, blocks: newBlocks });
    };

    const updateBlockContent = (idx: number, field: string, val: any) => {
        const newBlocks = [...examData.blocks];
        newBlocks[idx].content = { ...newBlocks[idx].content, [field]: val };
        setExamData({ ...examData, blocks: newBlocks });
    };

    const handleImport = () => {
        try {
            setJsonError(null);
            let parsed = JSON.parse(jsonInput);
            
            // FIX: If the user pasted the array of 4 exams, grab the first one automatically
            if (Array.isArray(parsed)) {
                parsed = parsed[0];
            }

            const hydratedData = { ...examData, ...parsed, contentType: 'exam' };
            // Ensure blocks array exists
            if (!hydratedData.blocks) hydratedData.blocks = [];
            
            setExamData(hydratedData);
            setJsonMode(false);
        } catch (e) { 
            setJsonError("Invalid JSON structure. Ensure you copied the raw JSON correctly."); 
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!examData.tags?.includes(tagInput.trim())) {
                setExamData({ ...examData, tags: [...(examData.tags || []), tagInput.trim()] });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setExamData({ ...examData, tags: examData.tags.filter((t:string) => t !== tagToRemove) });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 relative animate-in fade-in duration-500">
            
            {/* --- HEADER --- */}
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0 sticky top-0 z-20 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-1">
                        <FileText size={24} className="text-indigo-600" /> Exam Builder
                    </h2>
                    <div className="flex gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="bg-slate-100 px-2 py-1 rounded-md">{(examData.blocks || []).length} Blocks</span>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">{totalPoints} Points</span>
                    </div>
                </div>
                <button onClick={() => setJsonMode(!jsonMode)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${jsonMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                    <Code size={16} /> {jsonMode ? 'Visual Editor' : 'JSON Engine'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-40">
                {jsonMode ? (
                    <div className="p-8 max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Code size={20}/></div>
                            <div>
                                <h3 className="font-black text-slate-800">Raw JSON Payload</h3>
                                <p className="text-xs font-bold text-slate-400">Paste your AI-generated exam array here (it will import the first exam).</p>
                            </div>
                        </div>
                        {jsonError && <div className="mb-4 p-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-bold text-sm flex items-center gap-2"><Zap size={16}/> {jsonError}</div>}
                        <textarea 
                            className="w-full h-[60vh] p-6 bg-slate-900 text-emerald-400 font-mono text-sm rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-2xl custom-scrollbar leading-relaxed" 
                            value={jsonInput} 
                            onChange={e => setJsonInput(e.target.value)} 
                            placeholder="Paste your raw JSON exam object here..." 
                        />
                        <button onClick={handleImport} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <CheckCircle2 size={24} /> Hydrate Exam
                        </button>
                    </div>
                ) : (
                    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
                        
                        {/* --- METADATA SETTINGS PANEL --- */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                            <div className="flex items-center gap-3 text-indigo-600 mb-4">
                                <Settings size={20} /> <h3 className="font-black uppercase tracking-widest text-xs">Exam Configuration</h3>
                            </div>
                            
                            <input 
                                className="w-full text-3xl md:text-4xl font-black text-slate-900 placeholder-slate-200 outline-none transition-colors border-b-2 border-transparent focus:border-indigo-100 pb-2" 
                                placeholder="Exam Title..." 
                                value={examData.title} 
                                onChange={e => setExamData({...examData, title: e.target.value})} 
                            />
                            <textarea 
                                className="w-full text-lg font-medium text-slate-500 placeholder-slate-300 outline-none resize-none h-14" 
                                placeholder="A brief description for the students..." 
                                value={examData.description} 
                                onChange={e => setExamData({...examData, description: e.target.value})} 
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BarChart size={14}/> Target Level</label>
                                    <select value={examData.level} onChange={e => setExamData({...examData, level: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:bg-white transition-all cursor-pointer">
                                        <option value="All">All Levels</option>
                                        <option value="A1">A1 Beginner</option>
                                        <option value="A2">A2 Elementary</option>
                                        <option value="B1">B1 Intermediate</option>
                                        <option value="B2">B2 Upper Int.</option>
                                        <option value="C1">C1 Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={14}/> Time Limit</label>
                                    <div className="relative">
                                        <input type="number" value={examData.duration} onChange={e => setExamData({...examData, duration: parseInt(e.target.value) || 0})} className="w-full p-4 pl-5 pr-14 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:bg-white transition-all" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">min</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag size={14}/> Tags</label>
                                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder="Type & hit enter..." className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-200 focus:bg-white transition-all" />
                                </div>
                            </div>
                            
                            {examData.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {examData.tags.map((t:string) => (
                                        <span key={t} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100">
                                            {t} <button onClick={() => removeTag(t)} className="hover:text-rose-500 hover:bg-white p-0.5 rounded-md transition-colors"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- INTERACTIVE BLOCK CARDS --- */}
                        <div className="space-y-8">
                            {(examData.blocks || []).map((b: any, idx: number) => (
                                <div key={idx} className="bg-white p-8 md:p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all animate-in slide-in-from-bottom-4">
                                    
                                    {/* Block Header */}
                                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-[1rem] flex items-center justify-center font-black text-xl shadow-md">{idx + 1}</div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Block Type</span>
                                                <span className="text-sm font-bold text-indigo-600 capitalize">{b.type.replace('-', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 focus-within:border-amber-300 focus-within:bg-white transition-all">
                                                <input className="w-12 bg-transparent text-right font-black text-amber-600 outline-none text-lg" type="number" min="1" value={b.points || 10} onChange={e => updateBlockRoot(idx, 'points', parseInt(e.target.value) || 0)} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">pts</span>
                                            </div>
                                            <button onClick={() => { const n = [...examData.blocks]; n.splice(idx,1); setExamData({...examData, blocks: n}); }} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all active:scale-90">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>

                                    {/* --- QUIZ EDITOR --- */}
                                    {b.type === 'quiz' && (
                                        <>
                                            <textarea 
                                                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-medium text-xl text-slate-800 mb-8 outline-none resize-y min-h-[100px] transition-all leading-relaxed" 
                                                placeholder="Type your question prompt here..." 
                                                value={b.content?.question || ''} 
                                                onChange={e => updateBlockContent(idx, 'question', e.target.value)} 
                                            />
                                            <div className="space-y-3 pl-2 md:pl-4 border-l-4 border-indigo-100">
                                                {(b.content?.options || []).map((opt: any, oIdx: number) => {
                                                    const isCorrect = b.content.correctId === opt.id;
                                                    return (
                                                        <div key={opt.id} className={`flex items-center gap-4 p-3 pr-4 rounded-2xl border-2 transition-all group/opt ${isCorrect ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                                                            <button 
                                                                onClick={() => updateBlockContent(idx, 'correctId', opt.id)}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400 bg-slate-50'}`}
                                                            >
                                                                {isCorrect && <Check size={16} strokeWidth={4} />}
                                                            </button>
                                                            <input 
                                                                className={`flex-1 bg-transparent text-base font-bold outline-none ${isCorrect ? 'text-emerald-900' : 'text-slate-700'}`} 
                                                                value={opt.text} 
                                                                onChange={(e) => {
                                                                    const newOpts = [...b.content.options];
                                                                    newOpts[oIdx] = { ...opt, text: e.target.value };
                                                                    updateBlockContent(idx, 'options', newOpts);
                                                                }} 
                                                                placeholder={`Option ${oIdx + 1}`}
                                                            />
                                                            {b.content.options.length > 2 && (
                                                                <button onClick={() => { const newOpts = b.content.options.filter((_:any, i:number) => i !== oIdx); updateBlockContent(idx, 'options', newOpts); }} className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover/opt:opacity-100">
                                                                    <X size={18} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <button onClick={() => {
                                                    const newOpts = [...b.content.options, { id: `opt_${Date.now()}`, text: `New Option` }];
                                                    updateBlockContent(idx, 'options', newOpts);
                                                }} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-5 py-3 rounded-xl hover:bg-indigo-100 transition-colors uppercase tracking-widest mt-4 flex items-center gap-2 active:scale-95">
                                                    <Plus size={16} strokeWidth={3} /> Add Option
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* --- FILL-IN-THE-BLANK EDITOR --- */}
                                    {b.type === 'fill-blank' && (
                                        <>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prompt Text (Use [brackets] to hide words)</label>
                                            <textarea 
                                                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-medium text-xl text-slate-800 mb-6 outline-none resize-y min-h-[100px] transition-all leading-relaxed" 
                                                placeholder="Example: The dog is [barking] at the mailman." 
                                                value={b.content?.text || ''} 
                                                onChange={e => updateBlockContent(idx, 'text', e.target.value)} 
                                            />
                                            
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Decoy Words (Comma Separated)</label>
                                            <input 
                                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-200 transition-all" 
                                                placeholder="running, sleeping, eating" 
                                                value={(b.content?.distractors || []).join(', ')} 
                                                onChange={e => {
                                                    const arr = e.target.value.split(',').map(s => s.trim());
                                                    updateBlockContent(idx, 'distractors', arr);
                                                }} 
                                            />
                                        </>
                                    )}

                                    {/* --- ESSAY EDITOR --- */}
                                    {b.type === 'essay' && (
                                        <>
                                            <input 
                                                className="w-full text-2xl font-black text-slate-900 placeholder-slate-200 outline-none transition-colors border-b-2 border-transparent focus:border-indigo-100 pb-2 mb-6" 
                                                placeholder="Essay Prompt Header..." 
                                                value={b.title || ''} 
                                                onChange={e => updateBlockRoot(idx, 'title', e.target.value)} 
                                            />
                                            <textarea 
                                                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-medium text-xl text-slate-800 mb-4 outline-none resize-y min-h-[120px] transition-all leading-relaxed" 
                                                placeholder="Write the full prompt or instructions here..." 
                                                value={b.content || ''} 
                                                onChange={e => updateBlockRoot(idx, 'content', e.target.value)} 
                                            />
                                            <div className="pl-4 border-l-4 border-indigo-100 py-3">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><AlignLeft size={16} className="text-indigo-400"/> Student will receive a rich-text box to answer.</p>
                                            </div>
                                        </>
                                    )}

                                </div>
                            ))}
                            
                            {/* Empty State / Call to Action */}
                            {(examData.blocks || []).length === 0 && (
                                <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-[3rem]">
                                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6"><List size={32} /></div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">No Questions Yet</h3>
                                    <p className="text-slate-400 font-bold text-sm max-w-sm mx-auto">Use the bottom dock to add interactive blocks, or use the JSON Engine to paste an AI generated exam.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- ACTION DOCK (Sticky Bottom) --- */}
            {!jsonMode && (
                <div className="absolute bottom-0 left-0 right-0 px-6 py-5 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-2">
                        <button onClick={() => addBlock('quiz')} className="px-5 py-3.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                            <List size={16} strokeWidth={2.5}/> Quiz
                        </button>
                        <button onClick={() => addBlock('fill-blank')} className="px-5 py-3.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                            <Edit3 size={16} strokeWidth={2.5}/> Fill Blank
                        </button>
                        <button onClick={() => addBlock('essay')} className="px-5 py-3.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hidden md:flex">
                            <AlignLeft size={16} strokeWidth={2.5}/> Essay
                        </button>
                    </div>

                    <button onClick={() => onSave(examData)} className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-transform active:scale-95">
                        Publish Exam <Save size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
