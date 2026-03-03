// src/components/instructor/LessonBuilderView.tsx
import React, { useState, useEffect } from 'react';
import { 
    Code, Trash2, AlignLeft, FileText, MessageSquare, 
    List, HelpCircle, Image, Puzzle, MessageCircle, Gamepad2, X, Info 
} from 'lucide-react';

export function InjectorButton({ icon, label, onClick }: any) {
    return (
      <button 
        onClick={onClick} 
        className="h-28 bg-white border-2 border-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-xl transition-all active:scale-90 group"
      >
        <div className="text-slate-300 group-hover:text-indigo-600 transition-colors scale-125">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </button>
    );
}

export default function LessonBuilderView({ data, setData }: any) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2));

  const updateBlock = (index: number, field: string, value: any) => {
    const newBlocks = [...(data.blocks || [])];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setData({ ...data, blocks: newBlocks });
  };

  const addBlock = (type: string) => {
    const templates: any = {
      text: { type: 'text', title: '', content: 'New Core Concept...' },
      essay: { type: 'essay', title: 'Deep Dive', content: 'Paragraph 1...\n\nParagraph 2...' },
      callout: { type: 'callout', label: 'Pro Tip', content: 'Did you know that...' }, // NEW
      dialogue: { type: 'dialogue', lines: [{ speaker: 'A', text: '', side: 'left' }] },
      'vocab-list': { type: 'vocab-list', items: [{ term: '', definition: '' }] },
      quiz: { type: 'quiz', question: '', options: [{id:'a',text:''},{id:'b',text:''}], correctId: 'a' },
      image: { type: 'image', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', caption: '' },
      'fill-blank': { type: 'fill-blank', question: 'Fill in the blanks:', text: 'The [quick] brown [fox] jumps.', distractors: ['slow', 'dog'] },
      discussion: { type: 'discussion', title: 'Discussion Time', questions: ['Question 1?', 'Question 2?', 'Question 3?'] },
      game: { type: 'game', gameType: 'connect-three', title: 'Vocabulary Battle' }
    };
    setData({ ...data, blocks: [...(data.blocks || []), templates[type]] });
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...(data.blocks || [])].filter((_, i) => i !== index);
    setData({ ...data, blocks: newBlocks });
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
    <div className="max-w-3xl mx-auto space-y-12 pb-64">
      <div className="flex justify-between items-center bg-slate-100/50 p-2 rounded-[2rem] border border-slate-200">
         <button onClick={() => setJsonMode(!jsonMode)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${jsonMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}>
            <Code size={14} /> {jsonMode ? 'Exit JSON' : 'Advanced JSON'}
         </button>
      </div>

      {jsonMode ? (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl">
            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-[60vh] bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none" />
          </div>
          <button onClick={handleImportJson} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-emerald-400">Inject Architecture</button>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="space-y-4 px-2">
            <input className="text-5xl font-black border-none w-full focus:ring-0 p-0 tracking-tighter bg-transparent outline-none" placeholder="Unit Title..." value={data.title || ''} onChange={e => setData({...data, title: e.target.value})} />
            <input className="text-xl font-bold text-slate-400 border-none w-full focus:ring-0 p-0 tracking-tight bg-transparent outline-none" placeholder="Subtitle..." value={data.subtitle || ''} onChange={e => setData({...data, subtitle: e.target.value})} />
          </div>

          <div className="space-y-6">
            {(data.blocks || []).map((block: any, idx: number) => (
              <div key={idx} className="group bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-200 transition-all relative">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                       <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">{idx + 1}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.type}</span>
                   </div>
                   <button onClick={() => removeBlock(idx)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                </div>

                {/* TEXT EDITOR */}
                {block.type === 'text' && (
                  <textarea 
                    className="w-full bg-slate-50 rounded-xl p-4 font-black text-xl border-none focus:ring-2 focus:ring-indigo-100 resize-none h-32 outline-none" 
                    placeholder="Punchy text content..."
                    value={block.content} 
                    onChange={e => updateBlock(idx, 'content', e.target.value)} 
                  />
                )}

                {/* ESSAY EDITOR */}
                {block.type === 'essay' && (
                  <div className="space-y-4">
                    <input className="w-full font-black text-slate-800 bg-slate-50 border-none px-5 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Essay Title" value={block.title} onChange={e => updateBlock(idx, 'title', e.target.value)} />
                    <textarea className="w-full h-48 bg-slate-50 border-none p-5 rounded-xl text-xs font-serif leading-relaxed focus:ring-2 focus:ring-indigo-100 outline-none resize-none" placeholder="Paragraph 1...\n\nParagraph 2..." value={block.content} onChange={e => updateBlock(idx, 'content', e.target.value)} />
                  </div>
                )}

                {/* --- NEW: CALLOUT EDITOR --- */}
                {block.type === 'callout' && (
                  <div className="space-y-4 bg-amber-50 p-5 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={16} className="text-amber-500" />
                        <span className="text-xs font-bold text-amber-800">Grammar Spotlight / Pro-Tip</span>
                    </div>
                    <input 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-200 outline-none" 
                        placeholder="Label (e.g. Pro Tip, Grammar Focus)" 
                        value={block.label || ''} 
                        onChange={e => updateBlock(idx, 'label', e.target.value)} 
                    />
                    <textarea 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm italic focus:ring-2 focus:ring-amber-200 outline-none resize-none h-24" 
                        placeholder="Callout content..." 
                        value={block.content || ''} 
                        onChange={e => updateBlock(idx, 'content', e.target.value)} 
                    />
                  </div>
                )}

                {/* IMAGE EDITOR */}
                {block.type === 'image' && (
                  <div className="space-y-3">
                    <input className="w-full bg-slate-50 border-none p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Unsplash Image URL" value={block.url || ''} onChange={e => updateBlock(idx, 'url', e.target.value)} />
                    <input className="w-full bg-slate-50 border-none p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Image Caption (Optional)" value={block.caption || ''} onChange={e => updateBlock(idx, 'caption', e.target.value)} />
                  </div>
                )}

                {/* VOCAB LIST EDITOR */}
                {block.type === 'vocab-list' && (
                  <div className="space-y-3">
                    {(block.items || []).map((item: any, iIdx: number) => (
                       <div key={iIdx} className="flex gap-2">
                          <input className="w-1/3 bg-slate-50 border-none p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Term" value={item.term} onChange={e => { const newItems = [...block.items]; newItems[iIdx].term = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <input className="flex-1 bg-slate-50 border-none p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Definition" value={item.definition} onChange={e => { const newItems = [...block.items]; newItems[iIdx].definition = e.target.value; updateBlock(idx, 'items', newItems); }} />
                          <button onClick={() => { const newItems = block.items.filter((_:any, i:number) => i !== iIdx); updateBlock(idx, 'items', newItems); }} className="p-3 text-slate-300 hover:text-rose-500"><X size={16}/></button>
                       </div>
                    ))}
                    <button onClick={() => updateBlock(idx, 'items', [...(block.items||[]), {term:'', definition:''}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">+ Add Word</button>
                  </div>
                )}

                {/* QUIZ EDITOR */}
                {block.type === 'quiz' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <textarea className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold resize-none h-20 outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Quiz Question..." value={block.question || ''} onChange={e => updateBlock(idx, 'question', e.target.value)} />
                     <div className="space-y-2 mt-4">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Options (Select Correct)</span>
                       {(block.options || []).map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-2">
                             <input type="radio" className="w-4 h-4 text-indigo-600" checked={block.correctId === opt.id} onChange={() => updateBlock(idx, 'correctId', opt.id)} />
                             <input className="w-12 bg-white border border-slate-200 p-2 rounded-lg text-xs font-mono text-center outline-none" placeholder="ID" value={opt.id} onChange={e => { const newOpts = [...block.options]; newOpts[oIdx].id = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                             <input className="flex-1 bg-white border border-slate-200 p-2 rounded-lg text-sm outline-none" placeholder="Answer Text" value={opt.text} onChange={e => { const newOpts = [...block.options]; newOpts[oIdx].text = e.target.value; updateBlock(idx, 'options', newOpts); }} />
                          </div>
                       ))}
                       <button onClick={() => updateBlock(idx, 'options', [...(block.options||[]), {id: String.fromCharCode(97 + (block.options?.length || 0)), text: ''}])} className="text-xs font-bold text-indigo-500 mt-2 hover:underline">+ Add Option</button>
                     </div>
                  </div>
                )}

                {/* DIALOGUE EDITOR */}
                {block.type === 'dialogue' && (
                  <div className="space-y-3">
                     {(block.lines || []).map((line: any, lIdx: number) => (
                        <div key={lIdx} className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100 relative">
                           <button onClick={() => { const newLines = block.lines.filter((_:any, i:number) => i !== lIdx); updateBlock(idx, 'lines', newLines); }} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X size={14}/></button>
                           <div className="flex gap-2 pr-6">
                             <input className="w-1/4 bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none" placeholder="Speaker" value={line.speaker} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].speaker = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                             <select className="bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-500 outline-none" value={line.side} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].side = e.target.value; updateBlock(idx, 'lines', newLines); }}>
                                <option value="left">Left Side</option><option value="right">Right Side</option>
                             </select>
                           </div>
                           <textarea className="w-full bg-white border border-slate-200 p-3 rounded-lg text-sm resize-none outline-none" placeholder="What are they saying?" value={line.text} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].text = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                           <input className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs italic text-slate-500 outline-none" placeholder="Translation / Context note" value={line.translation || ''} onChange={e => { const newLines = [...block.lines]; newLines[lIdx].translation = e.target.value; updateBlock(idx, 'lines', newLines); }} />
                        </div>
                     ))}
                     <button onClick={() => updateBlock(idx, 'lines', [...(block.lines||[]), {speaker:'A', text:'', side:'left'}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors">+ Add Dialogue Line</button>
                  </div>
                )}

                {/* DISCUSSION EDITOR */}
                {block.type === 'discussion' && (
                  <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                     <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={16} className="text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900">Discussion Block</span>
                     </div>
                     <input 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 outline-none" 
                        placeholder="Title (e.g. Talk about it!)" 
                        value={block.title || ''} 
                        onChange={e => updateBlock(idx, 'title', e.target.value)} 
                     />
                     <div className="space-y-3">
                       {(block.questions || []).map((q: string, qIdx: number) => (
                          <div key={qIdx} className="flex gap-2">
                            <span className="flex-none p-3 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">{qIdx + 1}</span>
                            <input 
                              className="flex-1 bg-white border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" 
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
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Puzzle size={16} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-600">Drag & Drop Configurator</span>
                     </div>
                     <input 
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                        placeholder="Instruction (e.g., Fill in the missing verbs)" 
                        value={block.question || ''} 
                        onChange={e => updateBlock(idx, 'question', e.target.value)} 
                     />
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Sentence (Use [brackets] for blanks)</label>
                       <textarea 
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-mono resize-none h-24 focus:ring-2 focus:ring-indigo-100 outline-none" 
                          placeholder="I want to buy [apples] at the [store]." 
                          value={block.text || ''} 
                          onChange={e => updateBlock(idx, 'text', e.target.value)} 
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Distractor Words (Comma separated)</label>
                       <input 
                          className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none" 
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
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-10 border-t border-slate-100">
             <InjectorButton icon={<AlignLeft/>} label="Text" onClick={() => addBlock('text')} />
             <InjectorButton icon={<FileText/>} label="Essay" onClick={() => addBlock('essay')} />
             <InjectorButton icon={<Info/>} label="Callout" onClick={() => addBlock('callout')} /> {/* NEW BUTTON */}
             <InjectorButton icon={<MessageSquare/>} label="Dialogue" onClick={() => addBlock('dialogue')} />
             <InjectorButton icon={<List/>} label="Vocab" onClick={() => addBlock('vocab-list')} />
             <InjectorButton icon={<HelpCircle/>} label="Quiz" onClick={() => addBlock('quiz')} />
             <InjectorButton icon={<Image/>} label="Visual" onClick={() => addBlock('image')} />
             <InjectorButton icon={<Puzzle/>} label="Fill Blank" onClick={() => addBlock('fill-blank')} />
             <InjectorButton icon={<MessageCircle/>} label="Discussion" onClick={() => addBlock('discussion')} />
             <InjectorButton icon={<Gamepad2/>} label="Game" onClick={() => addBlock('game')} />
          </div>
        </div>
      )}
    </div>
  );
}
