import React, { useState } from 'react';
import { ShoppingBag, Zap, Sparkles, Paintbrush, CircleUser, Tag, Check, Lock, AlertCircle, X } from 'lucide-react';
import { Toast } from './Toast';

// ============================================================================
//  MOCK CATALOG (Move this to Firebase later, or keep it hardcoded for speed)
// ============================================================================
const STORE_CATALOG = {
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
    ]
};

const RARITY_COLORS: any = {
    common: 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    rare: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-400',
    epic: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:border-fuchsia-700/50 dark:text-fuchsia-400',
    legendary: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
};

export default function StorefrontView({ userData, onPurchase, onEquip }: any) {
    const [activeTab, setActiveTab] = useState<'avatars' | 'auras' | 'titles' | 'themes'>('avatars');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Safely fallback if userData isn't fully hydrated yet
    const fluxBalance = userData?.flux || 0;
    const inventory = userData?.inventory || [];
    const equipped = userData?.equipped || {};

    const handleBuy = async () => {
        if (!selectedItem) return;
        
        if (fluxBalance < selectedItem.price) {
            setToastMsg("Insufficient Flux.");
            setSelectedItem(null);
            return;
        }

        // Trigger the callback passed from App.tsx to update Firebase
        await onPurchase(selectedItem.id, selectedItem.price, activeTab);
        setToastMsg(`Acquired: ${selectedItem.name}!`);
        setSelectedItem(null);
    };

    const handleEquipClick = (item: any) => {
        onEquip(item.id, activeTab);
        setToastMsg(`Equipped: ${item.name}`);
    };

    const renderItemCard = (item: any) => {
        const isOwned = inventory.includes(item.id);
        const isEquipped = equipped[activeTab] === item.id;
        const canAfford = fluxBalance >= item.price;

        return (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden group">
                
                {/* Rarity Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${RARITY_COLORS[item.rarity]}`}>
                    {item.rarity}
                </div>

                {/* Equipped Badge */}
                {isEquipped && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                        <Check size={12} strokeWidth={3} /> Active
                    </div>
                )}

                {/* Item Preview */}
                <div className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800/50 mt-8 mb-6 flex items-center justify-center relative border border-slate-100 dark:border-slate-700/50">
                    {activeTab === 'avatars' && (
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.seed}&backgroundColor=transparent`} alt="Avatar" className="w-3/4 h-3/4 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                    )}
                    {activeTab === 'auras' && (
                        <div className={`w-20 h-20 rounded-full ring-8 ${item.css} group-hover:scale-110 transition-transform duration-500`} />
                    )}
                    {activeTab === 'titles' && (
                        <span className={`text-xl font-black italic text-center px-4 ${RARITY_COLORS[item.rarity].split(' ')[0]}`}>{item.name}</span>
                    )}
                    {activeTab === 'themes' && (
                        <div className="flex gap-2 group-hover:scale-110 transition-transform duration-500">
                            <div className={`w-8 h-16 rounded-full ${item.colors[0]} shadow-inner`} />
                            <div className={`w-8 h-16 rounded-full ${item.colors[1]} shadow-inner`} />
                        </div>
                    )}
                </div>

                {/* Item Info */}
                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-2">{item.name}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 flex-1">{item.description}</p>

                {/* Action Button */}
                {isOwned ? (
                    <button 
                        onClick={() => handleEquipClick(item)}
                        disabled={isEquipped}
                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isEquipped ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30'}`}
                    >
                        {isEquipped ? 'Equipped' : 'Equip Data'}
                    </button>
                ) : (
                    <button 
                        onClick={() => setSelectedItem(item)}
                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${canAfford ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        {canAfford ? <Lock size={14} /> : <AlertCircle size={14} />}
                        {item.price} Flux
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* HEADER: Balance & Navigation */}
            <div className="sticky top-0 z-30 w-full flex flex-col shrink-0">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-5 flex justify-between items-center pt-safe border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-500/20">
                            <ShoppingBag size={22} strokeWidth={3}/>
                        </div>
                        <div>
                            <span className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-tighter block leading-none">Flux Exchange</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Black Market</span>
                        </div>
                    </div>
                    
                    {/* The Flux Wallet */}
                    <div className="bg-amber-100 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                        <Zap size={18} className="text-amber-500 fill-amber-500" />
                        <span className="font-black text-amber-600 dark:text-amber-400 text-lg tracking-tight">{fluxBalance.toLocaleString()}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3 overflow-x-auto custom-scrollbar overscroll-x-contain">
                    {[
                        { id: 'avatars', icon: CircleUser, label: 'Avatars' },
                        { id: 'auras', icon: Sparkles, label: 'Auras' },
                        { id: 'titles', icon: Tag, label: 'Titles' },
                        { id: 'themes', icon: Paintbrush, label: 'Themes' },
                    ].map((tab: any) => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`shrink-0 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CATALOG GRID */}
            <div className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {STORE_CATALOG[activeTab].map(renderItemCard)}
                </div>
            </div>

            {/* PURCHASE CONFIRMATION MODAL */}
            {selectedItem && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={() => setSelectedItem(null)} />
                    
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col p-8">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                            <Lock size={32} strokeWidth={2.5} />
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 leading-tight">Acquire {selectedItem.name}?</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center font-bold text-sm mb-8 px-4">
                            This will permanently decrypt this asset and add it to your inventory.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex justify-between items-center mb-8 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cost</span>
                            <span className="text-xl font-black text-amber-500 flex items-center gap-1.5"><Zap size={18} fill="currentColor"/> {selectedItem.price}</span>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedItem(null)} className="flex-1 px-4 py-4 rounded-xl font-black text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors active:scale-95 uppercase text-[10px] tracking-widest">Cancel</button>
                            <button onClick={handleBuy} className="flex-[2] px-4 py-4 rounded-xl font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 active:scale-95 transition-all shadow-lg uppercase text-[10px] tracking-widest">Confirm Purchase</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
