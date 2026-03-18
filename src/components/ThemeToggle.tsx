// src/components/ThemeToggle.tsx
import React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm transition-colors duration-300">
      <button 
        onClick={() => setTheme('light')}
        aria-label="Light Mode"
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
          theme === 'light' 
            ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Sun size={14} strokeWidth={2.5} />
        <span className="hidden md:inline">Light</span>
      </button>

      <button 
        onClick={() => setTheme('system')}
        aria-label="System Theme"
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
          theme === 'system' 
            ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Laptop size={14} strokeWidth={2.5} />
        <span className="hidden md:inline">System</span>
      </button>

      <button 
        onClick={() => setTheme('dark')}
        aria-label="Dark Mode"
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
          theme === 'dark' 
            ? 'bg-slate-800 text-indigo-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Moon size={14} strokeWidth={2.5} />
        <span className="hidden md:inline">Dark</span>
      </button>
    </div>
  );
}
