// src/components/HomeView.tsx
import React, { useRef } from 'react';
import { GraduationCap, Globe, Flame, Zap, Trophy, School, Layers, Feather } from 'lucide-react';

export default function HomeView({ setActiveTab, classes, onSelectClass, userData, user, activeOrg }: any) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  // Calculate Stats
  const xp = userData?.xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const progress = ((xp % 1000) / 1000) * 100;
  const streak = userData?.streak || 1;
  const targetLang = userData?.targetLanguage || "English";

  // Dynamic Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = userData?.name?.split(' ')[0] || "Scholar";

  // --- DYNAMIC BRANDING ---
  const themeColor = activeOrg?.themeColor || '#4f46e5'; // Defaults to Indigo-600
  const themeName = activeOrg?.name || 'LLLMS';

  return (
    <div className="h-full flex flex-col bg-slate-50">
        
        {/* 1. DYNAMIC APP BAR */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                {activeOrg?.logoUrl ? (
                    <img src={activeOrg.logoUrl} alt="Organization Logo" className="w-8 h-8 object-contain rounded-md" />
                ) : (
                    <div className="text-white p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: themeColor }}>
                        <GraduationCap size={18} strokeWidth={3}/>
                    </div>
                )}
                <span className="font-black tracking-tighter text-lg truncate max-w-[150px]" style={{ color: themeColor }}>
                    {themeName}
                </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-1.5 shrink-0">
                <Globe size={14} className="text-slate-400"/>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{targetLang}</span>
            </div>
        </div>

        <div ref={scrollViewportRef} className="flex-1 overflow-y-auto custom-scrollbar pb-32">
            
            {/* 2. HERO SECTION */}
            <div className="bg-white pt-6 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-medium text-slate-400 tracking-tight">{greeting},</h1>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">{firstName}.</h1>
                </div>

                {/* STATS BENTO (Colorized by Brand) */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                        <Flame size={20} className="text-orange-500 mb-1 fill-orange-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{streak}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Day Streak</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                        <Zap size={20} className="text-yellow-500 mb-1 fill-yellow-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{xp}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                        <Trophy size={20} className="text-emerald-500 mb-1 fill-emerald-500"/>
                        <span className="text-lg font-black" style={{ color: themeColor }}>{level}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Level</span>
                    </div>
                </div>

                {/* PROGRESS BAR (Colorized by Brand) */}
                <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full transition-all duration-1000" 
                            style={{ width: `${progress}%`, backgroundColor: themeColor }}
                        />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{Math.round(1000 - (xp % 1000))} XP to Level Up</span>
                </div>
            </div>

            <div className="px-6 space-y-8 mt-8">
              
              {/* 3. CLASSES SECTION */}
              {classes && classes.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-4 ml-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">My Classes</h3>
                    </div>
                    
                    <div className="flex gap-5 overflow-x-auto pb-8 -mx-6 px-6 custom-scrollbar snap-x pt-2">
                        {classes.map((cls: any, index: number) => { 
                            const pendingCount = (cls.assignments || []).length;
                            // Keeping the varied gradients so classes look distinct from one another
                            const gradients = ["from-indigo-600 to-violet-600", "from-emerald-500 to-teal-600", "from-orange-500 to-rose-600"];
                            const themeGradient = gradients[index % gradients.length];

                            return ( 
                                <button key={cls.id} onClick={() => onSelectClass(cls)} className="snap-start min-w-[280px] h-[180px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden flex flex-col text-left">
                                    <div className={`h-24 w-full bg-gradient-to-r ${themeGradient} relative p-5 flex justify-between items-start`}>
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm">{cls.name.charAt(0)}</div>
                                        {pendingCount > 0 && (
                                            <div className="bg-white text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                              {pendingCount} Assigned
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 relative">
                                        <h4 className="font-black text-slate-800 text-xl truncate leading-tight transition-colors" style={{ color: themeColor }}>{cls.name}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{cls.code}</span>
                                        </div>
                                    </div>
                                </button> 
                            ); 
                        })}
                    </div>
                </div>
              ) : (
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <School size={32} className="mx-auto text-slate-300 mb-2"/>
                    <p className="text-sm text-slate-400 font-bold">No classes joined yet.</p>
                 </div>
              )}

              {/* 4. ACTION CARDS */}
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <button 
                    onClick={() => setActiveTab('flashcards')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg group text-left transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform rotate-12 group-hover:scale-125 transition-transform duration-700"><Layers size={100} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white"><Layers size={20} /></div>
                        <div><h3 className="text-white font-black text-xl mb-1 leading-none">Vocab Gym</h3><p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Practice</p></div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTab('create')} 
                    className="relative h-40 rounded-[2rem] overflow-hidden shadow-lg group text-left transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute -right-4 -bottom-4 text-white opacity-20 transform -rotate-12 group-hover:scale-125 transition-transform duration-700"><Feather size={100} /></div>
                    <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white"><Feather size={20} /></div>
                        <div><h3 className="text-white font-black text-xl mb-1 leading-none">Studio</h3><p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider">Creator</p></div>
                    </div>
                </button>
              </div>

            </div>
        </div>
    </div>
  );
}
