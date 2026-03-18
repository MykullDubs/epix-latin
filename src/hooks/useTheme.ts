// src/hooks/useTheme.ts
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('magister-theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // 1. Determine which theme we are actually displaying
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // 2. Apply the theme class to Tailwind
    root.classList.add(activeTheme);
    localStorage.setItem('magister-theme', theme);

    // 🔥 3. THE MAGIC FIX: Paint the Android OS Status & Gesture Bars
    const bgColor = activeTheme === 'dark' ? '#020617' : '#f8fafc'; // slate-950 or slate-50
    
    // Update the meta tag for the top status bar
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', bgColor);
    }

    // Update the physical body background for the bottom gesture bar bleed-through
    document.body.style.backgroundColor = bgColor;

  }, [theme]);

  return { theme, setTheme };
}
