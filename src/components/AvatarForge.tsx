// src/components/AvatarForge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle, Headphones, Fingerprint, User, Sparkles, Shirt, Gamepad2, Compass, Zap, Palette } from 'lucide-react';

// 🔥 STRICT DICEBEAR V9 COLOR PALETTES
const BG_COLORS = [
    'transparent', '4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b', 'ef4444', 
    'eab308', '84cc16', '14b8a6', '3b82f6', 'd946ef', '1e293b', '000000', 'ffffff'
];

const SKIN_TONES = ['ffdbac', 'f1c27d', 'e0ac69', '8d5524', 'c68642', '3d2c23'];
const HAIR_COLORS = ['000000', '2a2a2a', '4a3123', 'a56b46', 'e8b923', 'd6b370', '724133', 'c93305', 'f59797', 'ecf0f1'];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIES MATRIX (Strictly Validated for v9)
// ─────────────────────────────────────────────────────────────────────────────
const SPECIES_MATRIX: Record<string, any> = {
    bottts: {
        id: 'bottts', label: 'Mecha', icon: Cpu, endpoint: 'bottts', colorParam: 'baseColor', hasSkinTone: false, hasHairColor: false,
        tabs: [
            { id: 'face', icon: Cpu, label: 'Chassis' },
            { id: 'eyes', icon: Eye, label: 'Optics' },
            { id: 'mouth', icon: Smile, label: 'Vocoder' },
            { id: 'top', icon: ArrowUpCircle, label: 'Top' },
            { id: 'sides', icon: Headphones, label: 'Sides' },
            { id: 'texture', icon: Fingerprint, label: 'Decals' }
        ],
        parts: {
            face: ['round01', 'round02', 'square01', 'square02', 'square03', 'square04'],
            eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'sensor', 'smile'],
            mouth: ['bite', 'diagram', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02'],
            top: ['none', 'antenna', 'antennaCrooked', 'bulb01', 'floating', 'glowingBulb01', 'glowingBulb02', 'horns', 'lights', 'pyramid', 'radar'],
            sides: ['none', 'antenna01', 'antenna02', 'cables01', 'cables02', 'round', 'square', 'squareAssymetric'],
            texture: ['none', 'camo01', 'camo02', 'circuits', 'dirty01', 'dirty02', 'dots']
        }
    },
    avataaars: {
        id: 'avataaars', label: 'Human', icon: User, endpoint: 'avataaars', colorParam: 'skinColor', hasSkinTone: true, hasHairColor: true,
        tabs: [
            { id: 'top', icon: ArrowUpCircle, label: 'Hair' },
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
            eyes: ['closed', 'cry', 'default', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'],
            mouth: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
            facialHair: ['none', 'beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum']
        }
    },
    funEmoji: {
        id: 'funEmoji', label: 'Emoji', icon: Smile, endpoint: 'fun-emoji', colorParam: null, hasSkinTone: false, hasHairColor: false,
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            eyes: ['closed', 'closed2', 'crying', 'cute', 'dizzy', 'lookDown', 'peeking', 'shades', 'starStruck', 'wink', 'wink2'],
            mouth: ['cute', 'drip', 'faceMask', 'kissHeart', 'lilSmile', 'pissed', 'plain', 'sad', 'shout', 'shy', 'sick', 'smileLol', 'smileTeeth', 'tongueOut', 'wideSmile']
        }
    },
    toonHead: {
        id: 'toonHead', label: 'Toon', icon: User, endpoint: 'toon-head', colorParam: 'skinColor', hasSkinTone: true, hasHairColor: true,
        tabs: [
            { id: 'rearHair', icon: ArrowUpCircle, label: 'Back Hair' },
            { id: 'frontHair', icon: ArrowUpCircle, label: 'Front Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            rearHair: ['none', 'longStraight', 'longWavy', 'neckHigh', 'shoulderHigh'],
            frontHair: ['none', 'bun', 'sideComed', 'spiky', 'undercut'],
            eyes: ['bow', 'happy', 'humble', 'wide', 'wink'],
            mouth: ['agape', 'angry', 'laugh', 'sad', 'smile']
        }
    },
    pixelArt: {
        id: 'pixelArt', label: 'Retro', icon: Gamepad2, endpoint: 'pixel-art', colorParam: null, hasSkinTone: false, hasHairColor: false,
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'glasses', icon: Sparkles, label: 'Eyewear' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' }
        ],
        parts: {
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08'],
            glasses: ['none', 'dark01', 'dark02', 'dark03', 'dark04', 'dark05', 'dark06', 'dark07'],
            mouth: ['happy01', 'happy02', 'happy03', 'happy04', 'happy05', 'happy06', 'happy07', 'happy08', 'happy09', 'happy10', 'happy11', 'happy12', 'happy13', 'sad01', 'sad02', 'sad03', 'sad04', 'sad05'],
            hair: ['none', 'short01', 'short02', 'short03', 'short04', 'short05', 'long01', 'long02', 'long03', 'long04', 'long05']
        }
    },
    adventurer: {
        id: 'adventurer', label: 'Hero', icon: Compass, endpoint: 'adventurer', colorParam: 'skinColor', hasSkinTone: true, hasHairColor: true,
        tabs: [
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'eyebrows', icon: Sparkles, label: 'Brows' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'glasses', icon: Eye, label: 'Eyewear' }
        ],
        parts: {
            hair: ['none', 'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10', 'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20', 'long21', 'long22', 'long23', 'long24', 'long25', 'long26', 'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15', 'short16', 'short17'],
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26'],
            eyebrows: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15'],
            mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26', 'variant27', 'variant28', 'variant29', 'variant30'],
            glasses: ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05']
        }
    },
    croodles: {
        id: 'croodles', label: 'Doodle', icon: Fingerprint, endpoint: 'croodles', colorParam: 'baseColor', hasSkinTone: false, hasHairColor: false,
        tabs: [
            { id: 'face', icon: User, label: 'Face' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'nose', icon: ArrowUpCircle, label: 'Nose' }
        ],
        parts: {
            face: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08'],
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16'],
            mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18'],
            nose: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09']
        }
    },
    icons: {
        id: 'icons', label: 'Symbol', icon: Zap, endpoint: 'icons', colorParam: 'iconColor', hasSkinTone: false, hasHairColor: false,
        tabs: [
            { id: 'icon', icon: Zap, label: 'Icon' }
        ],
        parts: {
            icon: ['airplane', 'alarm', 'apple', 'archive', 'asterisk', 'bank', 'bell', 'bicycle', 'book', 'boombox', 'bug', 'camera', 'capsule', 'car-front', 'cloud', 'cpu', 'cup-hot', 'droplet', 'earbuds', 'egg', 'emoji-smile', 'envelope', 'eyeglasses', 'eye', 'feather', 'fire', 'flag', 'flower1', 'gem', 'gift', 'globe', 'hammer', 'headphones', 'heart', 'key', 'lamp', 'lightning', 'moon', 'music-note', 'palette', 'peace', 'pen', 'pencil', 'phone', 'play', 'puzzle', 'rocket', 'scissors', 'shield', 'snow', 'star', 'sun', 'tornado', 'trash', 'tree', 'trophy', 'umbrella', 'wifi']
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// URL BUILDER (Safely routes API parameters)
// ─────────────────────────────────────────────────────────────────────────────
const buildUrl = (specId: string, cfg: any): string => {
    const spec = SPECIES_MATRIX[specId];
    
    // Base URL requests transparent background (handled by React container instead)
    let url = `https://api.dicebear.com/9.x/${spec.endpoint}/svg?backgroundColor=transparent`;

    // 1. Color Parameters
    if (spec.colorParam) {
        if (specId === 'icons') url += `&iconColor=${cfg.primaryColor}`;
        else if (specId === 'bottts' || specId === 'croodles') url += `&baseColor=${cfg.primaryColor}`;
        else url += `&${spec.colorParam}=${cfg.skinTone || 'ffdbac'}`;
    }

    // 2. Hair Color Parameters (Avataaars, ToonHead, Adventurer)
    if (spec.hasHairColor && cfg.hairColor) {
        if (specId === 'toonHead' || specId === 'avataaars') url += `&hairColor=${cfg.hairColor}`;
    }

    // 3. Icon Special Case
    if (specId === 'icons') {
        if (cfg.icon) url += `&icon=${cfg.icon}`;
        return url;
    }

    // 4. Standard Feature Parameters
    spec.tabs.forEach((t: any) => {
        const val = cfg[t.id];
        if (val && val !== 'none') {
            url += `&${t.id}=${val}`;
        }
    });

    return url;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const getInitialSpecies = (url: string) => {
        if (!url) return 'bottts';
        if (url.includes('avataaars')) return 'avataaars';
        if (url.includes('fun-emoji')) return 'funEmoji';
        if (url.includes('toon-head')) return 'toonHead';
        if (url.includes('pixel-art')) return 'pixelArt';
        if (url.includes('adventurer')) return 'adventurer';
        if (url.includes('croodles')) return 'croodles';
        if (url.includes('icons')) return 'icons';
        return 'bottts';
    };

    const initialSpeciesId = useMemo(() => getInitialSpecies(currentConfig?.url), [currentConfig]);
    const [speciesId, setSpeciesId] = useState<string>(initialSpeciesId);

    // State tracks complete configuration for ALL species simultaneously
    const [configs, setConfigs] = useState<Record<string, any>>({
        bottts: { face: 'square01', eyes: 'glow', mouth: 'bite', top: 'none', sides: 'none', texture: 'none', primaryColor: '4f46e5', bgColor: 'transparent' },
        avataaars: { top: 'shortHair', accessories: 'none', clothing: 'hoodie', eyes: 'default', mouth: 'smile', facialHair: 'none', skinTone: 'ffdbac', hairColor: '2a2a2a', bgColor: 'transparent' },
        funEmoji: { eyes: 'cute', mouth: 'smileTeeth', bgColor: 'transparent' },
        toonHead: { rearHair: 'longStraight', frontHair: 'none', eyes: 'happy', mouth: 'smile', skinTone: 'f9c9b6', hairColor: '2a2a2a', bgColor: 'transparent' },
        pixelArt: { eyes: 'variant01', glasses: 'none', mouth: 'happy01', hair: 'short01', bgColor: 'transparent' },
        adventurer: { hair: 'short01', eyes: 'variant01', eyebrows: 'variant01', mouth: 'variant01', glasses: 'none', skinTone: 'f2d3b1', hairColor: '2a2a2a', bgColor: 'transparent' },
        croodles: { face: 'variant01', eyes: 'variant01', mouth: 'variant01', nose: 'variant01', primaryColor: '06b6d4', bgColor: 'transparent' },
        icons: { icon: 'star', primaryColor: 'f59e0b', bgColor: 'transparent' }
    });

    const activeSpecies = SPECIES_MATRIX[speciesId];
    const [activeTab, setActiveTab] = useState<string>(activeSpecies.tabs[0].id);

    useEffect(() => {
        setActiveTab(SPECIES_MATRIX[speciesId].tabs[0].id);
    }, [speciesId]);

    const previewUrl = buildUrl(speciesId, configs[speciesId]);

    const handleRandomize = () => {
        const spec = SPECIES_MATRIX[speciesId];
        const newCfg: Record<string, string> = { 
            primaryColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)] === 'transparent' ? '4f46e5' : BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
            bgColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
            skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
            hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]
        };
        
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

    const formatPartLabel = (str: string) => {
        return str.replace(/([A-Z])/g, ' $1')
                  .replace(/(\d+)/g, ' $1')
                  .trim()
                  .replace(/^./, str[0].toUpperCase());
    };

    return (
        <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-safe">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />

            <div className="bg-white dark:bg-slate-950 w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl border-t sm:border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 overflow-hidden flex flex-col h-[90vh] sm:max-h-[85vh]">

                {/* ── HEADER & PREVIEW ── */}
                <div className="bg-slate-50 dark:bg-slate-900 p-6 pb-4 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors z-20 shadow-sm">
                        <X size={20} strokeWidth={3} />
                    </button>

                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full text-indigo-500 transition-colors z-20 shadow-sm" title="Randomize">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    {/* LIVE PREVIEW WITH REACT BG COLOR */}
                    <div 
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] shadow-inner border-4 border-white dark:border-slate-800 flex items-center justify-center p-4 relative mb-6 shrink-0 transition-all duration-300"
                        style={{ backgroundColor: configs[speciesId].bgColor === 'transparent' ? 'transparent' : `#${configs[speciesId].bgColor}20` }}
                    >
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>

                    {/* SPECIES TABS */}
                    <div className="w-full flex justify-center gap-2 mb-2 flex-wrap">
                        {Object.values(SPECIES_MATRIX).map((spec: any) => {
                            const SpecIcon = spec.icon;
                            return (
                                <button
                                    key={spec.id}
                                    onClick={() => setSpeciesId(spec.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${speciesId === spec.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700'}`}
                                >
                                    <SpecIcon size={12} /> {spec.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── WORKBENCH ── */}
                <div className="flex flex-col p-6 pt-4 flex-1 overflow-hidden bg-white dark:bg-slate-950">
                    
                    {/* Dynamic Top Nav Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                        {/* Backdrop Color */}
                        <button 
                            onClick={() => setActiveTab('bgColor')}
                            className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] border ${activeTab === 'bgColor' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                        >
                            <Palette size={18} className="mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Backdrop</span>
                        </button>

                        {/* Skin Tone Tab */}
                        {activeSpecies.hasSkinTone && (
                            <button 
                                onClick={() => setActiveTab('skinTone')}
                                className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] border ${activeTab === 'skinTone' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                            >
                                <User size={18} className="mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Skin</span>
                            </button>
                        )}

                        {/* Hair Color Tab */}
                        {activeSpecies.hasHairColor && (
                            <button 
                                onClick={() => setActiveTab('hairColor')}
                                className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] border ${activeTab === 'hairColor' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                            >
                                <Sparkles size={18} className="mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Hair Dye</span>
                            </button>
                        )}

                        {/* Primary Color Tab */}
                        {activeSpecies.colorParam && !activeSpecies.hasSkinTone && (
                            <button 
                                onClick={() => setActiveTab('primaryColor')}
                                className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] border ${activeTab === 'primaryColor' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                            >
                                <Sparkles size={18} className="mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Color</span>
                            </button>
                        )}

                        {/* Feature Tabs */}
                        {activeSpecies.tabs.map((tab: any) => {
                            const Icon = tab.icon;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-xl transition-colors min-w-[70px] border ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                                >
                                    <Icon size={18} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                        
                        {/* 1. Color Pickers (Backdrop, Skin, Hair, Primary) */}
                        {['bgColor', 'primaryColor', 'skinTone', 'hairColor'].includes(activeTab) && (
                            <div className="flex flex-wrap gap-4 justify-center py-4 animate-in fade-in">
                                {
                                    (activeTab === 'skinTone' ? SKIN_TONES : activeTab === 'hairColor' ? HAIR_COLORS : BG_COLORS).map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => updateConfig(activeTab, color)}
                                        className={`w-12 h-12 rounded-2xl shadow-sm transition-transform ${configs[speciesId][activeTab] === color ? 'scale-110 ring-4 ring-offset-4 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-slate-900' : 'hover:scale-110 ring-1 ring-slate-200 dark:ring-slate-700'} ${color === 'transparent' ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-slate-100 dark:bg-slate-800' : ''}`}
                                        style={color !== 'transparent' ? { backgroundColor: `#${color}` } : {}}
                                    />
                                ))}
                            </div>
                        )}

                        {/* 2. Parts Grid */}
                        {!['bgColor', 'primaryColor', 'skinTone', 'hairColor'].includes(activeTab) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in">
                                {activeSpecies.parts[activeTab]?.map((part: string) => {
                                    const isSelected = configs[speciesId][activeTab] === part;
                                    return (
                                        <button 
                                            key={part}
                                            onClick={() => updateConfig(activeTab, part)}
                                            className={`py-4 px-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center text-center ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                        >
                                            <span className="truncate w-full">{formatPartLabel(part)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="p-6 pt-0 shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto pb-safe-6">
                    <button 
                        onClick={() => onSave(previewUrl, { ...configs[speciesId], url: previewUrl, species: speciesId })}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl"
                    >
                        <Save size={20} /> Save Identity 
                    </button>
                </div>
            </div>
        </div>
    );
}
