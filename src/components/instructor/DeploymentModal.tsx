import React, { useState, useMemo } from 'react';
import { X, Send, Search, Layers, FileText, Milestone, Zap, Target, Loader2, CheckCircle2, Gamepad2, Presentation, Inbox, HelpCircle, Crown, Type } from 'lucide-react';

// 1. Move config OUTSIDE the component so it isn't recreated on render
const PROTOCOLS = [
    { id: 'assign', label: 'Silent Assign', icon: Inbox, pro: false, validFor: ['lesson', 'deck', 'curriculum'] },
    { id: 'presentation', label: 'Live Sync', icon: Presentation, pro: false, validFor: ['lesson'] },
    { id: 'trivia', label: 'Trivia Arena', icon: HelpCircle, pro: false, validFor: ['deck'] },
    { id: 'connect_four', label: 'Connect 4', icon: Gamepad2, pro: true, validFor: ['deck'] },
    { id: 'slipstream', label: 'Slipstream', icon: Zap, pro: true, validFor: ['deck'] },
    { id: 'marble_scrabble', label: 'Scrabble', icon: Type, pro: true, validFor: ['lesson', 'deck'] },
];

export default function DeploymentModal({ isOpen, onClose, onDeploy, activeClass, lessons = [], allDecks = {}, curriculums = [], isPro, onUpgradeRequest }: any) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<'deck' | 'lesson' | 'curriculum'>('deck');
    const [deployMode, setDeployMode] = useState('assign');
    const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'success'>('idle');

    // 2. Memoize content to prevent re-filtering on every keystroke
    const filteredContent = useMemo(() => {
        const decksArray = Object.entries(allDecks).map(([id, d]: any) => ({ ...d, id, type: 'deck' }));
        const allContent = [...decksArray, ...lessons.map((l: any) => ({ ...l, type: 'lesson' })), ...curriculums.map((c: any) => ({ ...c, type: 'curriculum' }))];
        return allContent.filter(item => 
            item.type === selectedType && (item.title || item.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [allDecks, lessons, curriculums, selectedType, search]);

    const availableProtocols = PROTOCOLS.filter(p => p.validFor.includes(selectedType));

    if (!isOpen) return null;

    const handleProtocolClick = (protocolId: string, isPremium: boolean) => {
        if (isPremium && !isPro) return onUpgradeRequest?.();
        setDeployMode(protocolId);
    };

    const handleDeploy = async () => {
        if (!selectedId) return;
        setDeployState('deploying');
        // Simulate network
        await new Promise(r => setTimeout(r, 1500));
        setDeployState('success');
        setTimeout(() => {
            onDeploy({ classId: activeClass.id, contentId: selectedId, mode: deployMode });
            onClose();
            setDeployState('idle');
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => deployState === 'idle' && onClose()} />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 uppercase italic">
                            <Target size={24} className="text-indigo-500" /> Initialize Deployment
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            Targeting: <span className="text-indigo-500">{activeClass?.name}</span>
                        </p>
                    </div>
                </header>

                <div className="p-8 h-[550px] relative">
                    {/* Simplified Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: 'deck', label: 'Flash Decks', icon: Layers },
                            { id: 'lesson', label: 'Lessons', icon: FileText },
                            { id: 'curriculum', label: 'Pathways', icon: Milestone }
                        ].map((tab) => (
                            <TabButton key={tab.id} active={selectedType === tab.id} onClick={() => { setSelectedType(tab.id as any); setSelectedId(null); }} {...tab} />
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search database..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl outline-none" />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-6 h-64">
                         {filteredContent.map(item => (
                             <ContentRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)} icon={selectedType} />
                         ))}
                    </div>

                    {/* Protocols */}
                    {selectedId && (
                        <div className="animate-in slide-in-from-bottom-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Protocol</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {availableProtocols.map(p => (
                                    <ProtocolButton key={p.id} {...p} active={deployMode === p.id} onClick={() => handleProtocolClick(p.id, p.pro)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 3. Extracted Helper Components for Cleanliness
const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={14} /> {label}
    </button>
);

const ProtocolButton = ({ active, onClick, icon: Icon, label, pro }: any) => (
    <button onClick={onClick} className={`min-w-[100px] p-3 rounded-2xl border-2 flex flex-col items-center gap-1 relative ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100'}`}>
        {pro && <Crown size={10} className="absolute top-1 right-1 text-amber-500" />}
        <Icon size={16} className={active ? 'text-indigo-600' : 'text-slate-400'} />
        <span className="text-[9px] font-black uppercase">{label}</span>
    </button>
);

const ContentRow = ({ item, selected, onClick, icon }: any) => (
    <button onClick={onClick} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100'}`}>
        <span className="text-sm font-bold">{item.title || item.name}</span>
        {selected && <ShieldCheck size={16} className="text-indigo-500" />}
    </button>
);
