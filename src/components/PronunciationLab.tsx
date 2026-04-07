// src/components/PronunciationLab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Ear, Mic, Activity, Wind, Info, CheckCircle2, XCircle } from 'lucide-react';

// Master Phonetic Data Dictionary
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

const GENERIC_DATA = { symbol: '?', type: 'Phoneme', articulation: 'Variable', voicing: 'Variable', mechanicDesc: 'General articulation based on surrounding context.' };

export default function PronunciationLab({ block }: any) {
    const targetPhonemes = block?.targetPhonemes || ['i', 'ɪ'];
    const minimalPairs = block?.pairs || [];

    const [activePhoneme, setActivePhoneme] = useState<string>(targetPhonemes[0] || 'i');
    const [activePairId, setActivePairId] = useState<number | null>(null);
    
    const [isListening, setIsListening] = useState(false);
    const [targetWord, setTargetWord] = useState<string | null>(null);
    const [speechResult, setSpeechResult] = useState<'success' | 'fail' | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const recognitionRef = useRef<any>(null);

    const data = MASTER_PHONEME_DATA[activePhoneme] || { ...GENERIC_DATA, symbol: activePhoneme };

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
        <div className="w-full max-w-6xl mx-auto bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto my-8 font-sans">
            
            {/* LEFT PANE: Minimal Pairs & IPA Selection */}
            <div className="w-full md:w-[420px] bg-slate-900/50 p-8 flex flex-col border-r border-slate-800 shrink-0">
                
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={16} /> Target Phonemes
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-8">
                    {targetPhonemes.map((p: string) => (
                        <button 
                            key={p} 
                            onClick={() => { setActivePhoneme(p); setActivePairId(null); setSpeechResult(null); }}
                            className={`px-5 py-3 rounded-2xl text-xl font-black transition-all border-2 ${activePhoneme === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                        >
                            /{p}/
                        </button>
                    ))}
                </div>

                <div className="h-px w-full bg-slate-800 mb-8" />

                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Ear size={16} /> Minimal Pairs Validation
                </h3>
                
                <div className="space-y-4 overflow-y-auto max-h-[50vh] custom-scrollbar pr-2">
                    {minimalPairs.length === 0 && (
                        <div className="text-slate-500 text-xs font-bold text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                            No minimal pairs configured.
                        </div>
                    )}
                    {minimalPairs.map((pair: any) => {
                        const isActive = activePairId === pair.id;
                        return (
                            <div 
                                key={pair.id}
                                className={`w-full p-5 rounded-[2rem] flex flex-col gap-4 transition-all border-2 cursor-pointer ${isActive ? 'bg-slate-900 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                                onClick={() => !isActive && setActivePairId(pair.id)}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left truncate pr-2">{pair.focus}</span>
                                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)] shrink-0" />}
                                </div>
                                
                                <div className="flex justify-between items-center w-full gap-3">
                                    {/* Left Word Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startListening(pair.w1); setActivePhoneme(pair.p1); }}
                                        className={`flex-1 py-4 px-2 rounded-[1.25rem] flex flex-col items-center gap-1 transition-all border-2 active:scale-95 ${targetWord === pair.w1 && isListening ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10'}`}
                                    >
                                        <span className="font-mono text-[10px] font-bold text-indigo-400 mb-1">/{pair.p1}/</span>
                                        <span className="font-black text-lg leading-none truncate w-full">{pair.w1}</span>
                                        {targetWord === pair.w1 && speechResult === 'success' && <CheckCircle2 size={16} className="text-emerald-500 mt-2" />}
                                    </button>

                                    <span className="text-slate-600 text-[10px] italic font-serif">vs</span>

                                    {/* Right Word Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startListening(pair.w2); setActivePhoneme(pair.p2); }}
                                        className={`flex-1 py-4 px-2 rounded-[1.25rem] flex flex-col items-center gap-1 transition-all border-2 active:scale-95 ${targetWord === pair.w2 && isListening ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10'}`}
                                    >
                                        <span className="font-mono text-[10px] font-bold text-indigo-400 mb-1">/{pair.p2}/</span>
                                        <span className="font-black text-lg leading-none truncate w-full">{pair.w2}</span>
                                        {targetWord === pair.w2 && speechResult === 'success' && <CheckCircle2 size={16} className="text-emerald-500 mt-2" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT PANE: Mouth Mechanics Visualizer */}
            <div className="flex-1 p-8 md:p-12 flex flex-col relative bg-slate-950 overflow-hidden">
                
                {/* Header Info */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <span className="text-[10px] font-black px-3 py-1.5 bg-slate-800 text-indigo-300 rounded-lg uppercase tracking-widest border border-slate-700">
                                {data.type}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${data.voicing === 'Voiced' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {data.voicing}
                            </span>
                        </div>
                        <h2 className="text-6xl font-black text-white mb-2 tracking-tighter">/{data.symbol}/</h2>
                        <p className="text-indigo-400 font-bold text-lg tracking-wide">{data.articulation}</p>
                    </div>
                    
                    <button 
                        onClick={() => handlePlayAudio(targetWord || "Please select a word")}
                        disabled={!targetWord}
                        className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[1.5rem] flex items-center justify-center transition-transform active:scale-95 shadow-[0_10px_30px_rgba(79,102,241,0.3)] disabled:shadow-none border border-indigo-400/50 disabled:border-transparent"
                    >
                        <Volume2 size={28} />
                    </button>
                </div>

                {/* Simulated Mouth Mechanics UI */}
                <div className="flex-1 flex flex-col items-center justify-center relative my-8">
                    <div className={`relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center transition-transform duration-500 ${isListening ? 'scale-105' : ''}`}>
                        {/* Base Rings */}
                        <div className={`absolute inset-0 border-4 rounded-full transition-colors duration-500 ${isListening ? 'border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.2)]' : 'border-slate-800'}`} />
                        <div className={`absolute inset-6 border-[3px] border-dashed rounded-full transition-all duration-1000 ${data.voicing === 'Voiced' ? 'border-amber-500/50 animate-[spin_6s_linear_infinite]' : 'border-slate-800'}`} />
                        <div className="absolute inset-16 border-2 border-slate-800/50 rounded-full" />
                        
                        {/* Dynamic Hotspots based on articulation */}
                        {data.articulation.includes('Dental') && <div className="absolute top-6 w-16 h-16 bg-rose-500/20 border-2 border-rose-500 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse flex items-center justify-center text-[10px] font-black text-rose-300 uppercase tracking-widest backdrop-blur-sm">Teeth</div>}
                        {data.articulation.includes('Labial') && <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-16 h-16 bg-blue-500/20 border-2 border-blue-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-pulse flex items-center justify-center text-[10px] font-black text-blue-300 uppercase tracking-widest backdrop-blur-sm">Lips</div>}
                        {data.articulation.includes('Front') && <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse flex items-center justify-center text-[10px] font-black text-emerald-300 uppercase tracking-widest backdrop-blur-sm">Front</div>}
                        {data.articulation.includes('Alveolar') && <div className="absolute top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-indigo-500/20 border-2 border-indigo-500 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)] animate-pulse flex items-center justify-center text-[10px] font-black text-indigo-300 uppercase tracking-widest backdrop-blur-sm">Ridge</div>}
                        {data.articulation.includes('Velar') && <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-fuchsia-500/20 border-2 border-fuchsia-500 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.4)] animate-pulse flex items-center justify-center text-[10px] font-black text-fuchsia-300 uppercase tracking-widest backdrop-blur-sm">Velum</div>}
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Wind size={64} className={`transition-all duration-500 ${(data.type === 'Fricative' || data.type === 'Affricate') ? 'text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'opacity-10'}`} />
                        </div>
                    </div>
                </div>

                {/* Telemetry Dashboard */}
                <div className="h-20 mb-8 flex items-center justify-center z-10 w-full relative">
                    {isListening ? (
                        <div className="flex items-center justify-center gap-4 text-rose-400 font-black tracking-widest uppercase text-sm animate-pulse bg-rose-500/10 w-full py-5 rounded-2xl border border-rose-500/30">
                            <Mic size={20} className="animate-bounce" /> Listening for "{targetWord}"...
                        </div>
                    ) : speechResult ? (
                        <div className={`flex items-center justify-center gap-4 font-black tracking-widest uppercase text-sm w-full py-5 rounded-2xl border ${speechResult === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                            {speechResult === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />} 
                            {speechResult === 'success' ? 'Pronunciation Verified' : `Heard "${transcript}" instead`}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4 text-slate-500 font-bold tracking-widest uppercase text-xs w-full py-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                            Select a word and speak to test pronunciation
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative z-10 mt-auto">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={16} className="text-indigo-500" /> Articulation Mechanics
                    </h4>
                    <p className="text-slate-300 text-lg leading-relaxed font-medium">
                        {data.mechanicDesc}
                    </p>
                </div>
            </div>
        </div>
    );
}
