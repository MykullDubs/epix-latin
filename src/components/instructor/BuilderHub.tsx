// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect } from 'react';
import { 
  Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap, Map, 
  Wrench, Search, Loader2, Volume2, AlertCircle 
} from 'lucide-react';
import { JuicyToast } from '../Toast';
import CardBuilderView from './CardBuilderView';
import LessonBuilderView from './LessonBuilderView';
import ExamBuilderView from './ExamBuilderView';
import ArcadeBuilderView from './ArcadeBuilderView';
import CurriculumBuilderView from './CurriculumBuilderView';
import LivePreview from '../LivePreview';

// ============================================================================
//  SUB-COMPONENT: PHONETIC ENGINE DRAWER
// ============================================================================
const PhoneticEngine = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [word, setWord] = useState('');
    const [ipa, setIpa] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPhonetics = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        setIsLoading(true);
        setError(null);
        setIpa(null);
        setAudioUrl(null);

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error("Word not found in global database.");
            
            const data = await response.json();
            const phonetics = data[0]?.phonetics || [];
            const textEntry = phonetics.find((p: any) => p.text);
            const audioEntry = phonetics.find((p: any) => p.audio && p.audio.length > 0);

            const finalIpa = textEntry?.text || data[0]?.phonetic;

            if (finalIpa) {
                setIpa(finalIpa);
                if (audioEntry) setAudioUrl(audioEntry.audio);
            } else {
                setError("IPA transcription unavailable.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    return (
        <div className={`absolute top-24 right-0 bottom-0 w-full md:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-40 transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Volume2 size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Phonetic Engine</h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-colors">
                    <X size={16} strokeWidth={3} />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <form onSubmit={fetchPhonetics} className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder="Target word..."
                        className="w-full pl-12 pr-24 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-800 dark:text-white font-bold transition-all shadow-inner text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !word.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-colors shadow-md"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Scan'}
                    </button>
                </form>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl animate-in fade-in mb-6">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                    </div>
                )}

                {ipa && (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] animate-in zoom-in-95 duration-300 relative overflow-hidden group shadow-inner">
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">IPA Output</span>
                        <h2 className="text-3xl font-mono font-medium text-indigo-600 dark:text-indigo-400 tracking-widest mb-6">
                            {ipa}
                        </h2>
                        
                        {audioUrl && (
                            <button 
                                onClick={playAudio}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm"
                            >
                                <Volume2 size={14} /> Play Pronunciation
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN BUILDER HUB
// ============================================================================
export default function BuilderHub({ 
  onSaveCard, 
  onUpdateCard, 
  onDeleteCard, 
  onSaveLesson,
  onSaveCurriculum, 
  allDecks, 
  onPublishDeck,       
  instructorClasses,    
  lessons, 
  curriculums, 
  initialMode, 
  onClearMode 
}: any) {
  const [lessonData, setLessonData] = useState<any>({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
  const [mode, setMode] = useState<'card' | 'lesson' | 'exam' | 'arcade' | 'curriculum'>(initialMode || 'card'); 
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  const modes = [
    { id: 'card', label: 'Scriptorium', icon: <Layers size={18}/>, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { id: 'lesson', label: 'Curriculum', icon: <BookOpen size={18}/>, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'exam', label: 'Assessment', icon: <FileText size={18}/>, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 'arcade', label: 'Arcade', icon: <Gamepad2 size={18}/>, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { id: 'curriculum', label: 'Pathway Map', icon: <Map size={18}/>, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' } 
  ];

  const handleCommit = () => {
    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
    onSaveLesson(payload);
    
    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");

    if (mode === 'lesson') {
        setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
    } else if (mode === 'arcade') {
        setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
    }
  };

  const activeModeConfig = modes.find(m => m.id === mode) || modes[0];

  return ( 
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-500 relative transition-colors duration-300">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}
      
      {/* HEADER */}
      <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${activeModeConfig.bg} ${activeModeConfig.color} hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none`}>
            {activeModeConfig.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{activeModeConfig.label}</h2>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Magister Studio</p>
          </div>
        </div>

        {/* Mobile View Toggles (Hidden when in Curriculum Mode) */}
        {mode !== 'curriculum' && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl md:hidden border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'edit' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'preview' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Eye size={14} /> Preview
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          
          {/* THE NEW TOOLS BUTTON */}
          <button 
             onClick={() => setIsToolsOpen(!isToolsOpen)}
             className={`p-3 rounded-2xl transition-all border ${isToolsOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/50'}`}
             title="Open Phonetic Engine"
          >
             <Wrench size={20} />
          </button>

          {initialMode && (
            <button onClick={onClearMode} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 transition-all border border-slate-200 dark:border-slate-700">
              <X size={20} />
            </button>
          )}
          
          {/* Desktop View Toggles (Hidden when in Curriculum Mode) */}
          {mode !== 'curriculum' && (
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl shrink-0 mr-4">
                <button onClick={() => setViewMode('edit')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'edit' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                    <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                    <Eye size={14} /> Preview
                </button>
            </div>
          )}

          {mode !== 'exam' && mode !== 'curriculum' && (
            <button 
               onClick={handleCommit}
               className={`hidden sm:flex text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'}`}
             >
               Commit {mode === 'arcade' ? 'Game' : 'Unit'}
             </button>
          )}
        </div>
      </header>

      {/* 🔥 THE PHONETIC DRAWER OVERLAY */}
      <PhoneticEngine isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: EDITOR */}
        <div className={`h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-500 ease-in-out ${
          // 🔥 IF CURRICULUM MODE: Force full width. ELSE: respect the preview toggle.
          mode === 'curriculum' 
            ? 'w-full opacity-100' 
            : (viewMode === 'edit' ? 'w-full md:w-1/2 opacity-100' : 'hidden md:block md:w-1/2 opacity-50 grayscale-[50%]')
        }`}>
          <div className={`p-6 md:p-12 mx-auto pb-40 transition-all duration-500 ${mode === 'curriculum' ? 'max-w-5xl' : 'max-w-2xl'}`}>
            
            {/* The Mode Selector */}
            <div className="mb-10 flex flex-wrap bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-fit mx-auto md:mx-0 gap-1 border border-slate-200 dark:border-slate-800">
              {modes.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as any);
                    if (m.id === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
                    if (m.id === 'lesson') setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
                  }} 
                  className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === m.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg scale-105 border border-slate-100 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {m.id}
                </button>
              ))}
            </div>

            {/* The Content Renderers */}
            <div className="animate-in fade-in slide-in-from-bottom-4">
              {mode === 'card' && (
                <CardBuilderView 
                    onSaveCard={onSaveCard} 
                    onUpdateCard={onUpdateCard} 
                    onDeleteCard={onDeleteCard} 
                    availableDecks={allDecks} 
                    onPublishDeck={onPublishDeck}            
                    instructorClasses={instructorClasses}   
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

              {mode === 'curriculum' && (
                <div className="-mx-2 md:-mx-8">
                   <CurriculumBuilderView 
                      availableLessons={lessons} 
                      onSaveCurriculum={onSaveCurriculum} 
                      classes={instructorClasses} 
                      curriculums={curriculums}   
                   />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW (Hidden in Curriculum Mode) */}
        {mode !== 'curriculum' && (
            <div className={`h-full bg-slate-100 dark:bg-slate-950/50 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-500 ${
              viewMode === 'preview' ? 'flex w-full md:w-1/2' : 'hidden md:flex md:w-1/2'
            }`}>
              <div className="relative w-full h-full max-w-sm max-h-[750px] group flex flex-col items-center justify-center">
                
                {mode === 'exam' && (
                    <div className="w-full max-w-xs aspect-[9/16] bg-white dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
                        <FileText size={64} className="text-slate-200 dark:text-slate-700 mb-6" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Exam Preview</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Assessments are rendered dynamically in the student's isolated testing environment.</p>
                    </div>
                )}

                {mode === 'arcade' && (
                    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 dark:border-black animate-in zoom-in-95 duration-500 relative">
                        <div className="absolute inset-0 bg-amber-500/10 z-0" />
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                            <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner dark:shadow-none border border-amber-200 dark:border-amber-500/30 rotate-12">
                                <Gamepad2 size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                                {lessonData.title || "Untitled Game"}
                            </h3>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/80 dark:bg-slate-950/80 px-4 py-2 rounded-full mb-8 border border-slate-100 dark:border-slate-800">
                                Template: {lessonData.gameTemplate?.replace('-', ' ') || 'None'}
                            </p>
                            
                            <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-left space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mode</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lessonData.mode === 'pvc' ? 'vs CPU' : 'Pass & Play'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Win Goal</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lessonData.targetScore || 3} Points</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vocab Ammo</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lessonData.deckIds?.length || 0} Decks</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(mode === 'lesson' || mode === 'card') && (
                    <>
                        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-2xl rounded-[4rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <div className="relative h-full w-full animate-in zoom-in-95 duration-500 shadow-2xl rounded-[3rem] border-[12px] border-slate-900 dark:border-black overflow-hidden">
                          <LivePreview data={lessonData} />
                        </div>
                    </>
                )}

                {mode !== 'exam' && mode !== 'curriculum' && (
                    <button 
                        onClick={handleCommit}
                        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl md:hidden flex items-center gap-3 active:scale-90 transition-all ${mode === 'arcade' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-indigo-600 shadow-indigo-500/40'}`}
                    >
                        <Zap size={16} className={mode === 'arcade' ? 'text-white' : 'text-indigo-200'} /> Commit to Library
                    </button>
                )}
              </div>
            </div>
        )}
      </div>

      {/* MOBILE/TABLET FOOTER (Hidden in Curriculum Mode) */}
      {mode !== 'curriculum' && (
          <div className={`md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
            viewMode === 'edit' ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
          }`}>
            <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-700 px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full animate-pulse ${activeModeConfig.color.replace('text-', 'bg-')}`} />
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Editing: {mode}</p>
            </div>
          </div>
      )}
    </div> 
  );
}
