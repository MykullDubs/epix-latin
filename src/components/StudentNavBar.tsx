// src/components/StudentNavBar.tsx
import React from 'react';
import { Home, Compass, Layers, User, ShoppingBag } from 'lucide-react';

// ============================================================================
//  STUDENT NAVIGATION BAR (Frosted Pill Edition)
// ============================================================================
export default function StudentNavBar({ activeTab, setActiveTab, activeOrg }: any) {
  const tabs = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'discovery', icon: <Compass size={24} />, label: 'Explore' },
    { id: 'flashcards', icon: <Layers size={24} />, label: 'Decks' },
    { id: 'store', icon: <ShoppingBag size={24} />, label: 'Market' }, // 🔥 THE BLACK MARKET DOOR
    { id: 'profile', icon: <User size={24} />, label: 'Profile' }
  ];

  // Fallback theme color (your app's default color, e.g., Indigo-600)
  const themeColor = activeOrg?.themeColor || '#4f46e5'; 

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/60 px-6 py-4 pb-8 z-40 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-colors duration-300">
      <div className="flex justify-between items-center w-full max-w-md mx-auto px-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300 relative ${
                isActive ? '' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              style={isActive ? { color: themeColor } : {}} 
            >
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-2 scale-110 drop-shadow-md' : 'hover:scale-110'}`}>
                {tab.icon}
              </div>
              
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 absolute -bottom-4 whitespace-nowrap ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {tab.label}
              </span>

              {/* Little glowing dot under the active tab */}
              {isActive && (
                <div 
                  className="absolute -bottom-6 w-1.5 h-1.5 rounded-full shadow-lg transition-all duration-300 animate-in zoom-in" 
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 12px ${themeColor}` }} 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
