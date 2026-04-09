// src/components/instructor/AiGeneratorModal.tsx
import React, { useState, useRef } from 'react';
import { 
    Sparkles, Wand2, X, Loader2, FileText, AlignLeft,
    ListChecks, Puzzle, Brain, ChevronDown, 
    UploadCloud, File, MessageSquare, MessageCircle, Info, Mic, Image as ImageIcon,
    Lock, Crown, CheckCircle2
} from 'lucide-react';
import { JuicyToast } from '../Toast'; 

export default function AiGeneratorModal({ isOpen, onClose, onAppendBlocks, userData }: any) {
    const [activeTab, setActiveTab] = useState<'lesson' | 'scenario'>('lesson');
    
    // CONTENT STATES
    const [prompt, setPrompt] = useState('');
    const [scenarioPrompt, setScenarioPrompt] = useState(''); // Separate prompt for scenario tab
    const [gradeLevel, setGradeLevel] = useState('High School');
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // PDF STATES
    const [pdfFileName, setPdfFileName] = useState<string | null>(null);
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🔥 EXPANDED GENERATION TARGETS
    const [selectedTypes, setSelectedTypes] = useState({
        image: true,
        text: true,
        essay: false,
        vocab: true,
        quiz: true,
        fillBlank: false,
        dialogue: false,
        discussion: false,
        callout: false,
        pronunciation: false
    });

    // 🔥 FREEMIUM GATE CHECK
    const isPro = userData?.subscriptionTier === 'pro';

    if (!isOpen) return null;

    const toggleType = (type: keyof typeof selectedTypes) => {
        setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setToastMsg("Only PDF files are supported for document analysis.");
            return;
        }

        if (file.size > 15 * 1024 * 1024) { 
            setToastMsg("File is too large. Please upload a PDF under 15MB.");
            return;
        }

        setPdfFileName(file.name);
        
        const reader = new FileReader();
        reader.onloadend = () => {
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

    // 🔥 SCENARIO FORGE GENERATION (PRO ONLY)
    const handleGenerateScenario = async () => {
        if (!scenarioPrompt.trim()) return;
        setIsLoading(true);

        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;        
        if (!apiKey) {
            setToastMsg("CRITICAL: Missing Gemini API Key in .env file.");
            setIsLoading(false);
            return;
        }

        const systemPrompt = `You are an expert instructional designer creating interactive roleplay dialogues. 
        Generate a "dialogue" block based on this scenario: ${scenarioPrompt}. Target Audience: ${gradeLevel}.
        
        You must return a single JSON array with ONE object. Do not include markdown formatting or outside text.
        Schema: [{ "type": "dialogue", "lines": [{ "speaker": "Name 1", "text": "What they say", "translation": "Context or translation", "side": "left" }, { "speaker": "Name 2", "text": "Reply", "translation": "Context or translation", "side": "right" }] }]`;

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!res.ok) throw new Error("Scenario generation failed.");
            const data = await res.json();
            
            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\x60\x60\x60\s*$/i, '').trim();
            const generatedBlocks = JSON.parse(rawText);

            const stampedBlocks = generatedBlocks.map((block: any, idx: number) => ({
                ...block,
                id: `ai_scenario_${Date.now()}_${idx}`
            }));

            onAppendBlocks(stampedBlocks);
            setScenarioPrompt('');
            onClose();

        } catch (err: any) {
            console.error("Scenario Generator Error:", err);
            setToastMsg(`Generation failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔥 STANDARD LESSON ARCHITECT GENERATION
    const handleGenerate = async () => {
        if (!prompt.trim() && !pdfBase64) {
            setToastMsg("Please provide a topic, text, or upload a PDF.");
            return;
        }
        
        const isContentRequested = Object.values(selectedTypes).some(v => v);
        if (!isContentRequested) {
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
        ${selectedTypes.essay ? `- An "essay" block: A longer, deep-dive reading passage. Schema: { "type": "essay", "title": "Deep Dive Topic", "content": "Multiple paragraphs of detailed content..." }` : ''}
        ${selectedTypes.vocab ? `- A "vocab-list" block: 3 to 5 key terms and definitions based heavily on the source material. Schema: { "type": "vocab-list", "items": [{ "term": "Word", "definition": "Meaning" }] }` : ''}
        ${selectedTypes.quiz ? `- A "quiz" block: A multiple choice question testing comprehension. Schema: { "type": "quiz", "question": "The question?", "options": [{ "id": "a", "text": "opt 1" }, { "id": "b", "text": "opt 2" }, { "id": "c", "text": "opt 3" }, { "id": "d", "text": "opt 4" }], "correctId": "b" }` : ''}
        ${selectedTypes.fillBlank ? `- A "fill-blank" block: A sentence with exactly two blank words enclosed in [brackets]. Schema: { "type": "fill-blank", "question": "Fill in the missing words", "text": "The [first] word and the [second] word.", "distractors": ["wrong1", "wrong2"] }` : ''}
        ${selectedTypes.dialogue ? `- A "dialogue" block: A conversational exchange between two characters illustrating the concept. Schema: { "type": "dialogue", "lines": [{ "speaker": "Name 1", "text": "What they say", "translation": "Context or translation", "side": "left" }, { "speaker": "Name 2", "text": "Reply", "translation": "Context or translation", "side": "right" }] }` : ''}
        ${selectedTypes.discussion ? `- A "discussion" block: 3 thought-provoking questions for group discussion. Schema: { "type": "discussion", "title": "Discussion Topic", "questions": ["Question 1", "Question 2", "Question 3"] }` : ''}
        ${selectedTypes.callout ? `- A "callout" block: A highlighted pro-tip, grammar rule, or important fact. Schema: { "type": "callout", "label": "Pro Tip / Important", "content": "The critical information..." }` : ''}
        ${selectedTypes.pronunciation ? `- A "pronunciation" block: A minimal pairs lab comparing challenging sounds. Extract 2 related phonemes (IPA format) and provide minimal pair examples. Schema: { "type": "pronunciation", "targetPhonemes": ["IPA1", "IPA2"], "pairs": [{ "p1": "IPA1", "p2": "IPA2", "w1": "Word 1", "w2": "Word 2", "focus": "Concept Focus" }] }` : ''}
        
        Additional User Instructions / Topic:
        "${prompt || 'Analyze the attached PDF and extract the most important learning concepts.'}"`;

        const parts: any[] = [{ text: systemPrompt }];
        if (pdfBase64) {
            parts.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBase64
                }
            });
        }

        const textRequest = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: parts }],
                generationConfig: {
                    responseMimeType: "application/json" 
                }
            })
        });

        let imageRequest: Promise<Response> | null = null;
        if (selectedTypes.image) {
            const imageSubject = prompt.trim() || (pdfFileName ? pdfFileName.replace('.pdf', '') : 'a classroom concept');
            const imagePrompt = `A beautiful, modern, clean educational vector illustration representing the concept of: ${imageSubject}. Minimalist background, vibrant colors, no text or words in the image.`;
            
            imageRequest = fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: imagePrompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "16:9"
                    }
                })
            });
        }

        try {
            const promises: Promise<any>[] = [textRequest];
            if (imageRequest) promises.push(imageRequest);

            const results = await Promise.allSettled(promises);

            const textRes = results[0];
            if (textRes.status === 'rejected' || !textRes.value.ok) {
                throw new Error("Text generation failed or timed out.");
            }
            
            const textData = await textRes.value.json();
            if (textData.error) throw new Error(textData.error.message);

            let rawText = textData.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/^\x60\x60\x60(?:json)?\s*/i, '').replace(/\x60\x60\x60\s*$/i, '').trim();
            const generatedBlocks = JSON.parse(rawText);
            
            if (!Array.isArray(generatedBlocks)) {
                throw new Error("AI did not return the correct array schema.");
            }

            let heroImageUrl = null;
            if (selectedTypes.image && results[1] && results[1].status === 'fulfilled' && results[1].value.ok) {
                try {
                    const imgData = await results[1].value.json();
                    const base64Image = imgData.predictions?.[0]?.bytesBase64Encoded; 
                    if (base64Image) {
                        heroImageUrl = `data:image/jpeg;base64,${base64Image}`;
                    }
                } catch (imgError) {
                    console.warn("Image parsing failed, but continuing with text...", imgError);
                }
            }

            if (heroImageUrl) {
                generatedBlocks.unshift({
                    type: 'image',
                    url: heroImageUrl,
                    caption: `Conceptual Visualization: ${prompt.substring(0, 40) || 'Source Document'}`
                });
            }

            const stampedBlocks = generatedBlocks.map((block: any, idx: number) => ({
                ...block,
                id: `ai_generated_${Date.now()}_${idx}`
            }));

            setIsGenerating(false);
            onAppendBlocks(stampedBlocks);
            
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
            
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh]">
                
                {/* HEADER & TABS */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-md">
                            <Wand2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-widest leading-none">Magic Generator</h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Powered by Gemini & Imagen 4</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-x-auto">
                        <button 
                            onClick={() => setActiveTab('lesson')} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'lesson' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Sparkles size={14} /> Lesson Architect
                        </button>
                        <button 
                            onClick={() => setActiveTab('scenario')} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'scenario' ? 'bg-white dark:bg-cyan-600 text-cyan-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <Mic size={14} /> Scenario Forge
                            {!isPro && <Lock size={12} className="ml-1 opacity-50" />}
                        </button>
                    </div>

                    <button onClick={onClose} disabled={isGenerating || isLoading} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 rounded-full transition-colors disabled:opacity-50">
                        <X size={20} />
                    </button>
                </div>

                {/* TAB CONTENT: LESSON ARCHITECT */}
                {activeTab === 'lesson' && (
                    <>
                        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                            {/* PDF UPLOAD ZONE */}
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
                                        <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer">
                                            <UploadCloud size={28} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Upload a PDF Document</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Worksheets, Articles, Syllabi (Max 15MB)</span>
                                        </div>
                                        <input 
                                            type="file" accept="application/pdf" ref={fileInputRef} onChange={handlePdfUpload} disabled={isGenerating} 
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

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Context & Instructions</label>
                                <textarea 
                                    disabled={isGenerating} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Type a topic, paste a YouTube link, or give specific instructions for your PDF..."
                                    className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Target Grade Level</label>
                                    <div className="relative">
                                        <select 
                                            disabled={isGenerating} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-sm disabled:opacity-50"
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

                            <div className="space-y-3 pb-4">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Generated Assets</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    <button disabled={isGenerating} onClick={() => toggleType('image')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.image ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}>
                                        <ImageIcon size={18} className={selectedTypes.image ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Hero Image</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('text')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.text ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}>
                                        <AlignLeft size={18} className={selectedTypes.text ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Summary</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('essay')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.essay ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}>
                                        <FileText size={18} className={selectedTypes.essay ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Essay</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('vocab')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.vocab ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'}`}>
                                        <ListChecks size={18} className={selectedTypes.vocab ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Vocab List</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('callout')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.callout ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-amber-300'}`}>
                                        <Info size={18} className={selectedTypes.callout ? 'text-amber-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Callout</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('dialogue')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.dialogue ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'}`}>
                                        <MessageSquare size={18} className={selectedTypes.dialogue ? 'text-blue-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Dialogue</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('discussion')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.discussion ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-500 text-violet-700 dark:text-violet-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-violet-300'}`}>
                                        <MessageCircle size={18} className={selectedTypes.discussion ? 'text-violet-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Discussion</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('quiz')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.quiz ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-300'}`}>
                                        <Brain size={18} className={selectedTypes.quiz ? 'text-rose-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Quiz</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('fillBlank')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.fillBlank ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-300'}`}>
                                        <Puzzle size={18} className={selectedTypes.fillBlank ? 'text-emerald-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Fill Blanks</span>
                                    </button>
                                    <button disabled={isGenerating} onClick={() => toggleType('pronunciation')} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${selectedTypes.pronunciation ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-300'}`}>
                                        <Mic size={18} className={selectedTypes.pronunciation ? 'text-emerald-500' : 'text-slate-400'} />
                                        <span className="text-xs font-black uppercase tracking-widest">Pronounce</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating || (!prompt.trim() && !pdfBase64)}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isGenerating ? <><Loader2 size={20} className="animate-spin" /> Synthesizing Content...</> : <><Wand2 size={20} /> Generate Protocol</>}
                            </button>
                        </div>
                    </>
                )}

                {/* TAB CONTENT: SCENARIO FORGE */}
                {activeTab === 'scenario' && (
                    <div className="flex-1 flex flex-col p-8 bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-500">
                        {isPro ? (
                            <div className="w-full space-y-6 m-auto">
                                <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl p-6 flex items-start gap-4 text-cyan-800 dark:text-cyan-300 text-sm font-medium">
                                    <div className="p-2 bg-cyan-500 text-white rounded-xl shadow-md shrink-0"><Mic size={20} /></div>
                                    <div>
                                        <h3 className="font-black text-cyan-900 dark:text-cyan-100 mb-1">Scenario Forge Unlocked</h3>
                                        <p>Describe a real-world conversational scenario. The AI will forge an interactive, playable dialogue block for students to practice listening and speaking.</p>
                                    </div>
                                </div>
                                <textarea 
                                    value={scenarioPrompt}
                                    onChange={(e) => setScenarioPrompt(e.target.value)}
                                    placeholder="E.g., A customer comes into the bakery complaining that their custom cake order has the wrong name written on it. The cashier must apologize and offer a solution."
                                    className="w-full h-40 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 text-sm font-medium outline-none focus:border-cyan-500 shadow-inner resize-none text-slate-800 dark:text-white"
                                />
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Target Grade Level</label>
                                    <div className="relative">
                                        <select 
                                            disabled={isLoading} value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500 transition-colors shadow-sm disabled:opacity-50"
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
                                <button 
                                    onClick={handleGenerateScenario}
                                    disabled={isLoading || !scenarioPrompt.trim()}
                                    className="w-full py-4 mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                                    {isLoading ? 'Scripting Scenario...' : 'Forge Interactive Dialogue'}
                                </button>
                            </div>
                        ) : (
                            <div className="max-w-sm mx-auto relative flex flex-col items-center justify-center h-full text-center py-10">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 blur-3xl -z-10 rounded-full" />
                                
                                <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl mx-auto mb-6 relative border border-slate-800">
                                    <Lock className="text-cyan-400" size={32} />
                                    <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 p-1.5 rounded-lg shadow-lg">
                                        <Crown size={14} />
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Premium Tool Locked</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed px-4">
                                    The Scenario Forge uses advanced language models to create dynamic, playable roleplay dialogues for your students.
                                </p>
                                
                                <ul className="text-left space-y-4 mb-10 w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-emerald-500 shrink-0" size={18} /> Unlimited Audio Generation</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-emerald-500 shrink-0" size={18} /> 12 Native Accents & Dialects</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300"><CheckCircle2 className="text-emerald-500 shrink-0" size={18} /> Auto-Grading Pronunciation</li>
                                </ul>

                                <button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black uppercase text-xs tracking-widest py-4 rounded-[1.5rem] shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all">
                                    Upgrade to Magister Pro
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
