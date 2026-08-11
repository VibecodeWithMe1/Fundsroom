import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/20 scrollbar-thin ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-350">
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
          {children}
        </tbody>
      </table>
    </div>
  );
};
