import React from 'react';

interface BadgeProps {
  value: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ value, variant, className = '' }) => {
  const getStyleByValue = (val: string) => {
    const v = val.toUpperCase();
    if (v === 'ACTIVE' || v === 'CONFIRMED' || v === 'NORMAL' || v === 'SUCCESS') {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (v === 'LEAD' || v === 'PENDING' || v === 'WARNING') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (v === 'INACTIVE' || v === 'CANCELLED' || v === 'LOW STOCK' || v === 'DANGER') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    if (v === 'DRAFT' || v === 'INFO' || v === 'RETAIL') {
      return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    }
    if (v === 'WHOLESALE' || v === 'SALES') {
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
    if (v === 'DISTRIBUTOR' || v === 'ADMIN') {
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    }
    if (v === 'WAREHOUSE') {
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    }
    if (v === 'ACCOUNTS') {
      return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
    }
    return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
  };

  const badgeStyle = variant 
    ? {
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
        info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        neutral: 'bg-slate-700/30 text-slate-400 border border-slate-700/50',
      }[variant]
    : getStyleByValue(value);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${badgeStyle} ${className}`}>
      {value}
    </span>
  );
};
