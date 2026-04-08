// src/components/instructor/RoleplayBuilderModal.tsx
import React, { useState } from 'react';
import { X, Save, Bot, User, Target, Globe, Mic, Sparkles, MessageSquare } from 'lucide-react';

export default function RoleplayBuilderModal({ isOpen, onClose, onSaveBlock }: any) {
    const [title, setTitle] = useState('');
    const [aiPersona, setAiPersona] = useState('');
    const [studentRole, setStudentRole] = useState('');
    const [objective, setObjective] = useState('');
    const [language, setLanguage] = useState('English (B1 Intermediate)');

    // Real-time Prompt Compiler (Updated with Rule 5)
    const compiledPrompt = `You are ${aiPersona || '[AI Persona]'}. 
The user you are speaking to is ${studentRole || '[Student Role]'}. 
The user's objective is to ${objective || '[Objective]'}.
Target Language & Difficulty: ${language}.

Strict Rules:
1. Stay entirely in character. Never break the fourth wall.
2. Keep your responses concise, conversational, and natural (1-3 sentences max).
3. React realistically to the user's statements. If they fail their objective, push back.
4. Do not offer translations unless explicitly asked in character.
5. IMPORTANT: Once the user successfully achieves their objective, you MUST immediately call the "complete_mission" function.`;

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title || !aiPersona || !studentRole || !objective) return;

        // 1. Define the tool exactly how the Live API expects it
        const winConditionTool = {
            function_declarations: [{
                name: "complete_mission",
                description: `Call this function strictly when the user has accomplished their objective: ${objective}. Do not call it until the objective is fully met.`,
                parameters: {
                    type: "OBJECT",
                    properties: {
                        feedback: {
                            type: "STRING",
                            description: "A short, encouraging sentence of feedback on the user's performance."
                        }
                    },
                    required: ["feedback"]
                }
            }]
        };

        const newBlock = {
            id: `roleplay_${Date.now()}`,
            type: 'roleplay',
            title: title,
            prompt: compiledPrompt,
            metadata: {
                aiPersona,
                studentRole,
                objective,
                language,
                // 2. Attach the tool to the block's metadata
                tools: [winConditionTool]
            }
        };

        onSaveBlock(newBlock);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* ── HEADER ── */}
                <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-cyan-600 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <Mic size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none">Scenario Forge</h2>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">Live Audio Configuration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* ── BODY ── */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-slate-50 dark:bg-slate-950">
                    
                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Simulation Title</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <MessageSquare size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="e.g., The Angry Chef, Border Customs, Ordering Coffee"
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">AI Persona</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Bot size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={aiPersona} 
                                    onChange={(e) => setAiPersona(e.target.value)} 
                                    placeholder="e.g., A stressed-out Executive Chef"
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Student Role</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="text" 
                                    value={studentRole} 
                                    onChange={(e) => setStudentRole(e.target.value)} 
                                    placeholder="e.g., A new line cook"
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Win Condition / Objective</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Target size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={objective} 
                                onChange={(e) => setObjective(e.target.value)} 
                                placeholder="e.g., Successfully relay a ticket for three vegan burgers."
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Language & Difficulty</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Globe size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)} 
                                placeholder="e.g., Spanish (A2 Beginner)"
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Compiled Prompt Preview */}
                    <div className="mt-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Compiled Neural Prompt</span>
                        </div>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {compiledPrompt}
                        </p>
                    </div>

                </div>

                {/* ── FOOTER ── */}
                <div className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button 
                        onClick={handleSave}
                        disabled={!title || !aiPersona || !studentRole || !objective}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:shadow-none"
                    >
                        <Save size={20} /> Inject Scenario to Lesson
                    </button>
                </div>
            </div>
        </div>
    );
}
