import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-amber-400',
  iconBg = 'bg-amber-500/10 border-amber-500/20',
  subtext,
  tooltip
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0 || change === undefined || change === null;

  return (
    <div className="relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-dark glass-panel-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-300">
                <Info className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
        {change !== undefined && change !== null ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-semibold ${
                isPositive
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : isNegative
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
              {isNeutral && <Minus className="w-3.5 h-3.5" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </span>
            <span className="text-slate-400">{changeLabel}</span>
          </div>
        ) : subtext ? (
          <span className="text-slate-400 font-medium">{subtext}</span>
        ) : null}
      </div>
    </div>
  );
}
