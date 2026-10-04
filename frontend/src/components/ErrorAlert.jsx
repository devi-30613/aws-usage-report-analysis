import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4 shadow-card-dark">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-red-100">Unable to Fetch Cloud Analytics Data</h4>
          <p className="text-xs text-red-300/80 mt-0.5">{message || 'An error occurred while communicating with the FastAPI Athena gateway.'}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-red-400 hover:bg-red-300 rounded-xl transition-all shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Query</span>
        </button>
      )}
    </div>
  );
}
