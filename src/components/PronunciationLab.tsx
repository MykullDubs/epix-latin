// src/components/PronunciationLab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Ear, Mic, Activity, Wind, Info, CheckCircle2, XCircle } from 'lucide-react';

// Master Phonetic Data Dictionary
// This provides the mouth mechanics and meta-data for the visualizer.
const MASTER_PHONEME_DATA: Record<string, any> = {
    'i': { symbol: 'i', type: 'Vowel', articulation: 'High Front Unrounded', voicing: 'Voiced', mechanicDesc: 'Tongue is high and pushed forward. Lips are spread into a smile.' },
    'ɪ': { symbol: 'ɪ', type: 'Vowel', articulation: 'High-Mid Front Unrounded', voicing: 'Voiced', mechanicDesc: 'Tongue is slightly lower and more relaxed than /i/. Lips are relaxed.' },
    'eɪ': { symbol: 'eɪ', type: 'Diphthong', articulation: 'Mid-Front to High-Front', voicing: 'Voiced', mechanicDesc: 'Starts mid-front and glides up to a high-front position. Lips slightly spread.' },
    'ɛ': { symbol: 'ɛ', type: 'Vowel', articulation: 'Low-Mid Front Unrounded', voicing: 'Voiced', mechanicDesc: 'Tongue is mid-low and forward. Jaw drops slightly.' },
    'æ': { symbol: 'æ', type: 'Vowel', articulation: 'Low Front Unrounded', voicing: 'Voiced', mechanicDesc: 'Tongue is flat and forward. Jaw drops significantly.' },
    'u': { symbol: 'u', type: 'Vowel', articulation: 'High Back Rounded', voicing: 'Voiced', mechanicDesc: 'Tongue is high and pulled back. Lips are tightly rounded.' },
    'ʊ': { symbol: 'ʊ', type: 'Vowel', articulation: 'High-Mid Back Rounded', voicing: 'Voiced', mechanicDesc: 'Tongue is slightly lower than /u/. Lips are loosely rounded.' },
    'oʊ': { symbol: 'oʊ', type: 'Diphthong', articulation: 'Mid-Back to High-Back', voicing: 'Voiced', mechanicDesc: 'Starts mid-back and glides up to a rounded high-back position.' },
    'ɔ': { symbol: 'ɔ', type: 'Vowel', articulation: 'Low-Mid Back Rounded', voicing: 'Voiced', mechanicDesc: 'Tongue is mid-low and pulled back. Lips are flared.' },
    'ɑ': { symbol: 'ɑ', type: 'Vowel', articulation: 'Low Back Unrounded', voicing: 'Voiced', mechanicDesc: 'Tongue is flat and pulled back. Jaw drops significantly.' },
    'ə': { symbol: 'ə', type: 'Vowel', articulation: 'Mid Central', voicing: 'Voiced', mechanicDesc: 'The Schwa. Tongue and jaw are completely relaxed in a neutral position.' },
    'ʌ': { symbol: 'ʌ', type: 'Vowel', articulation: 'Mid-Low Central', voicing: 'Voiced', mechanicDesc: 'Tongue is slightly lower than the schwa, slightly pushed back.' },
    'p': { symbol: 'p', type: 'Consonant', articulation: 'Bilabial Plosive', voicing: 'Voiceless', mechanicDesc: 'Lips press together to build pressure, then release a puff of air.' },
    'b': { symbol: 'b', type: 'Consonant', articulation: 'Bilabial Plosive', voicing: 'Voiced', mechanicDesc: 'Lips are pressed firmly together to block airflow, then released with vocal cord vibration.' },
    't': { symbol: 't', type: 'Consonant', articulation: 'Alveolar Plosive', voicing: 'Voiceless', mechanicDesc: 'Tongue tip taps the alveolar ridge (behind top teeth), releasing air.' },
    'd': { symbol: 'd', type: 'Consonant', articulation: 'Alveolar Plosive', voicing: 'Voiced', mechanicDesc: 'Tongue tip taps the alveolar ridge while vocal cords vibrate.' },
    'k': { symbol: 'k', type: 'Consonant', articulation: 'Velar Plosive', voicing: 'Voiceless', mechanicDesc: 'Back of the tongue presses against the soft palate, releasing air.' },
    'g': { symbol: 'g', type: 'Consonant', articulation: 'Velar Plosive', voicing: 'Voiced', mechanicDesc: 'Back of the tongue presses against the soft palate with vocal cord vibration.' },
    'f': { symbol: 'f', type: 'Consonant', articulation: 'Labiodental Fricative', voicing: 'Voiceless', mechanicDesc: 'Top teeth lightly rest on the bottom lip. Air is forced through.' },
    'v': { symbol: 'v', type: 'Consonant', articulation: 'Labiodental Fricative', voicing: 'Voiced', mechanicDesc: 'Top teeth lightly rest on the bottom lip. Air is forced through with vocal cord vibration.' },
    'θ': { symbol: 'θ', type: 'Consonant', articulation: 'Dental Fricative', voicing: 'Voiceless', mechanicDesc: 'Tip of the tongue is placed just between or behind the front teeth. Continuous airflow.' },
    'ð': { symbol: 'ð', type: 'Consonant', articulation: 'Dental Fricative', voicing: 'Voiced', mechanicDesc: 'Same tongue placement as /θ/ (between teeth), but vocal cords vibrate.' },
    's': { symbol: 's', type: 'Consonant', articulation: 'Alveolar Fricative', voicing: 'Voiceless', mechanicDesc: 'Tongue tip approaches alveolar ridge. Air hisses through the narrow gap.' },
    'z': { symbol: 'z', type: 'Consonant', articulation: 'Alveolar Fricative', voicing: 'Voiced', mechanicDesc: 'Tongue tip approaches alveolar ridge. Air hisses through while vocal cords vibrate.' },
    'ʃ': { symbol: 'ʃ', type: 'Consonant', articulation: 'Palato-Alveolar Fricative', voicing: 'Voiceless', mechanicDesc: 'Tongue blade raised towards hard palate. Lips slightly flared. "Shhh" sound.' },
    'ʒ': { symbol: 'ʒ', type: 'Consonant', articulation: 'Palato-Alveolar Fricative', voicing: 'Voiced', mechanicDesc: 'Same position as /ʃ/, but vocal cords vibrate. Found in "measure".' },
    'tʃ': { symbol: 'tʃ', type: 'Consonant', articulation: 'Palato-Alveolar Affricate', voicing: 'Voiceless', mechanicDesc: 'Begins as /t/ stopping air, releases into the /ʃ/ friction. Found in "catch".' },
    'dʒ': { symbol: 'dʒ', type: 'Consonant', articulation: 'Palato-Alveolar Affricate', voicing: 'Voiced', mechanicDesc: 'Begins as /d/ stopping air, releases into the /ʒ/ friction. Found in "judge".' },
};

// Generic fallback for unknown phonemes
const GENERIC_DATA = { symbol: '?', type: 'Phoneme', articulation: 'Variable', voicing: 'Variable', mechanicDesc: 'General articulation based on surrounding context.' };

export default function PronunciationLab({ block }: any) {
    // 🔥 Extract dynamic data from the Builder
    const targetPhonemes = block?.targetPhonemes || ['i', 'ɪ'];
    const minimalPairs = block?.pairs || [];

    const [activePhoneme, setActivePhoneme] = useState<string>(targetPhonemes[0] || 'i');
    const [activePairId, setActivePairId] = useState<number | null>(null);
    
    // Voice Engine State
    const [isListening, setIsListening] = useState(false);
    const [targetWord, setTargetWord] = useState<string | null>(null);
    const [speechResult, setSpeechResult] = useState<'success' | 'fail' | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const recognitionRef = useRef<any>(null);

    const data = MASTER_PHONEME_DATA[activePhoneme] || { ...GENERIC_DATA, symbol: activePhoneme };

    // Initialize Web Speech API
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const spokenWord = event.results[0][0].transcript.toLowerCase().trim().replace(/[.,!?]/g, '');
                setTranscript(spokenWord);
                
                // Target Matching Logic
                if (targetWord && spokenWord === targetWord.toLowerCase()) {
                    setSpeechResult('success');
                } else {
                    setSpeechResult('fail');
                }
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setSpeechResult('fail');
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [targetWord]);

    const handlePlayAudio = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const startListening = (word: string) => {
        if (!recognitionRef.current) return alert("Speech recognition not supported in this browser. Please use Chrome or Safari.");
        setTargetWord(word);
        setSpeechResult(null);
        setTranscript('');
        setIsListening(true);
        recognitionRef.current.start();
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto my-8 font-sans">
            
            {/* LEFT PANE: Minimal Pairs & IPA Selection */}
            <div className="w-full md:w-[400px] bg-slate-950 p-6 md:p-8 flex flex-col border-r border-slate-800 shrink-0">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={16} /> Target Phonemes
                </h3>
                
                {/* Dynamically mapped from Studio Builder */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {targetPhonemes.map((p: string) => (
                        <button 
                            key={p} 
                            onClick={() => { setActivePhoneme(p); setActivePairId(null); setSpeechResult(null); }}
                            className={`px-5 py-4 rounded-2xl text-2xl font-bold transition-all ${activePhoneme === p ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'}`}
                        >
                            /{p}/
                        </button>
                    ))}
                </div>

                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2 mt-auto">
                    <Ear size={16} /> Minimal Pairs Practice
                </h3>
                
                {/* Dynamically mapped from Studio Builder */}
                <div className="space-y-4 overflow-y-auto max-h-[50vh] custom-scrollbar pr-2">
                    {minimalPairs.length === 0 && (
                        <div className="text-slate-500 text-xs font-bold text-center py-8">
                            No minimal pairs configured.
                        </div>
                    )}
                    {minimalPairs.map((pair: any) => {
                        const isActive = activePairId === pair.id;
                        return (
                            <div 
                                key={pair.id}
                                className={`w-full p-4 rounded-2xl flex flex-col gap-3 transition-all border ${isActive ? 'bg-emerald-900/20 border-emerald-500/50 shadow-inner' : 'bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-600'}`}
                                onClick={() => !isActive && setActivePairId(pair.id)}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left truncate pr-2">{pair.focus}</span>
                                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                                </div>
                                
                                <div className="flex justify-between items-center w-full gap-2">
                                    {/* Left Word Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startListening(pair.w1); setActivePhoneme(pair.p1); }}
                                        className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all border-2 active:scale-95 ${targetWord === pair.w1 && isListening ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-400'}`}
                                    >
                                        <span className="font-mono text-xs opacity-50">/{pair.p1}/</span>
                                        <span className="font-bold text-lg leading-none truncate w-full">{pair.w1}</span>
                                        {targetWord === pair.w1 && speechResult === 'success' && <CheckCircle2 size={16} className="text-emerald-500 mt-1" />}
                                    </button>

                                    <span className="text-slate-600 text-[10px] italic px-1">vs</span>

                                    {/* Right Word Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startListening(pair.w2); setActivePhoneme(pair.p2); }}
                                        className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all border-2 active:scale-95 ${targetWord === pair.w2 && isListening ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-400'}`}
                                    >
                                        <span className="font-mono text-xs opacity-50">/{pair.p2}/</span>
                                        <span className="font-bold text-lg leading-none truncate w-full">{pair.w2}</span>
                                        {targetWord === pair.w2 && speechResult === 'success' && <CheckCircle2 size={16} className="text-emerald-500 mt-1" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANE: Mouth Mechanics Visualizer */}
            <div className="flex-1 p-8 md:p-12 flex flex-col relative bg-slate-900 overflow-hidden">
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <div className="text-[10px] font-black px-3 py-1 bg-slate-800 text-slate-400 rounded-full inline-block uppercase tracking-widest mb-3">
                            {data.type} • {data.voicing}
                        </div>
                        <h2 className="text-5xl font-black text-white mb-2">/{data.symbol}/</h2>
                        <p className="text-indigo-400 font-bold text-lg">{data.articulation}</p>
                    </div>
                    {/* The Target Word Audio playback */}
                    <button 
                        onClick={() => handlePlayAudio(targetWord || "Please select a word")}
                        disabled={!targetWord}
                        className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg"
                    >
                        <Volume2 size={28} />
                    </button>
                </div>

                {/* 🔥 The Live Telemetry Dashboard */}
                <div className="h-16 mb-4 flex items-center justify-center z-10">
                    {isListening ? (
                        <div className="flex items-center gap-4 text-rose-500 font-black tracking-widest uppercase text-sm animate-pulse bg-rose-500/10 px-6 py-3 rounded-full border border-rose-500/30">
                            <Mic size={18} /> Listening for "{targetWord}"...
                        </div>
                    ) : speechResult ? (
                        <div className={`flex items-center gap-4 font-black tracking-widest uppercase text-sm px-6 py-3 rounded-full border ${speechResult === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                            {speechResult === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />} 
                            {speechResult === 'success' ? 'Pronunciation Verified' : `Heard "${transcript}" instead`}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-slate-500 font-bold tracking-widest uppercase text-xs">
                            Select a word and speak to test pronunciation
                        </div>
                    )}
                </div>

                {/* Simulated Mouth Mechanics UI */}
                <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                    <div className={`relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transition-transform duration-300 ${isListening ? 'scale-105' : ''}`}>
                        <div className={`absolute inset-0 border-4 rounded-full transition-colors duration-300 ${isListening ? 'border-rose-500/50 shadow-[0_0_50px_rgba(244,63,94,0.3)]' : 'border-slate-800'}`} />
                        <div className={`absolute inset-4 border-2 border-dashed rounded-full transition-all duration-1000 ${data.voicing === 'Voiced' ? 'border-amber-500 animate-[spin_4s_linear_infinite]' : 'border-slate-700'}`} />
                        
                        {/* Dynamic Hotspots based on articulation */}
                        {data.articulation.includes('Dental') && <div className="absolute top-4 w-12 h-12 bg-rose-500 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse flex items-center justify-center text-[10px] font-black text-white">Teeth</div>}
                        {data.articulation.includes('Labial') && <div className="absolute top-1/2 -translate-y-1/2 -left-6 w-12 h-12 bg-blue-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse flex items-center justify-center text-[10px] font-black text-white">Lips</div>}
                        {data.articulation.includes('Front') && <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-emerald-500 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-pulse flex items-center justify-center text-[10px] font-black text-white">Front</div>}
                        {data.articulation.includes('Alveolar') && <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-500 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse flex items-center justify-center text-[10px] font-black text-white">Ridge</div>}
                        {data.articulation.includes('Velar') && <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-fuchsia-500 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.6)] animate-pulse flex items-center justify-center text-[10px] font-black text-white">Velum</div>}
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Wind size={48} className={(data.type === 'Fricative' || data.type === 'Affricate') ? 'text-cyan-400 animate-pulse' : 'opacity-20'} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl relative z-10 mt-auto backdrop-blur-md">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info size={14} /> Articulation Mechanics
                    </h4>
                    <p className="text-slate-200 text-lg leading-relaxed font-medium">
                        {data.mechanicDesc}
                    </p>
                </div>
            </div>
        </div>
    );
}
