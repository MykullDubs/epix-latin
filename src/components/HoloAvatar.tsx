// src/components/HoloAvatar.tsx
import React from 'react';

const AURA_MAP: Record<string, string> = {
    'aura_emerald': 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]',
    'aura_void': 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]',
    'aura_solar': 'ring-4 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,1)] animate-pulse',
};

const AVATAR_SEEDS: Record<string, string> = {
    'av_cyberpup': 'cyberpup',
    'av_ninja': 'ninja',
    'av_astronaut': 'astronaut'
};

export default function HoloAvatar({ student, size = "md", className = "" }: { student: any, size?: "sm" | "md" | "lg" | "xl" | "hero", className?: string }) {
    const sizeClasses = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-20 h-20 text-2xl",
        hero: "w-32 h-32 text-4xl" 
    };

    const name = student?.name || "Student";
    const initials = name[0]?.toUpperCase() || "?";
    
    const equippedAvatar = student?.equipped?.avatars;
    const seed = AVATAR_SEEDS[equippedAvatar] || equippedAvatar; 
    
    const equippedAura = student?.equipped?.auras;
    const activeAuraCSS = equippedAura ? AURA_MAP[equippedAura] : '';

    // 🔥 Look for custom URLs from the Forge
    const avatarUrl = student?.avatarUrl || student?.profile?.main?.avatarUrl;

    return (
        <div className={`relative shrink-0 rounded-[35%] flex items-center justify-center font-black transition-all ${sizeClasses[size]} ${
            equippedAvatar || avatarUrl ? 'bg-slate-800' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
        } ${activeAuraCSS} ${className}`}>
            {equippedAvatar ? (
                <img 
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`} 
                    alt={name} 
                    className="w-full h-full object-contain p-1.5 drop-shadow-md animate-in zoom-in duration-300" 
                />
            ) : avatarUrl ? (
                <img 
                    src={avatarUrl} 
                    alt={name} 
                    className="w-full h-full object-contain p-1.5 animate-in zoom-in duration-300" 
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
