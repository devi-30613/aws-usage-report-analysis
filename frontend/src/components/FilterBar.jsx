import React, { useState } from 'react';
import { Filter, Calendar, RotateCcw, ChevronDown, Check } from 'lucide-react';

const AWS_SERVICES = [
  'Amazon EC2',
  'Amazon S3',
  'Amazon RDS',
  'AWS Lambda',
  'Amazon DynamoDB',
  'Amazon CloudFront',
  'Amazon CloudWatch',
  'Amazon ECS',
  'AWS Athena',
  'Amazon SNS/SQS'
];

const AWS_REGIONS = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)' }
];

export default function FilterBar({ filters, onFilterChange, onReset }) {
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);

  const handleDatePreset = (preset) => {
    const today = new Date('2026-10-01'); // Normalized to dataset horizon
    let start = '';
    const end = '2026-10-01';

    if (preset === '30d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (preset === '90d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split('T')[0];
    } else if (preset === '180d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 180);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'ytd') {
      start = '2026-01-01';
    } else if (preset === 'all') {
      start = '';
    }

    onFilterChange({
      ...filters,
      start_date: start,
      end_date: start ? end : ''
    });
  };

  const toggleService = (svc) => {
    const current = filters.services || [];
    const exists = current.includes(svc);
    const updated = exists ? current.filter((s) => s !== svc) : [...current, svc];
    onFilterChange({ ...filters, services: updated.length ? updated : undefined });
  };

  const toggleRegion = (reg) => {
    const current = filters.regions || [];
    const exists = current.includes(reg);
    const updated = exists ? current.filter((r) => r !== reg) : [...current, reg];
    onFilterChange({ ...filters, regions: updated.length ? updated : undefined });
  };

  const selectedServicesCount = filters.services?.length || 0;
  const selectedRegionsCount = filters.regions?.length || 0;

  return (
    <div className="p-4 mb-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Horizon:</span>
          </span>
          {[
            { id: 'all', label: 'All History' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 3 Months' },
            { id: '180d', label: 'Last 6 Months' },
            { id: 'ytd', label: 'YTD 2026' }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDatePreset(preset.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Reset Filters */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => onFilterChange({ ...filters, start_date: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => onFilterChange({ ...filters, end_date: e.target.value })}
            className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Services Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            AWS Services ({selectedServicesCount ? `${selectedServicesCount} Selected` : 'All'})
          </label>
          <button
            type="button"
            onClick={() => setShowServiceMenu(!showServiceMenu)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:border-slate-600"
          >
            <span className="truncate">
              {selectedServicesCount ? `${selectedServicesCount} services active` : 'All Services'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showServiceMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 p-2 space-y-1">
              {AWS_SERVICES.map((s) => {
                const isSelected = filters.services?.includes(s);
                return (
                  <div
                    key={s}
                    onClick={() => toggleService(s)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 cursor-pointer text-slate-200"
                  >
                    <span>{s}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Regions Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            AWS Regions ({selectedRegionsCount ? `${selectedRegionsCount} Selected` : 'All'})
          </label>
          <button
            type="button"
            onClick={() => setShowRegionMenu(!showRegionMenu)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:border-slate-600"
          >
            <span className="truncate">
              {selectedRegionsCount ? `${selectedRegionsCount} regions active` : 'All Regions'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRegionMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 p-2 space-y-1">
              {AWS_REGIONS.map((r) => {
                const isSelected = filters.regions?.includes(r.code);
                return (
                  <div
                    key={r.code}
                    onClick={() => toggleRegion(r.code)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 cursor-pointer text-slate-200"
                  >
                    <div>
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({r.code})</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
