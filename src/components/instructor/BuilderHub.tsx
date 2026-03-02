// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect } from 'react';
import { Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap } from 'lucide-react';
import { JuicyToast } from '../Toast';
import CardBuilderView from './CardBuilderView';
import LessonBuilderView from './LessonBuilderView';
import LivePreview from '../LivePreview';

// Assuming these exist or will be created next
// import ExamBuilderView from './ExamBuilderView';
// import ArcadeBuilderView from './ArcadeBuilderView';

export default function BuilderHub({ onSaveCard, onUpdateCard, onDeleteCard, onSaveLesson, allDecks, lessons, initialMode, onClearMode }: any) {
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
    if (mode === 'lesson') setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
    else if (mode === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
  };

  const activeModeConfig = modes.find(m => m.id === mode) || modes[0];

  return ( 
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden select-none animate-in fade-in duration-500">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      <header className="h-24 bg-white border-b border-slate-200 px-6 md:px-10 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${activeModeConfig.bg} ${activeModeConfig.color} hidden sm:flex`}>{activeModeConfig.icon}</div>
          <div><h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{activeModeConfig.label}</h2><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Magister Studio</p></div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl md:hidden">
          <button onClick={() => setViewMode('edit')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><Edit3 size={14} /> Edit</button>
          <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><Eye size={14} /> Preview</button>
        </div>

        <div className="flex items-center gap-3">
          {initialMode && <button onClick={onClearMode} className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100"><X size={20} /></button>}
          {mode !== 'exam' && <button onClick={handleCommit} className={`hidden sm:flex text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-slate-900 hover:bg-slate-800'}`}>Commit {mode === 'arcade' ? 'Game' : 'Unit'}</button>}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ${viewMode === 'edit' ? 'w-full md:w-1/2' : 'hidden md:block md:w-1/2 opacity-50'}`}>
          <div className="p-6 md:p-12 max-w-2xl mx-auto pb-40">
            <div className="mb-10 flex flex-wrap bg-slate-200/50 p-1.5 rounded-[2rem] gap-1">
              {modes.map((m) => (<button key={m.id} onClick={() => setMode(m.id as any)} className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase ${mode === m.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}>{m.id}</button>))}
            </div>
            {mode === 'card' && <CardBuilderView onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} availableDecks={allDecks} />}
            {mode === 'lesson' && <LessonBuilderView data={lessonData} setData={setLessonData} />}
            {/* Exam and Arcade builders go here */}
          </div>
        </div>

        <div className={`h-full bg-slate-100 border-l border-slate-200 flex flex-col items-center justify-center p-6 md:p-12 transition-all ${viewMode === 'preview' ? 'w-full' : 'hidden md:flex md:w-1/2'}`}>
            <div className="relative w-full h-full max-w-sm max-h-[750px]"><LivePreview data={lessonData} /></div>
        </div>
      </div>
    </div> 
  );
}
