import React from 'react';
import { Info, Download, Maximize2 } from 'lucide-react';

export default function ChartCard({
  title,
  subtitle,
  tooltip,
  action,
  children,
  className = ''
}) {
  return (
    <div className={`flex flex-col p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-dark ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-300">
                <Info className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {action && <div>{action}</div>}
      </div>

      {/* Body / Chart */}
      <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
