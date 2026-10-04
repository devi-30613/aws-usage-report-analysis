import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  BarChart3,
  Server,
  FileText,
  Database,
  Settings,
  Cloud,
  Zap,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, dataSource = 'mock' }) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Cost Analysis', path: '/cost-analysis', icon: DollarSign },
    { name: 'Usage Analysis', path: '/usage-analysis', icon: BarChart3 },
    { name: 'AWS Services', path: '/services', icon: Server },
    { name: 'Reports & Export', path: '/reports', icon: FileText },
    { name: 'AWS Data Pipeline', path: '/aws-data', icon: Database },
    { name: 'Settings & Config', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-glow-orange text-slate-950 font-bold">
            <Cloud className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">AWS Usage</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Report & Analytics</p>
          </div>
        </div>

        {/* Data Source Mode Indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dataSource === 'aws' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-medium">Engine Mode:</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
              dataSource === 'aws'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {dataSource.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-glow-orange'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Architecture Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Athena + S3</span>
              </span>
              <span className="text-emerald-400 font-mono">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              FastAPI backend running with Boto3 query orchestration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
