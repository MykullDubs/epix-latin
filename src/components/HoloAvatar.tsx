// src/components/HoloAvatar.tsx
import React from 'react';

// 🔥 HIGH-VOLTAGE AURA DEFINITIONS
// Upgraded to use ring-offset so the glow breathes outside the dark background
const AURA_MAP: Record<string, string> = {
    'aura_emerald': 'ring-[3px] ring-emerald-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.8)]',
    'aura_void': 'ring-[3px] ring-purple-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_25px_rgba(168,85,247,0.8)]',
    'aura_solar': 'ring-[3px] ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_35px_rgba(251,191,36,1)] animate-[pulse_1.5s_ease-in-out_infinite]',
};

// Maps store IDs to the Dicebear Bottts seeds
const AVATAR_SEEDS: Record<string, string> = {
    'av_cyberpup': 'cyberpup',
    'av_ninja': 'ninja',
    'av_astronaut': 'astronaut'
};

export default function HoloAvatar({ student, size = "md", className = "" }: { student: any, size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero", className?: string }) {
    const sizeClasses = {
        xs: "w-6 h-6 text-[8px]",
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-20 h-20 text-2xl",
        hero: "w-32 h-32 text-5xl" 
    };

    const name = student?.name || "Scholar";
    const initials = name[0]?.toUpperCase() || "?";
    
    // 1. Check for Store Avatars
    const equippedAvatar = student?.equipped?.avatars;
    const seed = AVATAR_SEEDS[equippedAvatar] || equippedAvatar; 
    
    // 2. Check for Store Auras
    const equippedAura = student?.equipped?.auras;
    const activeAuraCSS = equippedAura ? AURA_MAP[equippedAura] : 'border border-white/10 shadow-sm';

    // 🔥 3. Check for Custom Forge URLs 
    // It checks both the top-level payload (from the projector) and the nested profile (from local user data)
    const avatarUrl = student?.avatarUrl || student?.profile?.main?.avatarUrl;

    return (
        <div className={`relative shrink-0 rounded-[35%] flex items-center justify-center font-black transition-all duration-500 ${sizeClasses[size]} ${
            equippedAvatar || avatarUrl ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
        } ${activeAuraCSS} ${className}`}>
            
            {/* 🔥 HOLOGRAPHIC GLASS OVERLAY */}
            <div className="absolute inset-0 rounded-[35%] bg-gradient-to-tr from-white/5 to-white/20 pointer-events-none mix-blend-overlay z-20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
            
            {/* 🔥 CLIPPER FOR IMAGES (Separated so overflow-hidden doesn't kill the Aura shadows!) */}
            <div className="absolute inset-0 rounded-[35%] overflow-hidden z-10 flex items-center justify-center">
                
                {/* Render Store Avatar */}
                {equippedAvatar ? (
                    <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`} 
                        alt={name} 
                        className="w-full h-full object-contain p-1.5 drop-shadow-md animate-in zoom-in duration-300" 
                    />
                ) : 
                /* Render Custom Forge Avatar */
                avatarUrl ? (
                    <img 
                        src={avatarUrl} 
                        alt={name} 
                        className="w-full h-full object-cover animate-in zoom-in duration-300" 
                    />
                ) : 
                /* Fallback to Initials */
                (
                    <span className="relative z-10 drop-shadow-md">{initials}</span>
                )}
                
            </div>
        </div>
    );
}
