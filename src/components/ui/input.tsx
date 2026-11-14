import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-md border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-sm text-slate-100 shadow-sm transition-colors',
            'placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

