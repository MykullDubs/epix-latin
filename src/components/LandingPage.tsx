// src/components/LandingPage.tsx
import React, { useEffect, useState } from 'react';
import { 
    ArrowRight, Sparkles, Wand2, MonitorPlay, 
    Smartphone, Zap, CheckCircle2, GraduationCap, 
    QrCode, BrainCircuit, Play, X, Quote, ZapOff, Clock, Server, BookOpen, Users, ChevronRight, Mic, Terminal
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// COMPONENT 1: THE LIVE ENGINE PLAYGROUND (Internal)
// ─────────────────────────────────────────────────────────────
const DEFAULT_PAYLOAD = `{
  "lessonId": "demo_01",
  "title": "Live Interactive Demo",
  "level": "C1",
  "pages": [
    {
      "pageNumber": 1,
      "blocks": [
        {
          "type": "text_block",
          "style": "heading_1",
          "content": "Real-time Payload Compilation"
        },
        {
          "type": "text_block",
          "style": "body",
          "content": "Edit the JSON on the left. The engine will instantly parse and render the structural blocks on the right."
        },
        {
          "type": "discussion_block",
          "prompt": "How does decoupling content from styling improve accessibility?",
          "guidelines": [
            "Use specific technical vocabulary.", 
            "Provide one concrete example."
          ]
        },
        {
          "type": "wrap_up_block",
          "summary": "By separating data from design, payloads render natively on any target device.",
          "objectivesMet": [
            "Analyzed JSON schema capabilities",
            "Compiled responsive visual blocks"
          ]
        }
      ]
    }
  ]
}`;

function LivePlayground() {
    const [rawJson, setRawJson] = useState(DEFAULT_PAYLOAD);
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
  
    // Real-time JSON Compilation
    useEffect(() => {
      try {
        const data = JSON.parse(rawJson);
        if (!data.pages || !Array.isArray(data.pages)) {
          throw new Error("Schema Error: Missing 'pages' array.");
        }
        setParsedData(data);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    }, [rawJson]);
  
    // The Mock Rendering Engine (Parses MagisterOS Blocks)
    const renderBlock = (block: any, index: number) => {
      switch (block.type) {
        case 'text_block':
          return (
            <div key={index} className="mb-5">
              {block.style === 'heading_1' && <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{block.content}</h1>}
              {block.style === 'heading_2' && <h2 className="text-xl font-bold text-slate-200 mb-2 tracking-tight">{block.content}</h2>}
              {block.style === 'body' && <p className="text-slate-400 text-sm leading-relaxed font-medium">{block.content}</p>}
            </div>
          );
        case 'discussion_block':
          return (
            <div key={index} className="mb-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Discussion Target</span>
              </div>
              <p className="text-white font-bold text-lg mb-4 relative z-10">{block.prompt}</p>
              {block.guidelines && (
                <ul className="space-y-1.5 relative z-10">
                  {block.guidelines.map((guide: string, i: number) => (
                    <li key={i} className="text-xs font-medium text-slate-400 flex items-start gap-2">
                      <span className="text-purple-500 font-bold shrink-0">→</span> {guide}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        case 'dialogue_block':
          return (
             <div key={index} className="mb-5 border-l-2 border-blue-500/50 pl-5 py-2">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-4">Dialogue Sequence</span>
               {block.turns?.map((turn: any, i: number) => (
                 <div key={i} className="mb-4 last:mb-0">
                   <span className="text-xs font-black text-slate-300 block mb-0.5">{turn.speaker}</span>
                   <span className="text-sm font-medium text-slate-400">{turn.text}</span>
                 </div>
               ))}
             </div>
          );
        case 'wrap_up_block':
          return (
             <div key={index} className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lesson Wrap-Up</span>
                </div>
                <p className="text-slate-300 font-medium text-sm leading-relaxed mb-5">{block.summary}</p>
                {block.objectivesMet && (
                  <div className="pt-4 border-t border-emerald-500/20">
                    <span className="text-[9px] uppercase tracking-widest font-black text-emerald-500 block mb-3">Objectives Confirmed</span>
                    <ul className="space-y-2">
                      {block.objectivesMet.map((obj: string, i: number) => (
                        <li key={i} className="text-xs font-medium text-emerald-100/70 flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-emerald-500/50" /> {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
             </div>
          );
        default:
          return (
            <div key={index} className="p-4 border border-red-500/30 bg-red-900/20 rounded-xl text-xs text-red-400 font-mono mb-4">
              Unrecognized Block Type: {block.type}
            </div>
          );
      }
    };
  
    return (
      <div className="flex flex-col md:flex-row h-[600px]">
        {/* Editor Panel */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-950/80 border-b md:border-b-0 md:border-r border-white/10">
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            className="flex-1 w-full bg-transparent text-indigo-300 font-mono text-xs p-6 focus:outline-none resize-none leading-relaxed selection:bg-indigo-500/30 custom-scrollbar"
            spellCheck={false}
          />
          {error && (
            <div className="bg-red-950/50 border-t border-red-500/20 p-3 text-[10px] font-mono text-red-400 flex items-center gap-2">
              <X size={12} /> {error}
            </div>
          )}
        </div>
  
        {/* Render Output Panel */}
        <div className="w-full md:w-1/2 flex flex-col relative overflow-hidden bg-slate-900">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
            {error ? (
               <div className="h-full flex items-center justify-center flex-col text-slate-600 gap-4">
                 <Server size={32} className="opacity-20" />
                 <p className="text-xs font-bold uppercase tracking-widest text-center">Engine Halted<br/>Awaiting Valid JSON</p>
               </div>
            ) : (
               <div className="animate-in fade-in duration-500">
                 {/* Metadata Header */}
                 <div className="mb-8 border-b border-white/10 pb-4 flex justify-between items-end">
                   <div>
                     <div className="inline-block px-2 py-1 bg-white/5 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border border-white/5">
                       Target Level: {parsedData?.level}
                     </div>
                     <h3 className="text-white font-black">{parsedData?.title}</h3>
                   </div>
                 </div>
                 
                 {/* Render Blocks from Page 1 */}
                 {parsedData?.pages?.[0]?.blocks?.map((block: any, index: number) => renderBlock(block, index))}
               </div>
            )}
          </div>
        </div>
      </div>
    );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT 2: THE MAIN LANDING PAGE EXPORT
// ─────────────────────────────────────────────────────────────
export default function LandingPage({ onGetStarted, onLogin, onJoinGuest, onStartPlacement }: any) {
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'survival' | 'professional' | 'grammar'>('all');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // MOCK CATALOG DATA
    const catalogItems = [
        { id: 1, title: 'Border Customs Survival', category: 'survival', price: '$4.99', level: 'A2', ai: true, image: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=600&auto=format&fit=crop' },
        { id: 2, title: 'The Angry Customer', category: 'professional', price: '$7.99', level: 'B1', ai: true, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop' },
        { id: 3, title: 'Past Tense Mastery', category: 'grammar', price: 'Free', level: 'A1', ai: false, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop' },
        { id: 4, title: 'Kitchen Comm Pro', category: 'professional', price: '$14.99', level: 'B2', ai: true, image: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=1200&auto=format&fit=crop' },
        { id: 5, title: 'Medical Emergency Vocab', category: 'survival', price: '$9.99', level: 'B2', ai: true, image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop' },
        { id: 6, title: 'Prepositions of Place', category: 'grammar', price: '$2.99', level: 'A2', ai: false, image: 'https://images.unsplash.com/photo-1503694978374-8a2fb5a0a0b1?q=80&w=600&auto=format&fit=crop' },
    ];

    const filteredItems = activeTab === 'all' ? catalogItems : catalogItems.filter(item => item.category === activeTab);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden pb-24">
            
            {/* FLOATING NAVBAR */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-[1rem] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <GraduationCap size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">Magister<span className="text-indigo-400">OS</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="hidden md:block text-sm font-bold text-slate-300 hover:text-white transition-colors">Instructor Login</button>
                        <button onClick={onGetStarted} className="bg-white text-slate-900 hover:bg-indigo-50 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
                            Start Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="max-w-5xl mx-auto relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-1000">
                    
                    {/* 🔥 BIG HERO PLACEMENT BANNER */}
                    <div className="mb-16 md:mb-20">
                        <div 
                            onClick={onStartPlacement}
                            className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/40 rounded-[2rem] border border-indigo-500/30 p-1 cursor-pointer hover:border-indigo-400/60 transition-all duration-300 group overflow-hidden relative shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:shadow-[0_0_60px_rgba(99,102,241,0.25)] hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="bg-slate-950/80 backdrop-blur-xl rounded-[1.8rem] p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shrink-0">
                                        <BrainCircuit size={28} className="text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-xl md:text-2xl tracking-tight mb-1">Incoming Student?</h3>
                                        <p className="text-slate-400 text-sm font-medium">Take the adaptive placement calibration to discover your true CEFR level.</p>
                                    </div>
                                </div>
                                <button className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all group-hover:shadow-indigo-500/25 flex items-center gap-3 w-full sm:w-auto justify-center">
                                    Start Protocol <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-2xl">
                            <Sparkles size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">The Next Generation LMS</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400">
                            Teach at the speed of <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">thought.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                            Magister OS transforms static PDFs and Wikipedia articles into gamified, highly interactive live classroom experiences in under 10 seconds using AI.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <button onClick={onGetStarted} className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3">
                                Launch Your Classroom <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="w-full max-w-5xl mx-auto aspect-video bg-black rounded-[2rem] md:rounded-[3rem] border-4 border-slate-800/80 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative overflow-hidden flex items-center justify-center group">
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center">
                                <MonitorPlay size={64} className="text-slate-700 mb-4" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Drop `hero_demo.mp4` here</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. BENTO BOX FEATURE GRID */}
            <section className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
                    <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 md:p-12 relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-500 flex flex-col md:flex-row items-center gap-8">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex-1 relative z-10">
                            <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                                <Wand2 size={28} />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight text-white mb-4">The Magic Generator</h3>
                            <p className="text-slate-400 font-medium text-lg">
                                Paste a Wikipedia link or YouTube transcript. Magister's AI instantly forges a complete interactive curriculum with vocab lists, quizzes, and fill-in-the-blanks.
                            </p>
                        </div>
                        <div className="w-full md:w-[280px] shrink-0 aspect-[3/4] bg-slate-950 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center px-4">`ai_speedlapse.mp4`</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-bl from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-500 flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                                <QrCode size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-white mb-3">Frictionless Entry</h3>
                            <p className="text-slate-400 font-medium text-sm">
                                No accounts required for live games. Display the QR code on your smartboard and watch 30 students join your arena in under 10 seconds.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. DUAL-SCREEN SYNC ENGINE SHOWCASE */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5 mt-12">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">Zero Latency. <br className="md:hidden"/>Absolute Control.</h2>
                    <p className="text-lg text-slate-400 font-medium">Powered by a high-speed Websocket architecture, Magister OS syncs your smartboard projector with 30 student phones simultaneously in real-time.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 relative">
                    <div className="w-full md:w-3/5 aspect-[16/10] bg-slate-900 rounded-[2rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="h-8 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-rose-500/50" /><div className="w-3 h-3 rounded-full bg-amber-500/50" /><div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                        </div>
                        <div className="flex-1 flex items-center justify-center p-6">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-600 text-center">Projector View<br/>`projector_sync.mp4`</span>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-col items-center justify-center gap-2 text-indigo-500 animate-pulse">
                        <Zap size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
                    </div>

                    <div className="w-2/3 md:w-1/4 aspect-[9/19] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-0 w-1/2 h-6 bg-slate-800 rounded-b-3xl" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center px-4">Student HUD<br/>`mobile_sync.mp4`</span>
                    </div>
                </div>
            </section>

            {/* 3.5 THE DEVELOPER ENGINE & DOCUMENTATION */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5 mt-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                            <Terminal size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Open Architecture</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
                            Content is data. <br className="hidden md:block"/> Layout is dynamic.
                        </h2>
                        <p className="text-lg text-slate-400 font-medium">
                            MagisterOS isn't just an app; it's a JSON-driven layout engine. 
                            Decouple your pedagogical content from hardcoded UI constraints. 
                            The engine renders flawless native widgets, smartboard slides, and mobile views from a single payload.
                        </p>
                    </div>
                </div>

                {/* Documentation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/10 p-8 hover:bg-slate-900 transition-colors">
                        <h3 className="text-white font-black text-xl mb-4 flex items-center gap-3">
                            <BrainCircuit size={20} className="text-indigo-400" /> Document Hierarchy
                        </h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            A strict object tree architecture. Root lesson metadata sequences directly into structured Page Arrays, isolating rendering canvases step-by-step for deterministic performance.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/10 p-8 hover:bg-slate-900 transition-colors">
                        <h3 className="text-white font-black text-xl mb-4 flex items-center gap-3">
                            <Server size={20} className="text-indigo-400" /> Core Visual Blocks
                        </h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            Translate raw properties directly into designated screen containers using our core schemas: <code className="text-xs text-indigo-300 bg-indigo-900/30 px-1 rounded">text_block</code>, <code className="text-xs text-indigo-300 bg-indigo-900/30 px-1 rounded">dialogue_block</code>, and <code className="text-xs text-indigo-300 bg-indigo-900/30 px-1 rounded">wrap_up_block</code>.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-[2.5rem] border border-white/10 p-8 hover:bg-slate-900 transition-colors">
                        <h3 className="text-white font-black text-xl mb-4 flex items-center gap-3">
                            <Zap size={20} className="text-indigo-400" /> Adaptive Constraints
                        </h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            Compile configurations filter structural layouts programmatically. The schema interpreter cleanly strips out smartphone interactions if the target device requires a strictly visual presentation.
                        </p>
                    </div>
                </div>

                {/* The Live Playground Injection */}
                <div className="relative group mt-16">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative rounded-[2.5rem] border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
                        
                        <div className="bg-slate-900/80 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">Live Engine Sandbox</span>
                            </div>
                            <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full font-mono uppercase tracking-wider shadow-inner">v1.6 Compiler Live</span>
                        </div>
                        
                        {/* THE LIVE COMPONENT IN ACTION */}
                        <LivePlayground />
                        
                    </div>
                </div>
            </section>

            {/* 4. THE PREMIUM LESSON CATALOG */}
            <section className="py-24 relative z-10 border-t border-white/5 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                                <Sparkles size={12} className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Premium Library</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Ready-to-teach modules.</h2>
                            <p className="text-slate-400 font-medium">A la Carte premium lessons with built-in AI Voice Roleplay.</p>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {[
                                { id: 'all', label: 'All Modules' },
                                { id: 'survival', label: 'Survival English' },
                                { id: 'professional', label: 'Professional' },
                                { id: 'grammar', label: 'Grammar Labs' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border-white/10 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-slate-950 rounded-[2rem] border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 group cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                <div className="relative h-48 overflow-hidden bg-slate-900">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
                                    {item.ai && (
                                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                                            <Mic size={14} className="text-cyan-400" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Live Voice AI</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-indigo-600/90 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-widest shadow-sm">
                                        {item.level}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-white leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2 mb-4">{item.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-6 mt-auto">
                                        <span className="flex items-center gap-1.5"><BookOpen size={14} /> 4 Modules</span>
                                        <span className="flex items-center gap-1.5"><Users size={14} /> 500+</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <span className="text-lg font-black text-white">{item.price}</span>
                                        <button className="text-indigo-400 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                            View Course <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. THE "WHY SWITCH?" MATRIX */}
            <section className="max-w-5xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black tracking-tight text-white mb-4">The LMS paradigm is broken.</h2>
                    <p className="text-slate-400 font-medium">See why educators are leaving legacy systems behind.</p>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-4 bg-slate-950/50 border-b border-white/10 p-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                        <div className="col-span-1">Feature</div>
                        <div className="col-span-1 text-center">Legacy LMS</div>
                        <div className="col-span-1 text-center">Game Apps</div>
                        <div className="col-span-1 text-center text-indigo-400">Magister OS</div>
                    </div>
                    
                    {[
                        { label: "AI Content Generation", legacy: false, games: false, magister: true },
                        { label: "Live Multiplayer Mode", legacy: false, games: true, magister: true },
                        { label: "Spaced Repetition Engine", legacy: false, games: false, magister: true },
                        { label: "Pronunciation Analysis", legacy: false, games: false, magister: true },
                        { label: "Offline Mobile App", legacy: false, games: false, magister: true },
                        { label: "Frictionless Setup", legacy: false, games: true, magister: true },
                    ].map((row, i) => (
                        <div key={i} className="grid grid-cols-4 p-6 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                            <div className="col-span-1 text-xs md:text-sm font-bold text-white pr-4">{row.label}</div>
                            <div className="col-span-1 flex justify-center">{row.legacy ? <CheckCircle2 className="text-emerald-500" /> : <X className="text-slate-700" />}</div>
                            <div className="col-span-1 flex justify-center">{row.games ? <CheckCircle2 className="text-emerald-500" /> : <X className="text-slate-700" />}</div>
                            <div className="col-span-1 flex justify-center"><div className="bg-indigo-500/20 p-2 rounded-full"><CheckCircle2 className="text-indigo-400" /></div></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. SOCIAL PROOF / TESTIMONIALS */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Built by educators, for educators.</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { quote: "Magister OS saved me 4 hours of lesson prep this week alone. The AI generator feels like cheating.", author: "Sarah J.", role: "High School ESL Teacher" },
                        { quote: "Finally, an LMS that doesn't feel like it was built in 2004. My students actually ask to play the vocab battles.", author: "David M.", role: "University Professor" },
                        { quote: "The zero-latency smartboard syncing is flawless. I display the QR code, and the whole class is locked in within seconds.", author: "Elena R.", role: "Instructional Designer" }
                    ].map((t, i) => (
                        <div key={i} className="bg-gradient-to-b from-slate-900 to-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative">
                            <Quote size={40} className="text-indigo-500/20 absolute top-6 right-6" />
                            <p className="text-slate-300 font-medium leading-relaxed mb-8 relative z-10">"{t.quote}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-400">{t.author.charAt(0)}</div>
                                <div>
                                    <h4 className="text-sm font-black text-white">{t.author}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. PRICING SECTION */}
            <section className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-white/5 mt-12">
                <h2 className="text-4xl font-black tracking-tight text-white mb-4">Simple, transparent pricing.</h2>
                <p className="text-slate-400 font-medium mb-12">Stop paying for legacy software. Upgrade your classroom today.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 flex flex-col">
                        <h3 className="text-2xl font-black text-white mb-2">Basic Scholar</h3>
                        <div className="text-4xl font-black text-white mb-6">$0 <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">/ forever</span></div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> 1 Active Cohort</li>
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> Max 30 Students</li>
                            <li className="flex items-center gap-3 text-slate-300 font-bold"><CheckCircle2 size={18} className="text-slate-600"/> Standard Flashcards</li>
                            <li className="flex items-center gap-3 text-slate-500 font-bold opacity-50"><ZapOff size={18} className="text-slate-700"/> No AI Generation</li>
                        </ul>
                        <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs transition-colors">Start Free</button>
                    </div>

                    <div className="bg-gradient-to-b from-indigo-900 to-slate-900 rounded-[2.5rem] border-2 border-indigo-500 p-8 flex flex-col relative shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Most Popular</div>
                        <h3 className="text-2xl font-black text-white mb-2">Pro Instructor</h3>
                        <div className="text-4xl font-black text-white mb-6">$15 <span className="text-sm text-indigo-300 uppercase tracking-widest font-bold">/ month</span></div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Unlimited Cohorts</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Unlimited Students</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Gemini AI Magic Generator</li>
                            <li className="flex items-center gap-3 text-white font-bold"><CheckCircle2 size={18} className="text-indigo-400"/> Advanced Arena Games</li>
                        </ul>
                        <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-indigo-500/30">Upgrade to Pro</button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/10 mt-12 py-12 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <GraduationCap size={20} className="text-indigo-500" />
                    <span className="font-black tracking-tighter text-white">Magister<span className="text-indigo-400">OS</span></span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Built for modern educators.</p>
            </footer>
        </div>
    );
}
