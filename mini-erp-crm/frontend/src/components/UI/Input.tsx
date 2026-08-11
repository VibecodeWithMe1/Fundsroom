import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center justify-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-slate-900/60 border border-slate-700 rounded-lg py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 ${
              leftIcon ? 'pl-10 pr-3' : 'px-3'
            } ${
              error ? 'border-red-550 focus:border-red-550 focus:ring-red-550' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-red-400 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
