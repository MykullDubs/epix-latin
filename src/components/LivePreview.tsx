// src/components/LivePreview.tsx
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { THEMES } from '../constants/defaults';
import ConnectThreeVocab from './ConnectThreeVocab';

const LivePreview = ({ data }: any) => {
  const currentTheme = THEMES[data?.theme || 'indigo'] || THEMES['indigo'];

  // --- AUTOMATIC VOCABULARY EXTRACTOR ---
  // Scrapes the entire lesson architecture to find vocab-lists for the game
  const lessonVocab = data?.blocks
    ?.filter((b: any) => b.type === 'vocab-list')
    ?.flatMap((b: any) => b.items) || [];

  return (
    <div className={`w-full h-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[12px] border-slate-900 transition-all duration-700 ${currentTheme.font}`}>
      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
        <div className={`text-center border-b ${currentTheme.border} pb-8`}>
           <span className={`text-[10px] font-black ${currentTheme.accent} uppercase tracking-[0.4em] mb-2 block`}>
             {data.subtitle || "MAGISTER STUDIO"}
           </span>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{data.title || "Untitled Unit"}</h1>
        </div>
        
        {data.blocks?.map((b: any, i: number) => (
          <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {b.type === 'text' && (
               <div className="space-y-4 text-center">
                 {b.title && <h3 className={`${currentTheme.accent} font-black uppercase text-xs tracking-widest`}>{b.title}</h3>}
                 <p className="text-[3vh] font-black text-slate-800 leading-tight tracking-tighter">{b.content}</p>
               </div>
             )}

            {b.type === 'fill-blank' && (
                <div className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Fill in the Blank</span>
                  <h3 className="font-bold text-sm mb-4">{b.question}</h3>
                  <div className="text-sm font-medium leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl">
                      {b.text?.split(/\[(.*?)\]/g).map((part: string, j: number) => 
                          j % 2 === 0 ? part : <span key={j} className="inline-block w-16 h-6 border-b-2 border-slate-300 mx-1 border-dashed"></span>
                      )}
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap opacity-60">
                      {b.distractors?.map((d: string, j: number) => <span key={j} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">{d}</span>)}
                  </div>
                </div>
             )}
             
             {b.type === 'essay' && (
               <div className="space-y-6">
                 <h2 className={`text-center text-2xl font-black ${currentTheme.accent} tracking-tighter`}>{b.title}</h2>
                 <div className="space-y-4">
                   {b.content?.split('\n\n').map((p: string, j: number) => (
                     <p key={j} className="text-sm text-slate-600 leading-relaxed text-justify first-letter:text-xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-1">{p}</p>
                   ))}
                 </div>
               </div>
             )}
             
            {b.type === 'discussion' && (
                <div className="bg-indigo-50 border-2 border-indigo-100 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-black text-indigo-900 text-sm mb-4 flex items-center gap-2">
                    <MessageCircle size={16}/> {b.title || "Discussion"}
                  </h3>
                  <div className="space-y-3">
                    {b.questions?.map((q: string, j: number) => (
                      <div key={j} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-50 flex gap-3">
                        <span className="text-indigo-300 font-bold text-xs">{j + 1}</span>
                        <p className="text-slate-700 font-medium text-xs">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {b.type === 'image' && (
               <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={b.url} alt="preview" className="w-full object-cover" />
                  {b.caption && <p className="text-[10px] text-center p-2 text-slate-500 font-bold bg-slate-50">{b.caption}</p>}
               </div>
             )}

             {b.type === 'vocab-list' && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Vocabulary</h3>
                  {b.items?.map((item: any, j: number) => (
                    <div key={j} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                      <span className="font-black text-indigo-600 text-sm">{item.term}</span>
                      <span className="text-xs font-medium text-slate-600">{item.definition}</span>
                    </div>
                  ))}
                </div>
             )}

             {b.type === 'dialogue' && (
                <div className="space-y-3">
                  {b.lines?.map((line: any, j: number) => (
                    <div key={j} className={`flex items-end gap-2 ${line.side === 'right' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 ${line.side === 'right' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                        {line.speaker?.[0].toUpperCase()}
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs font-medium ${line.side === 'right' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                        {line.text}
                      </div>
                    </div>
                  ))}
                </div>
             )}

             {b.type === 'quiz' && (
                <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-lg">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Quiz Preview</span>
                  <h3 className="font-bold text-sm mb-4">{b.question}</h3>
                  <div className="space-y-2">
                    {b.options?.map((opt: any, j: number) => (
                      <div key={j} className={`p-3 rounded-lg text-xs font-bold ${b.correctId === opt.id ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 text-slate-300'}`}>
                        {opt.text} {b.correctId === opt.id && "✓"}
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {b.type === 'scenario' && (
                <div className="bg-emerald-900 p-5 rounded-2xl text-white shadow-lg border-2 border-emerald-500">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Interactive Scenario</span>
                  <h3 className="font-bold text-sm italic">"{b.nodes?.[0]?.text || 'Scenario starting point...'}"</h3>
                  <p className="text-xs text-emerald-200 mt-2">({b.nodes?.length} branching nodes configured)</p>
                </div>
             )}

             {/* --- NEW GAME DEPLOYMENT --- */}
             {b.type === 'game' && b.gameType === 'connect-three' && (
                 <div className="my-8 animate-in fade-in slide-in-from-bottom-4">
                     <div className="text-center mb-6">
                         <h3 className="text-2xl font-black text-slate-800">{b.title || "Vocabulary Battle"}</h3>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Pass & Play • Connect 3</p>
                     </div>
                     
                     {/* Scale down slightly to ensure it looks flawless in the mobile preview container */}
                     <div className="scale-95 origin-top">
                        <ConnectThreeVocab vocabList={lessonVocab} />
                     </div>
                 </div>
             )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default LivePreview;
