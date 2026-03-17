// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect } from 'react';
import { Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap } from 'lucide-react';
import { JuicyToast } from '../Toast';
import CardBuilderView from './CardBuilderView';
import LessonBuilderView from './LessonBuilderView';
import ExamBuilderView from './ExamBuilderView';
import ArcadeBuilderView from './ArcadeBuilderView';
import LivePreview from '../LivePreview';

export default function BuilderHub({ 
  onSaveCard, 
  onUpdateCard, 
  onDeleteCard, 
  onSaveLesson, 
  allDecks, 
  onPublishDeck,       
  instructorClasses,    
  lessons, 
  initialMode, 
  onClearMode 
}: any) {
  const [lessonData, setLessonData] = useState<any>({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
  const [mode, setMode] = useState<'card' | 'lesson' | 'exam' | 'arcade'>(initialMode || 'card'); 
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  const modes = [
    { id: 'card', label: 'Scriptorium', icon: <Layers size={18}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'lesson', label: 'Curriculum', icon: <BookOpen size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'exam', label: 'Assessment', icon: <FileText size={18}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'arcade', label: 'Arcade', icon: <Gamepad2 size={18}/>, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  const handleCommit = () => {
    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
    onSaveLesson(payload);
    
    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");

    // Reset state for next entry
    if (mode === 'lesson') {
        setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
    } else if (mode === 'arcade') {
        setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
    }
  };

  const activeModeConfig = modes.find(m => m.id === mode) || modes[0];

  return ( 
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden select-none animate-in fade-in duration-500">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* HEADER */}
      <header className="h-24 bg-white border-b border-slate-200 px-6 md:px-10 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${activeModeConfig.bg} ${activeModeConfig.color} hidden sm:flex transition-colors`}>
            {activeModeConfig.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{activeModeConfig.label}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Magister Studio</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl md:hidden border border-slate-200">
          <button 
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'
            }`}
          >
            <Edit3 size={14} /> Edit
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'
            }`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          {initialMode && (
            <button onClick={onClearMode} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">
              <X size={20} />
            </button>
          )}
          
          {mode !== 'exam' && (
            <button 
               onClick={handleCommit}
               className={`hidden sm:flex text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-slate-900 hover:bg-slate-800'}`}
             >
               Commit {mode === 'arcade' ? 'Game' : 'Unit'}
             </button>
          )}
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: EDITOR */}
        <div className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out ${
          viewMode === 'edit' ? 'w-full md:w-1/2 opacity-100' : 'hidden md:block md:w-1/2 opacity-50 grayscale-[50%]'
        }`}>
          <div className="p-6 md:p-12 max-w-2xl mx-auto pb-40">
            
            <div className="mb-10 flex flex-wrap bg-slate-200/50 p-1.5 rounded-[2rem] w-fit mx-auto md:mx-0 gap-1">
              {modes.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as any);
                    if (m.id === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
                    if (m.id === 'lesson') setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
                  }} 
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === m.id ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m.id}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4">
              {mode === 'card' && (
                <CardBuilderView 
                    onSaveCard={onSaveCard} 
                    onUpdateCard={onUpdateCard} 
                    onDeleteCard={onDeleteCard} 
                    availableDecks={allDecks} 
                    onPublishDeck={onPublishDeck}           // 🔥 Added missing prop
                    instructorClasses={instructorClasses}   // 🔥 Added missing prop
                />
              )}
              
              {mode === 'lesson' && (
                <LessonBuilderView 
                    data={lessonData} 
                    setData={setLessonData} 
                />
              )}
              
              {mode === 'exam' && (
                <div className="-mx-6 md:-mx-12">
                   <ExamBuilderView 
                      onSave={(examObj: any) => { 
                          onSaveLesson(examObj); 
                          setToastMsg("Assessment Successfully Built! 🎯"); 
                      }} 
                   />
                </div>
              )}
              
              {mode === 'arcade' && (
                <ArcadeBuilderView 
                    data={lessonData} 
                    setData={setLessonData} 
                    availableDecks={allDecks} 
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW */}
        <div className={`h-full bg-slate-100 border-l border-slate-200 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-500 ${
          viewMode === 'preview' ? 'flex w-full md:w-1/2' : 'hidden md:flex md:w-1/2'
        }`}>
          <div className="relative w-full h-full max-w-sm max-h-[750px] group flex flex-col items-center justify-center">
            
            {mode === 'exam' && (
                <div className="w-full max-w-xs aspect-[9/16] bg-white border-4 border-dashed border-slate-200 rounded-[3rem] shadow-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
                    <FileText size={64} className="text-slate-200 mb-6" />
                    <h3 className="text-lg font-black text-slate-800 mb-2">Exam Preview</h3>
                    <p className="text-sm font-bold text-slate-400">Assessments are rendered dynamically in the student's isolated testing environment.</p>
                </div>
            )}

            {mode === 'arcade' && (
                <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 animate-in zoom-in-95 duration-500 relative">
                    <div className="absolute inset-0 bg-amber-500/10 z-0" />
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner rotate-12">
                            <Gamepad2 size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
                            {lessonData.title || "Untitled Game"}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/80 px-4 py-2 rounded-full mb-8">
                            Template: {lessonData.gameTemplate?.replace('-', ' ') || 'None'}
                        </p>
                        
                        <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 text-left space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.mode === 'pvc' ? 'vs CPU' : 'Pass & Play'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Win Goal</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.targetScore || 3} Points</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vocab Ammo</span>
                                <span className="text-sm font-bold text-slate-700">{lessonData.deckIds?.length || 0} Decks</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(mode === 'lesson' || mode === 'card') && (
                <>
                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-2xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="relative h-full w-full animate-in zoom-in-95 duration-500">
                      <LivePreview data={lessonData} />
                    </div>
                </>
            )}

            {mode !== 'exam' && (
                <button 
                    onClick={handleCommit}
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl md:hidden flex items-center gap-3 active:scale-90 transition-all ${mode === 'arcade' ? 'bg-amber-500' : 'bg-slate-900'}`}
                >
                    <Zap size={16} className={mode === 'arcade' ? 'text-white' : 'text-yellow-400'} /> Commit to Library
                </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE/TABLET FOOTER */}
      <div className={`md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 transition-all duration-500 ${
        viewMode === 'edit' ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}>
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className={`w-1 h-4 rounded-full animate-pulse ${activeModeConfig.color.replace('text-', 'bg-')}`} />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editing Mode: {mode}</p>
        </div>
      </div>
    </div> 
  );
}
