import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No records found',
  description = 'Try adjusting your search queries or create a new record.',
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
      <div className="flex items-center justify-center p-3 rounded-full bg-slate-800/50 text-slate-500 mb-3">
        {icon ? icon : <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-200">{message}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-md">{description}</p>
    </div>
  );
};
