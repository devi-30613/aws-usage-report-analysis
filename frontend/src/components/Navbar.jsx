import React, { useState } from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { clearBackendCache, getDocsUrl } from '../services/api';

export default function Navbar({
  toggleSidebar,
  onRefresh,
  isRefreshing,
  dataSource = 'mock',
  insights = []
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState(null);

  const handleClearCache = async () => {
    try {
      setCacheClearing(true);
      await clearBackendCache();
      setCacheMessage('Cache flushed successfully');
      if (onRefresh) onRefresh();
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (err) {
      setCacheMessage('Failed to clear cache');
      setTimeout(() => setCacheMessage(null), 3000);
    } finally {
      setCacheClearing(false);
    }
  };

  const highSeverityAlerts = insights.filter((i) => i.severity === 'HIGH' || i.severity === 'MEDIUM');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Left: Mobile Menu Trigger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 rounded-lg lg:hidden hover:text-white hover:bg-slate-800"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">AWS Management</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-sm font-semibold text-slate-200">Cloud Financial Analytics</h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cache status toast */}
        {cacheMessage && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{cacheMessage}</span>
          </div>
        )}

        {/* Clear Cache Button */}
        <button
          onClick={handleClearCache}
          disabled={cacheClearing}
          title="Clear Athena & Backend TTL Cache"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Flush Cache</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        {/* Notifications / Anomaly Alerts */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
            title="Cost Anomalies & Notifications"
          >
            <Bell className="w-4 h-4" />
            {highSeverityAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-card-dark z-50 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Cost Alerts & Anomalies</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {highSeverityAlerts.length} Active
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {highSeverityAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No high severity anomalies detected in current period.</p>
                ) : (
                  highSeverityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{alert.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-snug">{alert.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AWS Documentation Link */}
        <a
          href={getDocsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-glow-orange transition-all"
        >
          <span>FastAPI Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
