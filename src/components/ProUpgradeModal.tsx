// src/components/ProUpgradeModal.tsx
import React, { useState } from 'react';
import { X, Crown, CheckCircle2, Sparkles, Zap, Layers, BarChart, Mic } from 'lucide-react';

export default function ProUpgradeModal({ isOpen, onClose, onCheckout }: any) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

    if (!isOpen) return null;

    const isAnnual = billingCycle === 'annual';
    const price = isAnnual ? 12 : 15;
    const total = isAnnual ? 144 : 15;

    const features = [
        { icon: <Sparkles size={18} />, text: "Unlimited AI Scenario & Lesson Generation" },
        { icon: <Mic size={18} />, text: "Scenario Forge: Live AI Voice Roleplays" },
        { icon: <Layers size={18} />, text: "Premium Blocks: Audio Stories, Hotspots & Drawing" },
        { icon: <Zap size={18} />, text: "Unlock Slipstream & Connect Four Arenas" },
        { icon: <BarChart size={18} />, text: "Advanced Student Analytics & Gradebook" },
        { icon: <Crown size={18} />, text: "Unlimited Cohorts & Lesson Storage" },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Dark glassy backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.15)] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-rose-500 rounded-full transition-all z-20">
                    <X size={20} strokeWidth={3} />
                </button>

                {/* LEFT SIDE: Value Prop & Features */}
                <div className="flex-1 p-10 md:p-12 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-900 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] uppercase tracking-widest mb-6">
                            <Crown size={14} strokeWidth={3} /> Magister OS Premium
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-6">
                            Supercharge your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">teaching workflow.</span>
                        </h2>
                        
                        <p className="text-slate-400 font-medium text-lg mb-10 max-w-md">
                            Stop spending hours planning. Unlock next-gen AI tools, premium interactive arenas, and unlimited capacity for your classroom.
                        </p>

                        <div className="space-y-4">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-200">
                                    <div className="p-1.5 bg-slate-800 text-amber-500 rounded-lg shadow-inner border border-slate-700">
                                        {f.icon}
                                    </div>
                                    <span className="font-bold text-sm">{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Pricing & Checkout */}
                <div className="w-full md:w-[400px] bg-slate-950 p-10 md:p-12 flex flex-col items-center justify-center border-l border-slate-800 relative">
                    
                    {/* Billing Toggle */}
                    <div className="bg-slate-900 p-1.5 rounded-2xl flex items-center mb-10 border border-slate-800 w-full relative">
                        <div 
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-700 rounded-xl transition-all duration-300 shadow-md ${isAnnual ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}
                        />
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${!isAnnual ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setBillingCycle('annual')}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest relative z-10 transition-colors ${isAnnual ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Annual
                        </button>
                        
                        {/* Discount Badge */}
                        <div className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-emerald-500/20 rotate-12">
                            Save 20%
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="text-center mb-10">
                        <div className="flex items-start justify-center gap-1 mb-2">
                            <span className="text-2xl font-bold text-slate-400 mt-2">$</span>
                            <span className="text-7xl font-black text-white tracking-tighter">{price}</span>
                            <span className="text-lg font-bold text-slate-500 self-end mb-2">/mo</span>
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                            {isAnnual ? `Billed annually at $${total}` : 'Billed monthly. Cancel anytime.'}
                        </p>
                    </div>

                    {/* Checkout Button */}
                    <button 
                        onClick={() => onCheckout(billingCycle)}
                        className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Proceed to Checkout
                    </button>

                    <p className="text-[10px] text-slate-500 font-medium text-center mt-6 uppercase tracking-widest">
                        Secure payment powered by Stripe
                    </p>
                </div>
            </div>
        </div>
    );
}
