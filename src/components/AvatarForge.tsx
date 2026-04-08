// src/components/AvatarForge.tsx
import React, { useState } from 'react';
import { X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle, Headphones, Fingerprint } from 'lucide-react';

// 🔥 THE MASSIVE NEW INVENTORY OF BOTTTS PARTS
const FORGE_PARTS: Record<string, string[]> = {
    base: ['round01', 'round02', 'square01', 'square02', 'square03', 'square04', 'cylinder01', 'cylinder02', 'cylinder03', 'cylinder04', 'diamond01', 'diamond02', 'diamond03', 'diamond04', 'shield01', 'shield02', 'shield03'],
    eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'roundFrame01', 'roundFrame02', 'sensor', 'smile', 'squareFrame01', 'squareFrame02', 'visor', 'wallE', 'winking'],
    mouth: ['bite', 'diagram', 'dirge', 'face01', 'face02', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02', 'art01', 'art02', 'art03', 'art04', 'pixel1', 'pixel2', 'teeth01'],
    top: ['antenna', 'antennaCrooked', 'bulb01', 'floating', 'glowingBulb01', 'glowingBulb02', 'horns', 'lights', 'pyramid', 'radar', 'none', 'hat01', 'hat02', 'plume', 'spikes', 'exhaust', 'siren'],
    sides: ['antenna01', 'antenna02', 'cables01', 'cables02', 'round', 'square', 'squareAssymetric', 'none', 'wings', 'pincers', 'speakers', 'exhaust01', 'exhaust02', 'panels01', 'panels02'],
    texture: ['camo01', 'camo02', 'circuits', 'dirty01', 'dirty02', 'dots', 'none', 'stripes', 'checkerboard', 'hazard', 'rust01', 'rust02', 'scales', 'carbon']
};

// 🔥 EXPANDED 16-COLOR PALETTE
const FORGE_COLORS = [
    '4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b', 'ef4444', 
    'eab308', '84cc16', '14b8a6', '3b82f6', 'd946ef', '1e293b', '000000', 'ffffff'
];

export default function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const [config, setConfig] = useState({
        base: currentConfig?.base || 'square01',
        eyes: currentConfig?.eyes || 'glow',
        mouth: currentConfig?.mouth || 'bite',
        top: currentConfig?.top || 'antenna',
        sides: currentConfig?.sides || 'cables01',
        texture: currentConfig?.texture || 'circuits',
        baseColor: currentConfig?.baseColor || '4f46e5'
    });

    const [activeTab, setActiveTab] = useState<'base' | 'eyes' | 'mouth' | 'top' | 'sides' | 'texture'>('base');

    const buildUrl = () => {
        let url = `https://api.dicebear.com/7.x/bottts/svg?backgroundColor=transparent&baseColor=${config.baseColor}`;
        if (config.base !== 'none') url += `&face=${config.base}`;
        if (config.eyes !== 'none') url += `&eyes=${config.eyes}`;
        if (config.mouth !== 'none') url += `&mouth=${config.mouth}`;
        if (config.top !== 'none') url += `&top=${config.top}`;
        if (config.sides !== 'none') url += `&sides=${config.sides}`;
        if (config.texture !== 'none') url += `&texture=${config.texture}`;
        return url;
    };

    const previewUrl = buildUrl();

    const handleRandomize = () => {
        setConfig({
            base: FORGE_PARTS.base[Math.floor(Math.random() * FORGE_PARTS.base.length)],
            eyes: FORGE_PARTS.eyes[Math.floor(Math.random() * FORGE_PARTS.eyes.length)],
            mouth: FORGE_PARTS.mouth[Math.floor(Math.random() * FORGE_PARTS.mouth.length)],
            top: FORGE_PARTS.top[Math.floor(Math.random() * FORGE_PARTS.top.length)],
            sides: FORGE_PARTS.sides[Math.floor(Math.random() * FORGE_PARTS.sides.length)],
            texture: FORGE_PARTS.texture[Math.floor(Math.random() * FORGE_PARTS.texture.length)],
            baseColor: FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)]
        });
    };

    const tabs = [
        { id: 'base', icon: Cpu, label: 'Chassis' },
        { id: 'eyes', icon: Eye, label: 'Optics' },
        { id: 'mouth', icon: Smile, label: 'Vocoder' },
        { id: 'top', icon: ArrowUpCircle, label: 'Top' },
        { id: 'sides', icon: Headphones, label: 'Sides' },
        { id: 'texture', icon: Fingerprint, label: 'Decals' }
    ];

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
                
                {/* HEADER & LIVE PREVIEW */}
                <div className="bg-slate-100 dark:bg-slate-800 p-8 pb-6 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-slate-500 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                    
                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-full text-indigo-500 transition-colors" title="Randomize Protocol">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-slate-900 rounded-[2rem] shadow-inner border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center p-4 relative mb-6 shrink-0">
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in" />
                    </div>

                    {/* Scrollable Color Swatches */}
                    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                        <div className="flex gap-2 w-max px-2">
                            {FORGE_COLORS.map(color => (
                                <button 
                                    key={color}
                                    onClick={() => setConfig({ ...config, baseColor: color })}
                                    className={`w-8 h-8 rounded-full shadow-sm transition-transform shrink-0 ${config.baseColor === color ? 'scale-110 ring-4 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-slate-900' : 'hover:scale-110 ring-1 ring-slate-300 dark:ring-slate-700'}`}
                                    style={{ backgroundColor: `#${color}` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* THE WORKBENCH CONTROLS */}
                <div className="flex flex-col p-6 flex-1 overflow-hidden">
                    
                    {/* Scrollable Navigation Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={18} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* High-Density Part Grid (3 Columns) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-3 gap-2 pb-4">
                            {FORGE_PARTS[activeTab].map((part) => {
                                const isSelected = config[activeTab as keyof typeof config] === part;
                                return (
                                    <button 
                                        key={part}
                                        onClick={() => setConfig({ ...config, [activeTab]: part })}
                                        className={`py-3 px-1 rounded-xl text-[10px] sm:text-xs font-bold capitalize transition-all active:scale-95 flex items-center justify-center text-center leading-tight ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        <span className="truncate w-full">{part.replace(/([A-Z0-9])/g, ' $1').trim()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SAVE FOOTER */}
                <div className="p-6 pt-0 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-2">
                    <button 
                        onClick={() => onSave(previewUrl, config)}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl mt-4"
                    >
                        <Save size={20} /> Save & Equip 
                    </button>
                </div>
            </div>
        </div>
    );
}
