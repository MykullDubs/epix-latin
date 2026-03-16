// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, CheckCircle2, Zap, ArrowRight, X } from 'lucide-react';

export default function LiveVocabProjector({ deck, classId, activeOrg, onExit }: any) {
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // DYNAMIC QUIZ GENERATOR
    const quizQuestions = useMemo(() => {
        if (!deck?.cards) return [];
        // Shuffle the deck
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        
        return shuffledDeck.map((card) => {
            // Grab 3 random distractors from the rest of the deck
            const distractors = deck.cards
                .filter((c: any) => c.id !== card.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            
            // Mix the correct answer with the distractors
            const options = [card, ...distractors]
                .map((c: any) => ({ id: c.id, text: c.back }))
                .sort(() => 0.5 - Math.random()); // Shuffle options

            return {
                question: card.front,
                options: options,
                correctId: card.id
            };
        });
    }, [deck]);

    // Mount & Unmount
    useEffect(() => {
        if (quizQuestions.length > 0) {
            startLiveClass(deck.id, 'vocab', quizQuestions[0]);
        }
        return () => { endLiveClass(); };
    }, []);

    const handleNext = () => {
        if (currentIndex < quizQuestions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            changeSlide(nextIdx, quizQuestions[nextIdx]); // Broadcast next question!
        } else {
            onExit(); // End of deck
        }
    };

    const currentQ = quizQuestions[currentIndex];
    const answerCount = Object.keys(liveState?.answers || {}).length;

    if (!currentQ) return null;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans selection:bg-indigo-500 relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />
            
            <div className="flex-1 flex items-center justify-center p-12 relative z-10">
                <div className="max-w-5xl w-full bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center animate-in zoom-in-95 duration-500">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] block mb-6">Target {currentIndex + 1} of {quizQuestions.length}</span>
                    <h2 className="text-5xl md:text-7xl font-black mb-12 leading-tight tracking-tight text-white">{currentQ.question}</h2>
                    
                    {liveState?.quizState === 'waiting' && (
                        <button 
                            onClick={() => triggerQuiz('active')}
                            className="bg-white hover:bg-slate-200 text-black px-12 py-6 rounded-full font-black text-3xl uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-transform active:scale-95 flex items-center gap-4 mx-auto"
                        >
                            <Zap size={40} fill="currentColor" /> Initiate Protocol
                        </button>
                    )}

                    {liveState?.quizState === 'active' && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <div className="flex items-center justify-center gap-6 bg-black/50 px-10 py-6 rounded-[2rem] border border-slate-700 w-fit mx-auto text-5xl font-black text-slate-300">
                                <Users size={56} className="animate-pulse text-white" /> 
                                <span>{answerCount} Locked In</span>
                            </div>
                            <button 
                                onClick={() => triggerQuiz('revealed')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-black text-2xl uppercase tracking-widest transition-transform active:scale-95 shadow-xl mx-auto"
                            >
                                Reveal Answer
                            </button>
                        </div>
                    )}

                    {liveState?.quizState === 'revealed' && (
                        <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                            <div className="bg-emerald-500 text-white p-10 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] text-4xl font-bold border-4 border-emerald-400 min-w-[50%] mb-12">
                                {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                            </div>
                            <button 
                                onClick={handleNext}
                                className="flex items-center gap-3 text-slate-400 hover:text-white font-black text-xl uppercase tracking-widest transition-colors"
                            >
                                {currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Finish Run'} <ArrowRight size={28} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
