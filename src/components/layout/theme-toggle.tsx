'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTheme } from '@/store/slices/uiPreferenceSlice';
import { IconSun, IconMoon } from '@/components/ui/icons';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.uiPreference.theme);
  const [mounted, setMounted] = useState(false);

  // Sync initial theme from localStorage or document element on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('datascope_theme');
      if (stored === 'light' || stored === 'dark') {
        dispatch(setTheme(stored));
      } else {
        const isLight = document.documentElement.classList.contains('light');
        dispatch(setTheme(isLight ? 'light' : 'dark'));
      }
    } catch {
      // In restricted environments
    }
  }, [dispatch]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    if (nextTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    try {
      localStorage.setItem('datascope_theme', nextTheme);
    } catch {}

    dispatch(setTheme(nextTheme));
  };

  const isLight = mounted && theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={
        isLight
          ? 'Current theme: Light Mode. Click to switch to Night Mode'
          : 'Current theme: Night Mode. Click to switch to Light Mode'
      }
      title={
        isLight
          ? 'Theme: Light Mode (Click for Night Mode)'
          : 'Theme: Night Mode (Click for Light Mode)'
      }
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isLight
          ? 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
          : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
      } ${className}`}
    >
      {isLight ? (
        <IconSun className="h-4 w-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <IconMoon className="h-4 w-4 text-emerald-400 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};
