// src/components/IPATranslator.tsx
import React, { useState } from 'react';
import { Search, Loader2, Volume2, AlertCircle } from 'lucide-react';

export default function IPATranslator() {
    const [word, setWord] = useState('');
    const [ipa, setIpa] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPhonetics = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        setIsLoading(true);
        setError(null);
        setIpa(null);
        setAudioUrl(null);

        try {
            // Hit the free Dictionary API
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            
            if (!response.ok) {
                throw new Error("Word not found in the database.");
            }
            
            const data = await response.json();
            
            // The API payload structure can vary slightly. We need to hunt for the text and audio.
            const phonetics = data[0]?.phonetics || [];
            
            // Find the first phonetic entry that actually has the IPA text
            const textEntry = phonetics.find((p: any) => p.text);
            // Find the first phonetic entry that has an audio file
            const audioEntry = phonetics.find((p: any) => p.audio && p.audio.length > 0);

            const finalIpa = textEntry?.text || data[0]?.phonetic;

            if (finalIpa) {
                setIpa(finalIpa);
                if (audioEntry) setAudioUrl(audioEntry.audio);
            } else {
                setError("IPA transcription unavailable for this exact word.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-xl transition-colors duration-300">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Volume2 size={16} className="text-indigo-500" /> Phonetic Engine
            </h3>

            <form onSubmit={fetchPhonetics} className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Enter an English word..."
                    className="w-full pl-12 pr-24 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white font-bold transition-all shadow-inner"
                />
                <button 
                    type="submit"
                    disabled={isLoading || !word.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-colors shadow-md"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Scan'}
                </button>
            </form>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl animate-in fade-in">
                    <AlertCircle size={18} />
                    <span className="text-xs font-bold">{error}</span>
                </div>
            )}

            {ipa && (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">IPA Output</span>
                    <h2 className="text-4xl font-mono font-medium text-slate-800 dark:text-white tracking-widest">
                        {ipa}
                    </h2>
                    
                    {audioUrl && (
                        <button 
                            onClick={playAudio}
                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all active:scale-95"
                        >
                            <Volume2 size={16} /> Play Audio
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
