// src/components/GuestJoinLobby.tsx
import React, { useState } from 'react';
import { getAuth, signInAnonymously, updateProfile } from 'firebase/auth';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function GuestJoinLobby({ classId, onCancel }: { classId: string, onCancel: () => void }) {
    const [nickname, setNickname] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;
        
        setIsJoining(true);
        const auth = getAuth();
        
        try {
            // 1. Create the invisible ghost account
            const userCredential = await signInAnonymously(auth);
            
            // 2. Attach the student's typed name to this session
            await updateProfile(userCredential.user, {
                displayName: nickname.trim()
            });

            // Note: Once this succeeds, the global App.tsx `user` state will update.
            // App.tsx will automatically re-render, bypass the !user block, 
            // and drop them into the activeStudentClass.
            
        } catch (err: any) {
            console.error("Ghost Auth Failed:", err);
            setError("Failed to connect to the arena. Try again.");
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <Sparkles size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Live Arena</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Join the Game</h1>
                    <p className="text-slate-400 text-sm font-medium">No account needed. Just enter a nickname.</p>
                </div>

                <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g. Maverick"
                        maxLength={12}
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                        autoFocus
                    />
                    
                    {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={!nickname.trim() || isJoining}
                        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isJoining ? 'Connecting...' : 'Enter Arena'} <ArrowRight size={16} />
                    </button>
                </form>

                <button 
                    onClick={onCancel}
                    className="w-full mt-6 text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
