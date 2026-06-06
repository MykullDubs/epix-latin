// src/components/SmartboardQRCode.tsx
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, ScanLine } from 'lucide-react';

interface SmartboardQRCodeProps {
  classId: string;
}

export default function SmartboardQRCode({ classId }: SmartboardQRCodeProps) {
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    // Dynamically grab the current domain (localhost or production domain)
    setJoinUrl(`${window.location.origin}/join/${classId}`);
  }, [classId]);

  // Prevent rendering until the client-side URL is established
  if (!joinUrl) return null; 

  return (
    <div className="flex flex-col items-center bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      {/* Subtle animated background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
      
      <div className="relative z-10 flex items-center gap-3 mb-6">
        <ScanLine className="text-indigo-400" size={28} />
        <h3 className="text-white font-black text-2xl tracking-tight uppercase">Join Arena</h3>
      </div>

      {/* The QR Code Container */}
      <div className="relative z-10 bg-white p-5 rounded-3xl mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-105 border-4 border-slate-800">
        <QRCode 
          value={joinUrl} 
          size={240}
          bgColor="#ffffff"
          fgColor="#020617" // Strict contrast (slate-950) for long-range smartboard scanning
          level="H" // High error correction so it scans easily even from the back of the classroom
        />
      </div>
      
      {/* Instructions & Manual Join Code */}
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mb-4">
          <Smartphone size={16} />
          <span>Point your camera to connect instantly</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manual Code</span>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-950 rounded-full border border-white/5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <span className="text-sm font-mono text-emerald-400 tracking-[0.2em] font-bold uppercase">{classId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
