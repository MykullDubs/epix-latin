// src/components/PrepositionsExam.tsx
import React, { useState } from 'react';
import { 
    Target, Zap, CheckCircle2, BrainCircuit, ArrowRight, Server, AlertTriangle, Loader2, BookOpen, BarChart3
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

// --- DATA: DIAGNOSTIC QUESTION MATRIX ---
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

const CEFR_DESCRIPTIONS: Record<CEFRLevel, string> = {
    A1: "Beginner — Basic understanding of simple static locations and clock times.",
    A2: "Elementary — Can navigate everyday movement, relative positions, and standard timeframes.",
    B1: "Intermediate — Solid grasp of deadlines, duration, and 3D spatial prepositions.",
    B2: "Upper-Intermediate — Fluent in metaphorical space/time, precise direction, and collocations.",
    C1: "Advanced — Complete mastery of idiomatic expressions, literary spatial relationships, and formal phrasing."
};

// FORMAT: [Question, Opt 1, Opt 2, Opt 3, Opt 4, Correct Index, Grammar Topic]
const QUESTION_MATRIX: Record<CEFRLevel, (string | number)[][]> = {
  A1: [
    ["We have English class ___ Mondays.", "in", "on", "at", "by", 1, "Time: Days of the Week"],
    ["The book is ___ the table.", "in", "on", "at", "under", 1, "Place: Surfaces (On)"],
    ["He wakes up ___ 7:00 AM every morning.", "in", "on", "at", "for", 2, "Time: Clock Times"],
    ["I live ___ a big city.", "in", "on", "at", "to", 0, "Place: Enclosed Spaces / Cities"],
    ["My birthday is ___ October.", "in", "on", "at", "to", 0, "Time: Months"],
    ["She is walking ___ school right now.", "at", "to", "on", "in", 1, "Direction: Movement to a destination"],
    ["The cat is sleeping ___ the bed.", "under", "to", "into", "at", 0, "Place: Directly below (Under)"],
    ["They are waiting ___ the bus stop.", "in", "on", "at", "into", 2, "Place: Specific points/locations"],
    ["We always watch TV ___ the evening.", "in", "on", "at", "by", 0, "Time: Parts of the day"],
    ["The bank is next ___ the supermarket.", "at", "to", "in", "of", 1, "Place: Next to / Adjacent"],
    ["Look ___ the picture on the wall!", "at", "in", "on", "to", 0, "Place: Focus point (Look at)"],
    ["We are flying ___ Madrid tonight.", "at", "to", "in", "on", 1, "Direction: Travel destination"],
    ["The keys are ___ my pocket.", "in", "on", "at", "to", 0, "Place: Inside enclosed spaces"],
    ["He is sitting ___ a chair.", "in", "on", "at", "under", 1, "Place: On furniture surfaces"],
    ["I always stay home ___ night.", "in", "on", "at", "to", 2, "Time: Exception (At night)"],
    ["Put the apples ___ the shopping bag.", "into", "at", "on", "under", 0, "Direction: Movement inside (Into)"],
    ["The clock is hanging ___ the wall.", "in", "on", "at", "over", 1, "Place: Vertical surfaces (On)"],
    ["She was born ___ 2010.", "in", "on", "at", "by", 0, "Time: Years"],
    ["The dog ran ___ the garden.", "in", "on", "into", "at", 2, "Direction: Movement into a space"],
    ["There is a bridge ___ the river.", "over", "in", "at", "into", 0, "Place: Directly above (Over)"]
  ],
  A2: [
    ["I have lived here ___ three years.", "since", "for", "during", "in", 1, "Time: Duration (For)"],
    ["She has been waiting ___ 2:00 PM.", "for", "since", "during", "by", 1, "Time: Starting point (Since)"],
    ["We walked ___ the park to get to the library.", "through", "on", "at", "in", 0, "Direction: Movement from side to side (Through)"],
    ["Please don't stand ___ front of the TV.", "in", "on", "at", "by", 0, "Place: In front of"],
    ["The car drove ___ the dark tunnel.", "over", "through", "on", "at", 1, "Direction: Passing inside (Through)"],
    ["He jumped ___ the swimming pool.", "in", "on", "into", "at", 2, "Direction: Action entering water (Into)"],
    ["We arrived ___ the airport very early.", "in", "on", "at", "to", 2, "Place: Arriving at specific buildings"],
    ["They arrived ___ Paris last night.", "in", "at", "to", "on", 0, "Place: Arriving in cities/countries"],
    ["You must finish the test ___ Friday.", "by", "until", "since", "for", 0, "Time: Deadlines (By)"],
    ["I fell asleep ___ the movie.", "during", "for", "since", "while", 0, "Time: Simultaneous events (During)"],
    ["The shop is ___ the pharmacy and the bakery.", "between", "among", "in", "next", 0, "Place: In the middle of two things (Between)"],
    ["She safely walked ___ the street to the other side.", "across", "through", "along", "into", 0, "Direction: From one side to the other (Across)"],
    ["We strolled slowly ___ the beach.", "along", "through", "across", "into", 0, "Direction: Following a line/edge (Along)"],
    ["He took his wallet ___ his pocket.", "out of", "into", "off", "from in", 0, "Direction: Removing from enclosed space (Out of)"],
    ["The cat jumped ___ the table onto the floor.", "off", "out of", "under", "in", 0, "Direction: Leaving a surface (Off)"],
    ["There is a clock directly ___ the whiteboard.", "above", "over", "on", "up", 0, "Place: Higher level without touching (Above)"],
    ["We sat ___ the shade of a large tree.", "in", "on", "at", "under", 0, "Place: Enclosed area/environment (In)"],
    ["She will be away on vacation ___ Monday to Thursday.", "from", "since", "between", "at", 0, "Time: Starting point of a range (From...to)"],
    ["You can't see the sun because it is hidden ___ the clouds.", "behind", "after", "back", "under", 0, "Place: At the back of (Behind)"],
    ["He is walking directly ___ the door right now.", "towards", "at", "in", "on", 0, "Direction: Moving in the direction of (Towards)"]
  ],
 B1: [
    ["We need to submit the final project ___ the end of the week.", "by", "until", "since", "in", 0, "Time: Deadlines (By vs. Until)"],
    ["I will wait right here ___ you get back.", "until", "by", "for", "since", 0, "Time: Continuous action up to a point (Until)"],
    ["The small cabin is hidden ___ the trees in the forest.", "among", "between", "middle", "in", 0, "Place: Surrounded by multiple objects (Among)"],
    ["He threw the ball ___ the fence and it landed in the yard.", "over", "above", "across", "through", 0, "Direction: Trajectory crossing an obstacle (Over)"],
    ["There is a temperature sensor located 100 meters ___ sea level.", "below", "under", "beneath", "down", 0, "Place: Measurements on a vertical scale (Below)"],
    ["She was sitting ___ the back of the taxi.", "in", "at", "on", "to", 0, "Place: Inside enclosed vehicles (In the back of)"],
    ["Please sign your name ___ the bottom of the page.", "at", "in", "on", "by", 0, "Place: Specific point on a page (At the bottom)"],
    ["We were stuck in heavy traffic ___ over two hours.", "for", "during", "since", "while", 0, "Time: Duration with quantities (For)"],
    ["The train will depart ___ exactly ten minutes.", "in", "at", "on", "by", 0, "Time: Future timeframe from now (In)"],
    ["He walked straight ___ the police officer without saying hello.", "past", "pass", "across", "through", 0, "Direction: Moving beyond a point (Past)"],
    ["You must step ___ the train before the doors close.", "onto", "into", "in", "at", 0, "Direction: Boarding public transport surfaces (Onto)"],
    ["Get ___ the car quickly, it's starting to rain!", "into", "onto", "on", "at", 0, "Direction: Entering private enclosed vehicles (Into)"],
    ["We live in a quiet neighborhood ___ the outskirts of the city.", "on", "in", "at", "by", 0, "Place: Geographical borders (On the outskirts)"],
    ["He has been working continuously on this report ___ dawn.", "since", "for", "from", "during", 0, "Time: Starting point of ongoing action (Since)"],
    ["The thief silently climbed ___ the open window.", "through", "across", "along", "over", 0, "Direction: Passing through an opening/frame"],
    ["The human resources office is located ___ the third floor.", "on", "in", "at", "by", 0, "Place: Building levels/floors (On)"],
    ["We met our new colleagues ___ a charity networking event.", "at", "in", "on", "to", 0, "Place: Organized gatherings/events (At)"],
    ["The scenic train traveled ___ the coastline for an hour.", "along", "across", "through", "into", 0, "Direction: Moving parallel to a boundary (Along)"],
    ["She stood shivering ___ the bus stop in the pouring rain.", "at", "in", "on", "by", 0, "Place: Specific transport stops (At)"],
    ["I couldn't hear the speaker because of the loud chatter ___ me.", "around", "among", "between", "about", 0, "Place: Surrounding in all directions (Around)"]
  ],
 B2: [
    ["We arrived just ___ time to catch the opening act of the concert.", "in", "on", "at", "by", 0, "Time: Idiomatic (In time vs. On time)"],
    ["The express train departed exactly ___ time, at 8:15 AM.", "on", "in", "at", "by", 0, "Time: Punctuality (On time)"],
    ["___ the time we reached the theater, the play had already started.", "By", "In", "On", "At", 0, "Time: Complex clauses (By the time)"],
    ["The headquarters are situated ___ the intersection of 5th and Main.", "at", "in", "on", "by", 0, "Place: Exact geographical crossroads (At)"],
    ["We wandered aimlessly ___ the narrow, winding streets of the old town.", "through", "across", "over", "along", 0, "Direction: Navigating complex 3D environments (Through)"],
    ["A sudden feeling of relief and happiness washed ___ him.", "over", "above", "across", "through", 0, "Direction: Metaphorical emotional movement (Wash over)"],
    ["There is a strict ban on parking ___ the entire length of the avenue.", "along", "across", "through", "around", 0, "Place/Direction: Parallel distribution (Along)"],
    ["The rocky hiking path wound its way ___ the steep hillside.", "up", "onto", "above", "over", 0, "Direction: Vertical ascending movement (Up)"],
    ["We found a quaint little restaurant hidden ___ a narrow alleyway.", "in", "at", "on", "into", 0, "Place: Enclosed urban pathways (In)"],
    ["The project deadline was pushed back ___ two weeks due to delays.", "by", "until", "for", "in", 0, "Time: Margin/Amount of modification (By)"],
    ["She sat diligently ___ her desk for hours without looking up.", "at", "in", "on", "by", 0, "Place: Workstations and functional positions (At)"],
    ["The shocking news spread rapidly ___ the entire country.", "throughout", "between", "among", "along", 0, "Place: Pervading every part of an area (Throughout)"],
    ["He stepped back without looking and fell ___ the edge of the platform.", "off", "out of", "from", "down", 0, "Direction: Falling from a raised surface (Off)"],
    ["We stood on the cliff, gazing out ___ the vast expanse of the ocean.", "across", "through", "over", "along", 0, "Direction: Looking over flat, open expanses (Across)"],
    ["The documents were buried beneath a pile of folders ___ the corner of the room.", "in", "at", "on", "by", 0, "Place: Internal corners of enclosed rooms (In)"],
    ["There is a famous 24-hour bakery right ___ the corner of the street.", "on", "in", "into", "over", 0, "Place: External street corners (On/At)"],
    ["He has been on medical leave ___ the beginning of the month.", "since", "from", "for", "during", 0, "Time: Ongoing states from a definite point (Since)"],
    ["They walked side by side ___ complete silence towards the exit.", "in", "with", "at", "by", 0, "State/Manner as spatial metaphor (In silence)"],
    ["The ambient temperature dropped well ___ freezing last night.", "below", "under", "beneath", "underneath", 0, "Place/Level: Standard meteorological scales (Below)"],
    ["We managed to organize the entire conference ___ very short notice.", "at", "in", "on", "with", 0, "Time Idiom: Urgency (At short notice)"]
  ],
  C1: [
    ["We must finish this monumental architecture project ___ the turn of the century.", "by", "until", "in", "at", 0, "Time: Deadlines with historical milestones (By)"],
    ["The picturesque village lies nestled ___ the foothills of the Alps.", "in", "among", "at", "on", 0, "Place: Literary geographical description (In the foothills)"],
    ["He was pacing nervously to and ___ across the hospital waiting room.", "fro", "from", "back", "forth", 0, "Direction Idiom: Reciprocal movement (To and fro)"],
    ["The corporation operates ___ a global scale, with offices in 40 countries.", "on", "in", "at", "by", 0, "Place Idiom: Scope and magnitude (On a scale)"],
    ["We were unfortunately caught ___ the crossfire of their bitter argument.", "in", "at", "on", "between", 0, "Metaphorical Place: Conflict zones (In the crossfire)"],
    ["The emergency security protocols will remain in effect ___ further notice.", "until", "by", "to", "for", 0, "Time Formal: Open-ended administrative duration (Until)"],
    ["He lives in a remote, off-grid cottage way out ___ the sticks.", "in", "at", "on", "to", 0, "Idiomatic Place: Rural isolation (In the sticks)"],
    ["The forensic investigators searched the abandoned warehouse from top ___ bottom.", "to", "until", "at", "by", 0, "Direction/Extent: Complete spatial coverage (From...to)"],
    ["She felt completely at home ___ the bohemian artists and writers of the city.", "among", "between", "in", "amidst", 0, "Place/Group: Belonging within a collective (Among/Amidst)"],
    ["The ancient Roman ruins lay buried ___ several meters of volcanic ash.", "beneath", "below", "down", "lower", 0, "Place Formal: Direct physical layering (Beneath)"],
    ["We worked around the clock, successfully closing the deal ___ the eleventh hour.", "at", "in", "on", "by", 0, "Time Idiom: Last possible moment (At the eleventh hour)"],
    ["The narrow path diverged, leading us deeper ___ the heart of the dense forest.", "into", "in", "inside", "within", 0, "Direction: Penetrating core centers (Into the heart of)"],
    ["His aggressive remarks were entirely out ___ line with our corporate values.", "of", "from", "with", "off", 0, "Metaphorical Direction: Behavioral boundaries (Out of line)"],
    ["The tense labor union negotiations dragged on well ___ the early hours of the morning.", "into", "in", "until", "to", 0, "Time/Direction: Penetrating late timeframes (Drag into)"],
    ["She stood majestically on the balcony, looking down ___ the bustling courtyard below.", "upon", "over", "at", "towards", 0, "Formal Direction: Elevation and vantage points (Look down upon)"],
    ["The entire project is currently hovering dangerously ___ the brink of collapse.", "on", "at", "in", "over", 0, "Metaphorical Place: Precarious states (On the brink of)"],
    ["He managed to effortlessly slip ___ the dense crowd completely unnoticed.", "through", "across", "along", "over", 0, "Direction: Fluid movement through obstacles (Slip through)"],
    ["The historic monastery is located well off the beaten ___.", "track", "road", "path", "way", 0, "Idiomatic Place: Unconventional routes (Off the beaten track)"],
    ["We arrived at the summit just as the golden sun was peeking ___ the horizon.", "over", "above", "across", "through", 0, "Direction/Place: Emerging across boundaries (Over the horizon)"],
    ["She has been surviving on a shoestring budget ___ the past six months.", "for", "since", "during", "in", 0, "Time: Retrospective duration up to present (For the past...)"]
  ]
};

// --- CORE LOGIC ---
const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MAX_QUESTIONS = 30; 

export default function PrepositionsExam() {
    const [appState, setAppState] = useState<'intro' | 'testing' | 'results'>('intro');
    const [studentName, setStudentName] = useState('');
    
    // Adaptive State: Starts at A2 to avoid beginner-grind for advanced students
    const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('A2');
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [streak, setStreak] = useState(0);
    
    const [history, setHistory] = useState<any[]>([]);
    const [currentQuestionTuple, setCurrentQuestionTuple] = useState<any[] | null>(null);

    // Database Status State
    const [syncStatus, setSyncStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [finalResultsObject, setFinalResultsObject] = useState<any>(null);

    const getNextQuestion = (level: CEFRLevel) => {
        const bank = QUESTION_MATRIX[level];
        const askedInLevel = history.filter(h => h.level === level).map(h => h.question);
        const available = bank.filter(q => !askedInLevel.includes(q[0]));
        
        if (available.length === 0) {
            console.warn(`Question bank exhausted at level ${level}. Recycling questions.`);
        }
        
        const pool = available.length > 0 ? available : bank;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const startExam = () => {
        if (!studentName.trim()) return;
        setCurrentQuestionTuple(getNextQuestion('A2'));
        setAppState('testing');
    };

    // Psychometrically robust placement calculator
    const calculateFinalPlacement = (historyData: any[]): CEFRLevel => {
        const accuracyByLevel: Record<CEFRLevel, { correct: number; total: number }> = {
            A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 },
            B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 },
            C1: { correct: 0, total: 0 }
        };

        historyData.forEach(h => {
            accuracyByLevel[h.level as CEFRLevel].total++;
            if (h.correct) accuracyByLevel[h.level as CEFRLevel].correct++;
        });

        // Find highest level with >= 3 attempts AND >= 60% accuracy
        let calculatedLevel: CEFRLevel = 'A1';
        for (const level of LEVELS) {
            const { correct, total } = accuracyByLevel[level];
            if (total >= 3 && (correct / total) >= 0.60) {
                calculatedLevel = level;
            }
        }
        return calculatedLevel;
    };

    const generateResultsObject = (finalHistory: any[]) => {
        const correctCount = finalHistory.filter(h => h.correct).length;
        const calculatedLevel = calculateFinalPlacement(finalHistory);
        
        // Fair XP: Purely accuracy based to not penalize beginners
        const finalXp = correctCount * 10;

        // Diagnostic Engine: Sort topics by frequency of errors
        const topicMissCount: Record<string, number> = {};
        finalHistory.filter(h => !h.correct && h.topic).forEach(h => {
            topicMissCount[h.topic] = (topicMissCount[h.topic] || 0) + 1;
        });

        const uniqueAreasForImprovement = Object.entries(topicMissCount)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 6)
            .map(([topic]) => topic);

        return {
            version: "1.4",
            student_name: studentName,
            final_placement: calculatedLevel,
            xp_earned: finalXp,
            coins_earned: Math.floor(finalXp / 5),
            total_questions: finalHistory.length,
            accuracy: Math.round((correctCount / finalHistory.length) * 100) + '%',
            areas_for_improvement: uniqueAreasForImprovement,
            audit_trail: finalHistory,
            timestamp: Date.now(),
            status: 'pending_review' 
        };
    };

    const saveToDatabase = async (resultsData: any) => {
        setSyncStatus('pending');
        try {
            const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const docId = `${safeName}_prepositions_${Date.now()}`;
            
            const placementRef = doc(db, 'artifacts', appId, 'placements', docId);
            await setDoc(placementRef, resultsData);
            
            setSyncStatus('success');
        } catch (error) {
            console.error("Failed to save results:", error);
            setSyncStatus('error');
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (!currentQuestionTuple) return;
        
        const isCorrect = selectedIndex === currentQuestionTuple[5];
        const topic = currentQuestionTuple[6] || "General Prepositions";
        
        const newHistory = [...history, {
            question: currentQuestionTuple[0],
            level: currentLevel,
            topic: topic,
            correct: isCorrect,
            timestamp: Date.now()
        }];
        setHistory(newHistory);
        
        // Standard +1/-1 streak incrementing
        let newStreak = isCorrect ? streak + 1 : streak - 1;
        let newLevel = currentLevel;
        const levelIdx = LEVELS.indexOf(currentLevel);

        // Adaptive Engine: Strict +/- 3 threshold to prevent level oscillation
        if (newStreak >= 3 && levelIdx < LEVELS.length - 1) {
            newLevel = LEVELS[levelIdx + 1];
            newStreak = 0;
        } else if (newStreak <= -3 && levelIdx > 0) {
            newLevel = LEVELS[levelIdx - 1];
            newStreak = 0;
        }

        setCurrentLevel(newLevel);
        setStreak(newStreak);
        setQuestionsAnswered(prev => prev + 1);

        if (questionsAnswered + 1 >= MAX_QUESTIONS) {
            const resultsObj = generateResultsObject(newHistory);
            setFinalResultsObject(resultsObj);
            saveToDatabase(resultsObj);
            setAppState('results');
        } else {
            setCurrentQuestionTuple(getNextQuestion(newLevel));
        }
    };

    // --- UI RENDERING ---
    if (appState === 'intro') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/50 rounded-2xl flex items-center justify-center mb-6">
                            <BrainCircuit size={32} className="text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-indigo-400 tracking-widest uppercase mb-1">Harmony School</h2>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Prepositions Exam</h1>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-8">Time, Location & Direction Assessment</p>
                        
                        <input 
                            type="text" 
                            placeholder="Enter your First & Last Name" 
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 mb-6 outline-none focus:border-indigo-500 transition-colors text-center font-bold text-lg"
                        />
                        
                        <button 
                            onClick={startExam}
                            disabled={!studentName.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            Begin Test <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (appState === 'testing' && currentQuestionTuple) {
        const progress = (questionsAnswered / MAX_QUESTIONS) * 100;
        
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
                <div className="w-full max-w-md flex flex-col h-[85vh] sm:h-auto">
                    
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-indigo-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Current Level: {currentLevel}</span>
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {questionsAnswered + 1} / {MAX_QUESTIONS}
                        </div>
                    </div>

                    <div className="w-full h-1 bg-slate-800 rounded-full mb-8 overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-6 flex-1 flex items-center justify-center text-center">
                            <h2 className="text-2xl sm:text-3xl font-serif leading-tight">
                                {currentQuestionTuple[0]}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3 shrink-0">
                            {[1, 2, 3, 4].map((optIdx) => (
                                <button 
                                    key={`${currentQuestionTuple[0]}-${optIdx}`}
                                    onClick={(e) => {
                                        e.currentTarget.blur();
                                        handleAnswer(optIdx - 1);
                                    }}
                                    className="w-full bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/10 active:bg-indigo-500/20 text-slate-200 font-bold py-4 px-6 rounded-2xl text-left transition-all"
                                >
                                    {currentQuestionTuple[optIdx]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (appState === 'results') {
        const placedLevel = finalResultsObject?.final_placement as CEFRLevel;

        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-slate-100 py-12 overflow-y-auto font-sans">
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
                    
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic mb-2">Exam Complete</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-widest">Student: {studentName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center flex flex-col justify-center">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Estimated CEFR Level</span>
                            <span className="text-4xl font-black text-indigo-400 mb-2">{placedLevel}</span>
                            <span className="text-[10px] font-medium text-slate-400 px-2 leading-relaxed">
                                {CEFR_DESCRIPTIONS[placedLevel]}
                            </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4 text-center">Performance Breakdown</span>
                            <div className="space-y-2">
                                {LEVELS.map(level => {
                                    const qs = history.filter(h => h.level === level);
                                    if (qs.length === 0) return null;
                                    const correct = qs.filter(h => h.correct).length;
                                    return (
                                        <div key={level} className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-300">{level}</span>
                                            <span className="text-slate-500">{correct} / {qs.length} correct</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 🔥 DIAGNOSTIC: Focus Areas */}
                        {finalResultsObject?.areas_for_improvement?.length > 0 && (
                            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl col-span-2">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <BookOpen size={14} className="text-rose-500" />
                                    <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">Prepositions to Review</span>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {finalResultsObject.areas_for_improvement.map((area: string, idx: number) => (
                                        <span key={idx} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🔥 DATABASE SYNC STATUS HUD */}
                    <div className={`mb-4 p-4 rounded-xl border flex items-center justify-between transition-colors ${
                        syncStatus === 'pending' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                        syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                        <div className="flex items-center gap-3">
                            {syncStatus === 'pending' && <Loader2 size={18} className="animate-spin" />}
                            {syncStatus === 'success' && <Server size={18} />}
                            {syncStatus === 'error' && <AlertTriangle size={18} />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {syncStatus === 'pending' ? 'Saving your results...' :
                                 syncStatus === 'success' ? 'Results saved successfully' :
                                 'Connection error'}
                            </span>
                        </div>
                        {syncStatus === 'success' && <CheckCircle2 size={18} />}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
