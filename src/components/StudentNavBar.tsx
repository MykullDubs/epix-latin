// src/components/StudentNavBar.tsx
import React from 'react';
import { Home, Compass, Layers, User } from 'lucide-react';

// ============================================================================
//  STUDENT NAVIGATION BAR (Floating Pill Edition)
// ============================================================================
export default function StudentNavBar({ activeTab, setActiveTab, activeOrg }: any) {
  const tabs = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'discovery', icon: <Compass size={24} />, label: 'Explore' },
    { id: 'flashcards', icon: <Layers size={24} />, label: 'Decks' },
    { id: 'profile', icon: <User size={24} />, label: 'Profile' }
  ];

  // Fallback theme color (your app's default color, e.g., Indigo-600)
  const themeColor = activeOrg?.themeColor || '#4f46e5'; 

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 pb-8 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 transition-all duration-300 relative"
              style={{ color: isActive ? themeColor : '#94a3b8' }} 
            >
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-2 scale-110' : 'hover:scale-110'}`}>
                {tab.icon}
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 absolute -bottom-4 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                {tab.label}
              </span>

              {/* Little glowing dot under the active tab */}
              {isActive && (
                <div 
                  className="absolute -bottom-6 w-1.5 h-1.5 rounded-full shadow-lg" 
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
