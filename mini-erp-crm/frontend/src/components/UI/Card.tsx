import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-panel rounded-xl p-5 shadow-lg shadow-slate-950/40 ${className}`}>
      {children}
    </div>
  );
};
