import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm active:bg-blue-700 focus-visible:ring-blue-500',
      secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60 active:bg-slate-850',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800/80 text-slate-200 active:bg-slate-800',
      ghost: 'bg-transparent hover:bg-slate-800/70 text-slate-300 hover:text-white',
      destructive: 'bg-red-600/90 hover:bg-red-500 text-white shadow-sm active:bg-red-700',
      subtle: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded',
      sm: 'h-8 px-3 text-xs rounded-md font-medium',
      md: 'h-9 px-4 text-sm rounded-md font-medium',
      lg: 'h-10 px-5 text-base rounded-md font-medium',
      icon: 'h-9 w-9 p-0 rounded-md flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

