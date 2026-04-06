// src/components/GuestPlayScreen.tsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase'; // 🔥 FIXED: Path corrected to go up only one level
import { Gamepad2, Zap, User, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export default function GuestPlayScreen({ classId }: { classId: string }) {
    const [nickname, setNickname] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [guestId, setGuestId] = useState<string>('');
    const [liveState, setLiveState] = useState<any>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // 1. Generate or retrieve a temporary Guest ID from local storage
    useEffect(() => {
        let storedId = localStorage.getItem('magister_guest_id');
        if (!storedId) {
            storedId = `guest_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('magister_guest_id', storedId);
        }
        setGuestId(storedId);
    }, []);

    // 2. Listen to the Live Session from the Projector
    useEffect(() => {
        if (!classId) return;
        const unsub = onSnapshot(doc(db, 'live_sessions', classId), (doc) => {
            if (doc.exists()) {
                setLiveState(doc.data());
            } else {
                setLiveState({ status: 'offline' });
            }
        });
        return () => unsub();
    }, [classId]);

    // Reset local selection when the projector moves to a new block
    useEffect(() => {
        setSelectedAnswer(null);
    }, [liveState?.currentBlockIndex]);

    // 3. Join the Game Arena
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim() || !guestId) return;
        
        setIsConnecting(true);
        try {
            // Register the guest in the live session's player pool
            await setDoc(doc(db, 'live_sessions', classId, 'players', guestId), {
                id: guestId,
                name: nickname.trim(),
                isGuest: true,
                score: 0,
                joinedAt: Date.now(),
                lastActive: Date.now()
            }, { merge: true });
            
            setHasJoined(true);
        } catch (error) {
            console.error("Failed to join arena:", error);
            alert("Connection failed. Please try again.");
        } finally {
            setIsConnecting(false);
        }
    };

    // 4. Send Game/Quiz Input to the Projector
    const submitAnswer = async (answerId: string) => {
        if (selectedAnswer) return; // Prevent double-tapping
        setSelectedAnswer(answerId);
        
        try {
            // Update the live session with the guest's answer
            await setDoc(doc(db, 'live_sessions', classId, 'answers', guestId), {
                playerName: nickname,
                answerId: answerId,
                timestamp: Date.now()
            }, { merge: true });

            // Ping the player's own doc to show they are active
            await updateDoc(doc(db, 'live_sessions', classId, 'players', guestId), {
                lastActive: Date.now()
            });
        } catch (error) {
            console.error("Failed to submit answer:", error);
        }
    };

    // --- VIEW A: OFFLINE / NO SESSION ---
    if (liveState?.status === 'offline') {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white p-6 font-sans text-center">
                <ShieldAlert size={64} className="text-slate-600 mb-6" />
                <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Arena Offline</h1>
                <p className="text-slate-400 font-bold max-w-xs">The instructor has not initialized a live session for this room code.</p>
            </div>
        );
    }

    // --- VIEW B: GUEST LOBBY (Enter Nickname) ---
    if (!hasJoined) {
        return (
            <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500">
                <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
                    <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8 rotate-12">
                        <Gamepad2 size={40} />
                    </div>
                    
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 text-center">Join Arena</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-10 text-center">Live Interactive Session</p>

                    <form onSubmit={handleJoin} className="w-full bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                                <User size={14} /> Player Nickname
                            </label>
                            <input 
                                type="text" 
                                autoFocus
                                required
                                maxLength={15}
                                placeholder="e.g. SpeedDemon99" 
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-5 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-inner"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isConnecting || !nickname.trim()}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isConnecting ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />} 
                            {isConnecting ? 'Connecting...' : 'Enter Game'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- VIEW C: THE MOBILE CONTROLLER ---
    
    // Check if the current block is a quiz/question
    const isQuizActive = liveState?.quizState === 'active';
    const isWaitingForHost = !liveState?.quizState || liveState?.quizState === 'waiting' || liveState?.quizState === 'revealed';

    return (
        <div className="min-h-[100dvh] flex flex-col bg-slate-950 text-white font-sans">
            <header className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                        <User size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Player</span>
                        <span className="font-bold text-sm tracking-wide">{nickname}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Connected</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 items-center justify-center">
                {isWaitingForHost ? (
                    <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                            <Loader2 size={40} className="text-indigo-500 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Eyes on the Board</h2>
                        <p className="text-slate-400 font-bold max-w-xs text-sm leading-relaxed">Waiting for the instructor to launch the next interactive protocol...</p>
                    </div>
                ) : isQuizActive && !selectedAnswer ? (
                    <div className="w-full max-w-sm flex flex-col h-full animate-in slide-in-from-bottom-8 duration-300">
                        <div className="text-center mb-8 shrink-0 mt-auto">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-indigo-400">Lock In!</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Select your answer quickly</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-auto">
                            {/* Standard 4-button A/B/C/D Layout */}
                            {[
                                { id: 'a', color: 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/40 border-rose-400' },
                                { id: 'b', color: 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/40 border-blue-400' },
                                { id: 'c', color: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/40 border-amber-400' },
                                { id: 'd', color: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/40 border-emerald-400' }
                            ].map((btn) => (
                                <button 
                                    key={btn.id}
                                    onClick={() => submitAnswer(btn.id)}
                                    className={`aspect-square rounded-[2rem] flex items-center justify-center text-5xl font-black uppercase shadow-xl border-t-[6px] active:border-t-0 active:translate-y-[6px] transition-all ${btn.color}`}
                                >
                                    {btn.id}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-emerald-500/20 border-4 border-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 size={48} className="text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Answer Locked</h2>
                        <p className="text-slate-400 font-bold max-w-xs text-sm leading-relaxed">Wait for the instructor to reveal the correct answer on the main screen.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
