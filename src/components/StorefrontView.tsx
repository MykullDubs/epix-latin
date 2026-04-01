// src/components/StorefrontView.tsx
import React, { useState } from 'react';
import { 
    ShoppingBag, Zap, Sparkles, Paintbrush, CircleUser, 
    Tag, Check, Lock, AlertCircle, X, GraduationCap, Globe,
    ShoppingCart, CheckCircle2, RotateCcw, Shield
} from 'lucide-react';
import { Toast } from './Toast';

// ============================================================================
//  MOCK CATALOG
// ============================================================================
const STORE_CATALOG: any = {
    avatars: [
        { id: 'av_cyberpup', name: 'Cyber-Pup', description: 'A good boy on the mainframe.', price: 500, rarity: 'rare', seed: 'cyberpup' },
        { id: 'av_ninja', name: 'Neon Ninja', description: 'Silent, deadly, highly educated.', price: 800, rarity: 'epic', seed: 'ninja' },
        { id: 'av_astronaut', name: 'Star Voyager', description: 'For those who aim higher.', price: 1200, rarity: 'legendary', seed: 'astronaut' },
    ],
    auras: [
        { id: 'aura_emerald', name: 'Emerald Matrix', description: 'A calming, calculated green glow.', price: 300, rarity: 'common', css: 'ring-emerald-500 shadow-emerald-500/50' },
        { id: 'aura_void', name: 'Void Walker', description: 'Deep purple energy field.', price: 600, rarity: 'rare', css: 'ring-purple-500 shadow-purple-500/50' },
        { id: 'aura_solar', name: 'Solar Flare', description: 'Blinding golden radiance.', price: 1500, rarity: 'legendary', css: 'ring-amber-400 shadow-amber-400/80 animate-pulse' },
    ],
    titles: [
        { id: 'title_scholar', name: '"The Scholar"', description: 'A respectable starting title.', price: 200, rarity: 'common' },
        { id: 'title_glitch', name: '"System Glitch"', description: 'You break the curve.', price: 750, rarity: 'epic' },
        { id: 'title_architect', name: '"The Architect"', description: 'Master of the curriculum.', price: 2000, rarity: 'legendary' },
    ],
    themes: [
        { id: 'theme_hacker', name: 'Terminal Green', description: 'Classic hacker aesthetic for the OS.', price: 1000, rarity: 'epic', colors: ['bg-emerald-950', 'bg-emerald-500'] },
        { id: 'theme_synth', name: 'Synthwave', description: 'Miami nights, 1984.', price: 1000, rarity: 'epic', colors: ['bg-fuchsia-900', 'bg-cyan-400'] },
        { id: 'theme_vapor', name: 'Vaporwave', description: 'Neon soaked cyber-dreams.', price: 1000, rarity: 'epic', colors: ['bg-violet-950', 'bg-fuchsia-400'] },
    ]
};

const RARITY_COLORS: any = {
    common: 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    rare: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-400',
    epic: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:border-fuchsia-700/50 dark:text-fuchsia-400',
    legendary: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400',
};

const CATEGORY_TABS = [
    { id: 'avatars', label: 'Avatars', icon: <CircleUser size={16} /> },
    { id: 'auras', label: 'Auras', icon: <Sparkles size={16} /> },
    { id: 'titles', label: 'Titles', icon: <Tag size={16} /> },
    { id: 'themes', label: 'OS Themes', icon: <Paintbrush size={16} /> },
];

// 🔥 UPDATED PROPS: We now correctly intercept onPurchase and onEquip from App.tsx
export default function StorefrontView({ userData, onPurchase, onEquip, onBack }: any) {
    const [activeTab, setActiveTab] = useState('avatars');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fluxBalance = userData?.coins || userData?.flux || 0;
    const inventory = userData?.inventory || [];
    const equipped = userData?.equipped || {};

    // 🔥 THE ECONOMY ENGINE (Routed through global actions)
    const handleBuy = async (item: any, category: string) => {
        if (fluxBalance < item.price) {
            setToastMsg("Insufficient Flux! Complete more modules to earn currency.");
            return;
        }

        setIsProcessing(true);
        // Call the bulletproof purchase engine from useMagisterData
        const result = await onPurchase(item.id, item.price, category);
        
        if (result?.success) {
            setToastMsg(`Successfully acquired ${item.name}! 💎`);
        } else {
            setToastMsg(result?.msg || "Transaction failed. Secure your connection and try again.");
        }
        setIsProcessing(false);
    };

    // 🔥 THE EQUIP ENGINE (Routed through global actions)
    const handleEquip = async (item: any, category: string) => {
        setIsProcessing(true);
        await onEquip(item.id, category);
        setToastMsg(`Equipped ${item.name}! ✨`);
        setIsProcessing(false);
    };

    // 🔥 THE UNEQUIP ENGINE (Passes null to clear the field)
    const handleUnequip = async (category: string) => {
        setIsProcessing(true);
        await onEquip(null, category); 
        setToastMsg(`Unequipped item. OS restored to default.`);
        setIsProcessing(false);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden animate-in fade-in duration-500">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* HEADER */}
            <header className="px-6 py-8 md:p-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 relative overflow-hidden z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10 mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-xs font-black uppercase tracking-widest active:scale-95">
                        <X size={16} /> Exit Store
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={20} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">The Exchange</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Trade your hard-earned Flux for OS upgrades.</p>
                    </div>

                    {/* Massive Flux Balance Display */}
                    <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-6 border-4 border-slate-800 flex items-center gap-6 shadow-2xl shrink-0">
                        <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <Zap size={28} className="text-amber-400" fill="currentColor" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Available Balance</span>
                            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{fluxBalance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* TAB NAVIGATION */}
            <div className="px-6 md:px-10 pt-6 pb-2 shrink-0 z-10 relative">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4">
                    {CATEGORY_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                                activeTab === tab.id 
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                                    : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CATALOG GRID */}
            <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-32 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {STORE_CATALOG[activeTab].map((item: any) => {
                        // 🔥 Smart Ownership Check (Accommodates both legacy dictionary and flat arrays)
                        const isOwned = Array.isArray(inventory) 
                            ? inventory.includes(item.id) 
                            : (inventory[activeTab] || []).includes(item.id);
                            
                        const isEquipped = equipped[activeTab] === item.id;
                        
                        return (
                            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 group">
                                
                                {/* Rarity Badge */}
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${RARITY_COLORS[item.rarity]}`}>
                                        {item.rarity}
                                    </span>
                                    {isOwned && (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Shield size={14} />
                                        </div>
                                    )}
                                </div>

                                {/* Visual Preview Mockup */}
                                <div className="w-full h-32 bg-slate-50 dark:bg-slate-950 rounded-3xl mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-800 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                                    {activeTab === 'themes' ? (
                                        <div className="w-full h-full flex">
                                            <div className={`w-1/2 h-full ${item.colors[0]}`} />
                                            <div className={`w-1/2 h-full ${item.colors[1]}`} />
                                        </div>
                                    ) : activeTab === 'auras' ? (
                                        <div className={`w-16 h-16 rounded-full border-4 border-slate-800 bg-slate-900 ${item.css}`} />
                                    ) : activeTab === 'titles' ? (
                                        <span className="font-black text-slate-800 dark:text-white text-lg tracking-widest">{item.name}</span>
                                    ) : (
                                        <CircleUser size={48} className="text-slate-300 dark:text-slate-700" />
                                    )}
                                </div>

                                {/* Text Content */}
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 leading-none">{item.name}</h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed line-clamp-2">{item.description}</p>

                                {/* 🔥 THE SMART BUTTON ENGINE */}
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {!isOwned ? (
                                        <button 
                                            disabled={isProcessing || fluxBalance < item.price}
                                            onClick={() => handleBuy(item, activeTab)}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart size={16} /> Buy — {item.price} Flux
                                        </button>
                                    ) : !isEquipped ? (
                                        <button 
                                            disabled={isProcessing}
                                            onClick={() => handleEquip(item, activeTab)}
                                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={16} /> Equip
                                        </button>
                                    ) : (
                                        <button 
                                            disabled={isProcessing}
                                            onClick={() => handleUnequip(activeTab)}
                                            className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 group flex items-center justify-center gap-2"
                                        >
                                            {/* Normal State: Active */}
                                            <span className="flex items-center gap-2 group-hover:hidden">
                                                <CheckCircle2 size={16} /> Active
                                            </span>
                                            {/* Hover State: Unequip */}
                                            <span className="hidden items-center gap-2 group-hover:flex">
                                                <RotateCcw size={16} /> Unequip
                                            </span>
                                        </button>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
