// src/components/AvatarForge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle, Headphones, Fingerprint, User, Sparkles, Shirt, Gamepad2, Compass, Zap } from 'lucide-react';

// 🔥 EXPANDED 16-COLOR PALETTE
const FORGE_COLORS = [
    '4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b', 'ef4444', 
    'eab308', '84cc16', '14b8a6', '3b82f6', 'd946ef', '1e293b', '000000', 'ffffff'
];

// 🔥 STRICTLY VALIDATED DICEBEAR V9 SCHEMAS (Now 8 Libraries!)
const SPECIES_MATRIX: Record<string, any> = {
    bottts: {
        id: 'bottts', label: 'Mecha', icon: Cpu, endpoint: 'bottts',
        tabs: [
            { id: 'base', icon: Cpu, label: 'Chassis' },
            { id: 'eyes', icon: Eye, label: 'Optics' },
            { id: 'mouth', icon: Smile, label: 'Vocoder' },
            { id: 'top', icon: ArrowUpCircle, label: 'Top' },
            { id: 'sides', icon: Headphones, label: 'Sides' },
            { id: 'texture', icon: Fingerprint, label: 'Decals' }
        ],
        parts: {
            base: ['round01', 'round02', 'square01', 'square02', 'square03', 'square04'],
            eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'roundFrame01', 'roundFrame02', 'sensor', 'smile'],
            mouth: ['bite', 'diagram', 'dirge', 'face01', 'face02', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02'],
            top: ['none', 'antenna', 'antennaCrooked', 'bulb01', 'floating', 'glowingBulb01', 'glowingBulb02', 'horns', 'lights', 'pyramid', 'radar'],
            sides: ['none', 'antenna01', 'antenna02', 'cables01', 'cables02', 'round', 'square', 'squareAssymetric'],
            texture: ['none', 'camo01', 'camo02', 'circuits', 'dirty01', 'dirty02', 'dots']
        }
    },
    avataaars: {
        id: 'avataaars', label: 'Human', icon: User, endpoint: 'avataaars',
        tabs: [
            { id: 'top', icon: ArrowUpCircle, label: 'Hair & Hats' },
            { id: 'accessories', icon: Eye, label: 'Eyewear' },
            { id: 'clothing', icon: Shirt, label: 'Outfit' },
            { id: 'eyes', icon: Sparkles, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'facialHair', icon: User, label: 'Facial Hair' }
        ],
        parts: {
            top: ['longHair', 'shortHair', 'eyepatch', 'hat', 'hijab', 'turban', 'winterHat1', 'winterHat2', 'bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 'miaWallace', 'shaggy', 'shaggyMullet', 'shaved', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'straight01', 'straight02', 'straightStrand'],
            accessories: ['none', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
            clothing: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
            eyes: ['close', 'cry', 'default', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'],
            mouth: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'scream', 'serious', 'smile', 'twinkle', 'vomit'],
            facialHair: ['none', 'beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum']
        }
    },
    funEmoji: {
        id: 'funEmoji', label: 'Emoji', icon: Smile, endpoint: 'fun-emoji',
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Optics' },
            { id: 'mouth', icon: Smile, label: 'Expression' }
        ],
        parts: {
            eyes: ['closed', 'closed2', 'crying', 'cute', 'dizzy', 'lookDown', 'peeking', 'pensive', 'shades', 'starStruck', 'tear', 'wink', 'wink2'],
            mouth: ['aww', 'cute', 'dizzy', 'faceMask', 'kissHeart', 'peeking', 'sad', 'shades', 'smile', 'smileLol', 'smileTeeth', 'starStruck', 'tear', 'tongueOut', 'wink']
        }
    },
    toonHead: {
        id: 'toonHead', label: 'Toon', icon: User, endpoint: 'toon-head',
        tabs: [
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            hair: ['none', 'bun', 'sideComed', 'spiky', 'undercut', 'longStraight', 'longWavy', 'neckHigh', 'shoulderHigh'],
            eyes: ['bow', 'happy', 'humble', 'wide', 'wink'],
            mouth: ['agape', 'angry', 'laugh']
        }
    },
    pixelArt: {
        id: 'pixelArt', label: 'Retro', icon: Gamepad2, endpoint: 'pixel-art-neutral',
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Optics' },
            { id: 'glasses', icon: Sparkles, label: 'Eyewear' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            eyes: ['variant01', 'variant02', 'variant03'],
            glasses: ['none', 'dark01', 'dark02', 'dark03'],
            mouth: ['happy01', 'happy02', 'happy03']
        }
    },
    adventurer: {
        id: 'adventurer', label: 'Hero', icon: Compass, endpoint: 'adventurer',
        tabs: [
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'features', icon: Sparkles, label: 'Features' }
        ],
        parts: {
            hair: ['long01', 'long02', 'long03', 'short01', 'short02', 'short03'],
            eyes: ['variant01', 'variant02', 'variant03'],
            mouth: ['variant01', 'variant02', 'variant03'],
            features: ['none', 'birthmark', 'blush', 'freckles', 'mustache']
        }
    },
    croodles: {
        id: 'croodles', label: 'Doodle', icon: Fingerprint, endpoint: 'croodles',
        tabs: [
            { id: 'face', icon: User, label: 'Face' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'nose', icon: ArrowUpCircle, label: 'Nose' }
        ],
        parts: {
            face: ['variant01', 'variant02', 'variant03', 'variant04'],
            eyes: ['variant01', 'variant02', 'variant03', 'variant04'],
            mouth: ['variant01', 'variant02', 'variant03', 'variant04'],
            nose: ['variant01', 'variant02', 'variant03', 'variant04']
        }
    },
    icons: {
        id: 'icons', label: 'Symbol', icon: Zap, endpoint: 'icons',
        tabs: [
            { id: 'icon', icon: Zap, label: 'Icon' }
        ],
        parts: {
            icon: ['airplane', 'alarm', 'apple', 'archive', 'asterisk', 'bank', 'bell', 'bicycle', 'book', 'boombox', 'bug', 'camera', 'capsule', 'car-front', 'cloud', 'cpu', 'cup-hot', 'droplet', 'earbuds', 'egg', 'emoji-smile', 'envelope', 'eyeglasses', 'eye', 'feather', 'fire', 'flag', 'flower1', 'gem', 'gift', 'globe', 'hammer', 'headphones', 'heart', 'key', 'lamp', 'lightning', 'moon', 'music-note', 'palette', 'peace', 'pen', 'pencil', 'phone', 'play', 'puzzle', 'rocket', 'scissors', 'shield', 'snow', 'star', 'sun', 'tornado', 'trash', 'tree', 'trophy', 'umbrella', 'wifi']
        }
    }
};

const getInitialSpecies = (url: string) => {
    if (url?.includes('avataaars')) return 'avataaars';
    if (url?.includes('fun-emoji')) return 'funEmoji';
    if (url?.includes('toon-head')) return 'toonHead';
    if (url?.includes('pixel-art')) return 'pixelArt';
    if (url?.includes('adventurer')) return 'adventurer';
    if (url?.includes('croodles')) return 'croodles';
    if (url?.includes('icons')) return 'icons';
    return 'bottts';
};

export default function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const initialSpeciesId = useMemo(() => getInitialSpecies(currentConfig?.url), [currentConfig]);
    const [speciesId, setSpeciesId] = useState<string>(initialSpeciesId);
    
    const [configs, setConfigs] = useState<Record<string, any>>({
        bottts: {
            base: currentConfig?.base || 'square01', eyes: currentConfig?.eyes || 'glow', mouth: currentConfig?.mouth || 'bite',
            top: currentConfig?.top || 'none', sides: currentConfig?.sides || 'none', texture: currentConfig?.texture || 'none',
            baseColor: currentConfig?.baseColor || '4f46e5'
        },
        avataaars: {
            top: 'shortHair', accessories: 'none', clothing: 'hoodie', eyes: 'default', mouth: 'smile', facialHair: 'none', baseColor: '4f46e5'
        },
        funEmoji: {
            eyes: 'cute', mouth: 'smile', baseColor: 'f59e0b'
        },
        toonHead: {
            hair: 'none', eyes: 'happy', mouth: 'smile', baseColor: 'f43f5e'
        },
        pixelArt: {
            eyes: 'variant01', glasses: 'none', mouth: 'happy01', baseColor: '10b981'
        },
        adventurer: {
            hair: 'short01', eyes: 'variant01', mouth: 'variant01', features: 'none', baseColor: 'f43f5e'
        },
        croodles: {
            face: 'variant01', eyes: 'variant01', mouth: 'variant01', nose: 'variant01', baseColor: '06b6d4'
        },
        icons: {
            icon: 'star', baseColor: 'f59e0b'
        }
    });

    const activeSpecies = SPECIES_MATRIX[speciesId];
    const [activeTab, setActiveTab] = useState<string>(activeSpecies.tabs[0].id);

    useEffect(() => {
        setActiveTab(SPECIES_MATRIX[speciesId].tabs[0].id);
    }, [speciesId]);

    const buildUrl = (specId: string, cfg: any) => {
        const spec = SPECIES_MATRIX[specId];
        let url = `https://api.dicebear.com/9.x/${spec.endpoint}/svg?backgroundColor=transparent`;
        
        if (specId === 'bottts') url += `&baseColor=${cfg.baseColor}`;
        if (specId === 'icons') url += `&iconColor=${cfg.baseColor}`;
        
        spec.tabs.forEach((t: any) => {
            if (cfg[t.id] && cfg[t.id] !== 'none' && cfg[t.id] !== 'blank') {
                url += `&${t.id}=${cfg[t.id]}`;
            }
        });
        return url;
    };

    const previewUrl = buildUrl(speciesId, configs[speciesId]);

    const handleRandomize = () => {
        const spec = SPECIES_MATRIX[speciesId];
        const newCfg: Record<string, string> = { baseColor: FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)] };
        
        spec.tabs.forEach((t: any) => {
            const partsArray = spec.parts[t.id];
            newCfg[t.id] = partsArray[Math.floor(Math.random() * partsArray.length)];
        });

        setConfigs(prev => ({ ...prev, [speciesId]: { ...prev[speciesId], ...newCfg } }));
    };

    const updateConfig = (key: string, value: string) => {
        setConfigs(prev => ({
            ...prev,
            [speciesId]: { ...prev[speciesId], [key]: value }
        }));
    };

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
                
                <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 pb-4 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-slate-500 transition-colors z-20">
                        <X size={20} strokeWidth={3} />
                    </button>
                    
                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-full text-indigo-500 transition-colors z-20" title="Randomize Protocol">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    <div 
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] shadow-inner border-4 border-white dark:border-slate-800 flex items-center justify-center p-4 relative mb-4 shrink-0 transition-all duration-300"
                        style={{ backgroundColor: (speciesId === 'bottts' || speciesId === 'icons') ? 'transparent' : `#${configs[speciesId].baseColor}30` }}
                    >
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in" />
                    </div>

                    <div className="w-full flex justify-center gap-2 mb-4 flex-wrap">
                        {Object.values(SPECIES_MATRIX).map(spec => {
                            const SpecIcon = spec.icon;
                            return (
                                <button
                                    key={spec.id}
                                    onClick={() => setSpeciesId(spec.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${speciesId === spec.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700'}`}
                                >
                                    <SpecIcon size={12}/> {spec.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                        <div className="flex gap-2 w-max px-2">
                            {FORGE_COLORS.map(color => (
                                <button 
                                    key={color}
                                    onClick={() => updateConfig('baseColor', color)}
                                    className={`w-8 h-8 rounded-full shadow-sm transition-transform shrink-0 ${configs[speciesId].baseColor === color ? 'scale-110 ring-4 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-slate-900' : 'hover:scale-110 ring-1 ring-slate-300 dark:ring-slate-700'}`}
                                    style={{ backgroundColor: `#${color}` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col p-6 flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    
                    <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                        {activeSpecies.tabs.map((tab: any) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] ${isActive ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Icon size={18} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-3 gap-2 pb-4 animate-in fade-in">
                            {activeSpecies.parts[activeTab]?.map((part: string) => {
                                const isSelected = configs[speciesId][activeTab] === part;
                                return (
                                    <button 
                                        key={part}
                                        onClick={() => updateConfig(activeTab, part)}
                                        className={`py-3 px-1 rounded-xl text-[10px] sm:text-xs font-bold capitalize transition-all active:scale-95 flex items-center justify-center text-center leading-tight ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        <span className="truncate w-full">{part.replace(/([A-Z0-9])/g, ' $1').trim().replace('0', '')}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-auto">
                    <button 
                        onClick={() => onSave(previewUrl, { ...configs[speciesId], url: previewUrl })}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl mt-4"
                    >
                        <Save size={20} /> Save & Equip 
                    </button>
                </div>
            </div>
        </div>
    );
}
