// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect } from 'react';
import { 
  Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap, Map, 
  Wrench, Search, Loader2, Volume2, AlertCircle, ArrowLeft
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
            audio.play().catch(() => {});
        }
    };

    return (
        <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[9000] transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Volume2 size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Phonetic Engine</h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={18} strokeWidth={2.5} />
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
                        className="w-full pl-12 pr-24 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white font-semibold transition-all text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !word.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Scan'}
                    </button>
                </form>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl mb-6">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                    </div>
                )}

                {ipa && (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] animate-in zoom-in-95 duration-300 relative overflow-hidden group">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">IPA Output</span>
                        <h2 className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-8">
                            {ipa}
                        </h2>
                        
                        {audioUrl && (
                            <button 
                                onClick={playAudio}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 shadow-sm"
                            >
                                <Volume2 size={16} /> Play Pronunciation
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
  userData,
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
  onClearMode,
  targetLessonId,     
  clearTargetLesson   
}: any) {
  const [lessonData, setLessonData] = useState<any>({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
  const [mode, setMode] = useState<'card' | 'lesson' | 'exam' | 'arcade' | 'curriculum'>(initialMode || 'card'); 
  
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [triggerAiModal, setTriggerAiModal] = useState(false);

  // Catch intent from Dashboard
  useEffect(() => {
    if (targetLessonId) {
        if (targetLessonId === 'new') {
            setMode('lesson');
            setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
        } 
        else if (targetLessonId === 'generate') {
            setMode('lesson');
            setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
            setTriggerAiModal(true);
        } 
        else {
            const lessonToEdit = lessons.find((l: any) => l.id === targetLessonId);
            if (lessonToEdit) {
                setMode('lesson');
                setLessonData(lessonToEdit);
            }
        }
        if (clearTargetLesson) clearTargetLesson();
    }
  }, [targetLessonId, lessons, clearTargetLesson]);

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  useEffect(() => {
      if (mode !== 'lesson' && mode !== 'card') {
          setIsPreviewActive(false);
      }
  }, [mode]);

  const modes = [
    { id: 'card', label: 'Flashcards', icon: <Layers size={16}/> },
    { id: 'lesson', label: 'Interactive Lesson', icon: <BookOpen size={16}/> },
    { id: 'exam', label: 'Assessment', icon: <FileText size={16}/> },
    { id: 'arcade', label: 'Arcade Game', icon: <Gamepad2 size={16}/> },
    { id: 'curriculum', label: 'Pathway Map', icon: <Map size={16}/> } 
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

  return ( 
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 relative transition-colors">
      {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* TOP HEADER */}
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex justify-between items-center shrink-0 z-40 select-none">
        
        <div className="flex items-center gap-4 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hidden sm:flex">
                <PenTool size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Studio</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Build and edit curriculum</p>
            </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
              onClick={() => setIsToolsOpen(!isToolsOpen)} 
              className={`p-2.5 rounded-xl transition-all border ${isToolsOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'}`} 
              title="Phonetic Engine"
          >
              <Wrench size={18} />
          </button>
          
          {(mode === 'lesson' || mode === 'card') && (
            <button 
                onClick={() => setIsPreviewActive(!isPreviewActive)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${isPreviewActive ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500/50'}`}
            >
                <Eye size={16} /> <span className="hidden sm:inline">Preview</span>
            </button>
          )}

          {mode !== 'exam' && mode !== 'card' && mode !== 'curriculum' && (
            <button onClick={handleCommit} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${mode === 'arcade' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}>
                Save
            </button>
          )}

          {initialMode && (
              <button onClick={onClearMode} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors ml-2">
                  <X size={20} />
              </button>
          )}
        </div>
      </header>

      {/* TOOLS DRAWER */}
      <PhoneticEngine isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />

      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`h-full flex flex-col w-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out`}>
          
          {/* TAB SELECTOR */}
          <div className="w-full px-6 pt-6 pb-2 shrink-0 max-w-5xl mx-auto select-none">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner border border-slate-200/50 dark:border-slate-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {modes.map((m) => {
                      const isActive = mode === m.id;
                      return (
                          <button 
                              key={m.id}
                              onClick={() => {
                                  setMode(m.id as any);
                                  if (m.id === 'arcade') setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
                                  if (m.id === 'lesson') setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
                              }} 
                              className={`flex-1 sm:flex-none min-w-fit px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                  isActive 
                                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' 
                                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                              }`}
                          >
                              {m.icon}
                              <span>{m.label}</span>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* BUILDER CONTENT */}
          <div className="flex-1 p-6 md:p-8 pt-4 mx-auto w-full max-w-5xl animate-in fade-in duration-500">
            {mode === 'card' && <CardBuilderView onSaveCard={onSaveCard} onUpdateCard={onUpdateCard} onDeleteCard={onDeleteCard} availableDecks={allDecks} onPublishDeck={onPublishDeck} instructorClasses={instructorClasses} />}
            {mode === 'lesson' && <LessonBuilderView data={lessonData} setData={setLessonData} onTogglePreview={() => setIsPreviewActive(!isPreviewActive)} isPreviewActive={isPreviewActive} triggerAiModal={triggerAiModal} onAiModalHandled={() => setTriggerAiModal(false)} userData={userData} />}
            {mode === 'exam' && <ExamBuilderView onSave={(examObj: any) => { onSaveLesson(examObj); setToastMsg("Assessment Successfully Built! 🎯"); }} />}
            {mode === 'arcade' && <ArcadeBuilderView data={lessonData} setData={setLessonData} availableDecks={allDecks} />}
            {mode === 'curriculum' && <CurriculumBuilderView availableLessons={lessons} onSaveCurriculum={onSaveCurriculum} classes={instructorClasses} curriculums={curriculums} />}
          </div>
        </div>

        {/* SLIDE-OVER PREVIEW MODAL */}
        {isPreviewActive && (mode === 'lesson' || mode === 'card') && (
            <>
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-[8000]" onClick={() => setIsPreviewActive(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] lg:w-[500px] bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-[8500] animate-in slide-in-from-right shadow-2xl">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            <Eye size={18} /> Live Preview
                        </div>
                        <button onClick={() => setIsPreviewActive(false)} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden p-6 md:p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-full h-full max-h-[850px] bg-white dark:bg-black rounded-[3rem] border-[10px] border-slate-800 dark:border-slate-950 shadow-xl overflow-hidden relative">
                            <LivePreview data={lessonData} />
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
    </div> 
  );
}
