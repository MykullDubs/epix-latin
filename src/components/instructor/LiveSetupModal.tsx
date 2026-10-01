// src/components/instructor/LiveSetupModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
    X, Send, Search, Layers, FileText, Milestone, 
    Zap, Target, Loader2, Gamepad2, 
    Presentation, Inbox, HelpCircle, Crown, Type, 
    ShieldCheck, Users
} from 'lucide-react';

const PROTOCOLS = [
    { id: 'assign', label: 'Assign to Dashboard', icon: Inbox, pro: false, validFor: ['lesson', 'deck', 'curriculum'] },
    { id: 'presentation', label: 'Live Sync', icon: Presentation, pro: false, validFor: ['lesson'] },
    { id: 'trivia', label: 'Trivia Arena', icon: HelpCircle, pro: false, validFor: ['deck'] },
    { id: 'connect_four', label: 'Connect 4', icon: Gamepad2, pro: true, validFor: ['deck'] },
    { id: 'slipstream', label: 'Slipstream', icon: Zap, pro: true, validFor: ['deck'] },
    { id: 'marble_scrabble', label: 'Scrabble', icon: Type, pro: true, validFor: ['lesson', 'deck'] },
];

export default function LiveSetupModal({ 
    isOpen, 
    onClose, 
    onDeploy, 
    classes = [], 
    lessons = [], 
    decks = {}, 
    curriculums = [], 
    preselectedContent,
    isPro, 
    onUpgradeRequest 
}: any) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'deck' | 'lesson' | 'curriculum'>('deck');
    const [deployMode, setDeployMode] = useState('');
    const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'success'>('idle');

    // Auto-hydrate the modal if opened from the Vault/Library
    useEffect(() => {
        if (isOpen) {
            if (preselectedContent) {
                setSelectedId(preselectedContent.id);
                setSelectedType(preselectedContent.type as any);
                setDeployMode(preselectedContent.type === 'lesson' ? 'presentation' : 'trivia');
            } else {
                setSelectedId(null);
                setDeployMode('');
            }
        }
    }, [isOpen, preselectedContent]);

    // Memoize content to prevent re-filtering on every keystroke
    const filteredContent = useMemo(() => {
        const decksArray = Object.entries(decks || {}).map(([id, d]: any) => ({ ...d, id, type: 'deck' }));
        const allContent = [...decksArray, ...lessons.map((l: any) => ({ ...l, type: 'lesson' })), ...curriculums.map((c: any) => ({ ...c, type: 'curriculum' }))];
        return allContent.filter(item => 
            item.type === selectedType && 
            (item.id !== 'custom') && // Filter out the base custom deck
            (item.title || item.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [decks, lessons, curriculums, selectedType, search]);

    const availableProtocols = PROTOCOLS.filter(p => p.validFor.includes(selectedType));

    if (!isOpen) return null;

    const handleProtocolClick = (protocolId: string, isPremium: boolean) => {
        if (isPremium && !isPro && onUpgradeRequest) return onUpgradeRequest();
        setDeployMode(protocolId);
    };

    const handleDeploy = async () => {
        if (!selectedClassId || !selectedId || !deployMode) return;
        
        setDeployState('deploying');
        // Simulate network/build delay for UX
        await new Promise(r => setTimeout(r, 1200));
        setDeployState('success');
        
        setTimeout(() => {
            onDeploy({ classId: selectedClassId, contentId: selectedId, mode: deployMode });
            setDeployState('idle');
        }, 800);
    };

    const isReady = selectedClassId && selectedId && deployMode && deployState === 'idle';

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 font-sans">
            <div className="absolute inset-0" onClick={() => deployState === 'idle' && onClose()} />
            
            <div className="relative w-full max-w-2xl bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh]">
                
                {/* Header */}
                <header className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 hidden sm:block">
                            <Target size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Initialize Deployment</h2>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Configure live session parameters</p>
                        </div>
                    </div>
                    <button onClick={() => deployState === 'idle' && onClose()} className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all shadow-sm">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col custom-scrollbar">
                    
                    {/* STEP 1: Target Cohort */}
                    <div className="mb-8 shrink-0">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 ml-1 flex items-center gap-2">
                            <Users size={16} /> 1. Target Cohort
                        </label>
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-800 dark:text-white transition-all shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select a class...</option>
                            <option value="sandbox">⚡ Quick Launch (Test / Guest Mode)</option>
                            {classes.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* STEP 2: Content Selection */}
                    <div className="mb-8 flex-1 flex flex-col min-h-[300px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 ml-1 flex items-center gap-2">
                            <Layers size={16} /> 2. Select Content
                        </label>
                        
                        {/* Tabs */}
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-fit mb-4 shadow-inner border border-slate-200/50 dark:border-slate-800 select-none overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
                            {[
                                { id: 'deck', label: 'Flashcards', icon: Layers },
                                { id: 'lesson', label: 'Lessons', icon: FileText },
                                { id: 'curriculum', label: 'Pathways', icon: Milestone }
                            ].map((tab) => (
                                <TabButton 
                                    key={tab.id} 
                                    active={selectedType === tab.id} 
                                    onClick={() => { 
                                        setSelectedType(tab.id as any); 
                                        setSelectedId(null); 
                                        setDeployMode(tab.id === 'curriculum' ? 'assign' : ''); 
                                    }} 
                                    {...tab} 
                                />
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative mb-4 shrink-0 select-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search library..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none text-sm font-semibold text-slate-800 dark:text-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Content List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2 select-none border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 p-2">
                            {filteredContent.length > 0 ? filteredContent.map((item: any) => (
                                <ContentRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)} />
                            )) : (
                                <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-slate-400 py-10 opacity-70">
                                    <Zap size={28} className="mb-3 text-slate-300 dark:text-slate-600" />
                                    <p className="font-semibold text-sm">No matching content found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STEP 3: Protocol Selector */}
                    {selectedId && (
                        <div className="shrink-0 animate-in slide-in-from-bottom-4 duration-300 select-none bg-white dark:bg-slate-950 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 ml-1 flex items-center gap-2">
                                <Zap size={16} /> 3. Delivery Method
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {availableProtocols.map(p => (
                                    <ProtocolButton key={p.id} {...p} active={deployMode === p.id} onClick={() => handleProtocolClick(p.id, p.pro)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 select-none transition-colors">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Zap size={16} className="animate-pulse text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest">System Ready</span>
                    </div>
                    <button 
                        onClick={handleDeploy}
                        disabled={!isReady}
                        className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:shadow-none"
                    >
                        {deployState === 'deploying' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} 
                        {deployState === 'success' ? 'Deployed!' : 'Initialize Sequence'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Subcomponents

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button 
        onClick={onClick} 
        className={`flex-1 sm:flex-none min-w-fit px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'border border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/80'}`}
    >
        <Icon size={16} /> {label}
    </button>
);

const ProtocolButton = ({ active, onClick, icon: Icon, label, pro }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 relative transition-all active:scale-95 ${active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/50' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm'}`}
    >
        {pro && <Crown size={12} className="absolute top-2 right-2 text-amber-500 drop-shadow-sm" />}
        <Icon size={22} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
        <span className={`text-[11px] font-bold uppercase tracking-wider text-center ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
    </button>
);

const ContentRow = ({ item, selected, onClick }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full p-3.5 rounded-[1rem] border flex items-center justify-between transition-all group ${selected ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-800'}`}
    >
        <div className="flex items-center gap-4 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 transition-colors ${selected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                {item.type === 'lesson' ? <FileText size={16} /> : item.type === 'curriculum' ? <Milestone size={16} /> : <Layers size={16} />}
            </div>
            <p className={`text-sm font-semibold truncate ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {item.title || item.name}
            </p>
        </div>
        <div className={`shrink-0 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}>
            <ShieldCheck size={18} className="text-indigo-500" />
        </div>
    </button>
);
