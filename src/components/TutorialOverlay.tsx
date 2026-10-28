// src/components/TutorialOverlay.tsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection, increment } from 'firebase/firestore';
import { db, appId, auth } from '../config/firebase';
import { 
    Sparkles, BookOpen, FileText, Trophy, Zap, 
    ArrowRight, ArrowLeft, X, CheckCircle2, Shield,
    Compass, PlusCircle, Flame, UserCheck
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

const HOME_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'home_welcome',
        badge: 'Command Center • Step 1 of 4',
        title: 'Welcome to Your Student Portal',
        description: 'This is your main Command Center. Track your global XP, run spaced-repetition reviews, and jump straight into your active subjects. Complete this 20-second tour to claim +50 XP.',
        icon: <Sparkles size={32} strokeWidth={2.2} />,
        accentColor: 'from-indigo-500 to-cyan-400'
    },
    {
        id: 'home_stats',
        badge: 'Telemetry & Ranks • Step 2 of 4',
        title: 'Streak, XP & Level Progression',
        description: 'Every lesson, flashcard review, and live classroom game earns XP toward your next Level. Complete at least one activity each day to keep your Streak lit!',
        targetSelector: '[data-tutorial="home-stats"]',
        icon: <Flame size={32} strokeWidth={2.2} />,
        accentColor: 'from-amber-400 to-orange-500'
    },
    {
        id: 'home_actions',
        badge: 'Action Center • Step 3 of 4',
        title: 'Daily Targets & Smart Review',
        description: 'Monitor your daily XP quests, launch your Spaced Repetition flashcard queue in Smart Review, build custom study sets in the Studio, or check instructor Messages.',
        targetSelector: '[data-tutorial="home-actions"]',
        icon: <Zap size={32} strokeWidth={2.2} />,
        accentColor: 'from-emerald-500 to-teal-400'
    },
    {
        id: 'home_classes',
        badge: 'Active Subjects • Step 4 of 4',
        title: 'Enter Your Classrooms',
        description: 'Tap any subject tile to open its Roadmap, Kinetic Canvas labs, Live Arena remote, and Assessments. You can also drag and reorder your subject tiles!',
        targetSelector: '[data-tutorial="home-classes"]',
        icon: <Compass size={32} strokeWidth={2.2} />,
        accentColor: 'from-indigo-500 to-purple-500'
    }
];


// --- STEPS FOR STUDENT CLASS VIEW (Inside a Classroom) ---
const CLASS_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'class_welcome',
        badge: 'Classroom Hub • Step 1 of 5',
        title: 'Welcome to Your Class Hub',
        description: 'Your personal classroom interface for interactive modules, adaptive assessments, and live classroom arenas. Complete this quick tour to claim +50 XP.',
        icon: <Sparkles size={32} strokeWidth={2.2} />,
        accentColor: 'from-indigo-500 to-cyan-400'
    },
    {
        id: 'class_roadmap',
        badge: 'Curriculum Pathways • Step 2 of 5',
        title: 'Follow Your Roadmap',
        description: 'Tap active nodes on your pathway to launch interactive lessons, flashcards, and 2D Kinetic Canvas labs. Completing modules unlocks the next checkpoint.',
        targetSelector: '[data-tutorial="lessons"]',
        actionTab: 'lessons',
        icon: <BookOpen size={32} strokeWidth={2.2} />,
        accentColor: 'from-emerald-500 to-teal-400'
    },
    {
        id: 'class_exams',
        badge: 'Adaptive Diagnostics • Step 3 of 5',
        title: 'High-Stakes Assessments',
        description: 'When an exam is available, a red notification badge appears. Once finished, tap any greyed-out exam card to inspect your question breakdown and instructor feedback.',
        targetSelector: '[data-tutorial="exams"]',
        actionTab: 'exams',
        icon: <FileText size={32} strokeWidth={2.2} />,
        accentColor: 'from-rose-500 to-amber-500'
    },
    {
        id: 'class_arena',
        badge: 'Live Protocols & Ranks • Step 4 of 5',
        title: 'Compete on the Leaderboard',
        description: 'Earn XP from every lesson, flashcard deck, and live classroom game to climb your class ranks.',
        targetSelector: '[data-tutorial="leaderboard"]',
        actionTab: 'leaderboard',
        icon: <Trophy size={32} strokeWidth={2.2} />,
        accentColor: 'from-amber-400 to-orange-500'
    },
    {
        id: 'class_grades',
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
    variant?: 'home' | 'class';
    user?: any;
    userData?: any;
    onSelectTab?: (tabId: string) => void;
    onComplete?: () => void;
    forceOpen?: boolean;
}

export default function TutorialOverlay({
    variant = 'class',
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

    const steps = variant === 'home' ? HOME_TUTORIAL_STEPS : CLASS_TUTORIAL_STEPS;
    const currentStep = steps[stepIdx] || steps[0];
    const xpReward = 50;

    const firestoreFlag = variant === 'home' ? 'homeTutorialCompleted' : 'tutorialCompleted';
    const localKey = uid ? `magister_${variant}_tutorial_done_${uid}` : '';

    // Determine whether this student needs the onboarding tour
    useEffect(() => {
        if (forceOpen) {
            setStepIdx(0);
            setShowRewardScreen(false);
            setIsVisible(true);
            return;
        }
        if (!uid || isInstructor) {
            setIsVisible(false);
            return;
        }

        const completedLocally = localKey ? localStorage.getItem(localKey) === 'true' : false;
        const completedInProfile =
            userData?.[firestoreFlag] === true ||
            userData?.profile?.main?.[firestoreFlag] === true;

        if (completedInProfile) {
            if (localKey) localStorage.setItem(localKey, 'true');
            setIsVisible(false);
        } else if (!completedLocally && userData !== undefined) {
            setIsVisible(true);
        }
    }, [uid, userData, isInstructor, forceOpen, firestoreFlag, localKey]);

    // Update spotlight bounding box and optionally switch active tab when step changes
    useEffect(() => {
        if (!isVisible || showRewardScreen) {
            setSpotlightRect(null);
            return;
        }

        if (currentStep?.actionTab && onSelectTab) {
            onSelectTab(currentStep.actionTab);
        }

        const updateSpotlight = () => {
            if (!currentStep?.targetSelector) {
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

        const timer = setTimeout(updateSpotlight, 120);
        window.addEventListener('resize', updateSpotlight);
        window.addEventListener('scroll', updateSpotlight, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
            window.removeEventListener('scroll', updateSpotlight, true);
        };
    }, [stepIdx, isVisible, showRewardScreen, currentStep, onSelectTab]);

    // Persist tutorial completion to Firestore and localStorage
    const markTutorialCompleted = async (awardBonusXp: boolean) => {
        if (localKey) {
            localStorage.setItem(localKey, 'true');
        }
        if (!uid) return;

        // Avoid double-awarding XP if they are just replaying the tour
        const alreadyDoneInFirestore =
            userData?.[firestoreFlag] === true ||
            userData?.profile?.main?.[firestoreFlag] === true;
        const shouldGrantXp = awardBonusXp && !alreadyDoneInFirestore;

        setIsSaving(true);
        try {
            const profileMainRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
            const userRootRef = doc(db, 'artifacts', appId, 'users', uid);

            await setDoc(
                profileMainRef,
                {
                    [firestoreFlag]: true,
                    [`${firestoreFlag}At`]: Date.now(),
                    ...(shouldGrantXp ? { xp: increment(xpReward) } : {})
                },
                { merge: true }
            );

            await setDoc(
                userRootRef,
                {
                    [firestoreFlag]: true,
                    ...(shouldGrantXp ? { xp: increment(xpReward) } : {})
                },
                { merge: true }
            );

            if (shouldGrantXp && studentEmail) {
                await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
                    studentName,
                    studentEmail,
                    itemTitle: variant === 'home' ? 'Dashboard Orientation Tour' : 'Classroom Interface Calibration',
                    itemId: `onboarding_${variant}_tutorial`,
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
        if (stepIdx < steps.length - 1) {
            setStepIdx(prev => prev + 1);
        } else {
            setShowRewardScreen(true);
            await markTutorialCompleted(true);
        }
    };

    const handleFinishTour = () => {
        setIsVisible(false);
        setShowRewardScreen(false);
        if (variant === 'class' && onSelectTab) onSelectTab('lessons');
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
                    className="z-[9510] rounded-3xl border-2 border-indigo-400 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.8)] pointer-events-none transition-all duration-300 animate-pulse"
                />
            )}

            {/* REWARD COMPLETION SCREEN */}
            {showRewardScreen ? (
                <div className="relative z-[9520] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-md w-full rounded-[3rem] p-8 sm:p-10 text-center border border-white/40 dark:border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-cyan-400" />

                    <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>

                    <span className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                        {variant === 'home' ? 'Dashboard Calibrated' : 'Classroom Synced'}
                    </span>

                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-3 mb-2">
                        You're All Set, {studentName}!
                    </h2>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                        {variant === 'home'
                            ? 'Your Scholar Command Center is ready. Join a class or tap an enrolled class card to begin!'
                            : 'Your classroom interface is calibrated and your modules are ready.'}
                    </p>

                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 mb-8 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Orientation Bonus
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
                        {isSaving ? 'Syncing Profile...' : 'Start Exploring'}
                    </button>
                </div>
            ) : (
                /* INTERACTIVE STEP CARD */
                <div className="relative z-[9520] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl max-w-lg w-full rounded-[2.5rem] p-7 sm:p-9 border border-white/40 dark:border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.45)] animate-in zoom-in-95 duration-300 overflow-hidden">
                    
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentStep.accentColor}`} />

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

                    <div className="flex items-center justify-center gap-2 mb-6">
                        {steps.map((s, idx) => (
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
                            {stepIdx === steps.length - 1 ? (
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
