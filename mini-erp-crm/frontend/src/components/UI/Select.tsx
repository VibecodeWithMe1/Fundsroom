import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          } ${className}`}
          {...props}
        >
          {options.map((option, idx) => (
            <option key={idx} value={option.value} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-xs text-red-400 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
