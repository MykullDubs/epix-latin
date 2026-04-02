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
            <div className="h-full flex items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-500">
                <div className="bg-white max-w-xl w-full rounded-[3rem] shadow-2xl border border-slate-100 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-500" />
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <FileText size={40} />
                    </div>
                    
                    <h1 className="text-3xl font-black text-slate-900 mb-4">{exam.title}</h1>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        {exam.description || "You are about to begin this assessment. Please ensure you have a stable connection and enough time."}
                    </p>
                    
                    <div className="flex justify-center gap-6 mb-10">
                        <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</span>
                            <span className="text-xl font-black text-slate-800 flex items-center gap-2 justify-center"><Clock size={18} className="text-indigo-500"/> {exam.duration || 30} min</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Questions</span>
                            <span className="text-xl font-black text-slate-800">{totalQuestions}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => onFinish(null, 0)} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest text-sm">
                            Cancel
                        </button>
                        <button onClick={() => setStarted(true)} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 text-sm">
                            Begin Exam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SCREEN 3: COMPLETED SCREEN ---
    if (submitted) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in zoom-in duration-300">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-slate-100 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-3 ${scoreDetail.status === 'pending_review' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ${scoreDetail.status === 'pending_review' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {scoreDetail.status === 'pending_review' ? <Clock size={48}/> : <CheckCircle2 size={48}/>}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3">
                        {scoreDetail.status === 'pending_review' ? 'Under Review' : 'Exam Submitted'}
                    </h2>
                    <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                        {scoreDetail.status === 'pending_review' 
                            ? "Your written answers have been sent to your instructor for grading. Your final score will be updated soon." 
                            : `You scored ${scoreDetail.score} out of ${scoreDetail.total} points.`}
                    </p>
                    <button onClick={() => onFinish(null, 0)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- SCREEN 2: ACTIVE EXAM (SCROLLING LIST) ---
    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative animate-in fade-in duration-500">
            
            {/* SUBMIT CONFIRMATION MODAL */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Submit Assessment?</h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">Final confirmation required. You cannot change answers after this.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Not yet</button>
                            <button onClick={confirmSubmit} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-lg transition-all active:scale-95">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* STICKY HEADER */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
                    <FileText size={20} className="text-indigo-600"/> {exam.title}
                </h1>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{answeredCount} / {totalQuestions}</span>
                    </div>

                    <div className={`px-4 py-2 rounded-xl font-black flex items-center gap-2 border-2 ${timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* QUESTIONS */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-40 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    {exam.questions.map((q: any, i: number) => {
                        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';

                        return (
                            <div key={q.id} className={`bg-white p-6 md:p-8 rounded-[2rem] border-2 shadow-sm transition-colors duration-300 ${isAnswered ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        Question {i + 1}
                                    </span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                                        {q.points} pts
                                    </span>
                                </div>
                                
                                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-tight">{q.prompt}</h3>
                                
                                {q.type === 'multiple-choice' && (
                                    <div className="space-y-3">
                                        {q.options.map((opt: string) => (
                                            <button 
                                                key={opt} 
                                                onClick={() => handleAnswer(q.id, opt)} 
                                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-bold flex justify-between items-center group ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 group-hover:border-indigo-300'}`}>
                                                        {answers[q.id] === opt && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                    {opt}
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
                                                className={`flex-1 p-6 rounded-2xl border-2 font-black text-lg capitalize transition-all flex items-center justify-center gap-3 ${answers[q.id] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'}`}
                                            >
                                                {answers[q.id] === val && <CheckCircle2 size={24} className="text-indigo-600" />}
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {q.type === 'essay' && (
                                    <textarea 
                                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none h-48 resize-none font-medium text-slate-700 text-lg transition-all" 
                                        placeholder="Type your answer here..." 
                                        value={answers[q.id] || ''} 
                                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* STICKY FOOTER */}
            <div className="bg-white/90 backdrop-blur-md p-6 border-t border-slate-200 absolute bottom-0 left-0 right-0 z-20 shadow-lg">
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">
                        {answeredCount === totalQuestions ? 'All questions answered. Ready to submit?' : 'Complete all questions before submitting.'}
                    </p>
                    <button 
                        onClick={() => setShowConfirm(true)} 
                        className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${answeredCount === totalQuestions ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
                    >
                        Submit Exam <Send size={18}/>
                    </button>
                </div>
            </div>
        </div>
    );
}
