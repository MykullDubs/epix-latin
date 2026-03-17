import React, { useState } from 'react';
import { Trophy, Medal, Crown, Zap, Flame, Heart, Loader2, ChevronRight, Globe, Users } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useGlobalLeaderboard } from '../hooks/useGlobalLeaderboard';
import { getInitials } from '../utils/profileHelpers';

// --- REUSABLE AVATAR SUB-COMPONENT ---
const UserAvatar = ({ user, size = "md", isMe = false }: any) => {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-14 h-14 text-lg",
        xl: "w-20 h-20 text-xl"
    };

    // Safely extract avatar or generate initials
    const avatarUrl = user?.avatarUrl || user?.profile?.main?.avatarUrl;
    const safeName = user?.name || "Scholar";
    const initials = getInitials ? getInitials(safeName) : safeName[0].toUpperCase();

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[30%] overflow-hidden flex items-center justify-center font-black transition-all shadow-md ${
                avatarUrl ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
            } ${isMe ? 'ring-4 ring-indigo-600 ring-offset-2' : 'border-2 border-white'}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={safeName} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {/* Status dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
        </div>
    );
};

export default function LeaderboardView({ studentEmails, currentUserEmail }: any) {
    // 🔥 THE NEW SCOPE TOGGLE
    const [scope, setScope] = useState<'class' | 'global'>('class');

    // Fetch both datasets (Firebase handles caching, so this is fast)
    const { rankings: classRankings, loading: classLoading } = useLeaderboard(studentEmails);
    const { rankings: globalRankings, loading: globalLoading } = useGlobalLeaderboard(50); // Top 50 Globally

    // Determine which dataset to show based on the toggle
    const rankings = scope === 'class' ? classRankings : globalRankings;
    const loading = scope === 'class' ? classLoading : globalLoading;

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <div className="text-center text-slate-400 font-black text-xs uppercase tracking-widest">Compiling rankings...</div>
        </div>
    );

    const topThree = rankings.slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-lg mx-auto">
            
            {/* 1. THE SCOPE TOGGLE */}
            <div className="flex gap-2 p-2 bg-slate-200/50 rounded-2xl mx-4 mt-6 shadow-inner">
                <button 
                    onClick={() => setScope('class')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${scope === 'class' ? 'bg-white shadow-md text-indigo-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Users size={16} /> My Cohort
                </button>
                <button 
                    onClick={() => setScope('global')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${scope === 'global' ? 'bg-white shadow-md text-indigo-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Globe size={16} /> Global Rank
                </button>
            </div>

            {/* 2. THE PODIUM */}
            {rankings.length > 0 ? (
                <div className="flex items-end justify-center gap-2 px-2 pt-6 pb-4">
                    {/* 2nd Place */}
                    {topThree[1] && (
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px] animate-in slide-in-from-bottom-8 duration-500 delay-100">
                            <div className="relative">
                                <UserAvatar user={topThree[1]} size="lg" isMe={topThree[1].email === currentUserEmail} />
                                <div className="absolute -top-2 -right-2 bg-slate-400 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                    <Medal size={12}/>
                                </div>
                            </div>
                            <div className="w-full h-20 bg-slate-200 rounded-t-[1.5rem] flex flex-col items-center justify-center shadow-inner border-x border-t border-slate-300/30">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">2nd</span>
                                <span className="text-[11px] font-black text-slate-700 truncate w-full text-center px-2">{topThree[1].name?.split(' ')[0]}</span>
                                <span className="text-[9px] font-bold text-slate-500">{topThree[1].xp} XP</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place (The King) */}
                    {topThree[0] && (
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-[125px] -translate-y-6 animate-in slide-in-from-bottom-12 duration-500">
                            <Crown size={28} className="text-yellow-500 fill-yellow-500 animate-bounce mb-1 drop-shadow-md" />
                            <div className="relative">
                                <UserAvatar user={topThree[0]} size="xl" isMe={topThree[0].email === currentUserEmail} />
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                                    <Trophy size={14}/>
                                </div>
                            </div>
                            <div className="w-full h-28 bg-indigo-600 rounded-t-[2rem] flex flex-col items-center justify-center shadow-2xl border-x border-t border-indigo-400 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                <span className="text-xs font-black text-indigo-200 uppercase tracking-widest relative z-10">1st</span>
                                <span className="text-sm font-black text-white truncate w-full text-center px-2 relative z-10">{topThree[0].name?.split(' ')[0]}</span>
                                <div className="flex items-center gap-1 text-[11px] text-yellow-300 font-black mt-1 relative z-10">
                                    <Zap size={10} fill="currentColor"/> {topThree[0].xp}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {topThree[2] && (
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px] animate-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="relative">
                                <UserAvatar user={topThree[2]} size="lg" isMe={topThree[2].email === currentUserEmail} />
                                <div className="absolute -top-2 -right-2 bg-orange-400 text-white p-1 rounded-full border-2 border-white shadow-sm">
                                    <Medal size={12}/>
                                </div>
                            </div>
                            <div className="w-full h-16 bg-orange-100 rounded-t-[1.5rem] flex flex-col items-center justify-center shadow-inner border-x border-t border-orange-200/50">
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">3rd</span>
                                <span className="text-[11px] font-black text-orange-700 truncate w-full text-center px-2">{topThree[2].name?.split(' ')[0]}</span>
                                <span className="text-[9px] font-bold text-orange-600/70">{topThree[2].xp} XP</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-12 text-slate-400">
                    <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">No Scholars Ranked</p>
                </div>
            )}

            {/* 3. THE RANKING LIST */}
            {rankings.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mx-2">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">
                            {scope === 'global' ? 'Global Ladder' : 'Cohort Roster'}
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">{rankings.length} Ranked</span>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                        {rankings.map((student: any, idx: number) => {
                            const isMe = student.email === currentUserEmail;
                            return (
                                <div key={student.uid || idx} className={`flex items-center gap-4 p-5 transition-all ${isMe ? 'bg-indigo-50/60' : 'hover:bg-slate-50 active:bg-slate-100'}`}>
                                    <span className={`w-6 text-sm font-black text-center ${idx < 3 ? 'text-indigo-500' : 'text-slate-300'}`}>
                                        {idx + 1}
                                    </span>
                                    
                                    <UserAvatar user={student} size="md" isMe={isMe} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`block font-black text-sm truncate ${isMe ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {student.name || 'Anonymous'} 
                                            </span>
                                            {isMe && <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm">You</span>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <Zap size={10} className="text-yellow-500" fill="currentColor" /> {student.xp || 0}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <Flame size={10} className="text-orange-500" fill="currentColor" /> {student.streak || 0}
                                            </span>
                                            {student.totalLikesReceived > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                                                    <Heart size={10} className="fill-rose-400" /> {student.totalLikesReceived}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {idx === 0 ? (
                                        <Trophy size={20} className="text-yellow-500 drop-shadow-sm" />
                                    ) : (
                                        <ChevronRight size={16} className="text-slate-200" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
