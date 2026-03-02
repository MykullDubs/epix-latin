// src/components/Toast.tsx
import React, { useEffect } from 'react';
import { Check, X, Info } from 'lucide-react';

// Standard Toast
export function Toast({ message, onClose }: any) {
  useEffect(() => { 
    const timer = setTimeout(onClose, 3000); 
    return () => clearTimeout(timer); 
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 border border-white/10">
      <Check size={16} className="text-emerald-400" /> 
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  );
}

// Juicy Toast (The upgraded version)
export function JuicyToast({ message, type = 'success', onClose }: { message: string, type?: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles: any = {
    success: { bg: 'bg-slate-900/90', iconBg: 'bg-emerald-500', icon: <Check size={12} strokeWidth={4} className="text-slate-900" /> },
    error: { bg: 'bg-rose-900/90', iconBg: 'bg-white', icon: <X size={12} strokeWidth={4} className="text-rose-900" /> },
    info: { bg: 'bg-indigo-900/90', iconBg: 'bg-white', icon: <Info size={12} strokeWidth={4} className="text-indigo-900" /> }
  };

  const s = styles[type] || styles.success;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`${s.bg} backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}>
        <div className={`${s.iconBg} rounded-full p-1`}>{s.icon}</div>
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
}
