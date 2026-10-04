import React, { useState, useEffect } from 'react';
import {
  Server,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  Globe,
  ExternalLink,
  X
} from 'lucide-react';
import { fetchServices } from '../services/api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatNumber, formatPercentage, getServiceColor } from '../utils/formatters';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortField, setSortField] = useState('total_cost');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchServices();
      setServices(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load AWS services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Extract distinct categories
  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services
    .filter((s) => {
      const matchesSearch = s.service.toLowerCase().includes(search.toLowerCase()) ||
        s.primary_region.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalSpend = services.reduce((acc, s) => acc + s.total_cost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          AWS Services Directory & Catalog
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore all active AWS products, primary deployment regions, resource counts, and month-over-month changes
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Control Bar: Search & Category Chips */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search AWS services, regions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-semibold">Total Services: <strong className="text-white">{services.length}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-semibold">Total Portfolio: <strong className="text-amber-400 font-mono">{formatCurrency(totalSpend)}</strong></span>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 shadow-glow-orange'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <TableSkeleton rows={8} />
      ) : filteredServices.length > 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 cursor-pointer select-none">
                <tr>
                  <th onClick={() => handleSort('service')} className="py-3.5 px-4 hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>AWS Service</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('category')} className="py-3.5 px-4 hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('total_usage')} className="py-3.5 px-4 text-right hover:text-white">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Usage Volume</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('total_cost')} className="py-3.5 px-4 text-right hover:text-white">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Cost (USD)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('cost_share_pct')} className="py-3.5 px-4 hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>Bill Share</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('primary_region')} className="py-3.5 px-4 hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>Primary Region</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('cost_change_percentage')} className="py-3.5 px-4 text-right hover:text-white">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>MoM Change</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredServices.map((s, idx) => {
                  const isPositive = s.cost_change_percentage > 0;
                  const isNegative = s.cost_change_percentage < 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getServiceColor(s.service, idx) }}></span>
                        <span>{s.service}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                        {formatNumber(s.total_usage)} <span className="text-slate-500 font-sans">{s.usage_unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(s.total_cost)}
                      </td>
                      <td className="py-3.5 px-4 w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(s.cost_share_pct * 2, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{s.cost_share_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-sans">
                        {s.primary_region}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          isPositive
                            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                            : isNegative
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isPositive && <TrendingUp className="w-3 h-3" />}
                          {isNegative && <TrendingDown className="w-3 h-3" />}
                          {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                          <span>{formatPercentage(s.cost_change_percentage)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedService(s)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Matching Services"
          description="Try adjusting your search keyword or selected category filter."
          onReset={() => {
            setSearch('');
            setCategoryFilter('ALL');
          }}
        />
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getServiceColor(selectedService.service) }}></div>
                <h3 className="text-lg font-bold text-white">{selectedService.service}</h3>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-400">Total Billed Spend</p>
                <p className="text-lg font-bold font-mono text-amber-400 mt-1">{formatCurrency(selectedService.total_cost)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-400">Total Usage Consumption</p>
                <p className="text-lg font-bold font-mono text-slate-200 mt-1">{formatNumber(selectedService.total_usage)} {selectedService.usage_unit}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-400">Unique Active Resources</p>
                <p className="text-lg font-bold font-mono text-sky-400 mt-1">{selectedService.resource_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <p className="text-slate-400">Month-over-Month Variance</p>
                <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{formatPercentage(selectedService.cost_change_percentage)}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs space-y-1">
              <p className="text-slate-400">Top Usage Meter Driver:</p>
              <p className="font-mono font-semibold text-slate-200">{selectedService.top_usage_type}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-glow-orange"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
