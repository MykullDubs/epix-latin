// src/components/instructor/BuilderHub.tsx
import React, { useState, useEffect } from 'react';
import { 
  Layers, BookOpen, FileText, Gamepad2, X, Edit3, Eye, Zap, Map, 
  Wrench, Search, Loader2, Volume2, AlertCircle, ArrowLeft, PenTool,
  Sparkles, Plus, Trash2
} from 'lucide-react';
import { JuicyToast } from '../Toast';
import CardBuilderView from './CardBuilderView';
import LessonBuilderView from './LessonBuilderView';
import ExamBuilderView from './ExamBuilderView';
import ArcadeBuilderView from './ArcadeBuilderView';
import CurriculumBuilderView from './CurriculumBuilderView';
import LivePreview from '../LivePreview';
import { KineticCanvasBuilder } from '../LessonBlocks';

// ============================================================================
//  KINETIC CANVAS PRESET TEMPLATES
// ============================================================================
const KINETIC_PRESETS: Record<string, any> = {
    grammar: {
        title: 'Grammar & Syntax Assembly: The Roman Road',
        subtitle: 'Drag the Latin words into their grammatical slots to launch the chariot.',
        backgroundTheme: 'roman_road',
        successAnimation: 'chariot_march',
        entities: [
            { id: 'ent_1', label: 'Legatus', sublabel: 'Nominative Subject', color: 'indigo', x: 20, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Subject' },
            { id: 'ent_2', label: 'epistulam', sublabel: 'Accusative Object', color: 'amber', x: 50, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Object' },
            { id: 'ent_3', label: 'mittit', sublabel: 'Transitive Verb', color: 'emerald', x: 80, y: 80, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Verb' }
        ],
        zones: [
            { id: 'zone_1', label: '1. Nominative (Who?)', x: 22, y: 30, width: 25, height: 24 },
            { id: 'zone_2', label: '2. Accusative (What?)', x: 50, y: 30, width: 25, height: 24 },
            { id: 'zone_3', label: '3. Verb (Action)', x: 78, y: 30, width: 25, height: 24 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Nominative Subject locked!' },
            { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Direct Object connected!' },
            { id: 'r3', entityId: 'ent_3', zoneId: 'zone_3', reaction: 'chariot_march', message: 'Legatus epistulam mittit! The Chariot Rides!' }
        ]
    },
    map: {
        title: 'Interactive Map: Provinces of the Empire',
        subtitle: 'Place the historical legions onto their strategic territories.',
        backgroundTheme: 'parchment',
        successAnimation: 'combine_flash',
        entities: [
            { id: 'ent_1', label: 'Legio X Fretensis', sublabel: 'Eastern Frontier', color: 'rose', x: 25, y: 82, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Garrison A' },
            { id: 'ent_2', label: 'Legio IX Hispana', sublabel: 'Northern Frontier', color: 'indigo', x: 75, y: 82, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Garrison B' }
        ],
        zones: [
            { id: 'zone_1', label: 'Britannia (North)', x: 30, y: 28, width: 28, height: 25 },
            { id: 'zone_2', label: 'Iudaea (East)', x: 72, y: 42, width: 28, height: 25 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_2', zoneId: 'zone_1', reaction: 'bounce_glow', message: 'Northern border secured!' },
            { id: 'r2', entityId: 'ent_1', zoneId: 'zone_2', reaction: 'combine_flash', message: 'Eastern trade routes active!' }
        ]
    },
    physics: {
        title: 'Physics & Forces Lab: Vector Equilibrium',
        subtitle: 'Place the Force Vector on the fulcrum, resize to 1.5x, and tilt to 30°.',
        backgroundTheme: 'physics_lab',
        successAnimation: 'lever_tilt',
        entities: [
            { id: 'ent_1', label: 'Force Vector →', sublabel: 'Scale 1.5x • Tilt 30°', color: 'cyan', x: 30, y: 78, scale: 1, rotation: 0, allowResize: true, allowRotate: true, targetScale: 1.5, targetRotation: 30, variableName: 'Torque Vector' },
            { id: 'ent_2', label: '50kg Counterweight', sublabel: 'Anchor Mass', color: 'amber', x: 70, y: 78, scale: 1, rotation: 0, allowResize: false, allowRotate: false, variableName: 'Load Mass' }
        ],
        zones: [
            { id: 'zone_1', label: 'Fulcrum Vector Node', x: 35, y: 35, width: 30, height: 26 },
            { id: 'zone_2', label: 'Lever Load Plate', x: 70, y: 35, width: 28, height: 26 }
        ],
        rules: [
            { id: 'r1', entityId: 'ent_1', zoneId: 'zone_1', reaction: 'lever_tilt', message: 'Vector engaged on Fulcrum!' },
            { id: 'r2', entityId: 'ent_2', zoneId: 'zone_2', reaction: 'bounce_glow', message: 'Counterweight balanced!' }
        ]
    }
};

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

  // --- INJECT A KINETIC CANVAS LAB BLOCK INTO LESSON DATA ---
  const handleAddKineticBlock = (presetKey: 'grammar' | 'map' | 'physics' = 'grammar') => {
    const preset = JSON.parse(JSON.stringify(KINETIC_PRESETS[presetKey] || KINETIC_PRESETS.grammar));
    const newBlock = {
        id: `kinetic_${Date.now()}`,
        type: 'kinetic_canvas',
        ...preset
    };
    setLessonData((prev: any) => ({
        ...prev,
        blocks: [...(prev.blocks || []), newBlock]
    }));
    setToastMsg("Kinetic Canvas Lab added to Lesson! ✨");
  };

  const handleUpdateKineticBlock = (blockId: string, updatedBlock: any) => {
    setLessonData((prev: any) => ({
        ...prev,
        blocks: (prev.blocks || []).map((b: any) => b.id === blockId ? updatedBlock : b)
    }));
  };

  const handleRemoveKineticBlock = (blockId: string) => {
    setLessonData((prev: any) => ({
        ...prev,
        blocks: (prev.blocks || []).filter((b: any) => b.id !== blockId)
    }));
  };

  const handleCommit = () => {
    const payload = mode === 'arcade' ? { ...lessonData, type: 'arcade_game' } : lessonData;
    onSaveLesson(payload, lessonData.id || null);
    setToastMsg(mode === 'arcade' ? "Arcade Game Committed! 🎮" : "Unit Committed! 📚");
    if (mode === 'lesson') {
        setLessonData({ title: '', subtitle: '', blocks: [], theme: 'indigo' });
    } else if (mode === 'arcade') {
        setLessonData({ title: '', description: '', gameTemplate: 'connect-three', targetScore: 3, mode: 'pvp', deckIds: [] });
    }
  };

  const kineticBlocks = (lessonData?.blocks || []).filter((b: any) => b?.type === 'kinetic_canvas');

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
        <div className="h-full flex flex-col w-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out">
          
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
          <div className="flex-1 p-6 md:p-8 pt-4 mx-auto w-full max-w-5xl animate-in fade-in duration-500 space-y-8">
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
                <>
                    {/* 🔥 KINETIC CANVAS LAB INJECTOR DOCK */}
                    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-[2rem] border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                        New Interactive Block
                                    </span>
                                    {kineticBlocks.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                                            {kineticBlocks.length} Active in Lesson
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-base sm:text-lg font-black tracking-tight">
                                    Insert a Kinetic 2D Canvas Lab
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('grammar')}
                                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
                            >
                                <Plus size={12} /> 🏛️ Grammar Chariot
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('map')}
                                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border border-white/10"
                            >
                                <Plus size={12} /> 🗺️ Empire Map
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddKineticBlock('physics')}
                                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border border-white/10"
                            >
                                <Plus size={12} /> ⚖️ Physics Lab
                            </button>
                        </div>
                    </div>

                    {/* EXISTING LESSON BUILDER VIEW */}
                    <LessonBuilderView 
                        data={lessonData} 
                        setData={setLessonData} 
                        onTogglePreview={() => setIsPreviewActive(!isPreviewActive)} 
                        isPreviewActive={isPreviewActive} 
                        triggerAiModal={triggerAiModal} 
                        onAiModalHandled={() => setTriggerAiModal(false)} 
                        userData={userData} 
                    />

                    {/* 🔥 RENDER KINETIC CANVAS EDITORS FOR ANY KINETIC BLOCKS IN THIS LESSON */}
                    {kineticBlocks.length > 0 && (
                        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <Sparkles size={16} /> Active Kinetic Canvas Labs ({kineticBlocks.length})
                                </h3>
                            </div>
                            {kineticBlocks.map((kb: any) => (
                                <div key={kb.id} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKineticBlock(kb.id)}
                                        className="absolute top-6 right-6 z-20 p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 transition-colors"
                                        title="Remove Kinetic Canvas Block"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <KineticCanvasBuilder
                                        block={kb}
                                        onChange={(updated: any) => handleUpdateKineticBlock(kb.id, updated)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {mode === 'exam' && (
                <ExamBuilderView 
                    onSave={(examObj: any) => { 
                        onSaveLesson(examObj); 
                        setToastMsg("Assessment Successfully Built! 🎯"); 
                    }} 
                />
            )}

            {mode === 'arcade' && (
                <ArcadeBuilderView 
                    data={lessonData} 
                    setData={setLessonData} 
                    availableDecks={allDecks} 
                />
            )}

            {mode === 'curriculum' && (
                <CurriculumBuilderView 
                    availableLessons={lessons} 
                    onSaveCurriculum={onSaveCurriculum} 
                    classes={instructorClasses} 
                    curriculums={curriculums} 
                />
            )}
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
