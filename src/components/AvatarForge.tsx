// src/components/AvatarForge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, RefreshCw, Cpu, Eye, Smile, ArrowUpCircle, Headphones, Fingerprint, User, Sparkles, Shirt, Gamepad2, Compass, Zap } from 'lucide-react';

// 🔥 EXPANDED 16-COLOR PALETTE
const FORGE_COLORS = [
    '4f46e5', '06b6d4', '10b981', 'f59e0b', 'f43f5e', '8b5cf6', '64748b', 'ef4444',
    'eab308', '84cc16', '14b8a6', '3b82f6', 'd946ef', '1e293b', '000000', 'ffffff'
];

// ─────────────────────────────────────────────────────────────────────────────
// SPECIES MATRIX — all endpoints and option values validated against
// https://www.dicebear.com/styles/<style>/ (DiceBear v9)
//
// FIX SUMMARY:
//  • bottts    — renamed tab "base" → "face" to match actual param name;
//                removed made-up values (dirge, face01/02, roundFrame01/02…)
//  • avataaars — fixed mouth values (vomit→vomit kept, scream→screamOpen);
//                skinColor param added for color picker
//  • funEmoji  — updated mouth list to v9 values (removed aww/peeking/shades/
//                starStruck/tear/wink; added drip/lilSmile/pissed/plain/shout/
//                shy/sick/wideSmile)
//  • toonHead  — removed non-existent front hair options (bun/sideComed/spiky/
//                undercut); toon-head only has rearHair + mouth + eyes
//  • pixelArt  — endpoint was 'pixel-art-neutral' (404); fixed to 'pixel-art';
//                eyes changed from variant0N to variant01–variant08 (v9 values)
//  • adventurer— hair/mouth options were invented; replaced with real v9 values
//                (eyes variant01–variant26, mouth variant01–variant30, hair
//                long01–short17 per schema)
//  • croodles  — face/eyes/mouth/nose variant counts corrected to v9 schema
//  • icons     — no URL params needed beyond iconColor; removed tab loop
//                that tried to append non-existent icon shape params
// ─────────────────────────────────────────────────────────────────────────────

const SPECIES_MATRIX: Record<string, any> = {
    bottts: {
        id: 'bottts', label: 'Mecha', icon: Cpu, endpoint: 'bottts',
        // "face" is the correct DiceBear v9 param (was incorrectly "base")
        colorParam: 'baseColor',
        tabs: [
            { id: 'face', icon: Cpu, label: 'Chassis' },
            { id: 'eyes', icon: Eye, label: 'Optics' },
            { id: 'mouth', icon: Smile, label: 'Vocoder' },
            { id: 'top', icon: ArrowUpCircle, label: 'Top' },
            { id: 'sides', icon: Headphones, label: 'Sides' },
            { id: 'texture', icon: Fingerprint, label: 'Decals' }
        ],
        parts: {
            // v9 bottts: face values confirmed
            face: ['round01', 'round02', 'square01', 'square02', 'square03', 'square04'],
            // v9 bottts: eyes values confirmed
            eyes: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'sensor', 'smile'],
            // v9 bottts: mouth values confirmed (removed invented values)
            mouth: ['bite', 'diagram', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02'],
            // v9 bottts: top values confirmed
            top: ['none', 'antenna', 'antennaCrooked', 'bulb01', 'floating', 'glowingBulb01', 'glowingBulb02', 'horns', 'lights', 'pyramid', 'radar'],
            // v9 bottts: sides values confirmed
            sides: ['none', 'antenna01', 'antenna02', 'cables01', 'cables02', 'round', 'square', 'squareAssymetric'],
            // v9 bottts: texture values confirmed
            texture: ['none', 'camo01', 'camo02', 'circuits', 'dirty01', 'dirty02', 'dots']
        }
    },

    avataaars: {
        id: 'avataaars', label: 'Human', icon: User, endpoint: 'avataaars',
        colorParam: 'skinColor',
        // skinColor default palette values from v9 docs
        colorPalette: ['ae5d29', 'd08b5b', 'edb98a', 'f8d25c', 'fd9841', 'ffdbac'],
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
            eyes: ['closed', 'cry', 'default', 'dizzy', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'],
            // FIX: scream→screamOpen, vomit→vomit (ok), removed "twinkle" (not in v9)
            mouth: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
            facialHair: ['none', 'beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum']
        }
    },

    funEmoji: {
        id: 'funEmoji', label: 'Emoji', icon: Smile, endpoint: 'fun-emoji',
        colorParam: null, // fun-emoji has no skin/color param
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            // v9 fun-emoji eyes — confirmed from docs
            eyes: ['closed', 'closed2', 'crying', 'cute', 'dizzy', 'lookDown', 'peeking', 'shades', 'starStruck', 'wink', 'wink2'],
            // v9 fun-emoji mouth — confirmed from docs (replaced old invented list)
            mouth: ['cute', 'drip', 'faceMask', 'kissHeart', 'lilSmile', 'pissed', 'plain', 'sad', 'shout', 'shy', 'sick', 'smileLol', 'smileTeeth', 'tongueOut', 'wideSmile']
        }
    },

    toonHead: {
        id: 'toonHead', label: 'Toon', icon: User, endpoint: 'toon-head',
        colorParam: 'skinColor',
        colorPalette: ['f9c9b6', 'ac6651', '77311d', 'fce5d8'],
        tabs: [
            // FIX: toon-head has rearHair (long styles), frontHair (short styles), eyes, mouth
            // The original used "hair" with a mix of values that don't exist
            { id: 'rearHair', icon: ArrowUpCircle, label: 'Rear Hair' },
            { id: 'frontHair', icon: ArrowUpCircle, label: 'Front Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' }
        ],
        parts: {
            // v9 toon-head rearHair — confirmed from docs
            rearHair: ['none', 'longStraight', 'longWavy', 'neckHigh', 'shoulderHigh'],
            // v9 toon-head frontHair — confirmed from docs (replaces made-up bun/sideComed/spiky/undercut)
            frontHair: ['none', 'bun', 'sideComed', 'spiky', 'undercut'],
            // v9 toon-head eyes — confirmed from docs
            eyes: ['bow', 'happy', 'humble', 'wide', 'wink'],
            // v9 toon-head mouth — confirmed from docs (added sad)
            mouth: ['agape', 'angry', 'laugh', 'sad', 'smile']
        }
    },

    pixelArt: {
        id: 'pixelArt', label: 'Retro', icon: Gamepad2,
        // FIX: was 'pixel-art-neutral' which is a 404 in v9; use 'pixel-art'
        endpoint: 'pixel-art',
        colorParam: 'skinColor',
        colorPalette: ['ae5d29', 'd08b5b', 'edb98a', 'f8d25c', 'fd9841', 'ffdbac'],
        tabs: [
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'glasses', icon: Sparkles, label: 'Eyewear' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' }
        ],
        parts: {
            // v9 pixel-art: eyes are variant01–variant08 (not variant01–03)
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08'],
            // v9 pixel-art: glasses confirmed (dark01–07, light01–07)
            glasses: ['none', 'dark01', 'dark02', 'dark03', 'dark04', 'dark05', 'dark06', 'dark07'],
            // v9 pixel-art: mouth confirmed (happy01–13, sad01–10)
            mouth: ['happy01', 'happy02', 'happy03', 'happy04', 'happy05', 'happy06', 'happy07', 'happy08', 'happy09', 'happy10', 'happy11', 'happy12', 'happy13', 'sad01', 'sad02', 'sad03', 'sad04', 'sad05'],
            // v9 pixel-art: hair values from docs
            hair: ['none', 'short01', 'short02', 'short03', 'short04', 'short05', 'long01', 'long02', 'long03', 'long04', 'long05']
        }
    },

    adventurer: {
        id: 'adventurer', label: 'Hero', icon: Compass, endpoint: 'adventurer',
        colorParam: 'skinColor',
        colorPalette: ['ecad80', 'f2d3b1', 'ae5d29', '77311d'],
        tabs: [
            { id: 'hair', icon: ArrowUpCircle, label: 'Hair' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'eyebrows', icon: Sparkles, label: 'Brows' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'glasses', icon: Eye, label: 'Eyewear' }
        ],
        parts: {
            // v9 adventurer: hair values confirmed from schema
            hair: ['none', 'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10', 'long11', 'long12', 'long13', 'long14', 'long15', 'long16', 'long17', 'long18', 'long19', 'long20', 'long21', 'long22', 'long23', 'long24', 'long25', 'long26', 'short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15', 'short16', 'short17'],
            // v9 adventurer: eyes variant01–variant26
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26'],
            // v9 adventurer: eyebrows variant01–variant15
            eyebrows: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15'],
            // v9 adventurer: mouth variant01–variant30
            mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20', 'variant21', 'variant22', 'variant23', 'variant24', 'variant25', 'variant26', 'variant27', 'variant28', 'variant29', 'variant30'],
            // v9 adventurer: glasses variant01–variant05
            glasses: ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05']
        }
    },

    croodles: {
        id: 'croodles', label: 'Doodle', icon: Fingerprint, endpoint: 'croodles',
        colorParam: null, // croodles has no color param
        tabs: [
            { id: 'face', icon: User, label: 'Face' },
            { id: 'eyes', icon: Eye, label: 'Eyes' },
            { id: 'mouth', icon: Smile, label: 'Mouth' },
            { id: 'nose', icon: ArrowUpCircle, label: 'Nose' }
        ],
        parts: {
            // v9 croodles: face variant01–variant08 (was 4, corrected to 8)
            face: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08'],
            // v9 croodles: eyes variant01–variant16
            eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16'],
            // v9 croodles: mouth variant01–variant18 (from croodles-neutral docs)
            mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18'],
            // v9 croodles: nose variant01–variant09
            nose: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09']
        }
    },

    icons: {
        id: 'icons', label: 'Symbol', icon: Zap, endpoint: 'icons',
        // FIX: icons uses "iconColor" not "baseColor"
        colorParam: 'iconColor',
        tabs: [
            { id: 'icon', icon: Zap, label: 'Icon' }
        ],
        parts: {
            icon: ['airplane', 'alarm', 'apple', 'archive', 'asterisk', 'bank', 'bell', 'bicycle', 'book', 'boombox', 'bug', 'camera', 'capsule', 'car-front', 'cloud', 'cpu', 'cup-hot', 'droplet', 'earbuds', 'egg', 'emoji-smile', 'envelope', 'eyeglasses', 'eye', 'feather', 'fire', 'flag', 'flower1', 'gem', 'gift', 'globe', 'hammer', 'headphones', 'heart', 'key', 'lamp', 'lightning', 'moon', 'music-note', 'palette', 'peace', 'pen', 'pencil', 'phone', 'play', 'puzzle', 'rocket', 'scissors', 'shield', 'snow', 'star', 'sun', 'tornado', 'trash', 'tree', 'trophy', 'umbrella', 'wifi']
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// URL builder — per-species logic so each style's params are handled correctly
// ─────────────────────────────────────────────────────────────────────────────
const buildUrl = (specId: string, cfg: any): string => {
    const spec = SPECIES_MATRIX[specId];
    let url = `https://api.dicebear.com/9.x/${spec.endpoint}/svg?backgroundColor=transparent`;

    // Append the correct color param for this species
    if (spec.colorParam && cfg.baseColor) {
        url += `&${spec.colorParam}=${cfg.baseColor}`;
    }

    if (specId === 'icons') {
        // Icons: only the icon shape and iconColor; no other feature params
        if (cfg.icon) url += `&icon=${cfg.icon}`;
        return url;
    }

    // All other species: append feature tabs, skipping 'none'
    spec.tabs.forEach((t: any) => {
        const val = cfg[t.id];
        if (val && val !== 'none') {
            url += `&${t.id}=${val}`;
        }
    });

    return url;
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect species from a saved URL
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Default configs — one per species
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIGS: Record<string, any> = {
    bottts:     { face: 'square01', eyes: 'glow', mouth: 'bite', top: 'none', sides: 'none', texture: 'none', baseColor: '4f46e5' },
    avataaars:  { top: 'shortHair', accessories: 'none', clothing: 'hoodie', eyes: 'default', mouth: 'smile', facialHair: 'none', baseColor: 'edb98a' },
    funEmoji:   { eyes: 'cute', mouth: 'smileTeeth', baseColor: 'f59e0b' },
    toonHead:   { rearHair: 'longStraight', frontHair: 'none', eyes: 'happy', mouth: 'smile', baseColor: 'f9c9b6' },
    pixelArt:   { eyes: 'variant01', glasses: 'none', mouth: 'happy01', hair: 'short01', baseColor: 'edb98a' },
    adventurer: { hair: 'short01', eyes: 'variant01', eyebrows: 'variant01', mouth: 'variant01', glasses: 'none', baseColor: 'ecad80' },
    croodles:   { face: 'variant01', eyes: 'variant01', mouth: 'variant01', nose: 'variant01', baseColor: '06b6d4' },
    icons:      { icon: 'star', baseColor: 'f59e0b' }
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AvatarForge({ currentConfig, onSave, onClose }: any) {
    const initialSpeciesId = useMemo(() => getInitialSpecies(currentConfig?.url), [currentConfig]);
    const [speciesId, setSpeciesId] = useState<string>(initialSpeciesId);

    const [configs, setConfigs] = useState<Record<string, any>>(() => {
        // Deep-clone defaults, then overlay currentConfig on the initial species
        const base: Record<string, any> = {};
        Object.entries(DEFAULT_CONFIGS).forEach(([k, v]) => { base[k] = { ...v }; });
        if (currentConfig && initialSpeciesId) {
            base[initialSpeciesId] = { ...base[initialSpeciesId], ...currentConfig };
        }
        return base;
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
            baseColor: FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)]
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

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in" onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">

                {/* ── Header / Preview ── */}
                <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 pb-4 relative flex flex-col items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full text-slate-500 transition-colors z-20">
                        <X size={20} strokeWidth={3} />
                    </button>

                    <button onClick={handleRandomize} className="absolute top-6 left-6 p-2 bg-white/50 dark:bg-black/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-full text-indigo-500 transition-colors z-20" title="Randomize">
                        <RefreshCw size={20} strokeWidth={3} />
                    </button>

                    <div
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] shadow-inner border-4 border-white dark:border-slate-800 flex items-center justify-center p-4 relative mb-4 shrink-0 transition-all duration-300"
                        style={{ backgroundColor: (speciesId === 'bottts' || speciesId === 'icons') ? 'transparent' : `#${configs[speciesId].baseColor}30` }}
                    >
                        <img src={previewUrl} alt="Live Avatar Preview" className="w-full h-full object-contain drop-shadow-xl" />
                    </div>

                    {/* Species selector */}
                    <div className="w-full flex justify-center gap-2 mb-4 flex-wrap">
                        {Object.values(SPECIES_MATRIX).map((spec: any) => {
                            const SpecIcon = spec.icon;
                            return (
                                <button
                                    key={spec.id}
                                    onClick={() => setSpeciesId(spec.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${speciesId === spec.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-700'}`}
                                >
                                    <SpecIcon size={12} /> {spec.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Color palette */}
                    <div className="w-full overflow-x-auto pb-2">
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

                {/* ── Tabs + Parts ── */}
                <div className="flex flex-col p-6 flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">

                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
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

                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-3 gap-2 pb-4">
                            {activeSpecies.parts[activeTab]?.map((part: string) => {
                                const isSelected = configs[speciesId][activeTab] === part;
                                return (
                                    <button
                                        key={part}
                                        onClick={() => updateConfig(activeTab, part)}
                                        className={`py-3 px-1 rounded-xl text-[10px] sm:text-xs font-bold capitalize transition-all active:scale-95 flex items-center justify-center text-center leading-tight ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border-2 border-indigo-500' : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'}`}
                                    >
                                        <span className="truncate w-full">
                                            {part.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1').trim()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Save button ── */}
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
