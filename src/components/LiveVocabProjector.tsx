// src/components/LiveVocabProjector.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLiveClass } from '../hooks/useLiveClass';
import { Users, CheckCircle2, Zap, ArrowRight, X } from 'lucide-react';

export default function LiveVocabProjector({ deck, classId, activeOrg, onExit }: any) {
    // We pass 'true' to useLiveClass to indicate this is the Instructor/Broadcaster
    const { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz } = useLiveClass(classId, true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // DYNAMIC QUIZ GENERATOR
    const quizQuestions = useMemo(() => {
        if (!deck?.cards || deck.cards.length === 0) return [];
        
        // Shuffle the deck for a unique run every time
        const shuffledDeck = [...deck.cards].sort(() => 0.5 - Math.random());
        
        return shuffledDeck.map((card) => {
            // Grab up to 3 random distractors from the rest of the deck
            const distractors = deck.cards
                .filter((c: any) => c.id !== card.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            
            // Map to standard quiz option format: { id, text }
            const options = [card, ...distractors]
                .map((c: any) => ({ 
                    id: c.id, 
                    text: c.back // In vocab, the 'back' is the definition/answer
                }))
                .sort(() => 0.5 - Math.random()); // Shuffle the ABCD order

            return {
                question: card.front, // The vocab word
                options: options,
                correctId: card.id
            };
        });
    }, [deck]);

    // BROADCAST LIFECYCLE
    useEffect(() => {
        if (quizQuestions.length > 0 && classId) {
            console.log(`🚀 VOCAB PROTOCOL: Broadcasting to Class [${classId}]`);
            // Start the live session with the first generated question
            startLiveClass(deck.id, 'vocab', quizQuestions[0]);
        }

        // Cleanup: Terminate the live session when the teacher closes the projector
        return () => {
            console.log("🛑 VOCAB PROTOCOL: Terminating broadcast");
            endLiveClass();
        };
    }, [classId, deck.id, quizQuestions]); // Reactive dependencies ensure it starts when data is ready

    const handleNext = () => {
        if (currentIndex < quizQuestions.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            // We broadcast the specific question payload so students don't need the whole deck
            changeSlide(nextIdx, quizQuestions[nextIdx]); 
        } else {
            onExit(); // End of the deck, close projector
        }
    };

    const currentQ = quizQuestions[currentIndex];
    const answerCount = liveState?.answers ? Object.keys(liveState.answers).length : 0;

    if (!currentQ) {
        return (
            <div className="h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white font-black animate-pulse">GENERATING TARGETS...</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white font-sans selection:bg-indigo-500 relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80" />
            
            <div className="flex-1 flex items-center justify-center p-12 relative z-10">
                <div className="max-w-5xl w-full bg-slate-900 border-4 border-slate-800 rounded-[4rem] p-16 shadow-2xl text-center animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">
                            Target {currentIndex + 1} of {quizQuestions.length}
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black mb-12 leading-tight tracking-tight text-white uppercase italic">
                        {currentQ.question}
                    </h2>
                    
                    {/* INSTRUCTOR CONTROLS */}
                    <div className="flex flex-col items-center gap-8">
                        {(!liveState?.quizState || liveState?.quizState === 'waiting') && (
                            <button 
                                onClick={() => triggerQuiz('active')}
                                className="group bg-white hover:bg-indigo-500 hover:text-white text-black px-12 py-6 rounded-full font-black text-3xl uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all active:scale-95 flex items-center gap-4"
                            >
                                <Zap size={40} className="group-hover:fill-current" /> Initiate Protocol
                            </button>
                        )}

                        {liveState?.quizState === 'active' && (
                            <div className="space-y-12 animate-in fade-in duration-500 w-full">
                                <div className="flex items-center justify-center gap-6 bg-black/50 px-10 py-8 rounded-[3rem] border-2 border-slate-800 w-fit mx-auto shadow-2xl">
                                    <div className="relative">
                                        <Users size={64} className="text-indigo-400" />
                                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-6xl font-black text-white leading-none">{answerCount}</span>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked In</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => triggerQuiz('revealed')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-full font-black text-2xl uppercase tracking-widest transition-transform active:scale-95 shadow-[0_20px_50px_rgba(79,70,229,0.3)]"
                                >
                                    Reveal Correct Answer
                                </button>
                            </div>
                        )}

                        {liveState?.quizState === 'revealed' && (
                            <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full">
                                <div className="bg-emerald-500 text-white p-12 rounded-[3rem] shadow-[0_0_60px_rgba(16,185,129,0.4)] text-4xl font-black border-4 border-emerald-400 max-w-2xl mb-12">
                                    {currentQ.options.find((o:any) => o.id === currentQ.correctId)?.text}
                                </div>
                                <button 
                                    onClick={handleNext}
                                    className="flex items-center gap-4 text-slate-400 hover:text-white font-black text-2xl uppercase tracking-[0.2em] transition-all hover:gap-6"
                                >
                                    {currentIndex < quizQuestions.length - 1 ? 'Next Target' : 'Protocol Complete'} <ArrowRight size={32} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Exit Button */}
            <button 
                onClick={onExit}
                className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2"
            >
                <X size={32} />
            </button>
        </div>
    );
}
