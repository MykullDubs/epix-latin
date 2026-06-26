// src/components/PlacementExam.tsx
import React, { useState } from 'react';
import { 
    Target, Zap, CheckCircle2, BrainCircuit, ArrowRight, Server, AlertTriangle, Loader2, BookOpen, BarChart3
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

// --- DATA: DIAGNOSTIC QUESTION MATRIX ---
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

const CEFR_DESCRIPTIONS: Record<CEFRLevel, string> = {
    A1: "Beginner — Can understand and use familiar everyday expressions.",
    A2: "Elementary — Can communicate in simple, routine tasks.",
    B1: "Intermediate — Can deal with most situations likely to arise whilst travelling.",
    B2: "Upper-Intermediate — Can interact with fluency and spontaneity.",
    C1: "Advanced — Can use language flexibly for academic and professional purposes."
};

// FORMAT: [Question, Opt 1, Opt 2, Opt 3, Opt 4, Correct Index, Grammar Topic]
const QUESTION_MATRIX: Record<CEFRLevel, (string | number)[][]> = {
  A1: [
    ["Hi, what ___ your name?", "am", "is", "are", "be", 1, "Verb 'To Be'"],
    ["I ___ from Mexico.", "am", "is", "are", "be", 0, "Verb 'To Be'"],
    ["___ you like coffee?", "Does", "Do", "Are", "Is", 1, "Present Simple: Interrogative"],
    ["She ___ a teacher.", "am", "are", "is", "be", 2, "Verb 'To Be'"],
    ["We ___ working right now.", "am", "is", "are", "do", 2, "Present Continuous"],
    ["___ is your birthday?", "Who", "Where", "When", "Why", 2, "Wh- Questions"],
    ["I have two ___.", "childs", "childrens", "child", "children", 3, "Irregular Plurals"],
    ["He ___ breakfast at 7 AM.", "eat", "eats", "eating", "ate", 1, "Present Simple: 3rd Person"],
    ["My brother ___ drive a car.", "can't", "no can", "not can", "don't can", 0, "Modals: Can/Cannot"],
    ["They live ___ London.", "on", "at", "in", "by", 2, "Prepositions of Place"],
    ["Look at ___ dog over there!", "this", "that", "these", "those", 1, "Demonstratives"],
    ["I don't have ___ money.", "some", "any", "many", "a", 1, "Quantifiers: Some/Any"],
    ["What time ___?", "it is", "is it", "has it", "does it", 1, "Question Word Order"],
    ["She is ___ her homework.", "do", "does", "doing", "did", 2, "Present Continuous"],
    ["I went to the store ___ buy milk.", "for", "to", "at", "so", 1, "Infinitive of Purpose"],
    ["___ there a hospital near here?", "Are", "Is", "Does", "Do", 1, "There is / There are"],
    ["This is ___ book.", "my", "mine", "me", "I", 0, "Possessive Adjectives"],
    ["Yesterday, I ___ to the cinema.", "go", "went", "going", "goes", 1, "Past Simple: Irregular"],
    ["I usually wake up ___ 6 o'clock.", "in", "on", "at", "for", 2, "Prepositions of Time"],
    ["___ your sister play tennis?", "Do", "Is", "Are", "Does", 3, "Present Simple: Interrogative"],
    ["I always go to bed ___ midnight.", "in", "on", "at", "by", 2, "Prepositions of Time"],
    ["They ___ television every evening.", "watch", "watches", "watching", "watched", 0, "Present Simple"],
    ["Whose jacket is this? It's ___.", "my", "me", "mine", "I", 2, "Possessive Pronouns"],
    ["Can you pass me ___ sugar, please?", "a", "an", "the", "these", 2, "Definite Articles"],
    ["He ___ to the gym on Mondays.", "go", "goes", "going", "went", 1, "Present Simple: 3rd Person"],
    ["I want ___ a new phone.", "buy", "buying", "to buy", "bought", 2, "Verbs followed by Infinitive"],
    ["My birthday is ___ July.", "in", "on", "at", "for", 0, "Prepositions of Time (Months)"],
    ["Are there ___ eggs in the fridge?", "some", "any", "much", "a lot", 1, "Quantifiers: Questions"],
    ["The book is ___ the table.", "in", "on", "under", "next", 1, "Prepositions of Place"],
    ["I ___ a student.", "am", "is", "are", "be", 0, "Verb 'To Be'"],
    ["___ they from Spain?", "Are", "Is", "Do", "Does", 0, "Verb 'To Be' Interrogative"],
    ["My mother ___ a blue car.", "has", "have", "having", "is", 0, "Have got / Has"],
    ["There ___ a book on the desk.", "is", "are", "am", "be", 0, "There is / There are"],
    ["I ___ speak French.", "cannot", "am not", "no", "don't", 0, "Modals: Cannot"],
    ["She ___ late for class today.", "was", "were", "is", "be", 0, "Past Simple 'To Be'"]
  ],
  A2: [
    ["I ___ to Paris last year.", "travel", "traveled", "traveling", "travels", 1, "Past Simple: Regular"],
    ["We ___ a movie when the phone rang.", "watched", "were watching", "are watching", "watch", 1, "Past Continuous"],
    ["Have you ever ___ sushi?", "eat", "ate", "eaten", "eating", 2, "Present Perfect: Experience"],
    ["I ___ meet you at the cafe tomorrow.", "will", "am", "do", "did", 0, "Future Simple (Will)"],
    ["You ___ smoke in the hospital.", "mustn't", "don't have to", "needn't", "aren't", 0, "Modals of Prohibition"],
    ["If it rains, we ___ at home.", "stay", "stayed", "will stay", "would stay", 2, "First Conditional"],
    ["I have lived here ___ 2015.", "since", "for", "in", "ago", 0, "Present Perfect: Since/For"],
    ["This is the ___ movie I have ever seen.", "good", "better", "best", "most good", 2, "Superlatives"],
    ["I enjoy ___ books in the evening.", "read", "to read", "reading", "reads", 2, "Verbs followed by Gerunds"],
    ["She ___ go to the party because she was sick.", "can't", "couldn't", "won't", "doesn't", 1, "Modals: Past Ability"],
    ["There isn't ___ milk in the fridge.", "some", "any", "no", "many", 1, "Quantifiers: Negative Sentences"],
    ["___ you going to buy a new car?", "Do", "Have", "Are", "Will", 2, "Future (Going to)"],
    ["I ___ my keys. I can't find them.", "lost", "have lost", "lose", "am losing", 1, "Present Perfect: Recent Past"],
    ["He's the man ___ stole my bag!", "who", "which", "where", "whose", 0, "Relative Pronouns"],
    ["We don't have ___ time left.", "much", "many", "a lot", "some", 0, "Quantifiers: Much/Many"],
    ["I think it ___ rain tomorrow.", "is raining", "rains", "will rain", "rained", 2, "Future Predictions"],
    ["They have been married ___ ten years.", "since", "for", "in", "during", 1, "Present Perfect: For/Since"],
    ["You ___ wear a seatbelt in the car.", "must", "can", "might", "could", 0, "Modals of Obligation"],
    ["I didn't ___ to the gym yesterday.", "went", "go", "going", "gone", 1, "Past Simple: Negative"],
    ["That is the restaurant ___ we ate last night.", "who", "which", "where", "that", 2, "Relative Adverbs"],
    ["He is not as tall ___ his brother.", "than", "like", "as", "so", 2, "Comparatives (as...as)"],
    ["I was reading a book when the lights ___ out.", "go", "went", "going", "gone", 1, "Past Continuous Interruption"],
    ["Have you finished your homework ___?", "already", "just", "yet", "still", 2, "Present Perfect: Yet/Already"],
    ["I would like ___ a cup of tea.", "have", "to have", "having", "had", 1, "Would Like + Infinitive"],
    ["She has a ___ of shoes.", "many", "much", "lot", "lots", 2, "Quantifiers (A lot of)"],
    ["This car is ___ expensive for me to buy.", "too", "enough", "very", "much", 0, "Too vs. Enough"],
    ["We ___ to Spain next summer.", "go", "going", "are going", "went", 2, "Future (Present Continuous for Plans)"],
    ["He doesn't have ___ friends in this city.", "much", "many", "some", "no", 1, "Countable Nouns"],
    ["I'm not strong ___ to lift this box.", "too", "very", "enough", "much", 2, "Too vs. Enough"],
    ["I don't like ___ early.", "wake up", "waking up", "woke up", "wakes up", 1, "Gerunds after Verbs"],
    ["My car is ___ than yours.", "fast", "faster", "fastest", "more fast", 1, "Comparatives"],
    ["She plays the piano very ___.", "good", "well", "nice", "fine", 1, "Adverbs of Manner"],
    ["How ___ apples do we have?", "much", "many", "some", "any", 1, "Countable/Uncountable Nouns"],
    ["She is ___ than her sister.", "tall", "taller", "tallest", "more tall", 1, "Comparatives"],
    ["He drives very ___.", "fastly", "fast", "quick", "speed", 1, "Adverbs of Manner"]
  ],
 B1: [
    ["A: Why didn't you buy the jacket?\nB: Because I didn't have ___ money.", "enough", "sufficient", "too much", "quite", 0, "Quantifiers (Enough)"],
    ["A: What do you do?\nB: I am ___.", "student", "a student", "the student", "one student", 1, "Articles with Professions"],
    ["If I had more time, I ___ to the gym every day.", "would go", "went", "will go", "go", 0, "Second Conditional"],
    ["A: How long have you been studying English?\nB: ___ three years.", "Since", "For", "During", "By", 1, "Present Perfect (For/Since)"],
    ["I'm sorry I'm late. It ___ heavily on my way here.", "was raining", "is raining", "rained", "raining", 0, "Past Continuous"],
    ["A: This box is too heavy!\nB: Don't worry, I ___ help you.", "will", "am going to", "help", "would", 0, "Future (Spontaneous Decisions)"],
    ["Excuse me, do you know where ___?", "is the bank", "the bank is", "does the bank be", "is it the bank", 1, "Indirect Questions"],
    ["She is very ___ in learning about different cultures.", "interested", "interesting", "interest", "interests", 0, "-ed vs -ing Adjectives"],
    ["I am looking forward ___ you next week.", "to see", "to seeing", "see", "seeing", 1, "Phrasal Verbs + Gerund"],
    ["The exam wasn't as difficult ___ I thought.", "than", "that", "as", "like", 2, "Comparatives (as...as)"],
    ["A: Did you do your homework?\nB: No, I completely forgot ___ it.", "to do", "doing", "make", "to make", 0, "Verbs followed by Infinitive"],
    ["We can go to the beach, but it depends ___ the weather.", "of", "on", "from", "in", 1, "Dependent Prepositions"],
    ["I ___ this movie three times. It's my favorite!", "saw", "have seen", "had seen", "am seeing", 1, "Present Perfect: Experience"],
    ["A: The music is too loud.\nB: Do you mind ___ the volume?", "to lower", "lowering", "lower", "if you lower", 1, "Verbs followed by Gerunds"],
    ["He told me that he ___ at 8 PM.", "will arrive", "would arrive", "arrives", "is arriving", 1, "Reported Speech"],
    ["This software needs ___.", "updating", "to update", "update", "updated", 0, "Need + Gerund"],
    ["She is the teacher ___ helped me pass the class.", "which", "who", "whom", "whose", 1, "Relative Clauses"],
    ["We'll go for a walk unless it ___.", "rains", "will rain", "doesn't rain", "rained", 0, "Conditionals: Unless"],
    ["Despite ___ tired, he finished the project.", "being", "to be", "of being", "he was", 0, "Linkers of Contrast"],
    ["A: Did you buy the tickets?\nB: Yes, I ___ them yesterday.", "bought", "have bought", "buy", "had bought", 0, "Past Simple vs Present Perfect"],
    ["I usually go to work ___ bus.", "in", "by", "on", "with", 1, "Prepositions of Transport"],
    ["A: Is Maria here?\nB: No, she ___ left.", "yet", "already", "still", "just", 3, "Present Perfect (Just)"],
    ["If you study hard, you ___ the exam.", "would pass", "pass", "will pass", "passed", 2, "First Conditional"],
    ["I want you ___ the truth.", "to tell me", "tell me", "that you tell me", "telling me", 0, "Verb + Object + Infinitive"],
    ["The house ___ built in 1990.", "has been", "was", "is", "were", 1, "Passive Voice (Past)"],
    ["You don't need to bring an umbrella; it ___ rain.", "mustn't", "isn't going to", "don't", "doesn't", 1, "Future Predictions"],
    ["I enjoy ___ new languages.", "to learn", "learning", "learn", "learned", 1, "Verbs followed by Gerunds"],
    ["I don't understand. Can you explain ___?", "me the rule", "to me the rule", "the rule to me", "the rule me", 2, "Verb Patterns (Explain)"],
    ["He hasn't finished the report ___.", "already", "still", "yet", "just", 2, "Present Perfect: Yet"],
    ["I ___ my keys. I can't find them anywhere.", "lost", "have lost", "lose", "am losing", 1, "Present Perfect: Recent Past"],
    ["A: I am so tired.\nB: You ___ go to bed early tonight.", "ought", "should", "must to", "have", 1, "Modals of Advice"],
    ["She asked me ___ I wanted to go.", "if", "that", "what", "where", 0, "Reported Speech"],
    ["That's the hospital ___ my mother works.", "which", "that", "where", "who", 2, "Relative Clauses"],
    ["I'm not used to ___ up so early.", "wake", "waking", "woke", "woken", 1, "Be used to + Gerund"],
    ["They made me ___ for two hours.", "to wait", "wait", "waiting", "waited", 1, "Make + Bare Infinitive"]
  ],
B2: [
    ["If you hadn't helped me, I ___ failed.", "would", "will have", "would have", "had", 2, "Third Conditional"],
    ["A: Your hair looks great!\nB: Thanks, I ___ yesterday.", "cut it", "had it cut", "have it cut", "cut myself", 1, "Causative Verbs"],
    ["I'd rather you ___ smoke in here.", "don't", "didn't", "won't", "not", 1, "Would Rather + Past Simple"],
    ["A: I'm freezing!\nB: You ___ worn a coat.", "must have", "should have", "could have", "would have", 1, "Past Modals of Advice"],
    ["It was ___ a difficult exam that many failed.", "so", "such", "too", "very", 1, "So vs Such"],
    ["By this time next year, I ___ my degree.", "will finish", "am finishing", "will have finished", "finish", 2, "Future Perfect"],
    ["A: Why did you stop?\nB: I stopped ___ my shoe.", "tying", "to tie", "tie", "tied", 1, "Stop + Infinitive (Purpose)"],
    ["They wouldn't let me ___ the building.", "enter", "to enter", "entering", "entered", 0, "Let + Bare Infinitive"],
    ["The more you practice, ___ you will become.", "the best", "better", "the better", "more better", 2, "Double Comparatives"],
    ["I recommend ___ a doctor.", "to see", "see", "seeing", "that you seeing", 2, "Recommend + Gerund"],
    ["He apologized for ___ so late.", "be", "being", "been", "having", 1, "Prepositions + Gerunds"],
    ["A: Did she pass the test?\nB: She ___, but I'm not sure.", "must have", "might have", "can have", "should have", 1, "Past Modals of Deduction"],
    ["He speaks as if he ___ an expert.", "is", "was", "were", "has been", 2, "As if + Subjunctive/Past"],
    ["It's high time you ___ a job.", "get", "got", "getting", "have got", 1, "It's time + Past Simple"],
    ["If only I ___ more time for my hobbies.", "have", "had", "will have", "have had", 1, "If Only + Past (Regret)"],
    ["A: Have you seen John?\nB: He ___ left; his coat is still here.", "mustn't have", "can't have", "shouldn't have", "might not have", 1, "Past Modals of Deduction (Negative)"],
    ["He was accused ___ stealing the documents.", "for", "with", "of", "about", 2, "Dependent Prepositions"],
    ["I regret ___ you that your application was denied.", "informing", "to inform", "inform", "informed", 1, "Gerunds vs Infinitives (Change in Meaning)"],
    ["The project is bound ___ successful.", "be", "being", "to be", "been", 2, "Expressions of Certainty"],
    ["A: Look at the time!\nB: We'd better ___ going.", "to be", "be", "get", "getting", 2, "Had better + Bare Infinitive"],
    ["___ he worked hard, he failed.", "Despite", "Although", "In spite of", "However", 1, "Conjunctions of Concession"],
    ["He failed the test, ___ surprised me.", "what", "which", "that", "who", 1, "Relative Clauses (Which)"],
    ["She cries very easily when watching movies. She is very ___.", "sensible", "sympathetic", "sensitive", "sensational", 2, "False Friends (Sensible/Sensitive)"],
    ["Do you remember ___ this movie before?", "to see", "see", "seeing", "saw", 2, "Remember + Gerund (Memory)"],
    ["I wish I ___ more money.", "have", "had", "would have", "will have", 1, "Wish + Past Simple"],
    ["He warned me ___ the red button.", "not touching", "don't touch", "not to touch", "no touching", 2, "Reported Speech (Commands)"],
    ["I'm not used ___ up so early.", "getting", "to get", "to getting", "get", 2, "Be used to + Gerund"],
    ["Suppose you ___ the meeting early, what would happen?", "leave", "left", "have left", "leaving", 1, "Unreal Past (Suppose)"],
    ["She is believed ___ the country.", "to leave", "leaving", "to have left", "having left", 2, "Perfect Infinitive"],
    ["By the time you arrive, we ___ dinner.", "finish", "will finish", "will have finished", "are finishing", 2, "Future Perfect in Time Clauses"],
    ["He was made ___ the fine.", "pay", "paying", "to pay", "paid", 2, "Passive with Make"],
    ["Try ___ the router; that might fix the issue.", "to restart", "restart", "restarting", "restarted", 2, "Try + Gerund (Experiment)"],
    ["A: Did he succeed?\nB: Yes, he succeeded ___ passing the exam.", "to pass", "in passing", "on passing", "passing", 1, "Verb + Preposition + Gerund"],
    ["Not only ___ late, but he also forgot the rings.", "he was", "was he", "did he be", "he is", 1, "Negative Inversion"],
    ["I didn't mean ___ you.", "to hurt", "hurting", "hurt", "to hurting", 0, "Verb Patterns (Mean)"]
  ],
  C1: [
    ["It is imperative that she ___ present at the meeting.", "is", "be", "was", "were", 1, "The Subjunctive Mood"],
    ["But for your assistance, we ___.", "would fail", "had failed", "would have failed", "will fail", 2, "Implied Conditionals (But for)"],
    ["He has a ___ knowledge of quantum physics.", "profound", "steep", "heavy", "thick", 0, "Advanced Collocations"],
    ["The politician managed to ___ the difficult questions.", "dodge", "flee", "shirk", "stray", 0, "Advanced Vocabulary: Nuance"],
    ["She took ___ to his casual remarks about her work.", "offense", "umbrage", "insult", "resentment", 1, "Advanced Idioms (Take umbrage)"],
    ["His argument was so ___ that everyone agreed instantly.", "cogent", "bland", "spurious", "tenuous", 0, "Advanced Adjectives"],
    ["The success of the project hinges ___ her approval.", "in", "with", "on", "about", 2, "Dependent Prepositions"],
    ["It's a ___ conclusion that they will win the championship.", "foregone", "past", "certain", "done", 0, "Idiomatic Expressions"],
    ["She has a knack ___ making people feel comfortable.", "in", "with", "for", "about", 2, "Noun + Preposition Collocations"],
    ["The company is on the ___ of collapse.", "verge", "edge", "brink", "margin", 2, "Advanced Prepositional Phrases"],
    ["He was caught ___ reading confidential emails.", "red-handed", "black-handed", "white-handed", "blue-handed", 0, "Idioms"],
    ["The new policy will be implemented across the ___.", "board", "table", "desk", "room", 0, "Idioms"],
    ["We need to nip this problem in the ___.", "bud", "flower", "root", "seed", 0, "Idioms"],
    ["She's a very ___ reader, devouring three books a week.", "voracious", "tenacious", "spacious", "audacious", 0, "Advanced Adjectives"],
    ["His explanation was completely ___; I couldn't understand a word.", "lucid", "baffling", "transparent", "coherent", 1, "Advanced Vocabulary: Meaning"],
    ["The rumor spread like ___ through the office.", "wildfire", "water", "wind", "disease", 0, "Similes and Idioms"],
    ["He's always blowing his own ___, boasting about his achievements.", "trumpet", "flute", "drum", "piano", 0, "Idioms"],
    ["We must ___ out the root cause of this systemic failure.", "ferret", "badger", "weasel", "hound", 0, "Advanced Phrasal Verbs"],
    ["Scarcely ___ the house when it started to rain.", "I had left", "had I left", "I left", "did I leave", 1, "Negative Inversion"],
    ["Not only ___ the exam, but she got the highest score.", "she passed", "did she pass", "passed she", "she did pass", 1, "Negative Inversion"],
    ["___ of what he says, I still don't trust him.", "Regardless", "Provided", "Despite", "Although", 0, "Prepositional Phrases"],
    ["They decided to ___ the issue until the next meeting.", "shelve", "chair", "desk", "floor", 0, "Advanced Phrasal/Idiomatic Verbs"],
    ["Only when he apologized ___ him.", "I forgave", "did I forgive", "I did forgive", "forgave I", 1, "Inversion after Only"],
    ["On no account ___ the red button.", "you must press", "must you press", "you press", "press you", 1, "Negative Inversion (On no account)"],
    ["Try as he ___, he couldn't open the jar.", "could", "might", "would", "should", 1, "Concessive Clauses (Try as...)"],
    ["___ had she sat down than the phone rang.", "Hardly", "Barely", "No sooner", "Scarcely", 2, "Inversion (No sooner... than)"],
    ["It's of ___ importance that you arrive on time.", "paramount", "heavy", "deep", "strong", 0, "Advanced Collocations"],
    ["The new law has ___ widespread criticism.", "sparked", "jumped", "made", "pulled", 0, "Advanced Collocations"],
    ["She was ___ the impression that it was free.", "in", "with", "under", "on", 2, "Prepositional Phrases"],
    ["You can't just ___ your responsibilities.", "shirk", "drop", "lose", "fall", 0, "Advanced Vocabulary"],
    ["We need to completely ___ the system.", "overhaul", "overtake", "overdo", "oversee", 0, "Advanced Vocabulary"],
    ["He's prone ___ exaggeration.", "for", "with", "to", "in", 2, "Adjective + Preposition"],
    ["It goes without ___ that we are grateful.", "saying", "speaking", "telling", "talking", 0, "Idiomatic Expressions"],
    ["The project was fraught ___ difficulties.", "of", "with", "in", "about", 1, "Adjective + Preposition"],
    ["By dint ___ hard work, she succeeded.", "of", "with", "for", "in", 0, "Advanced Prepositional Phrases"]
  ]
};

// --- CORE LOGIC ---
const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MAX_QUESTIONS = 30; 

export default function PlacementExam() {
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
            const docId = `${safeName}_${Date.now()}`;
            
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
        const topic = currentQuestionTuple[6] || "General Vocabulary";
        
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
                        <h1 className="text-4xl font-black tracking-tight mb-2">Placement Exam</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-widest mb-8">English Level Assessment</p>
                        
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
                                    // 🔥 THE FIX: Using the question text in the key forces React to render a fresh, unhighlighted button
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
                                    <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">Grammar to Review</span>
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
