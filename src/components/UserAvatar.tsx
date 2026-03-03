import React from 'react';

export default function UserAvatar({ user, size = "md", border = false }: any) {
    const sizeClasses: any = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-12 h-12 text-sm",
        lg: "w-20 h-20 text-xl",
        xl: "w-32 h-32 text-2xl"
    };

    const avatarUrl = user?.avatarUrl || user?.profile?.main?.avatarUrl;
    const name = user?.name || "Scholar";
    const initials = name.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[30%] overflow-hidden flex items-center justify-center font-black transition-all ${
                avatarUrl ? 'bg-slate-100' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
            } ${border ? 'ring-4 ring-white shadow-xl' : ''}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {/* The "Agile" Online Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-1/4 h-1/4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
        </div>
    );
}
