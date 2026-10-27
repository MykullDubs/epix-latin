// src/components/ExamPlayerView.tsx
import React, { useState, useEffect } from 'react';
import { 
    FileText, Clock, CheckCircle2, AlertTriangle, 
    Send, Check, AlignLeft, Flag, XCircle, ArrowRight, ArrowLeft
} from 'lucide-react';

// ============================================================================
//  EXAM PLAYER (Flat UI + Paginated Progressive State Machine)
// ============================================================================
export default function ExamPlayerView({ exam, onFinish }: any) {
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [scoreDetail, setScoreDetail] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // --- PROGRESSIVE ENGINE STATE ---
    const isProgressive = exam?.isProgressive === true && Array.isArray(exam?.phases) && exam.phases.length > 0;
    const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
    const [phaseHistory, setPhaseHistory] = useState<any[]>([]);
    
    // --- PAGINATION STATE ---
    const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
    
    // --- TIMER STATE ---
    const [timeLeft, setTimeLeft] = useState((exam.duration || 30) * 60);

    // Map the active questions based on whether it's progressive or a legacy flat exam
    const activeBlocks = isProgressive ? (exam.phases[currentPhaseIdx]?.blocks || []) : (exam.questions || exam.blocks || []);
    const totalQuestions = activeBlocks.length;
    
    const answeredCount = activeBlocks.filter((b: any) => answers[b.id] !== undefined && answers[b.id] !== '').length;
    const progressPct = totalQuestions > 0 ? ((currentBlockIdx + 1) / totalQuestions) * 100 : 0;
    const isLastQuestion = currentBlockIdx === totalQuestions - 1;

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [started, submitted, timeLeft]);

    // Auto-submit if time runs out
    useEffect(() => {
        if (started && timeLeft <= 0 && !submitted) {
            evaluateSubmission();
        }
    }, [timeLeft, started]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (qId: string, val: any) => {
        if (submitted) return;
        setAnswers({ ...answers, [qId]: val });
    };

    // --- EVALUATION ENGINE ---
    const evaluateSubmission = () => {
        let phasePoints = 0;
        let earnedPoints = 0;
        const details: any[] = [];
        let requiresManualGrading = false;

        activeBlocks.forEach((q: any) => {
            const points = parseInt(q.points || 10);
            phasePoints += points;
            const studentVal = answers[q.id];
            let isCorrect = false;
            let awarded = 0;

            const qType = q.type || 'multiple-choice';

            // Support legacy flat exams and new unified blocks
            if (qType === 'multiple-choice' || qType === 'boolean' || qType === 'quiz') {
                const correctRef = q.correctAnswer || q.correctId || q.content?.correctId;
                if (String(studentVal) === String(correctRef)) { 
                    awarded = points;
                    isCorrect = true;
                }
            } else if (qType === 'essay') {
                requiresManualGrading = true;
                awarded = 0; 
            }

            details.push({ 
                qId: q.id, 
                type: qType, 
                prompt: q.prompt || q.title || q.content?.question, 
                maxPoints: points, 
                studentVal: studentVal || "(No Answer)", 
                correctVal: q.correctAnswer || q.correctId || q.content?.correctId || null, 
                awardedPoints: awarded, 
                isCorrect,
                teacherFeedback: "" 
            });
            earnedPoints += awarded;
        });

        const phaseScorePct = phasePoints > 0 ? Math.round((earnedPoints / phasePoints) * 100) : 0;
        
        const phaseResult = { 
            phaseId: isProgressive ? exam.phases[currentPhaseIdx].id : 'default',
            phaseTitle: isProgressive ? exam.phases[currentPhaseIdx].title : exam.title,
            score: earnedPoints, 
            total: phasePoints, 
            scorePct: phaseScorePct, 
            status: requiresManualGrading ? 'pending_review' : 'graded', 
            details 
        };

        const newHistory = [...phaseHistory, phaseResult];
        setPhaseHistory(newHistory);
        setShowConfirm(false);

        // --- BRANCHING LOGIC FOR PROGRESSIVE EXAMS ---
        if (isProgressive) {
            const currentPhaseData = exam.phases[currentPhaseIdx];
            const passed = phaseScorePct >= (currentPhaseData.passingThreshold || 80);
            
            let nextId = passed ? currentPhaseData.nextPhaseId : currentPhaseData.fallbackPhaseId;
            
            // If there is a valid routing ID, find its index and navigate there
            if (nextId) {
                const nextIndex = exam.phases.findIndex((p: any) => p.id === nextId);
                if (nextIndex !== -1) {
                    setCurrentPhaseIdx(nextIndex);
                    setCurrentBlockIdx(0); // Reset pagination for the new phase
                    return;
                }
            }
        }

        // --- FINALIZATION (Standard Exam or End of Progressive Route) ---
        const finalTotalPoints = newHistory.reduce((sum, h) => sum + h.total, 0);
        const finalEarnedPoints = newHistory.reduce((sum, h) => sum + h.score, 0);
        const finalScorePct = finalTotalPoints > 0 ? Math.round((finalEarnedPoints / finalTotalPoints) * 100) : 0;
        const finalStatus = newHistory.some(h => h.status === 'pending_review') ? 'pending_review' : 'graded';

        const finalResultPayload = {
            score: finalEarnedPoints,
            total: finalTotalPoints,
            finalScorePct,
            status: finalStatus,
            details: newHistory.flatMap(h => h.details),
            phaseHistory: newHistory // Store the exact routing path taken
        };

        setScoreDetail(finalResultPayload);
        setSubmitted(true);
        
        onFinish(exam.id, finalEarnedPoints, exam.title, finalResultPayload);
    };

    if (!exam || totalQuestions === 0) return null;

    // --- SCREEN 1: INTRO SCREEN ---
    if (!started) {
        return (
            <div className="h-[100dvh] overflow-y-auto custom-scrollbar bg-zinc-100 dark:bg-zinc-950 animate-in fade-in duration-300">
                {/* min-h-full + padding ensures it centers if short, but scrolls if tall */}
                <div className="min-h-full flex items-center justify-center p-4 py-12">
                    <div className="bg-white dark:bg-black max-w-xl w-full border-2 border-zinc-900 dark:border-zinc-200 p-6 sm:p-8 text-center relative shadow-sm">
                        
                        <div className="w-20 h-20 bg-black text-white border-2 border-zinc-900 dark:border-zinc-200 flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} strokeWidth={2.5} />
                        </div>
                        
                        <h1 className="text-3xl font-black text-zinc-950 dark:text-white mb-2 uppercase tracking-tighter leading-tight">
                            {exam.title}
                        </h1>
                        
                        {isProgressive && (
                            <span className="inline-block bg-indigo-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                Adaptive Assessment Protocol
                            </span>
                        )}

                        <div className="max-h-[30vh] overflow-y-auto custom-scrollbar mb-8 px-2">
                            <p className="text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed text-sm">
                                {exam.description || "You are about to begin this assessment. Ensure a stable connection before proceeding."}
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                            <div className="border-2 border-zinc-900 dark:border-zinc-200 flex-1 py-4">
                                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Time Limit</span>
                                <span className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2 justify-center">
                                    <Clock size={18} className="text-indigo-600"/> {exam.duration || 30} MIN
                                </span>
                            </div>
                            <div className="border-2 border-zinc-900 dark:border-zinc-200 flex-1 py-4">
                                <span className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">
                                    {isProgressive ? 'Initial Nodes' : 'Questions'}
                                </span>
                                <span className="text-xl font-black text-zinc-900 dark:text-white">
                                    {String(totalQuestions).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => onFinish(null, 0)} className="w-full sm:w-auto py-4 sm:px-6 font-black text-zinc-500 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors uppercase tracking-[0.2em] text-xs">
                                Cancel
                            </button>
                            <button onClick={() => setStarted(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] transition-colors text-xs flex items-center justify-center gap-2">
                                Initialize Sequence <AlignLeft size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- SCREEN 3: COMPLETED SCREEN ---
    if (submitted) {
        return (
            <div className="h-[100dvh] overflow-y-auto custom-scrollbar bg-zinc-100 dark:bg-zinc-950 animate-in zoom-in duration-200">
                <div className="min-h-full flex items-center justify-center p-4 py-12">
                    <div className="bg-white dark:bg-black p-8 text-center max-w-md w-full border-2 border-zinc-900 dark:border-zinc-200 relative shadow-sm">
                        
                        <div className={`w-20 h-20 flex items-center justify-center mx-auto mb-6 border-4 ${scoreDetail.status === 'pending_review' ? 'bg-amber-400 border-black text-black' : 'bg-emerald-600 border-black text-white'}`}>
                            {scoreDetail.status === 'pending_review' ? <Clock size={40} strokeWidth={2.5}/> : <CheckCircle2 size={40} strokeWidth={3}/>}
                        </div>
                        
                        <h2 className="text-2xl font-black text-zinc-950 dark:text-white mb-2 uppercase tracking-tight">
                            {scoreDetail.status === 'pending_review' ? 'Pending Review' : 'Sequence Terminated'}
                        </h2>
                        
                        <div className="bg-zinc-100 dark:bg-zinc-900 p-5 mb-8 border-2 border-zinc-900 dark:border-zinc-200 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            <p className="text-zinc-600 dark:text-zinc-400 font-bold leading-relaxed text-sm">
                                {scoreDetail.status === 'pending_review' 
                                    ? "Written responses logged for instructor evaluation. Score pending." 
                                    : `Final calculation complete. \nScore: ${scoreDetail.score} / ${scoreDetail.total}`}
                            </p>
                        </div>

                        <button onClick={() => onFinish(null, 0)} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-xs">
                            Return to Hub
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SCREEN 2: ACTIVE EXAM (PAGINATED VIEW) ---
    const q = activeBlocks[currentBlockIdx];
    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
    const qType = q.type || 'multiple-choice';

    return (
        <div className="h-[100dvh] flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative animate-in fade-in duration-300">
            
            {/* SUBMIT CONFIRMATION MODAL */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 dark:bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-black w-full max-w-sm border-2 border-zinc-900 dark:border-zinc-200 p-8 text-center">
                        <div className="w-16 h-16 bg-rose-600 text-white flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-black text-zinc-950 dark:text-white mb-2 uppercase tracking-tight">
                            {isProgressive ? 'Finalize Phase?' : 'Finalize Sequence?'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 font-bold">
                            Cannot reverse data entry after this point.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border-2 border-transparent">Cancel</button>
                            <button onClick={evaluateSubmission} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-colors border-2 border-rose-600">Execute</button>
                        </div>
                    </div>
                </div>
            )}

            {/* STICKY HEADER (LOCKED TO TOP) */}
            <header className="shrink-0 px-4 sm:px-6 py-4 bg-white dark:bg-black border-b-2 border-zinc-900 dark:border-zinc-200 z-30 flex justify-between items-center">
                <div className="flex flex-col min-w-0 pr-4">
                    <h1 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight truncate leading-none mb-1">
                        {exam.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Flag size={12} className="text-indigo-600" /> 
                        <span className="truncate">
                            {isProgressive ? exam.phases[currentPhaseIdx].title : 'Assessment Active'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] tabular-nums">
                            {String(answeredCount).padStart(2, '0')}/{String(totalQuestions).padStart(2, '0')}
                        </span>
                    </div>

                    <div className={`px-3 py-2 font-black flex items-center gap-1.5 border-2 transition-colors ${timeLeft < 60 ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white border-transparent'}`}>
                        <Clock size={14} className={timeLeft < 60 ? 'text-white' : 'text-zinc-500'} /> 
                        <span className="tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            {/* SCROLLABLE QUESTION AREA (BACKGROUND REMAINS GREY) */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar flex flex-col justify-center">
                <div key={q.id} className="w-full max-w-3xl mx-auto bg-white dark:bg-black p-6 md:p-10 border-2 shadow-sm transition-all duration-300 animate-in slide-in-from-right-8 fade-in border-zinc-300 dark:border-zinc-800">
                    <div className="flex justify-between items-start mb-6 border-b-2 border-zinc-100 dark:border-zinc-900 pb-4">
                        <span className={`text-[10px] font-black px-3 py-1 uppercase tracking-[0.2em] transition-colors border-2 ${isAnswered ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-transparent'}`}>
                            Target {String(currentBlockIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 uppercase tracking-[0.2em]">
                            {q.points || 10} PTS
                        </span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-8 uppercase tracking-tight leading-snug">
                        {q.prompt || q.content?.question}
                    </h3>
                    
                    {(qType === 'multiple-choice' || qType === 'quiz') && (
                        <div className="space-y-3">
                            {(q.options || q.content?.options || []).map((optData: any) => {
                                const optId = typeof optData === 'string' ? optData : optData.id;
                                const optText = typeof optData === 'string' ? optData : optData.text;
                                const isSelected = answers[q.id] === optId;

                                return (
                                    <button 
                                        key={optId} 
                                        onClick={() => handleAnswer(q.id, optId)} 
                                        className={`w-full p-4 text-left border-2 transition-colors font-bold flex justify-between items-center group ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-100' : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 bg-white dark:bg-black'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-indigo-400 bg-transparent'}`}>
                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <span className="text-sm md:text-base leading-snug">{optText}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {qType === 'boolean' && (
                        <div className="flex gap-4">
                            {['true', 'false'].map((val) => {
                                const isSelected = answers[q.id] === val;
                                return (
                                    <button 
                                        key={val} 
                                        onClick={() => handleAnswer(q.id, val)} 
                                        className={`flex-1 p-5 border-2 font-black text-sm uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-indigo-400 bg-white dark:bg-black'}`}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {qType === 'essay' && (
                        <textarea 
                            className={`w-full p-5 bg-zinc-50 dark:bg-zinc-900 outline-none h-48 resize-none font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base transition-colors border-2 ${answers[q.id] ? 'border-indigo-600' : 'border-zinc-200 dark:border-zinc-800 focus:border-indigo-400'}`} 
                            placeholder="Enter transmission data here..." 
                            value={answers[q.id] || ''} 
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                        />
                    )}
                </div>
            </main>
            
            {/* STICKY FOOTER (LOCKED TO BOTTOM) */}
            <footer className="shrink-0 bg-white dark:bg-black p-4 md:p-6 border-t-2 border-zinc-900 dark:border-zinc-200 z-30 pb-safe-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    
                    {currentBlockIdx > 0 ? (
                        <button 
                            onClick={() => setCurrentBlockIdx(prev => prev - 1)} 
                            className="px-6 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-2 border-transparent"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Back</span>
                        </button>
                    ) : (
                        <div className="w-24" /> 
                    )}

                    {!isLastQuestion ? (
                        <button 
                            onClick={() => setCurrentBlockIdx(prev => prev + 1)} // This is safe, it will be overridden immediately below.
                            onPointerDown={() => setCurrentBlockIdx(prev => prev + 1)} // Fix fast click on mobile
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 transition-colors ml-auto border-2 border-indigo-600"
                        >
                            Next <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowConfirm(true)} 
                            className={`px-8 py-4 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 transition-colors ml-auto border-2 ${answeredCount === totalQuestions ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-600 text-white'}`}
                        >
                            {isProgressive ? 'Finalize Phase' : 'Submit'} <Send size={16} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
}
