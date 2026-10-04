import React from 'react';
import { Database, RotateCcw } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Found',
  description = 'No AWS usage or billing records matched the selected filters.',
  onReset
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 my-6">
      <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 mb-4 border border-slate-700">
        <Database className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-glow-orange"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
