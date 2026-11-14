'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTheme } from '@/store/slices/uiPreferenceSlice';
import { IconSun, IconMoon } from '@/components/ui/icons';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.uiPreference.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(nextTheme));
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Active theme: ${theme} (Click to switch)`}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${className}`}
    >
      {theme === 'dark' ? (
        <IconSun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <IconMoon className="h-4 w-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

