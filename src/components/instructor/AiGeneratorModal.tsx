// src/components/instructor/AiGeneratorModal.tsx
import React, { useState, useRef } from 'react';
import { 
    Sparkles, Wand2, X, Loader2, FileText, 
    ListChecks, Puzzle, Brain, ChevronDown, UploadCloud, File
} from 'lucide-react';
import { JuicyToast } from '../Toast'; 

export default function AiGeneratorModal({ isOpen, onClose, onAppendBlocks }: any) {
    const [prompt, setPrompt] = useState('');
    const [gradeLevel, setGradeLevel] = useState('High School');
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // 🔥 NEW PDF STATES
    const [pdfFileName, setPdfFileName] = useState<string | null>(null);
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // 🔥 HANDLE PDF UPLOAD & BASE64 CONVERSION
    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setToastMsg("Only PDF files are supported for document analysis.");
            return;
        }

        if (file.size > 15 * 1024 * 1024) { // 15MB limit for inline API limits
            setToastMsg("File is too large. Please upload a PDF under 15MB.");
            return;
        }

        setPdfFileName(file.name);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            // reader.result returns "data:application/pdf;base64,JVBER..."
            // We only want the raw base64 string after the comma
            const base64String = (reader.result as string).split(',')[1];
            setPdfBase64(base64String);
            setToastMsg(`PDF "${file.name}" attached successfully! ✨`);
        };
        reader.readAsDataURL(file);
    };

    const removePdf = () => {
        setPdfFileName(null);
        setPdfBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !pdfBase64) {
            setToastMsg("Please provide a topic, text, or upload a PDF.");
            return;
        }
        
        if (!Object.values(selectedTypes).some(v => v)) {
            setToastMsg("Please select at least one type of content to generate.");
            return;
        }

        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;        
        if (!apiKey) {
            setToastMsg("CRITICAL: Missing Gemini API Key in .env file.");
            return;
        }

        setIsGenerating(true);

        const systemPrompt = `You are an expert instructional designer. Generate educational content based on the provided topic, text, or attached PDF document.
        Target Audience: ${gradeLevel}.
        
        You must return a single JSON array of objects. Do not include markdown formatting or outside text.
        Generate ONLY the block types requested by the user below:
        
        ${selectedTypes.text ? `- A "text" block: An engaging, well-structured introduction or summary. Schema: { "type": "text", "title": "Catchy Title", "content": "Paragraph content..." }` : ''}
        ${selectedTypes.vocab ? `- A "vocab-list" block: 3 to 5 key terms and definitions based heavily on the source material. Schema: { "type": "vocab-list", "items": [{ "term": "Word", "definition": "Meaning" }] }` : ''}
        ${selectedTypes.quiz ? `- A "quiz" block: A multiple choice question testing comprehension of the source material. Schema: { "type": "quiz", "question": "The question?", "options": [{ "id": "a", "text": "opt 1" }, { "id": "b", "text": "opt 2" }, { "id": "c", "text": "opt 3" }, { "id": "d", "text": "opt 4" }], "correctId": "b" }` : ''}
        ${selectedTypes.fillBlank ? `- A "fill-blank" block: A sentence with exactly two blank words enclosed in [brackets] drawn from the core concepts. Schema: { "type": "fill-blank", "question": "Fill in the missing words", "text": "The [first] word and the [second] word.", "distractors": ["wrong1", "wrong2"] }` : ''}
        
        Additional User Instructions / Topic:
        "${prompt || 'Analyze the attached PDF and extract the most important learning concepts.'}"`;

        // 🔥 ASSEMBLE THE MULTIMODAL PAYLOAD
        const parts: any[] = [{ text: systemPrompt }];
        if (pdfBase64) {
            parts.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBase64
                }
            });
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: parts }],
                    generationConfig: {
                        responseMimeType: "application/json" 
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error Details:", errorData);
                throw new Error(`API call failed: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            let rawText = data.candidates[0].content.parts[0].text;
            
            rawText = rawText.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\x60\x60\x60\s*$/i, '').trim();
            const generatedBlocks = JSON.parse(rawText);
            
            if (!Array.isArray(generatedBlocks)) {
                throw new Error("AI did not return the correct array schema.");
            }

            const stampedBlocks = generatedBlocks.map((block: any, idx: number) => ({
                ...block,
                id: `ai_generated_${Date.now()}_${idx}`
            }));

            setIsGenerating(false);
            onAppendBlocks(stampedBlocks);
            
            // Clean up states
            setPrompt('');
            removePdf();
            onClose();

        } catch (err: any) {
            console.error("Magic Generator Error:", err);
            setToastMsg(`Generation failed: ${err.message}`);
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
            
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !isGenerating && onClose()} />
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh]">
                
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-indigo-500 to-purple-600 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none">Magic Generator</h2>
                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">Multimodal Document Analysis</p>
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
                    
                    {/* 🔥 NEW PDF UPLOAD ZONE */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Source Document (Optional)
                        </label>
                        {pdfFileName ? (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 truncate">
                                    <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0">
                                        <File size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 truncate">{pdfFileName}</span>
                                </div>
                                <button onClick={removePdf} disabled={isGenerating} className="p-2 text-emerald-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors shrink-0">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer">
                                    <UploadCloud size={28} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Upload a PDF Document</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Worksheets, Articles, Syllabi (Max 15MB)</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    ref={fileInputRef}
                                    onChange={handlePdfUpload} 
                                    disabled={isGenerating} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AND / OR</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Context & Instructions
                        </label>
                        <textarea 
                            disabled={isGenerating}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Type a topic, paste a YouTube link, or give specific instructions for your PDF (e.g. 'Focus only on the vocabulary from chapter 2')..."
                            className="w-full h-24 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner disabled:opacity-50 custom-scrollbar"
                        />
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
                    <div className="space-y-3 pb-4">
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
                        disabled={isGenerating || (!prompt.trim() && !pdfBase64)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Analyzing Document...
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
