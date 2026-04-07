// src/components/instructor/AiGeneratorModal.tsx
import React, { useState } from 'react';
import { 
    Sparkles, Wand2, X, Loader2, FileText, 
    ListChecks, Puzzle, Brain, ChevronDown 
} from 'lucide-react';
import { JuicyToast } from '../Toast'; // Assuming you have this

export default function AiGeneratorModal({ isOpen, onClose, onAppendBlocks }: any) {
    const [prompt, setPrompt] = useState('');
    const [gradeLevel, setGradeLevel] = useState('High School');
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const [selectedTypes, setSelectedTypes] = useState({
        vocab: true,
        quiz: true,
        fillBlank: false,
        text: true
    });

    if (!isOpen) return null;

    const toggleType = (type: keyof typeof selectedTypes) => {
        setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setToastMsg("Please provide a topic or text to generate from.");
            return;
        }
        
        setIsGenerating(true);

        // ====================================================================
        // 🚀 PRODUCTION API CALL (Uncomment and configure when ready)
        // ====================================================================
        /*
        try {
            const response = await fetch('YOUR_FIREBASE_CLOUD_FUNCTION_URL', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    gradeLevel: gradeLevel,
                    types: selectedTypes
                })
            });
            const data = await response.json();
            onAppendBlocks(data.blocks);
            onClose();
        } catch (error) {
            setToastMsg("AI Generation failed. Please try again.");
        }
        */

        // ====================================================================
        // 🧪 SIMULATED MOCK GENERATION (For testing the UI/UX)
        // ====================================================================
        setTimeout(() => {
            const generatedBlocks: any[] = [];

            if (selectedTypes.text) {
                generatedBlocks.push({
                    id: `block_${Date.now()}_1`,
                    type: 'text',
                    title: `Introduction to: ${prompt.substring(0, 20)}...`,
                    content: `This is an AI-generated introduction for ${gradeLevel} students regarding the topic of ${prompt}. It automatically synthesizes the core concepts into an easy-to-read format.`
                });
            }

            if (selectedTypes.vocab) {
                generatedBlocks.push({
                    id: `block_${Date.now()}_2`,
                    type: 'vocab-list',
                    items: [
                        { term: 'Synthesis', definition: 'The combination of ideas to form a theory or system.' },
                        { term: 'Algorithm', definition: 'A process or set of rules to be followed in calculations.' },
                        { term: 'Dynamic', definition: 'Characterized by constant change, activity, or progress.' }
                    ]
                });
            }

            if (selectedTypes.quiz) {
                generatedBlocks.push({
                    id: `block_${Date.now()}_3`,
                    type: 'quiz',
                    question: `Which of the following best describes the main concept of ${prompt}?`,
                    content: {
                        question: `Which of the following best describes the main concept of ${prompt}?`,
                        options: [
                            { id: 'a', text: 'It relies entirely on manual input.' },
                            { id: 'b', text: 'It is an automated, dynamic process.' }, // Correct
                            { id: 'c', text: 'It has no educational value.' },
                            { id: 'd', text: 'It was invented in 1920.' }
                        ],
                        correctId: 'b'
                    }
                });
            }

            if (selectedTypes.fillBlank) {
                generatedBlocks.push({
                    id: `block_${Date.now()}_4`,
                    type: 'fill-blank',
                    question: "Complete the sentence:",
                    text: `The new AI [generator] allows teachers to instantly build [interactive] lessons.`,
                    distractors: ["manual", "boring", "calculator"]
                });
            }

            setIsGenerating(false);
            onAppendBlocks(generatedBlocks);
            onClose();
        }, 3500); // Simulate a 3.5 second API wait time
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isGenerating && onClose()} />
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none">Magic Generator</h2>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">AI-Powered Lesson Creation</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        disabled={isGenerating}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
                    
                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Source Material or Topic
                        </label>
                        <div className="relative">
                            <textarea 
                                disabled={isGenerating}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Paste a Wikipedia article, a YouTube URL, or simply type a topic like 'The French Revolution'..."
                                className="w-full h-32 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm md:text-base font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner disabled:opacity-50 custom-scrollbar"
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {prompt.length} chars
                            </div>
                        </div>
                    </div>

                    {/* Settings Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Target Grade Level
                            </label>
                            <div className="relative">
                                <select 
                                    disabled={isGenerating}
                                    value={gradeLevel}
                                    onChange={(e) => setGradeLevel(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <option value="Elementary School">Elementary School</option>
                                    <option value="Middle School">Middle School</option>
                                    <option value="High School">High School</option>
                                    <option value="University">University / Adult</option>
                                    <option value="ESL Beginner">ESL (Beginner)</option>
                                    <option value="ESL Advanced">ESL (Advanced)</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Block Selectors */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Generated Assets
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                disabled={isGenerating}
                                onClick={() => toggleType('text')}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.text ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}
                            >
                                <FileText size={20} className={selectedTypes.text ? 'text-indigo-500' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase tracking-widest">Summary Text</span>
                            </button>

                            <button 
                                disabled={isGenerating}
                                onClick={() => toggleType('vocab')}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.vocab ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}
                            >
                                <ListChecks size={20} className={selectedTypes.vocab ? 'text-indigo-500' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase tracking-widest">Vocab List</span>
                            </button>

                            <button 
                                disabled={isGenerating}
                                onClick={() => toggleType('quiz')}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.quiz ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}
                            >
                                <Brain size={20} className={selectedTypes.quiz ? 'text-indigo-500' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase tracking-widest">Trivia Quiz</span>
                            </button>

                            <button 
                                disabled={isGenerating}
                                onClick={() => toggleType('fillBlank')}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.fillBlank ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}
                            >
                                <Puzzle size={20} className={selectedTypes.fillBlank ? 'text-indigo-500' : 'text-slate-400'} />
                                <span className="text-xs font-black uppercase tracking-widest">Fill-in Blanks</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer / Action */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Synthesizing Content...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} /> Generate Protocol
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
