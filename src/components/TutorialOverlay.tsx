// src/components/TutorialOverlay.tsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection, increment } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { 
    Sparkles, BookOpen, FileText, Trophy, Zap, 
    ArrowRight, ArrowLeft, X, CheckCircle2, Layers, Shield
} from 'lucide-react';

export interface TutorialStep {
    id: string;
    badge: string;
    title: string;
    description: string;
    targetSelector?: string; // Optional data-tutorial="[id]" selector to spotlight
    actionTab?: string;      // Optional tab to switch to when this step activates
    icon: React.ReactNode;
    accentColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        badge: 'System Calibration • Step 1 of 5',
        title: 'Welcome to Your Learning Hub',
        description: 'Your personal command center for interactive modules, adaptive assessments, and live classroom arenas. Complete this 30-second tour to calibrate your profile and claim +50 XP.',
        icon: <Sparkles size={32} strokeWidth={2.2} />,
        accentColor: 'from-indigo-500 to-cyan-400'
    },
    {
        id: 'roadmap',
        badge: 'Curriculum Pathways • Step 2 of 5',
        title: 'Follow Your Roadmap',
        description: 'Tap active nodes on your pathway to launch interactive lessons, flashcards, and 2D Kinetic Canvas labs. Completing modules unlocks the next checkpoint on your map.',
        targetSelector: '[data-tutorial="lessons"]',
        actionTab: 'lessons',
        icon: <BookOpen size={32} strokeWidth={2.2} />,
        accentColor: 'from-emerald-500 to-teal-400'
    },
    {
        id: 'exams',
        badge: 'Adaptive Diagnostics • Step 3 of 5',
        title: 'High-Stakes Assessments',
        description: 'When an exam is assigned, a red notification badge appears. Once completed, you can tap any greyed-out exam card to inspect your question breakdown and instructor feedback.',
        targetSelector: '[data-tutorial="exams"]',
        actionTab: 'exams',
        icon: <FileText size={32} strokeWidth={2.2} />,
        accentColor: 'from-rose-500 to-amber-500'
    },
    {
        id: 'arena',
        badge: 'Live Protocols & Ranks • Step 4 of 5',
        title: 'Compete on the Leaderboard',
        description: 'Earn XP from every lesson, flashcard deck, and live classroom game to climb your class ranks and customize your HoloAvatar.',
        targetSelector: '[data-tutorial="leaderboard"]',
        actionTab: 'leaderboard',
        icon: <Trophy size={32} strokeWidth={2.2} />,
        accentColor: 'from-amber-400 to-orange-500'
    },
    {
        id: 'grades',
        badge: 'Service Record • Step 5 of 5',
        title: 'Track Your Standing',
        description: 'Your Service Record calculates your overall standing rank (S, A, B+) and stores all official report cards and written feedback from your instructor.',
        targetSelector: '[data-tutorial="grades"]',
        actionTab: 'grades',
        icon: <Shield size={32} strokeWidth={2.2} />,
        accentColor: 'from-indigo-500 to-purple-500'
    }
];

interface TutorialOverlayProps {
    user?: any;
    userData?: any;
    onSelectTab?: (tabId: string) => void;
    onComplete?: () => void;
    forceOpen?: boolean;
}

export default function TutorialOverlay({
    user,
    userData,
    onSelectTab,
    onComplete,
    forceOpen = false
}: TutorialOverlayProps) {
    const [stepIdx, setStepIdx] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showRewardScreen, setShowRewardScreen] = useState(false);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

    const uid = user?.uid || auth?.currentUser?.uid;
    const studentEmail = user?.email || userData?.email || auth?.currentUser?.email;
    const studentName = userData?.name || user?.displayName || 'Scholar';
    const isInstructor = userData?.role === 'instructor' || userData?.role === 'admin';

    const xpReward = 50;
    const currentStep = TUTORIAL_STEPS[stepIdx];

    // Determine whether this student needs the onboarding tour
    useEffect(() => {
        if (forceOpen) {
            setIsVisible(true);
            return;
        }
        if (!uid || isInstructor) {
            setIsVisible(false);
            return;
        }

        const localKey = `magister_tutorial_done_${uid}`;
        const completedLocally = localStorage.getItem(localKey) === 'true';
        const completedInProfile =
            userData?.tutorialCompleted === true ||
            userData?.profile?.main?.tutorialCompleted === true;

        if (completedInProfile) {
            localStorage.setItem(localKey, 'true');
            setIsVisible(false);
        } else if (!completedLocally && userData !== undefined) {
            setIsVisible(true);
        }
    }, [uid, userData, isInstructor, forceOpen]);

    // Update spotlight bounding box and optionally switch active tab when step changes
    useEffect(() => {
        if (!isVisible || showRewardScreen) {
            setSpotlightRect(null);
            return;
        }

        if (currentStep.actionTab && onSelectTab) {
            onSelectTab(currentStep.actionTab);
        }

        const updateSpotlight = () => {
            if (!currentStep.targetSelector) {
                setSpotlightRect(null);
                return;
            }
            const el = document.querySelector(currentStep.targetSelector);
            if (el) {
                setSpotlightRect(el.getBoundingClientRect());
            } else {
                setSpotlightRect(null);
            }
        };

        // Slight delay so any tab transition finishes before measuring coordinates
        const timer = setTimeout(updateSpotlight, 120);
        window.addEventListener('resize', updateSpotlight);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
        };
    }, [stepIdx, isVisible, showRewardScreen, currentStep, onSelectTab]);

    // Persist tutorial completion to Firestore and localStorage
    const markTutorialCompleted = async (awardBonusXp: boolean) => {
        if (uid) {
            localStorage.setItem(`magister_tutorial_done_${uid}`, 'true');
        }
        if (!uid) return;

        setIsSaving(true);
        try {
            const profileMainRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
            const userRootRef = doc(db, 'artifacts', appId, 'users', uid);

            await setDoc(
                profileMainRef,
                {
                    tutorialCompleted: true,
                    tutorialCompletedAt: Date.now(),
                    ...(awardBonusXp ? { xp: increment(xpReward) } : {})
                },
                { merge: true }
            );

            await setDoc(
                userRootRef,
                {
                    tutorialCompleted: true,
                    ...(awardBonusXp ? { xp: increment(xpReward) } : {})
                },
                { merge: true }
            );

            if (awardBonusXp && studentEmail) {
                await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
                    studentName,
                    studentEmail,
                    itemTitle: 'Scholar Interface Calibration',
                    itemId: 'onboarding_tutorial',
                    xp: xpReward,
                    timestamp: Date.now(),
                    type: 'completion'
                });
            }
        } catch (err) {
            console.error('Failed to sync tutorial status:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkip = async () => {
        setIsVisible(false);
        await markTutorialCompleted(false);
        if (onComplete) onComplete();
    };

    const handleNext = async () => {
        if (stepIdx < TUTORIAL_STEPS.length - 1) {
            setStepIdx(prev => prev + 1);
        } else {
            setShowRewardScreen(true);
            await markTutorialCompleted(true);
        }
    };

    const handleFinishTour = () => {
        setIsVisible(false);
        setShowRewardScreen(false);
        if (onSelectTab) onSelectTab('lessons');
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9500] flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300 font-sans select-none">
            
            {/* DYNAMIC SPOTLIGHT RING OVER TARGET ELEMENT */}
            {spotlightRect && !showRewardScreen && (
                <div
                    style={{
                        position: 'fixed',
                        left: spotlightRect.left - 8,
                        top: spotlightRect.top - 8,
                        width: spotlightRect.width + 16,
                        height: spotlightRect.height + 16
                    }}
                    className="z-[9510] rounded-2xl border-2 border-indigo-400 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.8)] pointer-events-none transition-all duration-300 animate-pulse"
                />
            )}

            {/* ============================================================= */}
            {/* REWARD COMPLETION SCREEN                                      */}
            {/* ============================================================= */}
            {showRewardScreen ? (
                <div className="relative z-[9520] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-md w-full rounded-[3rem] p-8 sm:p-10 text-center border border-white/40 dark:border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-cyan-400" />

                    <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>

                    <span className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        Calibration Complete
                    </span>

                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3 mb-2">
                        You're Ready, {studentName}!
                    </h2>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                        Your interface is synced and your first modules are unlocked. Here is your calibration bonus:
                    </p>

                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 mb-8 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Onboarding Bonus
                        </span>
                        <span className="text-2xl font-black text-emerald-500 flex items-center gap-1.5">
                            <Zap size={22} fill="currentColor" /> +{xpReward} XP
                        </span>
                    </div>

                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleFinishTour}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
                    >
                        {isSaving ? 'Syncing Profile...' : 'Enter Learning Hub'}
                    </button>
                </div>
            ) : (
                /* ============================================================= */
                /* INTERACTIVE STEP CARD                                         */
                /* ============================================================= */
                <div className="relative z-[9520] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-lg w-full rounded-[2.5rem] p-7 sm:p-9 border border-white/40 dark:border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-300 overflow-hidden">
                    
                    {/* Top Gradient Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentStep.accentColor}`} />

                    {/* Top Row: Step Badge & Skip Button */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                            {currentStep.badge}
                        </span>

                        <button
                            type="button"
                            onClick={handleSkip}
                            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                            Skip Tour <X size={13} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Step Icon & Copy */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${currentStep.accentColor} text-white flex items-center justify-center shrink-0 shadow-lg`}>
                            {currentStep.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {currentStep.title}
                            </h2>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base leading-relaxed mb-8">
                        {currentStep.description}
                    </p>

                    {/* Progress Dots */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {TUTORIAL_STEPS.map((s, idx) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setStepIdx(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    idx === stepIdx
                                        ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                                        : idx < stepIdx
                                            ? 'w-2 bg-emerald-400'
                                            : 'w-2 bg-slate-200 dark:bg-slate-800'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Footer Navigation Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            disabled={stepIdx === 0}
                            onClick={() => setStepIdx(prev => Math.max(0, prev - 1))}
                            className={`px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border ${
                                stepIdx > 0
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 cursor-pointer'
                                    : 'opacity-0 pointer-events-none'
                            }`}
                        >
                            <ArrowLeft size={15} strokeWidth={2.5} /> Back
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            {stepIdx === TUTORIAL_STEPS.length - 1 ? (
                                <>Claim +{xpReward} XP <Zap size={15} fill="currentColor" /></>
                            ) : (
                                <>Next Step <ArrowRight size={15} strokeWidth={2.5} /></>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
