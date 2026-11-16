'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

export const DataScopeLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle,
}) => {
  const sizeMap = {
    sm: { icon: 'h-6 w-6', text: 'text-sm', sub: 'text-[10px]' },
    md: { icon: 'h-8 w-8', text: 'text-base', sub: 'text-xs' },
    lg: { icon: 'h-10 w-10', text: 'text-xl', sub: 'text-xs' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Bespoke Isometric Prism Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${icon}`}>
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 3L28 9.5L16 16L4 9.5L16 3Z"
            fill="url(#logo-prism-top)"
          />
          <path
            d="M4 9.5L16 16V29L4 22.5V9.5Z"
            fill="url(#logo-prism-left)"
          />
          <path
            d="M28 9.5L16 16V29L28 22.5V9.5Z"
            fill="url(#logo-prism-right)"
          />
          <polygon
            points="16,8 23,12 23,20 16,24 9,20 9,12"
            stroke="#6ee7b7"
            strokeWidth="1.2"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
          <circle cx="16" cy="16" r="2.4" fill="#a7f3d0" />
          <defs>
            <linearGradient id="logo-prism-top" x1="16" y1="2" x2="28" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="logo-prism-left" x1="4" y1="9" x2="16" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="logo-prism-right" x1="28" y1="9" x2="16" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Title and Subtitle */}
      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-bold tracking-tight text-slate-100 dark:text-slate-100 ${text}`}>
            DataScope
          </span>
          {subtitle && (
            <span className={`text-slate-400 dark:text-slate-400 font-medium ${sub} hidden sm:block`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
