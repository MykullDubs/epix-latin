// src/components/ExamPlayerView.tsx
import React, { useState, useEffect } from 'react';
import { 
    FileText, Clock, CheckCircle2, AlertTriangle, 
    Send, Check, AlignLeft 
} from 'lucide-react';

// ============================================================================
//  EXAM PLAYER (Timer, Intro Screen, & Syncs with Inbox)
// ============================================================================
export default function ExamPlayerView({ exam, onFinish }: any) {
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [scoreDetail, setScoreDetail] = useState<any>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // --- TIMER STATE ---
    const [timeLeft, setTimeLeft] = useState((exam.duration || 30) * 60);

    const totalQuestions = exam?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!started || submitted || timeLeft <= 0) return;
        const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [started, submitted, timeLeft]);

    // Auto-submit if time runs out
    useEffect(() => {
        if (started && timeLeft <= 0 && !submitted) {
            confirmSubmit();
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

    const confirmSubmit = () => {
        let totalPoints = 0;
        let earnedPoints = 0;
        const details: any[] = [];
        let requiresManualGrading = false;

        exam.questions.forEach((q: any) => {
            const points = parseInt(q.points || 0);
            totalPoints += points;
            const studentVal = answers[q.id];
            let isCorrect = false;
            let awarded = 0;

            if (q.type === 'multiple-choice' || q.type === 'boolean') {
                if (String(studentVal) === String(q.correctAnswer)) { 
                    awarded = points;
                    isCorrect = true;
                }
            } else if (q.type === 'essay') {
                requiresManualGrading = true;
                awarded = 0; // Requires teacher input
            }

            // 🔥 PRO-LMS PAYLOAD: Scaffolds the exact data the SpeedModerator needs
            details.push({ 
                qId: q.id, 
                type: q.type, 
                prompt: q.prompt, 
                maxPoints: points, 
                studentVal: studentVal || "(No Answer)", 
                correctVal: q.correctAnswer || null, 
                awardedPoints: awarded, 
                isCorrect,
                teacherFeedback: "" // Scaffolding for instructor comments
            });
            earnedPoints += awarded;
        });

        const finalStatus = requiresManualGrading ? 'pending_review' : 'graded';
        const finalScorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        
        const result = { 
            score: earnedPoints, 
            total: totalPoints, 
            finalScorePct, 
            status: finalStatus, 
            details 
        };

        setScoreDetail(result);
        setSubmitted(true);
        setShowConfirm(false);

        // Save immediately via parent
        onFinish(exam.id, earnedPoints, exam.title, result);
    };

    if (!exam || totalQuestions === 0) return null;

    // --- SCREEN 1: INTRO SCREEN ---
    if (!started) {
        return (
            <div className="h-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 transition-colors">
                <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-500" />
                    
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-indigo-100 dark:border-indigo-500/20">
                        <FileText size={48} strokeWidth={2.5} />
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">{exam.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed text-sm md:text-base px-4">
                        {exam.description || "You are about to begin this assessment. Please ensure you have a stable connection and enough time."}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 px-4">
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-1 py-5 rounded-2xl shadow-sm">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Time Limit</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 justify-center">
                                <Clock size={20} className="text-indigo-500"/> {exam.duration || 30} min
                            </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-1 py-5 rounded-2xl shadow-sm">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Questions</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 px-4">
                        <button onClick={() => onFinish(null, 0)} className="w-full sm:w-auto py-5 sm:px-8 font-black text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors uppercase tracking-widest text-xs active:scale-95">
                            Cancel
                        </button>
                        <button onClick={() => setStarted(true)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all active:scale-95 text-sm flex items-center justify-center gap-3">
                            Begin Assessment <AlignLeft size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SCREEN 3: COMPLETED SCREEN ---
    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 animate-in zoom-in duration-300 transition-colors">
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
                                : `You scored ${scoreDetail.score} out of ${scoreDetail.total} total points.`}
                        </p>
                    </div>

                    <button onClick={() => onFinish(null, 0)} className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-95 transition-all text-xs">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- SCREEN 2: ACTIVE EXAM (SCROLLING LIST) ---
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative animate-in fade-in duration-500 transition-colors pb-safe">
            
            {/* SUBMIT CONFIRMATION MODAL */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle size={36} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Submit Assessment?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium px-2">Final confirmation required. You cannot change your answers after this point.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 border border-slate-200 dark:border-slate-700">Cancel</button>
                            <button onClick={confirmSubmit} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 border border-rose-500/50">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* STICKY HEADER */}
            <div className="px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex justify-between items-center shadow-sm transition-colors pt-safe">
                <div className="flex flex-col">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight leading-none mb-1">
                        {exam.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <FileText size={12} className="text-indigo-500" /> Assessment Active
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{answeredCount} / {totalQuestions}</span>
                    </div>

                    <div className={`px-4 py-2.5 rounded-xl font-black flex items-center gap-2 border-2 shadow-sm transition-colors ${timeLeft < 60 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 animate-pulse' : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                        <Clock size={16} className={timeLeft < 60 ? 'text-rose-500' : 'text-slate-400'} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* QUESTIONS */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-40 custom-scrollbar overscroll-y-contain">
                <div className="max-w-3xl mx-auto space-y-6">
                    {exam.questions.map((q: any, i: number) => {
                        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';

                        return (
                            <div key={q.id} className={`bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] border-2 shadow-sm transition-all duration-300 ${isAnswered ? 'border-indigo-200 dark:border-indigo-500/50 shadow-[0_10px_30px_rgba(99,102,241,0.05)]' : 'border-slate-200 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm transition-colors border ${isAnswered ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        Question {i + 1}
                                    </span>
                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2 rounded-xl shadow-sm uppercase tracking-widest">
                                        {q.points} Points
                                    </span>
                                </div>
                                
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-8 leading-snug tracking-tight">{q.prompt}</h3>
                                
                                {q.type === 'multiple-choice' && (
                                    <div className="space-y-3">
                                        {q.options.map((opt: string) => (
                                            <button 
                                                key={opt} 
                                                onClick={() => handleAnswer(q.id, opt)} 
                                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-bold flex justify-between items-center group shadow-sm active:scale-[0.98] ${answers[q.id] === opt ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-950'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors shadow-inner ${answers[q.id] === opt ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 dark:bg-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 bg-white dark:bg-slate-900'}`}>
                                                        {answers[q.id] === opt && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                    <span className="text-[15px] leading-relaxed">{opt}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {q.type === 'boolean' && (
                                    <div className="flex gap-4">
                                        {['true', 'false'].map((val) => (
                                            <button 
                                                key={val} 
                                                onClick={() => handleAnswer(q.id, val)} 
                                                className={`flex-1 p-6 rounded-2xl border-2 font-black text-lg capitalize transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] ${answers[q.id] === val ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 ring-4 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-950'}`}
                                            >
                                                {answers[q.id] === val && <CheckCircle2 size={24} className="text-indigo-600 dark:text-indigo-400" />}
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {q.type === 'essay' && (
                                    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-inner ${answers[q.id] ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'}`}>
                                        <textarea 
                                            className="w-full p-6 bg-transparent outline-none h-48 resize-none font-medium text-slate-700 dark:text-slate-200 text-base md:text-lg transition-all" 
                                            placeholder="Type your response here..." 
                                            value={answers[q.id] || ''} 
                                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* STICKY FOOTER */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 border-t border-slate-200 dark:border-slate-800 absolute bottom-0 left-0 right-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none pb-safe-6">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className={`text-[10px] font-black uppercase tracking-widest hidden md:flex items-center gap-2 ${answeredCount === totalQuestions ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {answeredCount === totalQuestions ? <><CheckCircle2 size={16}/> Ready to submit.</> : <><AlertTriangle size={16}/> Complete all questions.</>}
                    </p>
                    <button 
                        onClick={() => setShowConfirm(true)} 
                        className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${answeredCount === totalQuestions ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'}`}
                    >
                        Submit Assessment <Send size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
}
