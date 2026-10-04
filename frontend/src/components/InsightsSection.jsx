import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  DollarSign,
  Copy,
  Check
} from 'lucide-react';
import { getSeverityBadgeClass, formatCurrency } from '../utils/formatters';

export default function InsightsSection({ insights = [] }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyAction = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!insights || insights.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Automated Cloud Insights & Optimization Actions
            </h3>
            <p className="text-xs text-slate-400">
              Rule-based cost anomaly detection, sizing suggestions, and financial governance
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
          {insights.length} Actionable Findings
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${getSeverityBadgeClass(item.severity)}`}>
                    {item.severity} &bull; {item.category}
                  </span>
                  {item.impact_usd && (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Save {formatCurrency(item.impact_usd)}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="line-clamp-1">{item.action}</span>
                </div>
                <button
                  onClick={() => handleCopyAction(item.id, item.action)}
                  title="Copy Action Command"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
