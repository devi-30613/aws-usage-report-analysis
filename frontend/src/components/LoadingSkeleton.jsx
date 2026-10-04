import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-800 rounded"></div>
          <div className="h-7 w-32 bg-slate-700 rounded"></div>
        </div>
        <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-3 w-40 bg-slate-800 rounded pt-2"></div>
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className={`w-full ${height} rounded-2xl bg-slate-900/80 border border-slate-800 p-5 animate-pulse flex flex-col justify-between`}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-3 w-48 bg-slate-800/60 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded"></div>
      </div>
      <div className="flex items-end justify-between gap-3 h-44 pt-4">
        {[40, 65, 30, 85, 55, 90, 70, 45].map((val, idx) => (
          <div
            key={idx}
            className="flex-1 bg-slate-800 rounded-t"
            style={{ height: `${val}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-5 animate-pulse space-y-4">
      <div className="h-4 w-44 bg-slate-800 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex justify-between items-center gap-4 py-2 border-b border-slate-800/60">
            <div className="h-4 w-1/4 bg-slate-800 rounded"></div>
            <div className="h-4 w-1/6 bg-slate-800 rounded"></div>
            <div className="h-4 w-1/6 bg-slate-800 rounded"></div>
            <div className="h-4 w-1/5 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
