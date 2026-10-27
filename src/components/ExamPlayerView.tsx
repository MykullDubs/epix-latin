// src/components/ExamPlayerView.tsx
import React, { useState, useEffect } from 'react';
import { 
    FileText, Clock, CheckCircle2, AlertTriangle, 
    Send, Check, AlignLeft, Flag, ArrowRight, ArrowLeft, HelpCircle
} from 'lucide-react';

// ============================================================================
//  EXAM PLAYER (Unified Frosted UI + Paginated Progressive State Machine)
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
    const [timeLeft, setTimeLeft] = useState((exam?.duration || 30) * 60);

    // Map the active questions based on whether it's progressive or a standard flat exam
    const activeBlocks = isProgressive 
        ? (exam.phases[currentPhaseIdx]?.blocks || []) 
        : (exam?.questions || exam?.blocks || []);
    const totalQuestions = activeBlocks.length;
    
    // Safe index clamping in case phase changes dynamically
    const safeBlockIdx = Math.min(currentBlockIdx, Math.max(0, totalQuestions - 1));
    const answeredCount = activeBlocks.filter((b: any) => answers[b.id] !== undefined && answers[b.id] !== '').length;
    const progressPct = totalQuestions > 0 ? ((safeBlockIdx + 1) / totalQuestions) * 100 : 0;
    const isLastQuestion = safeBlockIdx >= totalQuestions - 1;

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
        setAnswers((prev: any) => ({ ...prev, [qId]: val }));
    };

    // --- CLEAN PAGINATION HANDLERS ---
    const handlePrevQuestion = () => {
        setCurrentBlockIdx((prev) => Math.max(0, prev - 1));
    };

    const handleNextQuestion = () => {
        setCurrentBlockIdx((prev) => Math.min(totalQuestions - 1, prev + 1));
    };

    // Helper to extract bracketed target words from fill-in-the-blank text
    const extractBracketTargets = (text: string = '') => {
        const matches = text.match(/\[(.*?)\]/g);
        return matches ? matches.map(m => m.slice(1, -1)) : [];
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
            let correctReference: any = q.correctAnswer || q.correctId || q.content?.correctId || null;

            if (qType === 'multiple-choice' || qType === 'boolean' || qType === 'quiz') {
                if (String(studentVal) === String(correctReference)) { 
                    awarded = points;
                    isCorrect = true;
                }
                // Map option ID to readable text for the gradebook if applicable
                const opts = q.options || q.content?.options || [];
                const foundStudentOpt = opts.find((o: any) => (typeof o === 'object' ? o.id === studentVal : o === studentVal));
                const foundCorrectOpt = opts.find((o: any) => (typeof o === 'object' ? o.id === correctReference : o === correctReference));
                if (foundCorrectOpt && typeof foundCorrectOpt === 'object') {
                    correctReference = foundCorrectOpt.text;
                }
            } else if (qType === 'fill-blank') {
                const targets = extractBracketTargets(q.content?.text || q.prompt || '');
                correctReference = targets.join(', ');
                if (studentVal && String(studentVal).trim().toLowerCase() === String(targets[0] || '').trim().toLowerCase()) {
                    awarded = points;
                    isCorrect = true;
                }
            } else if (qType === 'essay') {
                requiresManualGrading = true;
                awarded = 0; 
            }

            // Readable student value for multiple-choice option objects
            let displayStudentVal = studentVal || "(No Answer)";
            if (qType === 'quiz' || qType === 'multiple-choice') {
                const opts = q.options || q.content?.options || [];
                const matchedOpt = opts.find((o: any) => typeof o === 'object' && o.id === studentVal);
                if (matchedOpt) displayStudentVal = matchedOpt.text;
            }

            details.push({ 
                qId: q.id, 
                type: qType, 
                prompt: q.prompt || q.title || q.content?.question || q.content?.text || 'Question Prompt', 
                maxPoints: points, 
                studentVal: displayStudentVal, 
                correctVal: correctReference, 
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
            
            const nextId = passed ? currentPhaseData.nextPhaseId : currentPhaseData.fallbackPhaseId;
            
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
            phaseHistory: newHistory
        };

        setScoreDetail(finalResultPayload);
        setSubmitted(true);
        
        onFinish(exam.id, finalEarnedPoints, exam.title, finalResultPayload);
    };

    if (!exam || totalQuestions === 0) return null;

    // ========================================================================
    // SCREEN 1: INTRO SCREEN (Scrollable when description is long)
    // ========================================================================
    if (!started) {
        return (
            <div className="h-[100dvh] w-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 transition-colors">
                <div className="min-h-full flex items-center justify-center p-6 py-12">
                    <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-500" />
                        
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100 dark:border-indigo-500/20">
                            <FileText size={48} strokeWidth={2.5} />
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
                            {exam.title}
                        </h1>

                        {isProgressive && (
                            <span className="inline-block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 mb-4 shadow-sm">
                                Adaptive Assessment
                            </span>
                        )}

                        <div className="max-h-[32vh] overflow-y-auto custom-scrollbar mb-8 px-4">
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm md:text-base">
                                {exam.description || "You are about to begin this assessment. Please ensure you have a stable connection and enough time."}
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 px-2">
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-1 py-5 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Time Limit</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 justify-center">
                                    <Clock size={20} className="text-indigo-500"/> {exam.duration || 30} min
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-1 py-5 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                    {isProgressive ? 'Phase 1 Questions' : 'Questions'}
                                </span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">
                                    {totalQuestions}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 px-2">
                            <button 
                                type="button"
                                onClick={() => onFinish(null, 0)} 
                                className="w-full sm:w-auto py-5 sm:px-8 font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors uppercase tracking-widest text-xs active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStarted(true)} 
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all active:scale-95 text-sm flex items-center justify-center gap-3"
                            >
                                Begin Assessment <AlignLeft size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // SCREEN 3: COMPLETED SCREEN
    // ========================================================================
    if (submitted) {
        return (
            <div className="h-[100dvh] w-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 animate-in zoom-in duration-300 transition-colors">
                <div className="min-h-full flex items-center justify-center p-6 py-12">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-3 ${scoreDetail.status === 'pending_review' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border-2 ${scoreDetail.status === 'pending_review' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-100 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-500/20'}`}>
                            {scoreDetail.status === 'pending_review' ? <Clock size={48} strokeWidth={2.5}/> : <CheckCircle2 size={48} strokeWidth={2.5}/>}
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            {scoreDetail.status === 'pending_review' ? 'Under Review' : 'Assessment Submitted'}
                        </h2>
                        
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
                                {scoreDetail.status === 'pending_review' 
                                    ? "Your written answers have been sent to your instructor for grading. Your final score will be updated soon." 
                                    : `You scored ${scoreDetail.score} out of ${scoreDetail.total} total points (${scoreDetail.finalScorePct}%).`}
                            </p>
                        </div>

                        <button 
                            type="button"
                            onClick={() => onFinish(null, 0)} 
                            className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-95 transition-all text-xs"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // SCREEN 2: ACTIVE EXAM (Paginated + Static Header/Footer + Grey Track)
    // ========================================================================
    const q = activeBlocks[safeBlockIdx];
    if (!q) return null;

    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
    const qType = q.type || 'multiple-choice';

    // Prepare fill-in-the-blank word bank if needed
    const fillBlankText = q.content?.text || q.prompt || '';
    const bracketTargets = qType === 'fill-blank' ? extractBracketTargets(fillBlankText) : [];
    const wordBank = qType === 'fill-blank' 
        ? Array.from(new Set([...bracketTargets, ...(q.content?.distractors || [])])) 
        : [];
    const promptWithBlank = qType === 'fill-blank'
        ? fillBlankText.replace(/\[(.*?)\]/g, () => answers[q.id] ? `[ ${answers[q.id]} ]` : '_______')
        : (q.prompt || q.title || q.content?.question);

    return (
        <div className="h-[100dvh] w-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden relative animate-in fade-in duration-500 transition-colors">
            
            {/* SUBMIT CONFIRMATION MODAL */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {isProgressive ? 'Complete Phase?' : 'Submit Assessment?'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium px-2">
                            {isProgressive 
                                ? "Your answers for this phase will be locked and evaluated to determine your next phase."
                                : "Final confirmation required. You cannot change your answers after this point."}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowConfirm(false)} 
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 border border-slate-200 dark:border-slate-700"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={evaluateSubmission} 
                                className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 border border-rose-500/50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOCKED TOP HEADER */}
            <header className="shrink-0 px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 z-30 flex justify-between items-center shadow-sm transition-colors">
                <div className="flex flex-col min-w-0 pr-4">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight leading-none mb-1 truncate">
                        {exam.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Flag size={12} className="text-indigo-500 shrink-0" /> 
                        <span className="truncate">
                            {isProgressive ? exam.phases[currentPhaseIdx]?.title : 'Assessment Active'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest tabular-nums">
                            {safeBlockIdx + 1} / {totalQuestions}
                        </span>
                    </div>

                    <div className={`px-4 py-2.5 rounded-xl font-black flex items-center gap-2 border-2 shadow-sm transition-colors ${timeLeft < 60 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 animate-pulse' : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                        <Clock size={16} className={timeLeft < 60 ? 'text-rose-500' : 'text-slate-400'} /> 
                        <span className="tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            {/* UNIFIED GREY BACKGROUND TRACK OUTSIDE THE QUESTION BOUNDARY */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar bg-slate-100/80 dark:bg-slate-950 flex flex-col">
                <div 
                    key={`${currentPhaseIdx}_${q.id}`} 
                    className={`w-full max-w-3xl my-auto mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 rounded-[2.5rem] border-2 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                        isAnswered 
                            ? 'border-indigo-200 dark:border-indigo-500/50 shadow-[0_15px_35px_rgba(99,102,241,0.06)]' 
                            : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                >
                    {/* Question Card Header */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm transition-colors border ${
                            isAnswered 
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                            Question {safeBlockIdx + 1} of {totalQuestions}
                        </span>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2 rounded-xl shadow-sm uppercase tracking-widest">
                            {q.points || 10} Points
                        </span>
                    </div>
                    
                    {/* Question Prompt */}
                    <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-8 leading-snug tracking-tight">
                        {promptWithBlank}
                    </h3>
                    
                    {/* 1. MULTIPLE CHOICE / QUIZ */}
                    {(qType === 'multiple-choice' || qType === 'quiz') && (
                        <div className="space-y-3">
                            {(q.options || q.content?.options || []).map((optData: any, oIdx: number) => {
                                const optId = typeof optData === 'string' ? optData : (optData.id || `opt_${oIdx}`);
                                const optText = typeof optData === 'string' ? optData : optData.text;
                                const isSelected = answers[q.id] === optId;

                                return (
                                    <button 
                                        type="button"
                                        key={optId} 
                                        onClick={() => handleAnswer(q.id, optId)} 
                                        className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-bold flex justify-between items-center group shadow-sm active:scale-[0.99] ${
                                            isSelected 
                                                ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-4 ring-indigo-500/15' 
                                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50/70 dark:bg-slate-950'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors shadow-inner ${
                                                isSelected 
                                                    ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 dark:bg-indigo-500 text-white' 
                                                    : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 bg-white dark:bg-slate-900'
                                            }`}>
                                                {isSelected && <Check size={14} strokeWidth={4} />}
                                            </div>
                                            <span className="text-[15px] leading-relaxed">{optText}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 2. FILL-IN-THE-BLANK */}
                    {qType === 'fill-blank' && (
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Select or type the missing word:
                            </span>
                            {wordBank.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                    {wordBank.map((word: string, wIdx: number) => {
                                        const isSelected = answers[q.id] === word;
                                        return (
                                            <button
                                                type="button"
                                                key={`${word}_${wIdx}`}
                                                onClick={() => handleAnswer(q.id, word)}
                                                className={`px-5 py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 shadow-sm ${
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                {word}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <input
                                type="text"
                                placeholder="Or type your answer directly..."
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswer(q.id, e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    )}
                    
                    {/* 3. TRUE / FALSE */}
                    {qType === 'boolean' && (
                        <div className="flex gap-4">
                            {['true', 'false'].map((val) => {
                                const isSelected = answers[q.id] === val;
                                return (
                                    <button 
                                        type="button"
                                        key={val} 
                                        onClick={() => handleAnswer(q.id, val)} 
                                        className={`flex-1 p-6 rounded-2xl border-2 font-black text-lg capitalize transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] ${
                                            isSelected 
                                                ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-4 ring-indigo-500/20' 
                                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-950'
                                        }`}
                                    >
                                        {isSelected && <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400" />}
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* 4. ESSAY */}
                    {qType === 'essay' && (
                        <div className="space-y-4">
                            {q.content && typeof q.content === 'string' && q.title && (
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {q.content}
                                </p>
                            )}
                            <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-inner ${
                                answers[q.id] 
                                    ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/10' 
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                            }`}>
                                <textarea 
                                    className="w-full p-6 bg-transparent outline-none h-48 resize-none font-medium text-slate-700 dark:text-slate-200 text-base md:text-lg transition-all" 
                                    placeholder="Type your response here..." 
                                    value={answers[q.id] || ''} 
                                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {/* STATIC LOCKED BOTTOM NAVIGATION FOOTER */}
            <footer className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 border-t border-slate-200/80 dark:border-slate-800 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none pb-safe">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    
                    <button 
                        type="button"
                        disabled={safeBlockIdx === 0}
                        onClick={handlePrevQuestion} 
                        className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 border ${
                            safeBlockIdx > 0
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer'
                                : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {answeredCount} of {totalQuestions} Answered
                    </div>

                    {!isLastQuestion ? (
                        <button 
                            type="button"
                            onClick={handleNextQuestion}
                            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            Next <ArrowRight size={16} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => setShowConfirm(true)} 
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                                answeredCount === totalQuestions 
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            }`}
                        >
                            {isProgressive ? 'Complete Phase' : 'Submit'} <Send size={16} strokeWidth={2.5} />
                        </button>
                    )}

                </div>
            </footer>
        </div>
    );
}
