import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="text-sm text-slate-400 animate-pulse">Loading data...</p>
    </div>
  );
};
