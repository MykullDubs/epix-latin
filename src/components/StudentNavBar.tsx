// src/components/StudentNavBar.tsx
import React from 'react';   
import { Home, Compass, Layers, User, ShoppingBag } from 'lucide-react';
import HoloAvatar from './HoloAvatar';

// ============================================================================
//  STUDENT NAVIGATION BAR (Flat Architectural Grid Edition)
// ============================================================================
export default function StudentNavBar({ activeTab, setActiveTab, activeOrg, userData }: any) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'discovery', icon: Compass, label: 'Explore' },
    { id: 'flashcards', icon: Layers, label: 'Decks' },
    { id: 'store', icon: ShoppingBag, label: 'Market' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  // Primary brand color used as a stark solid fill for the active tile
  const themeColor = activeOrg?.themeColor || '#4f46e5'; 

  return (
    <nav className="absolute bottom-0 left-0 w-full bg-white dark:bg-black border-t-2 border-zinc-900 dark:border-zinc-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex divide-x-2 divide-zinc-900 dark:divide-zinc-200 h-[64px] sm:h-[72px]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              style={isActive ? { backgroundColor: themeColor } : {}} 
            >
              <div className="mb-1.5 flex items-center justify-center">
                {tab.id === 'profile' && userData ? (
                  <div className={`w-6 h-6 border-2 flex items-center justify-center overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${
                      isActive ? 'border-white' : 'border-current'
                  }`}>
                    {/* Wrapping the avatar in a strict square box to enforce the flat UI */}
                    <HoloAvatar student={userData} size="sm" className="w-full h-full object-cover scale-110" />
                  </div>
                ) : (
                  <Icon size={20} strokeWidth={isActive ? 3 : 2.5} />
                )}
              </div>
              
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-75'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
