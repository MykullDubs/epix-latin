import React from 'react';
import { Trophy, Medal, Crown, Zap, Flame, Heart } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getInitials } from '../utils/profileHelpers';

// --- REUSABLE AVATAR SUB-COMPONENT ---
const UserAvatar = ({ user, size = "md", isMe = false }: any) => {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-14 h-14 text-lg",
        xl: "w-20 h-20 text-xl"
    };

    // The leaderboard ranking objects usually have avatarUrl directly or nested
    const avatarUrl = user?.avatarUrl || user?.profile?.main?.avatarUrl;
    const initials = getInitials(user?.name || "S");

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[30%] overflow-hidden flex items-center justify-center font-black transition-all shadow-md ${
                avatarUrl ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
            } ${isMe ? 'ring-2 ring-indigo-600 ring-offset-2' : 'border-2 border-white'}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {/* Status dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
    );
};

export default function LeaderboardView({ studentEmails, currentUserEmail }: any) {
    const { rankings, loading } = useLeaderboard(studentEmails);

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <div className="text-center text-slate-400 font-black text-xs uppercase tracking-widest">Calculating rankings...</div>
        </div>
    );

    const topThree = rankings.slice(0, 3);
    const theRest = rankings.slice(3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            
            {/* 1. THE PODIUM */}
            <div className="flex items-end justify-center gap-2 px-2 pt-10 pb-4">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
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
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[125px] -translate-y-6">
                        <Crown size={28} className="text-yellow-500 fill-yellow-500 animate-bounce mb-1" />
                        <div className="relative">
                            <UserAvatar user={topThree[0]} size="xl" isMe={topThree[0].email === currentUserEmail} />
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg">
                                <Trophy size={14}/>
                            </div>
                        </div>
                        <div className="w-full h-28 bg-indigo-600 rounded-t-[2rem] flex flex-col items-center justify-center shadow-2xl border-x border-t border-indigo-400 relative overflow-hidden">
                            {/* Inner glow effect */}
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
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
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

            {/* 2. THE RANKING LIST */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mx-2">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Global Rankings</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">{rankings.length} Active</span>
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
                                        {isMe && <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">You</span>}
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
        </div>
    );
}

// Add this to your lucide-react imports if Loader2 is missing
import { Loader2, ChevronRight } from 'lucide-react';
