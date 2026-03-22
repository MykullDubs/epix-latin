import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle } from 'lucide-react';

// The Blueprint Arrays (Available Bot Parts)
const PARTS = {
    base: ['box', 'cylinder', 'shadow', 'skull', 'square'],
    eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'robocop', 'round', 'sensor', 'smile'],
    mouth: ['bite', 'diagram', 'grill01', 'grill02', 'square01', 'square02'],
    top: ['antenna', 'antennaCrooked', 'bulb01', 'horns', 'radar', 'lights', 'pyramid']
};

const COLORS = ['4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b'];

export default function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const [config, setConfig] = useState(currentConfig || {
        base: 'skull',
        eyes: 'glow',
        mouth: 'bite',
        top: 'antenna',
        baseColor: '4f46e5'
    });

    const [activeTab, setActiveTab] = useState<'base' | 'eyes' | 'mouth' | 'top'>('base');

    // Dynamically build the render URL based on state
    const previewUrl = `https://api.dicebear.com/7.x/bottts/svg?base=${config.base}&eyes=${config.eyes}&mouth=${config.mouth}&top=${config.top}&baseColor=${config.baseColor}&backgroundColor=transparent`;

    const handleRandomize = () => {
        setConfig({
            base: PARTS.base[Math.floor(Math.random() * PARTS.base.length)],
            eyes: PARTS.eyes[Math.floor(Math.random() * PARTS.eyes.length)],
            mouth: PARTS.mouth[Math.floor(Math.random() * PARTS.mouth.length)],
            top: PARTS.top[Math.floor(Math.random() * PARTS.top.length)],
            baseColor: COLORS[Math.floor(Math.random() * COLORS.length)]
        });
    };

    const tabs = [
        { id: 'base', icon: Cpu, label: 'Chassis' },
        { id: 'eyes', icon: Eye, label: 'Optics' },
        { id: 'mouth', icon: Smile, label: 'Vocoder' },
        { id: 'top', icon: ArrowUpCircle, label: 'Hardware' }
    ];

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
                
                {/* HEADER & LIVE PREVIEW */}
                <div className="bg-slate-100 dark:bg-slate-800 p-8 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-slate-500 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                    
                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-full text-indigo-500 transition-colors" title="Randomize Protocol">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-[2rem] shadow-inner border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center p-4 relative mb-6">
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in" />
                    </div>

                    {/* Color Swatches */}
                    <div className="flex gap-2 justify-center bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                        {COLORS.map(color => (
                            <button 
                                key={color}
                                onClick={() => setConfig({ ...config, baseColor: color })}
                                className={`w-6 h-6 rounded-full transition-transform ${config.baseColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                                style={{ backgroundColor: `#${color}` }}
                            />
                        ))}
                    </div>
                </div>

                {/* THE WORKBENCH CONTROLS */}
                <div className="flex flex-col p-6 h-72">
                    
                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={18} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Part Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-3 gap-3">
                            {PARTS[activeTab].map((part) => {
                                const isSelected = config[activeTab] === part;
                                // Create a mini-preview of just that part if possible, or just the name
                                return (
                                    <button 
                                        key={part}
                                        onClick={() => setConfig({ ...config, [activeTab]: part })}
                                        className={`py-4 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        {part}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SAVE FOOTER */}
                <div className="p-6 pt-0">
                    <button 
                        onClick={() => onSave(previewUrl, config)}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                        <Save size={20} /> Save & Equip Avatar
                    </button>
                </div>
            </div>
        </div>
    );
}
