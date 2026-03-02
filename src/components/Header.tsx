// src/components/Header.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Header({ title, subtitle, rightAction, onClickTitle, sticky = true }: any) {
  return (
    <div className={`px-6 pt-12 pb-6 bg-white ${sticky ? 'sticky top-0' : ''} z-40 border-b border-slate-100 flex justify-between items-end`}>
        <div onClick={onClickTitle} className={onClickTitle ? "cursor-pointer active:opacity-60 transition-opacity" : ""}>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {title} {onClickTitle && <ChevronDown size={20} className="text-slate-400" />}
            </h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        {rightAction}
    </div>
  );
}
