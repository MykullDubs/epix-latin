// src/components/InstallPWA.tsx
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true); // Default true to prevent flash
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if we are already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Detect iOS (Apple blocks the standard install prompt)
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIosDevice && !isStandalone) {
        setShowIosPrompt(true);
    }

    // 3. Intercept the standard Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
    };

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('Magister OS was successfully installed.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // If already installed, render absolutely nothing.
  if (isInstalled) return null;

  // Render the iOS Manual Instructions
  if (showIosPrompt && !isInstallable) {
      return (
          <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-xl shadow-indigo-900/5 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 bg-indigo-50 w-24 h-24 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />
              <button onClick={() => setShowIosPrompt(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <X size={16} />
              </button>
              
              <div className="flex items-center gap-4 relative z-10 mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Smartphone size={24} />
                  </div>
                  <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Install Magister OS</h4>
                      <p className="text-slate-500 text-xs font-bold mt-1">Get the native iOS experience.</p>
                  </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-600 relative z-10 border border-slate-100">
                  <span>1. Tap</span> <Share size={16} className="text-indigo-500" /> 
                  <span>2. Scroll down to</span> <PlusSquare size={16} className="text-slate-800" /> <span>Add to Home Screen</span>
              </div>
          </div>
      );
  }

  // Render the Android/Chrome 1-Click Install Button
  if (isInstallable) {
      return (
        <button 
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-slate-900/20 transition-all active:scale-95 group font-black uppercase tracking-widest text-[10px]"
        >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-transform">
                <Download size={18} strokeWidth={2.5} />
            </div>
            Install App to Device
        </button>
      );
  }

  return null;
}
