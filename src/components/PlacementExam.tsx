// src/components/PlacementExam.tsx
import React, { useState } from 'react';
import { 
    Target, Zap, CheckCircle2, BrainCircuit, ArrowRight, Server, AlertTriangle, Loader2
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

// --- DATA: QUESTION MATRIX ---
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

const QUESTION_MATRIX: Record<CEFRLevel, (string | number)[][]> = {
  A1: [
    ["Hi, what ___ your name?", "am", "is", "are", "be", 1],
    ["I ___ from Mexico.", "am", "is", "are", "be", 0],
    ["___ you like coffee?", "Does", "Do", "Are", "Is", 1],
    ["She ___ a teacher.", "am", "are", "is", "be", 2],
    ["We ___ working right now.", "am", "is", "are", "do", 2],
    ["___ is your birthday?", "Who", "Where", "When", "Why", 2],
    ["I have two ___.", "childs", "childrens", "child", "children", 3],
    ["He ___ breakfast at 7 AM.", "eat", "eats", "eating", "ate", 1],
    ["My brother ___ drive a car.", "can't", "no can", "not can", "don't can", 0],
    ["They live ___ London.", "on", "at", "in", "by", 2],
    ["Look at ___ dog over there!", "this", "that", "these", "those", 1],
    ["I don't have ___ money.", "some", "any", "many", "a", 1],
    ["What time ___?", "it is", "is it", "has it", "does it", 1],
    ["She is ___ her homework.", "do", "does", "doing", "did", 2],
    ["I went to the store ___ buy milk.", "for", "to", "at", "so", 1],
    ["___ there a hospital near here?", "Are", "Is", "Does", "Do", 1],
    ["This is ___ book.", "my", "mine", "me", "I", 0],
    ["Yesterday, I ___ to the cinema.", "go", "went", "going", "goes", 1],
    ["I usually wake up ___ 6 o'clock.", "in", "on", "at", "for", 2],
    ["How ___ apples do we have?", "much", "many", "some", "any", 1]
  ],
  A2: [
    ["I ___ to Paris last year.", "travel", "traveled", "traveling", "travels", 1],
    ["She is ___ than her sister.", "tall", "taller", "tallest", "more tall", 1],
    ["We ___ a movie when the phone rang.", "watched", "were watching", "are watching", "watch", 1],
    ["Have you ever ___ sushi?", "eat", "ate", "eaten", "eating", 2],
    ["I ___ meet you at the cafe tomorrow.", "will", "am", "do", "did", 0],
    ["You ___ smoke in the hospital.", "mustn't", "don't have to", "needn't", "aren't", 0],
    ["If it rains, we ___ at home.", "stay", "stayed", "will stay", "would stay", 2],
    ["He drives very ___.", "fastly", "fast", "quick", "speed", 1],
    ["I have lived here ___ 2015.", "since", "for", "in", "ago", 0],
    ["This is the ___ movie I have ever seen.", "good", "better", "best", "most good", 2],
    ["I enjoy ___ books in the evening.", "read", "to read", "reading", "reads", 2],
    ["She ___ go to the party because she was sick.", "can't", "couldn't", "won't", "doesn't", 1],
    ["There isn't ___ milk in the fridge.", "some", "any", "no", "many", 1],
    ["___ you going to buy a new car?", "Do", "Have", "Are", "Will", 2],
    ["I ___ my keys. I can't find them.", "lost", "have lost", "lose", "am losing", 1],
    ["He's the man ___ stole my bag!", "who", "which", "where", "whose", 0],
    ["We don't have ___ time left.", "much", "many", "a lot", "some", 0],
    ["The exam was ___ difficult than I expected.", "less", "least", "more", "most", 2],
    ["I'm looking forward to ___ you.", "see", "seeing", "saw", "be seeing", 1],
    ["She told me she ___ tired.", "is", "was", "has been", "were", 1]
  ],
  B1: [
    ["If I had a million dollars, I ___ travel the world.", "will", "can", "would", "shall", 2],
    ["The letter ___ delivered yesterday.", "was", "were", "is", "has been", 0],
    ["By the time we arrived, the train ___.", "left", "has left", "had left", "was leaving", 2],
    ["You should ___ a doctor about that cough.", "see", "to see", "seeing", "saw", 0],
    ["He suggested ___ to the beach.", "go", "to go", "going", "goes", 2],
    ["I'm not used to ___ up so early.", "wake", "waking", "woke", "woken", 1],
    ["She asked me where ___.", "was the station", "the station was", "is the station", "the station is", 1],
    ["We'll go for a walk unless it ___.", "rains", "will rain", "doesn't rain", "rained", 0],
    ["He is thought ___ a millionaire.", "be", "to be", "being", "is", 1],
    ["I wish I ___ play the piano.", "can", "could", "will", "shall", 1],
    ["Despite ___ tired, he finished the project.", "be", "being", "he was", "of being", 1],
    ["I'll call you as soon as I ___.", "arrive", "will arrive", "arrived", "am arriving", 0],
    ["This software needs ___.", "update", "to update", "updating", "updated", 2],
    ["It's about time you ___ a job.", "get", "got", "getting", "have got", 1],
    ["You ___ have left your keys at the office.", "must", "can", "should", "ought", 0],
    ["She won't come ___ you invite her.", "if", "unless", "incase", "otherwise", 1],
    ["The movie was so boring that I fell ___.", "sleep", "asleep", "sleeping", "sleepy", 1],
    ["Do you mind ___ the window?", "open", "to open", "opening", "opened", 2],
    ["He denied ___ the money.", "to steal", "steal", "stealing", "stole", 2],
    ["If only I ___ more time for my hobbies.", "have", "had", "will have", "have had", 1]
  ],
  B2: [
    ["Scarcely ___ the house when it started to rain.", "I had left", "had I left", "I left", "did I leave", 1],
    ["If you hadn't helped me, I ___ failed.", "would", "will have", "would have", "had", 2],
    ["I'd rather you ___ smoke in here.", "don't", "didn't", "won't", "not", 1],
    ["He is believed ___ the country.", "to leave", "leaving", "to have left", "having left", 2],
    ["It was ___ a difficult exam that many failed.", "so", "such", "too", "very", 1],
    ["Not only ___ the exam, but she got the highest score.", "she passed", "did she pass", "passed she", "she did pass", 1],
    ["You shouldn't have driven so fast. You ___ had an accident.", "must have", "should have", "could have", "will have", 2],
    ["I'm having my house ___ next week.", "paint", "painting", "painted", "to paint", 2],
    ["He apologized for ___ so late.", "be", "being", "been", "having", 1],
    ["By this time next year, I ___ my degree.", "will finish", "will have finished", "finish", "am finishing", 1],
    ["It's no use ___ over spilled milk.", "cry", "crying", "to cry", "cried", 1],
    ["She objected ___ treated like a child.", "to be", "being", "to being", "be", 2],
    ["Hardly ever ___ to the theater nowadays.", "I go", "go I", "do I go", "I do go", 2],
    ["They wouldn't let me ___ the building.", "enter", "to enter", "entering", "entered", 0],
    ["He was accused ___ stealing the documents.", "for", "with", "of", "about", 2],
    ["No sooner had we arrived ___ the storm broke.", "when", "than", "then", "that", 1],
    ["I regret ___ you that your application was denied.", "informing", "to inform", "inform", "informed", 1],
    ["The project is bound ___ successful.", "be", "being", "to be", "been", 2],
    ["He speaks as if he ___ an expert.", "is", "was", "were", "has been", 2],
    ["Under no circumstances ___ open this door.", "you should", "should you", "you must", "must you", 1]
  ],
  C1: [
    ["It is imperative that she ___ present at the meeting.", "is", "be", "was", "were", 1],
    ["___ what he says, I still don't trust him.", "Regardless", "Albeit", "Notwithstanding", "Furthermore", 2],
    ["But for your assistance, we ___.", "would fail", "had failed", "would have failed", "will fail", 2],
    ["He has a ___ knowledge of quantum physics.", "profound", "steep", "heavy", "thick", 0],
    ["The politician managed to ___ the difficult questions.", "dodge", "flee", "shirk", "stray", 0],
    ["She took ___ to his casual remarks about her work.", "offense", "umbrage", "insult", "resentment", 1],
    ["His argument was so ___ that everyone agreed instantly.", "cogent", "bland", "spurious", "tenuous", 0],
    ["They decided to ___ the issue until the next meeting.", "table", "chair", "desk", "floor", 0],
    ["The success of the project hinges ___ her approval.", "in", "with", "on", "about", 2],
    ["It's a ___ conclusion that they will win the championship.", "foregone", "past", "certain", "done", 0],
    ["She has a knack ___ making people feel comfortable.", "in", "with", "for", "about", 2],
    ["The company is on the ___ of collapse.", "verge", "edge", "brink", "margin", 2],
    ["He was caught ___ reading confidential emails.", "red-handed", "black-handed", "white-handed", "blue-handed", 0],
    ["The new policy will be implemented across the ___.", "board", "table", "desk", "room", 0],
    ["We need to nip this problem in the ___.", "bud", "flower", "root", "seed", 0],
    ["She's a very ___ reader, devouring three books a week.", "voracious", "tenacious", "spacious", "audacious", 0],
    ["His explanation was completely ___; I couldn't understand a word.", "lucid", "baffling", "transparent", "coherent", 1],
    ["The rumor spread like ___ through the office.", "wildfire", "water", "wind", "disease", 0],
    ["He's always blowing his own ___, boasting about his achievements.", "trumpet", "flute", "drum", "piano", 0],
    ["We must ___ out the root cause of this systemic failure.", "ferret", "badger", "weasel", "hound", 0]
  ]
};

// --- CORE LOGIC ---
const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MAX_QUESTIONS = 20;

export default function PlacementExam() {
    const [appState, setAppState] = useState<'intro' | 'testing' | 'results'>('intro');
    const [studentName, setStudentName] = useState('');
    
    // Adaptive State: Starts at A1 (Ladder Approach)
    const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('A1');
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [streak, setStreak] = useState(0);
    
    const [history, setHistory] = useState<any[]>([]);
    const [currentQuestionTuple, setCurrentQuestionTuple] = useState<any[] | null>(null);

    // Database Status State
    const [syncStatus, setSyncStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [finalPayloadObject, setFinalPayloadObject] = useState<any>(null);

    const getNextQuestion = (level: CEFRLevel) => {
        const bank = QUESTION_MATRIX[level];
        const askedInLevel = history.filter(h => h.level === level).map(h => h.question);
        const available = bank.filter(q => !askedInLevel.includes(q[0]));
        
        const pool = available.length > 0 ? available : bank;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const startExam = () => {
        if (!studentName.trim()) return;
        setCurrentQuestionTuple(getNextQuestion('A1'));
        setAppState('testing');
    };

    const generatePayloadObject = (finalHistory: any[], finalLevel: CEFRLevel) => {
        const correctCount = finalHistory.filter(h => h.correct).length;
        const levelBonus = (LEVELS.indexOf(finalLevel) + 1) * 50;
        const finalXp = (correctCount * 10) + levelBonus;

        return {
            student_name: studentName,
            final_placement: finalLevel,
            xp_earned: finalXp,
            coins_earned: Math.floor(finalXp / 5),
            total_questions: finalHistory.length,
            accuracy: Math.round((correctCount / finalHistory.length) * 100) + '%',
            audit_trail: finalHistory,
            timestamp: Date.now(),
            status: 'pending_review' // Flags it for the instructor dashboard
        };
    };

    const saveToDatabase = async (payload: any) => {
        setSyncStatus('pending');
        try {
            // Sanitize name for document ID
            const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const docId = `${safeName}_${Date.now()}`;
            
            const placementRef = doc(db, 'artifacts', appId, 'placements', docId);
            await setDoc(placementRef, payload);
            
            setSyncStatus('success');
        } catch (error) {
            console.error("Failed to sync placement payload:", error);
            setSyncStatus('error');
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (!currentQuestionTuple) return;
        
        const isCorrect = selectedIndex === currentQuestionTuple[5];
        
        const newHistory = [...history, {
            question: currentQuestionTuple[0],
            level: currentLevel,
            correct: isCorrect,
            timestamp: Date.now()
        }];
        setHistory(newHistory);
        
        let newStreak = isCorrect ? Math.max(1, streak + 1) : Math.min(-1, streak - 1);
        let newLevel = currentLevel;
        const levelIdx = LEVELS.indexOf(currentLevel);

        // Adaptive Engine: +2 Promotes, -2 Demotes
        if (newStreak >= 2 && levelIdx < LEVELS.length - 1) {
            newLevel = LEVELS[levelIdx + 1];
            newStreak = 0;
        } else if (newStreak <= -2 && levelIdx > 0) {
            newLevel = LEVELS[levelIdx - 1];
            newStreak = 0;
        }

        setCurrentLevel(newLevel);
        setStreak(newStreak);
        setQuestionsAnswered(prev => prev + 1);

        if (questionsAnswered + 1 >= MAX_QUESTIONS) {
            // Exam Complete! Generate payload and save to DB
            const payloadObj = generatePayloadObject(newHistory, newLevel);
            setFinalPayloadObject(payloadObj);
            saveToDatabase(payloadObj);
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
                        <h1 className="text-3xl font-black tracking-tight mb-2">Diagnostic Protocol</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-widest mb-8">MagisterOS Calibration</p>
                        
                        <input 
                            type="text" 
                            placeholder="Enter your Callsign / Name" 
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 mb-6 outline-none focus:border-indigo-500 transition-colors text-center font-bold text-lg"
                        />
                        
                        <button 
                            onClick={startExam}
                            disabled={!studentName.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            Initiate Sequence <ArrowRight size={18} />
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
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Targeting: {currentLevel}</span>
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
                                    key={optIdx}
                                    onClick={() => handleAnswer(optIdx - 1)}
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
        const payloadString = JSON.stringify(finalPayloadObject, null, 2);

        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-slate-100 py-12 overflow-y-auto font-sans">
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
                    
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic mb-2">Calibration Complete</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-widest">Operator: {studentName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Assigned Tier</span>
                            <span className="text-4xl font-black text-indigo-400">{currentLevel}</span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Accuracy</span>
                            <span className="text-4xl font-black text-slate-200">
                                {finalPayloadObject?.accuracy || '0%'}
                            </span>
                        </div>
                    </div>

                    {/* 🔥 DATABASE SYNC STATUS HUD */}
                    <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between transition-colors ${
                        syncStatus === 'pending' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                        syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                        <div className="flex items-center gap-3">
                            {syncStatus === 'pending' && <Loader2 size={18} className="animate-spin" />}
                            {syncStatus === 'success' && <Server size={18} />}
                            {syncStatus === 'error' && <AlertTriangle size={18} />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {syncStatus === 'pending' ? 'Syncing to Magister Command...' :
                                 syncStatus === 'success' ? 'Payload Secured in Database' :
                                 'Network Failure: Local Backup Required'}
                            </span>
                        </div>
                        {syncStatus === 'success' && <CheckCircle2 size={18} />}
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4 text-slate-400">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-amber-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Local Payload Record</span>
                            </div>
                        </div>
                        <pre className="bg-black/50 border border-slate-800 p-4 rounded-xl overflow-x-auto text-xs font-mono text-emerald-400/80 max-h-48">
                            {payloadString}
                        </pre>
                    </div>

                    <button 
                        onClick={() => navigator.clipboard.writeText(payloadString)}
                        className={`w-full text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all ${
                            syncStatus === 'success' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'
                        }`}
                    >
                        {syncStatus === 'success' ? 'Copy Backup to Clipboard' : 'Copy Payload Manually'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
