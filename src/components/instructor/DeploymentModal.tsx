// src/components/instructor/DeploymentModal.tsx
import React, { useState } from 'react';
import { 
    X, Send, Search, Layers, FileText, 
    Milestone, ShieldCheck, Zap, Target,
    Loader2, CheckCircle2, Gamepad2, Presentation, Inbox, HelpCircle, Crown, Lock, Type
} from 'lucide-react';

export default function DeploymentModal({ 
    isOpen, 
    onClose, 
    onDeploy, 
    activeClass, 
    lessons = [], 
    allDecks = {}, 
    curriculums = [],
    isPro,             // 🔥 ADDED FREEMIUM GATE
    onUpgradeRequest   // 🔥 ADDED UPGRADE TRIGGER
}: any) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'deck' | 'lesson' | 'curriculum'>('deck');
    
    // 🔥 UPDATED: Added 'marble_scrabble' to the valid state types
    const [deployMode, setDeployMode] = useState<'assign' | 'presentation' | 'trivia' | 'connect_four' | 'slipstream' | 'marble_scrabble'>('assign');
    const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'success'>('idle');

    if (!isOpen) return null;

    // Flatten and categorize content
    const decksArray = Object.entries(allDecks).map(([id, d]: any) => ({ ...d, id, type: 'deck' }));
    const allContent = [
        ...decksArray,
        ...lessons.map((l: any) => ({ ...l, type: 'lesson' })),
        ...curriculums.map((c: any) => ({ ...c, type: 'curriculum' }))
    ];

    const filteredContent = allContent.filter(item => 
        (item.title || item.name || '').toLowerCase().includes(search.toLowerCase()) &&
        item.type === selectedType
    );

    // 🔥 UPDATED: Added Marble Scrabble to the available protocols
    const availableProtocols = [
        { id: 'assign', label: 'Silent Assign', icon: Inbox, pro: false, validFor: ['lesson', 'deck', 'curriculum'] },
        { id: 'presentation', label: 'Live Sync', icon: Presentation, pro: false, validFor: ['lesson'] },
        { id: 'trivia', label: 'Trivia Arena', icon: HelpCircle, pro: false, validFor: ['deck'] },
        { id: 'connect_four', label: 'Connect 4', icon: Gamepad2, pro: true, validFor: ['deck'] },
        { id: 'slipstream', label: 'Slipstream', icon: Zap, pro: true, validFor: ['deck'] },
        { id: 'marble_scrabble', label: 'Scrabble', icon: Type, pro: true, validFor: ['deck'] }, // <--- ADDED HERE
    ].filter(p => p.validFor.includes(selectedType));

    const handleProtocolClick = (protocolId: string, isPremium: boolean) => {
        if (isPremium && !isPro) {
            onClose(); // Close this modal to prevent stacking
            if (onUpgradeRequest) onUpgradeRequest();
        } else {
            setDeployMode(protocolId as any);
        }
    };

    const handleDeploy = () => {
        if (!selectedId) return;
        
        // 1. Trigger the "Uplink" sequence
        setDeployState('deploying');
        
        setTimeout(() => {
            // 2. Show Success
            setDeployState('success');
            
            // 3. Execute database change & close modal
            setTimeout(() => {
                onDeploy({ classId: activeClass.id, contentId: selectedId, mode: deployMode });
                setDeployState('idle');
                setSelectedId(null);
                setDeployMode('assign');
                onClose();
            }, 1000);
        }, 1500); 
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => deployState === 'idle' && onClose()} />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3 uppercase italic">
                            <Target size={24} className="text-indigo-500" /> Initialize Deployment
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                            Targeting Fleet: <span className="text-indigo-500">{activeClass?.name}</span>
                        </p>
                    </div>
                    {deployState === 'idle' && (
                        <button onClick={onClose} className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm relative z-10">
                            <X size={20} strokeWidth={3} />
                        </button>
                    )}
                </div>

                {/* Content Picker OR Deployment Screen */}
                <div className="p-8 flex flex-col h-[550px] relative">
                    
                    {deployState !== 'idle' ? (
                        // 🔥 THE TACTICAL UPLINK SCREEN
                        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-12 animate-in fade-in duration-300">
                            {deployState === 'deploying' ? (
                                <>
                                    <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-indigo-100 dark:border-slate-800 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                                        <Zap size={32} className="text-indigo-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white mb-2">Establishing Uplink</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Transmitting Protocol: {deployMode}...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-500 mb-2">Payload Delivered</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mission Data Synced</p>
                                </>
                            )}
                        </div>
                    ) : (
                        // STANDARD SELECTION SCREEN
                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 shrink-0">
                                {[
                                    { id: 'deck', label: 'Flash Decks', icon: Layers },
                                    { id: 'lesson', label: 'Lessons', icon: FileText },
                                    { id: 'curriculum', label: 'Pathways', icon: Milestone }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { 
                                            setSelectedType(tab.id as any); 
                                            setSelectedId(null); 
                                            setDeployMode('assign'); // Reset mode on tab switch
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                            selectedType === tab.id 
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <tab.icon size={14} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative mb-6 shrink-0">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Scan content database..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-sm font-bold text-slate-700 dark:text-white transition-all shadow-inner"
                                />
                            </div>

                            {/* Content List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 mb-6">
                                {filteredContent.length > 0 ? filteredContent.map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedId(item.id)}
                                        className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                                            selectedId === item.id 
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' 
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl transition-colors ${selectedId === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-indigo-400'}`}>
                                                {selectedType === 'deck' ? <Layers size={18} /> : selectedType === 'lesson' ? <FileText size={18} /> : <Milestone size={18} />}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-black transition-colors ${selectedId === item.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {item.title || item.name}
                                                </p>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedId === item.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                                                    {item.cards?.length || item.steps?.length || 0} Components
                                                </span>
                                            </div>
                                        </div>
                                        {selectedId === item.id && <ShieldCheck size={20} className="text-indigo-500 animate-in zoom-in" />}
                                    </button>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                                        <Zap size={48} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs">No matching content found</p>
                                    </div>
                                )}
                            </div>

                            {/* PROTOCOL SELECTOR */}
                            {selectedId && availableProtocols.length > 0 && (
                                <div className="shrink-0 animate-in slide-in-from-bottom-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select Deployment Protocol</label>
                                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                        {availableProtocols.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleProtocolClick(p.id, p.pro)}
                                                className={`flex-1 min-w-[120px] flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                                                    deployMode === p.id 
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' 
                                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-indigo-300'
                                                }`}
                                            >
                                                {p.pro && (
                                                    <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 p-1 rounded-bl-lg shadow-sm">
                                                        <Crown size={10} strokeWidth={3} />
                                                    </div>
                                                )}
                                                <p.icon size={18} className={deployMode === p.id ? 'text-indigo-500' : 'text-slate-400'} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <Zap size={14} className="animate-pulse text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Syncing with Magister Cloud</span>
                    </div>
                    <button 
                        onClick={handleDeploy}
                        disabled={!selectedId || deployState !== 'idle'}
                        className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:shadow-none"
                    >
                        {deployState !== 'idle' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                        Finalize Deployment
                    </button>
                </div>
            </div>
        </div>
    );
}
