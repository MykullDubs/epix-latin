// src/components/instructor/LessonBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { 
    Code, Trash2, AlignLeft, FileText, MessageSquare, 
    List, HelpCircle, Image, Puzzle, MessageCircle, Gamepad2, X, Info, Activity, Mic, Play, Tag, ChevronUp, ChevronDown,
    Wand2, Presentation, Crown, Search // 🔥 IMPORTED CROWN ICON
} from 'lucide-react';
import AiGeneratorModal from './AiGeneratorModal'; 

export function InjectorButton({ icon, label, subtitle, onClick, colorTheme = 'indigo', isPremium = false }: any) {
    const themeMap: Record<string, { bg: string, text: string, ring: string, iconBg: string, iconText: string }> = {
        indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-900 dark:text-indigo-100', ring: 'ring-1 ring-indigo-100 dark:ring-indigo-500/20 hover:ring-indigo-300', iconBg: 'bg-indigo-200 dark:bg-indigo-500/30', iconText: 'text-indigo-700 dark:text-indigo-300' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-900 dark:text-emerald-100', ring: 'ring-1 ring-emerald-100 dark:ring-emerald-500/20 hover:ring-emerald-300', iconBg: 'bg-emerald-200 dark:bg-emerald-500/30', iconText: 'text-emerald-700 dark:text-emerald-300' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-900 dark:text-blue-100', ring: 'ring-1 ring-blue-100 dark:ring-blue-500/20 hover:ring-blue-300', iconBg: 'bg-blue-200 dark:bg-blue-500/30', iconText: 'text-blue-700 dark:text-blue-300' },
        fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', text: 'text-fuchsia-900 dark:text-fuchsia-100', ring: 'ring-1 ring-fuchsia-100 dark:ring-fuchsia-500/20 hover:ring-fuchsia-300', iconBg: 'bg-fuchsia-200 dark:bg-fuchsia-500/30', iconText: 'text-fuchsia-700 dark:text-fuchsia-300' },
        violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-900 dark:text-violet-100', ring: 'ring-1 ring-violet-100 dark:ring-violet-500/20 hover:ring-violet-300', iconBg: 'bg-violet-200 dark:bg-violet-500/30', iconText: 'text-violet-700 dark:text-violet-300' },
        rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-900 dark:text-rose-100', ring: 'ring-1 ring-rose-100 dark:ring-rose-500/20 hover:ring-rose-300', iconBg: 'bg-rose-200 dark:bg-rose-500/30', iconText: 'text-rose-700 dark:text-rose-300' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-900 dark:text-amber-100', ring: 'ring-1 ring-amber-100 dark:ring-amber-500/20 hover:ring-amber-300', iconBg: 'bg-amber-200 dark:bg-amber-500/30', iconText: 'text-amber-700 dark:text-amber-300' },
        cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-900 dark:text-cyan-100', ring: 'ring-1 ring-cyan-100 dark:ring-cyan-500/20 hover:ring-cyan-300', iconBg: 'bg-cyan-200 dark:bg-cyan-500/30', iconText: 'text-cyan-700 dark:text-cyan-300' },
        slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-900 dark:text-slate-100', ring: 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-500', iconBg: 'bg-slate-200 dark:bg-slate-700', iconText: 'text-slate-700 dark:text-slate-300' },
    };

    const t = themeMap[colorTheme] || themeMap.indigo;

    return (
        <button 
            onClick={onClick} 
            className={`w-full p-4 md:p-5 ${t.bg} rounded-[2rem] flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-32 md:h-36 ${t.ring} relative overflow-hidden`}
        >
            {/* 🔥 NEW: PREMIUM CROWN BADGE */}
            {isPremium && (
                <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 px-2 py-1 rounded-bl-xl font-black flex items-center justify-center shadow-sm z-10">
                    <Crown size={12} strokeWidth={3} />
                </div>
            )}
            
            <div className={`w-10 h-10 md:w-12 md:h-12 ${t.iconBg} rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110 relative z-10`}>
                {React.cloneElement(icon, { className: t.iconText, size: 20 })}
            </div>
            
            <div className="text-left mt-auto relative z-10">
                <span className={`font-black text-sm md:text-base uppercase tracking-tighter block leading-none mb-1 ${t.text}`}>{label}</span>
                <span className={`text-[9px] font-bold ${t.iconText} uppercase tracking-widest opacity-80`}>{subtitle}</span>
            </div>
        </button>
    );
}

export default function LessonBuilderView({ 
    data, setData, onTogglePreview, isPreviewActive, 
    triggerAiModal, onAiModalHandled, userData 
}: any) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2));
  
  // 🔥 SMART TAG STATE
  const [tagInput, setTagInput] = useState('');
  
  // 🔥 AI GENERATOR STATE & GATEKEEPER
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [newlyAddedIndices, setNewlyAddedIndices] = useState<number[]>([]);

  // 🔥 FREEMIUM GATE CHECK
  const isPro = userData?.subscriptionTier === 'pro';

  const handleMagicGenerateClick = () => {
      const aiUses = userData?.magicGenerationsCount || 0;
      
      if (isPro || aiUses < 3) {
          setIsAiModalOpen(true);
      } else {
          setIsUpgradeModalOpen(true);
      }
  };

  const handlePremiumBlockClick = (type: string) => {
      if (isPro) {
          addBlock(type);
      } else {
          setIsUpgradeModalOpen(true);
      }
  };

  useEffect(() => {
      if (triggerAiModal) {
          handleMagicGenerateClick();
          if (onAiModalHandled) onAiModalHandled();
      }
  }, [triggerAiModal, onAiModalHandled]);

  const updateBlock = (index: number, field: string, value: any) => {
    const newBlocks = [...(data.blocks || [])];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setData({ ...data, blocks: newBlocks });
  };

  const addBlock = (type: string) => {
    const templates: any = {
      text: { type: 'text', title: '', content: 'New Core Concept...' },
      essay: { type: 'essay', title: 'Deep Dive', content: 'Paragraph 1...\n\nParagraph 2...' },
      callout: { type: 'callout', label: 'Pro Tip', content: 'Did you know that...' }, 
      dialogue: { type: 'dialogue', lines: [{ speaker: 'A', text: '', side: 'left' }] },
      'vocab-list': { type: 'vocab-list', items: [{ term: '', definition: '' }] },
      quiz: { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' },
      image: { type: 'image', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', caption: '' },
      'fill-blank': { type: 'fill-blank', question: 'Fill in the blanks:', text: 'The [quick] brown [fox] jumps.', distractors: ['slow', 'dog'] },
      discussion: { type: 'discussion', title: 'Discussion Time', questions: ['Question 1?', 'Question 2?', 'Question 3?'] },
      game: { type: 'game', gameType: 'connect-three', title: 'Vocabulary Battle' },
      pronunciation: { 
        type: 'pronunciation', 
        targetPhonemes: ['i', 'ɪ', 'b', 'v', 'θ', 'ð'], 
        pairs: [
            { id: Date.now(), p1: 'i', p2: 'ɪ', w1: 'sheep', w2: 'ship', focus: 'Vowel Tension' }
        ] 
      },
      grammar: {
          type: 'grammar',
          title: 'Grammar Focus',
          rule: 'Explain the rule clearly here...',
          formula: 'Subject + Verb + Object',
          examples: [
              { en: "This is an example sentence.", target: "example sentence", note: "Optional context" }
          ]
      },
      // 🔥 PREMIUM TEMPLATES
      'audio-story': { type: 'audio-story', title: 'Listening Comprehension', text: 'Once upon a time...', imageUrl: '' },
      'image-hotspot': { type: 'image-hotspot', title: 'Explore the Map', imageUrl: '', hotspots: [{ x: 50, y: 50, title: 'Landmark', description: 'Description here' }] },
      'drawing': { type: 'drawing', title: 'Draw the concept!' },
      'roleplay': { 
          type: 'roleplay', 
          title: 'Live Conversation Simulation', 
          prompt: 'A customer is ordering a coffee.',
          metadata: { aiPersona: 'Barista', studentRole: 'Customer', objective: 'Successfully order a latte.' }
      }
    };
    
    const newIndex = (data.blocks || []).length;
    setData({ ...data, blocks: [...(data.blocks || []), templates[type]] });
    
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index);
    setData({ ...data, blocks: newBlocks });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
      const newBlocks = [...(data.blocks || [])];
      if (direction === 'up' && index > 0) {
          [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      } else if (direction === 'down' && index < newBlocks.length - 1) {
          [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      }
      setData({ ...data, blocks: newBlocks });
  };

  const handleAppendAiBlocks = (generatedBlocks: any[]) => {
      const startIndex = (data.blocks || []).length;
      const newIndices = generatedBlocks.map((_, i) => startIndex + i);
      setData({ ...data, blocks: [...(data.blocks || []), ...generatedBlocks] });
      setNewlyAddedIndices(newIndices);
      setTimeout(() => setNewlyAddedIndices([]), 3000);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const newTag = tagInput.trim().toLowerCase();
          if (newTag && !(data.tags || []).includes(newTag)) setData({ ...data, tags: [...(data.tags || []), newTag] });
          setTagInput('');
      }
  };

  const handleRemoveTag = (tagToRemove: string) => {
      const newTags = (data.tags || []).filter((t: string) => t !== tagToRemove);
      setData({ ...data, tags: newTags });
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setData(parsed);
      setJsonMode(false);
    } catch (e) {
      alert("Syntax Error in JSON");
    }
  };

  useEffect(() => {
    if (!jsonMode) setJsonInput(JSON.stringify(data, null, 2));
  }, [data, jsonMode]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-64 relative">
      
      <AiGeneratorModal 
          isOpen={isAiModalOpen} 
          onClose={() => setIsAiModalOpen(false)} 
          onAppendBlocks={handleAppendAiBlocks} 
          userData={userData}
      />

      {/* 🔥 THE UPGRADE PAYWALL MODAL */}
      {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUpgradeModalOpen(false)} />
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full relative z-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-amber-500/30">
                      <Crown size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Magister Pro Feature</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                      Upgrade to Magister Pro to unlock unlimited AI generations, premium interactive blocks (like Audio Stories and Roleplay), and priority support.
                  </p>
                  <div className="space-y-3">
                      <button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                          Upgrade to Pro — $15/mo
                      </button>
                      <button onClick={() => setIsUpgradeModalOpen(false)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          Maybe Later
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* STICKY HEADER WITH TOGGLES */}
      <div className="sticky top-4 z-50 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
         <div className="flex gap-2">
             <button onClick={() => setJsonMode(!jsonMode)} className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${jsonMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Code size={16} /> {jsonMode ? 'Exit JSON' : 'Advanced JSON'}
             </button>
             
             {!jsonMode && (
                 <button onClick={handleMagicGenerateClick} className="flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95">
                    <Wand2 size={16} /> Magic Generate
                 </button>
             )}
         </div>
         
         <div className="flex gap-2">
             {onTogglePreview && (
                 <button onClick={onTogglePreview} className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isPreviewActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200'}`}>
                     <Play size={16} fill={isPreviewActive ? "currentColor" : "none"} /> {isPreviewActive ? 'Close Preview' : 'Live Preview'}
                 </button>
             )}
         </div>
      </div>

      {jsonMode ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl">
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-[60vh] bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none" />
          </div>
          <button onClick={handleImportJson} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-emerald-400 active:scale-95 transition-all">Inject Architecture</button>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-300">
          
          <div className="space-y-4 px-2">
            <input className="text-4xl md:text-5xl font-black border-none w-full focus:ring-0 p-0 tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700" placeholder="Unit Title..." value={data.title || ''} onChange={e => setData({...data, title: e.target.value})} />
            <input className="text-lg md:text-xl font-bold text-slate-400 border-none w-full focus:ring-0 p-0 tracking-tight bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700" placeholder="Subtitle..." value={data.subtitle || ''} onChange={e => setData({...data, subtitle: e.target.value})} />
            
            {/* SMART TAGS UI */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
                {(data.tags || []).map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 shadow-sm animate-in zoom-in-95 duration-200">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 ml-1 transition-colors"><X size={12} strokeWidth={3} /></button>
                    </span>
                ))}
                <div className="flex items-center relative">
                    <Tag size={14} className="absolute left-3 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Add tags (press Enter)..." 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 transition-colors w-48 shadow-sm"
                    />
                </div>
            </div>
          </div>

          <div className="space-y-6">
            {(data.blocks || []).map((block: any, idx: number) => {
              const isNewlyAdded = newlyAddedIndices.includes(idx);
              return (
              <div key={idx} className={`group bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border-2 transition-all relative shadow-sm ${isNewlyAdded ? 'border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50'}`}>
                
                {/* 🔥 BLOCK HEADER WITH MOVEMENT & DELETE CONTROLS */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-50 dark:border-slate-800/50">
                   <div className="flex items-center gap-3">
                       <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${isNewlyAdded ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>{idx + 1}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.type}</span>
                       {isNewlyAdded && <span className="ml-2 px-2 py-1 bg-purple-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">AI Generated</span>}
                   </div>
                   
                   <div className="flex items-center gap-2">
                       {/* 🔥 REORDER CONTROLS */}
                       <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                           <button 
                               onClick={() => moveBlock(idx, 'up')}
                               disabled={idx === 0}
                               className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                               title="Move Block Up"
                           >
                               <ChevronUp size={16} strokeWidth={3} />
                           </button>
                           <button 
                               onClick={() => moveBlock(idx, 'down')}
                               disabled={idx === (data.blocks || []).length - 1}
                               className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                               title="Move Block Down"
                           >
                               <ChevronDown size={16} strokeWidth={3} />
                           </button>
                       </div>
                       
                       <button onClick={() => removeBlock(idx)} className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors" title="Delete Block">
                           <Trash2 size={18} strokeWidth={2.5} />
                       </button>
                   </div>
                </div>

                {/* TEXT EDITOR */}
                {block.type === 'text' && (
                  <textarea 
                    className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white rounded-2xl p-6 font-bold text-xl border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-200 resize-none h-32 outline-none" 
                    placeholder="Punchy text content..."
                    value={block.content} 
                    onChange={e => updateBlock(idx, 'content', e.target.value)} 
                  />
                )}

                {/* ESSAY EDITOR */}
                {block.type === 'essay' && (
                  <div className="space-y-4">
                    <input className="w-full font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Essay Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} />
                    <textarea className="w-full h-64 bg-slate-50 dark:bg-slate-950 dark:text-slate-300 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl text-sm font-serif leading-relaxed focus:ring-2 focus:ring-indigo-200 outline-none resize-none" placeholder="Paragraph 1...\n\nParagraph 2..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} />
                  </div>
                )}

                {/* CALLOUT EDITOR */}
                {block.type === 'callout' && (
                  <div className="space-y-4 bg-amber-50 dark:bg-amber-500/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={18} className="text-amber-500" strokeWidth={3} />
                        <span className="text-xs font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest">Grammar Spotlight / Pro-Tip</span>
                    </div>
                    <input 
                        className="w-full bg-white dark:bg-slate-900 dark:text-white border border-amber-100 dark:border-amber-800/50 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-300 outline-none shadow-sm" 
                        placeholder="Label (e.g. Pro Tip, Grammar Focus)" 
                        value={block.label || ''} 
                        onChange={e => updateBlock(idx, 'label', e.target.value)} 
                    />
                    <textarea 
                        className="w-full bg-white dark:bg-slate-900 dark:text-slate-300 border border-amber-100 dark:border-amber-800/50 p-4 rounded-2xl text-sm italic focus:ring-2 focus:ring-amber-300 outline-none resize-none h-32 shadow-sm" 
                        placeholder="Callout content..." 
                        value={block.content || ''} 
                        onChange={e => updateBlock(idx, 'content', e.target.value)} 
                    />
                  </div>
                )}

                {/* IMAGE EDITOR */}
                {block.type === 'image' && (
                  <div className="space-y-4">
                    <input className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Unsplash Image URL" value={block.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} />
                    <input className="w-full bg-slate-50 dark:bg-slate-950 dark:text-slate-400 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Image Caption (Optional)" value={block.caption || ''} onChange={e => updateBlock(idx, 'caption', e.target.value)} />
                  </div>
                )}

                {/* VOCAB LIST EDITOR */}
                {block.type === 'vocab-list' && (
                  <div className="space-y-3">
                    {(block.items || []).map((item: any, iIdx: number) => (
                       <div key={iIdx} className="flex gap-2">
                          <input className="w-1/3 bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-fuchsia-200 outline-none" placeholder="Term" value={item.term} onChange={e => { const newItems = [...block.items]; newItems[iIdx].term = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <input className="flex-1 bg-slate-50 dark:bg-slate-950 dark:text-slate-300 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-fuchsia-200 outline-none" placeholder="Definition" value={item.definition} onChange={e => { const newItems = [...block.items]; newItems[iIdx].definition = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <button onClick={() => { const newItems = block.items.filter((_:any, i:number) => i !== iIdx); updateBlock(idx, 'items', newItems); }} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors"><X size={18}/></button>
                       </div>
                    ))}
                    <button onClick={() => updateBlock(idx, 'items', [...(block.items||[]), {term:'', definition:''}])} className="w-full py-4 mt-2 border-2 border-dashed border-fuchsia-200 dark:border-fuchsia-900/50 rounded-2xl text-xs font-black tracking-widest uppercase text-fuchsia-500 hover:text-fuchsia-600 hover:border-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 transition-colors">+ Add Word</button>
                  </div>
                )}

                {/* QUIZ EDITOR */}
                {block.type === 'quiz' && (
                  <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-500/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50">
                     <textarea className="w-full bg-white dark:bg-slate-900 dark:text-white border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-2xl text-sm font-bold resize-none h-24 outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm" placeholder="Quiz Question..." value={block.content?.question || block.question || ''} onChange={e => updateBlock(idx, 'question', e.target.value)} />
                     <div className="space-y-3 mt-4">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Options (Select Correct)</span>
                       {(block.content?.options || block.options || []).map((opt: any, oIdx: number) => {
                           const isCorrect = (block.content?.correctId || block.correctId) === opt.id;
                           return (
                           <div key={oIdx} className="flex items-center gap-3">
                              <input type="radio" className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={isCorrect} onChange={() => updateBlock(idx, 'correctId', opt.id)} />
                              <input className="w-16 bg-white dark:bg-slate-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 p-3 rounded-xl text-xs font-mono font-bold text-center outline-none shadow-sm" placeholder="ID" value={opt.id} onChange={e => { const newOpts = [...(block.content?.options || block.options)]; newOpts[oIdx].id = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                              <input className="flex-1 bg-white dark:bg-slate-900 dark:text-white border border-indigo-100 dark:border-indigo-800/50 p-3 rounded-xl text-sm font-medium outline-none shadow-sm" placeholder="Answer Text" value={opt.text} onChange={e => { const newOpts = [...(block.content?.options || block.options)]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                           </div>
                           );
                       })}
                       <button onClick={() => updateBlock(idx, 'options', [...(block.content?.options || block.options || []), {id: String.fromCharCode(97 + ((block.content?.options || block.options)?.length || 0)), text: ''}])} className="text-xs font-black text-indigo-500 mt-2 hover:text-indigo-700 transition-colors uppercase tracking-widest">+ Add Option</button>
                     </div>
                  </div>
                )}

                {/* DIALOGUE EDITOR */}
                {block.type === 'dialogue' && (
                  <div className="space-y-4">
                     {(block.lines || []).map((line: any, lIdx: number) => (
                        <div key={lIdx} className="p-5 bg-blue-50/50 dark:bg-blue-500/10 rounded-[2rem] space-y-3 border border-blue-100 dark:border-blue-900/50 relative group/line">
                           <button onClick={() => { const newLines = block.lines.filter((_:any, i:number) => i !== lIdx); updateBlock(idx, 'lines', newLines); }} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover/line:opacity-100"><X size={16}/></button>
                           <div className="flex gap-3 pr-8">
                             <input className="w-1/4 bg-white dark:bg-slate-900 dark:text-white border border-blue-100 dark:border-blue-800/50 p-3 rounded-xl text-xs font-black outline-none shadow-sm" placeholder="Speaker" value={line.speaker} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].speaker = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                             <select className="bg-white dark:bg-slate-900 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 p-3 rounded-xl text-xs font-bold text-slate-500 outline-none shadow-sm cursor-pointer" value={line.side} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].side = e.target.value; updateBlock(idx, 'lines', newLines); }}>
                                <option value="left">Left Side</option><option value="right">Right Side</option>
                             </select>
                           </div>
                           <textarea className="w-full bg-white dark:bg-slate-900 dark:text-white border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl text-sm font-medium resize-none outline-none shadow-sm h-24" placeholder="What are they saying?" value={line.text} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].text = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                           <input className="w-full bg-white/50 dark:bg-slate-900/50 dark:text-slate-400 border border-blue-100/50 dark:border-blue-800/30 p-3 rounded-xl text-xs italic text-slate-500 outline-none" placeholder="Translation / Context note" value={line.translation || ''} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].translation = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                        </div>
                     ))}
                     <button onClick={() => updateBlock(idx, 'lines', [...(block.lines||[]), {speaker:'A', text:'', side:'left'}])} className="w-full py-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl text-xs font-black tracking-widest uppercase text-blue-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">+ Add Dialogue Line</button>
                  </div>
                )}

                {/* DISCUSSION EDITOR */}
                {block.type === 'discussion' && (
                  <div className="space-y-4 bg-violet-50/50 dark:bg-violet-500/10 p-6 rounded-3xl border border-violet-100 dark:border-violet-900/50">
                     <div className="flex items-center gap-2 mb-4">
                        <MessageCircle size={18} className="text-violet-600" strokeWidth={3} />
                        <span className="text-xs font-black text-violet-800 dark:text-violet-400 uppercase tracking-widest">Discussion Block</span>
                     </div>
                     <input 
                        className="w-full bg-white dark:bg-slate-900 dark:text-white border border-violet-200 dark:border-violet-800/50 p-4 rounded-2xl text-sm font-black focus:ring-2 focus:ring-violet-300 outline-none shadow-sm" 
                        placeholder="Title (e.g. Talk about it!)" 
                        value={block.title || ''} 
                        onChange={e => updateBlock(idx, 'title', e.target.value)} 
                     />
                     <div className="space-y-3">
                       {(block.questions || []).map((q: string, qIdx: number) => (
                          <div key={qIdx} className="flex gap-3">
                            <span className="flex-none w-12 h-12 flex items-center justify-center text-xs font-black text-violet-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-violet-100 dark:border-violet-800/50">{qIdx + 1}</span>
                            <input 
                              className="flex-1 bg-white dark:bg-slate-900 dark:text-white border border-violet-200 dark:border-violet-800/50 p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-300 outline-none shadow-sm" 
                              placeholder={`Question ${qIdx + 1}`} 
                              value={q} 
                              onChange={e => {
                                 const newQs = [...block.questions];
                                 newQs[qIdx] = e.target.value;
                                 updateBlock(idx, 'questions', newQs);
                              }} 
                            />
                          </div>
                       ))}
                     </div>
                  </div>
                )}

                {/* FILL BLANK EDITOR */}
                {block.type === 'fill-blank' && (
                  <div className="space-y-4 bg-emerald-50/30 dark:bg-emerald-500/5 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                     <div className="flex items-center gap-2 mb-4">
                        <Puzzle size={18} className="text-emerald-600" strokeWidth={3} />
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest">Drag & Drop Configurator</span>
                     </div>
                     <input 
                        className="w-full bg-white dark:bg-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-sm font-black focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm" 
                        placeholder="Instruction (e.g., Fill in the missing verbs)" 
                        value={block.question || ''} 
                        onChange={e => updateBlock(idx, 'question', e.target.value)} 
                     />
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 block">Sentence (Use [brackets] for blanks)</label>
                       <textarea 
                          className="w-full bg-white dark:bg-slate-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-sm font-mono font-medium resize-none h-32 focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm leading-relaxed" 
                          placeholder="I want to buy [apples] at the [store]." 
                          value={block.text || ''} 
                          onChange={e => updateBlock(idx, 'text', e.target.value)} 
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 block">Distractor Words (Comma separated)</label>
                       <input 
                          className="w-full bg-white dark:bg-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm" 
                          placeholder="oranges, bank, sell" 
                          value={(block.distractors || []).join(', ')} 
                          onChange={e => {
                             const distArr = e.target.value.split(',').map((s:string) => s.trim()).filter((s:string) => s !== '');
                             updateBlock(idx, 'distractors', distArr);
                          }} 
                       />
                     </div>
                  </div>
                )}

                {/* PRONUNCIATION LAB EDITOR */}
                {block.type === 'pronunciation' && (
                  <div className="space-y-6 bg-emerald-50/50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <Activity size={18} className="text-emerald-600" strokeWidth={3} />
                           <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Pronunciation Lab Matrix</span>
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Activity size={12} /> Target Phonemes (Comma Separated IPA)
                       </label>
                       <input 
                          className="w-full bg-white dark:bg-slate-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-300 outline-none shadow-inner" 
                          placeholder="i, ɪ, b, v, θ, ð" 
                          value={(block.targetPhonemes || []).join(', ')} 
                          onChange={e => {
                             const ipaArr = e.target.value.split(',').map((s:string) => s.trim()).filter((s:string) => s !== '');
                             updateBlock(idx, 'targetPhonemes', ipaArr);
                          }} 
                       />
                     </div>

                     <div className="pt-2 space-y-4">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Mic size={12} /> Minimal Pairs Validation
                       </label>
                       
                       {(block.pairs || []).map((pair: any, pIdx: number) => (
                          <div key={pair.id || pIdx} className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm relative group/pair">
                             <button onClick={() => { const newPairs = block.pairs.filter((_:any, i:number) => i !== pIdx); updateBlock(idx, 'pairs', newPairs); }} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover/pair:opacity-100 transition-opacity"><X size={16}/></button>
                             
                             <input 
                                className="w-[85%] bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-xs font-black text-slate-700 focus:ring-2 focus:ring-emerald-200 outline-none" 
                                placeholder="Concept Focus (e.g. Vowel Tension)" 
                                value={pair.focus || ''} 
                                onChange={e => { const newPairs = [...block.pairs]; newPairs[pIdx].focus = e.target.value; updateBlock(idx, 'pairs', newPairs); }} 
                             />
                             
                             <div className="flex gap-2 items-center">
                                <div className="flex-1 flex gap-2">
                                    <input className="w-14 bg-slate-100 dark:bg-slate-800 dark:text-emerald-400 text-slate-500 font-mono font-bold text-center border-none p-3 rounded-xl text-sm outline-none" placeholder="/p1/" value={pair.p1} onChange={e => { const newPairs = [...block.pairs]; newPairs[pIdx].p1 = e.target.value; updateBlock(idx, 'pairs', newPairs); }} />
                                    <input className="flex-1 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 p-3 rounded-xl text-sm font-black text-emerald-900 dark:text-emerald-100 outline-none" placeholder="Word 1" value={pair.w1} onChange={e => { const newPairs = [...block.pairs]; newPairs[pIdx].w1 = e.target.value; updateBlock(idx, 'pairs', newPairs); }} />
                                </div>
                                <span className="text-[10px] italic text-slate-400 px-1 font-serif">vs</span>
                                <div className="flex-1 flex gap-2">
                                    <input className="flex-1 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 p-3 rounded-xl text-sm font-black text-emerald-900 dark:text-emerald-100 outline-none text-right" placeholder="Word 2" value={pair.w2} onChange={e => { const newPairs = [...block.pairs]; newPairs[pIdx].w2 = e.target.value; updateBlock(idx, 'pairs', newPairs); }} />
                                    <input className="w-14 bg-slate-100 dark:bg-slate-800 dark:text-emerald-400 text-slate-500 font-mono font-bold text-center border-none p-3 rounded-xl text-sm outline-none" placeholder="/p2/" value={pair.p2} onChange={e => { const newPairs = [...block.pairs]; newPairs[pIdx].p2 = e.target.value; updateBlock(idx, 'pairs', newPairs); }} />
                                </div>
                             </div>
                          </div>
                       ))}
                       <button onClick={() => updateBlock(idx, 'pairs', [...(block.pairs||[]), { id: Date.now(), p1: '', p2: '', w1: '', w2: '', focus: '' }])} className="w-full py-4 border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">+ Add Minimal Pair</button>
                     </div>
                  </div>
                )}

                {/* 🔥 GRAMMAR BLOCK EDITOR */}
                {block.type === 'grammar' && (
                  <div className="space-y-6 bg-cyan-50/50 dark:bg-cyan-500/10 p-6 rounded-3xl border border-cyan-100 dark:border-cyan-900/50">
                     <div className="flex items-center gap-2 mb-2">
                        <Presentation size={18} className="text-cyan-600" strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-widest text-cyan-800 dark:text-cyan-400">Grammar Whiteboard</span>
                     </div>
                     
                     <input 
                        className="w-full bg-white dark:bg-slate-900 dark:text-white border border-cyan-200 dark:border-cyan-800/50 p-4 rounded-2xl text-lg font-black focus:ring-2 focus:ring-cyan-300 outline-none shadow-sm" 
                        placeholder="Title (e.g., The Present Perfect)" 
                        value={block.title || ''} 
                        onChange={e => updateBlock(idx, 'title', e.target.value)} 
                     />
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Rule / Explanation</label>
                        <textarea 
                           className="w-full bg-white dark:bg-slate-900 dark:text-slate-300 border border-cyan-200 dark:border-cyan-800/50 p-4 rounded-2xl text-sm font-medium resize-none h-20 focus:ring-2 focus:ring-cyan-300 outline-none shadow-sm" 
                           placeholder="Explain when and why to use this grammar..." 
                           value={block.rule || ''} 
                           onChange={e => updateBlock(idx, 'rule', e.target.value)} 
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Structure Formula</label>
                        <input 
                           className="w-full bg-slate-900 dark:bg-slate-950 text-cyan-400 border border-cyan-200 dark:border-cyan-800/50 p-4 rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-cyan-300 outline-none shadow-inner" 
                           placeholder="Subject + have/has + Past Participle" 
                           value={block.formula || ''} 
                           onChange={e => updateBlock(idx, 'formula', e.target.value)} 
                        />
                     </div>

                     <div className="pt-2 space-y-3">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Drill Examples</label>
                        {(block.examples || []).map((ex: any, eIdx: number) => (
                           <div key={eIdx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-cyan-100 dark:border-cyan-800/50 shadow-sm relative group/ex space-y-3">
                              <button onClick={() => { const newEx = block.examples.filter((_:any, i:number) => i !== eIdx); updateBlock(idx, 'examples', newEx); }} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover/ex:opacity-100 transition-opacity"><X size={16}/></button>
                              
                              <input 
                                 className="w-[85%] bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-cyan-200 outline-none" 
                                 placeholder="Full sentence (e.g. I have eaten sushi.)" 
                                 value={ex.en || ''} 
                                 onChange={e => { const newEx = [...block.examples]; newEx[eIdx].en = e.target.value; updateBlock(idx, 'examples', newEx); }} 
                              />
                              <div className="flex gap-3">
                                 <input 
                                    className="w-1/3 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-500/30 p-3 rounded-xl text-xs font-black outline-none" 
                                    placeholder="Target words to highlight" 
                                    value={ex.target || ''} 
                                    onChange={e => { const newEx = [...block.examples]; newEx[eIdx].target = e.target.value; updateBlock(idx, 'examples', newEx); }} 
                                 />
                                 <input 
                                    className="flex-1 bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-xs italic outline-none" 
                                    placeholder="Context Note (Optional)" 
                                    value={ex.note || ''} 
                                    onChange={e => { const newEx = [...block.examples]; newEx[eIdx].note = e.target.value; updateBlock(idx, 'examples', newEx); }} 
                                 />
                              </div>
                           </div>
                        ))}
                        <button onClick={() => updateBlock(idx, 'examples', [...(block.examples||[]), { en: '', target: '', note: '' }])} className="w-full py-3 border-2 border-dashed border-cyan-200 dark:border-cyan-800/50 rounded-2xl text-xs font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors">+ Add Example</button>
                     </div>
                  </div>
                )}

              </div>
              );
            })}
          </div>

          {/* THE INJECTOR GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-12 pb-12 border-t border-slate-100 dark:border-slate-800">
             {/* 🟢 STANDARD BLOCKS (FREE) */}
             <InjectorButton icon={<AlignLeft/>} label="Text" subtitle="Paragraphs" colorTheme="slate" onClick={() => addBlock('text')} />
             <InjectorButton icon={<FileText/>} label="Essay" subtitle="Long Form" colorTheme="slate" onClick={() => addBlock('essay')} />
             <InjectorButton icon={<Info/>} label="Callout" subtitle="Pro Tips" colorTheme="amber" onClick={() => addBlock('callout')} /> 
             <InjectorButton icon={<MessageSquare/>} label="Dialogue" subtitle="Conversations" colorTheme="blue" onClick={() => addBlock('dialogue')} />
             <InjectorButton icon={<Presentation/>} label="Grammar" subtitle="Whiteboard" colorTheme="cyan" onClick={() => addBlock('grammar')} />
             <InjectorButton icon={<List/>} label="Vocab" subtitle="Glossary" colorTheme="fuchsia" onClick={() => addBlock('vocab-list')} />
             <InjectorButton icon={<HelpCircle/>} label="Quiz" subtitle="Assessments" colorTheme="indigo" onClick={() => addBlock('quiz')} />
             <InjectorButton icon={<Image/>} label="Visual" subtitle="Media & Images" colorTheme="cyan" onClick={() => addBlock('image')} />
             <InjectorButton icon={<Puzzle/>} label="Fill Blank" subtitle="Interactive Text" colorTheme="emerald" onClick={() => addBlock('fill-blank')} />
             <InjectorButton icon={<MessageCircle/>} label="Discussion" subtitle="Live Forums" colorTheme="violet" onClick={() => addBlock('discussion')} />
             <InjectorButton icon={<Mic/>} label="Pronunciation" subtitle="Lab Matrix" colorTheme="emerald" onClick={() => addBlock('pronunciation')} />
             
             {/* 👑 PREMIUM BLOCKS (PRO) */}
             <InjectorButton 
                 icon={<Gamepad2/>} label="Game" subtitle="Multiplayer" colorTheme="rose" isPremium={true} 
                 onClick={() => handlePremiumBlockClick('game')} 
             />
             <InjectorButton 
                 icon={<Activity/>} label="Audio Story" subtitle="Listening Comp" colorTheme="indigo" isPremium={true} 
                 onClick={() => handlePremiumBlockClick('audio-story')} 
             />
             <InjectorButton 
                 icon={<Search/>} label="Hotspot" subtitle="Interactive Map" colorTheme="cyan" isPremium={true} 
                 onClick={() => handlePremiumBlockClick('image-hotspot')} 
             />
             <InjectorButton 
                 icon={<Wand2/>} label="Roleplay" subtitle="AI Simulation" colorTheme="fuchsia" isPremium={true} 
                 onClick={() => handlePremiumBlockClick('roleplay')} 
             />
          </div>
        </div>
      )}
    </div>
  );
}
