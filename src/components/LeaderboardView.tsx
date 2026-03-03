import React from 'react';
import { Trophy, Medal, Crown, Zap, Flame } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
export default function LeaderboardView({ studentEmails, currentUserEmail }: any) {
    const { rankings, loading } = useLeaderboard(studentEmails);

    if (loading) return <div className="p-12 text-center animate-pulse text-slate-400 font-bold">Calculating rankings...</div>;

    const topThree = rankings.slice(0, 3);
    const theRest = rankings.slice(3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. THE PODIUM */}
            <div className="flex items-end justify-center gap-2 px-2 pt-10 pb-4">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
                        <div className="w-12 h-12 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center text-slate-500 font-black relative">
                            {topThree[1].name?.[0] || 'S'}
                            <div className="absolute -top-2 -right-2 bg-slate-400 text-white p-1 rounded-full border-2 border-white"><Medal size={10}/></div>
                        </div>
                        <div className="w-full h-16 bg-slate-200 rounded-t-2xl flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] font-black text-slate-500 uppercase">2nd</span>
                            <span className="text-xs font-black text-slate-700 truncate w-full text-center px-1">{topThree[1].name?.split(' ')[0]}</span>
                        </div>
                    </div>
                )}

                {/* 1st Place (The King) */}
                {topThree[0] && (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px] -translate-y-4">
                        <Crown size={24} className="text-yellow-500 fill-yellow-500 animate-bounce mb-1" />
                        <div className="w-16 h-16 rounded-full bg-indigo-500 border-4 border-white shadow-2xl flex items-center justify-center text-white text-xl font-black relative">
                            {topThree[0].name?.[0] || 'S'}
                        </div>
                        <div className="w-full h-24 bg-indigo-600 rounded-t-2xl flex flex-col items-center justify-center shadow-lg border-x border-t border-indigo-400">
                            <span className="text-xs font-black text-indigo-200 uppercase tracking-widest">1st</span>
                            <span className="text-sm font-black text-white truncate w-full text-center px-1">{topThree[0].name?.split(' ')[0]}</span>
                            <div className="flex items-center gap-1 text-[10px] text-yellow-300 font-black mt-1"><Zap size={10} fill="currentColor"/> {topThree[0].xp}</div>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
                        <div className="w-12 h-12 rounded-full bg-orange-100 border-4 border-white shadow-lg flex items-center justify-center text-orange-600 font-black relative">
                            {topThree[2].name?.[0] || 'S'}
                            <div className="absolute -top-2 -right-2 bg-orange-400 text-white p-1 rounded-full border-2 border-white"><Medal size={10}/></div>
                        </div>
                        <div className="w-full h-12 bg-orange-100 rounded-t-2xl flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] font-black text-orange-500 uppercase">3rd</span>
                            <span className="text-xs font-black text-orange-700 truncate w-full text-center px-1">{topThree[2].name?.split(' ')[0]}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. THE RANKING LIST */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Full Rankings</h3>
                    <span className="text-[10px] font-bold text-slate-400">{rankings.length} Students Active</span>
                </div>
                
                <div className="divide-y divide-slate-50">
                    {rankings.map((student: any, idx: number) => {
                        const isMe = student.email === currentUserEmail;
                        return (
                            <div key={student.uid} className={`flex items-center gap-4 p-5 transition-colors ${isMe ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                <span className={`w-6 text-sm font-black ${idx < 3 ? 'text-indigo-500' : 'text-slate-300'}`}>{idx + 1}</span>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 ${isMe ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {student.name?.[0] || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`block font-black text-sm truncate ${isMe ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {student.name || 'Anonymous Student'} {isMe && '(You)'}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Zap size={10} className="text-yellow-500" /> {student.xp || 0} XP</span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Flame size={10} className="text-orange-500" /> {student.streak || 0} Day Streak</span>
                                    </div>
                                </div>
                                {idx === 0 && <Trophy size={20} className="text-yellow-500" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
