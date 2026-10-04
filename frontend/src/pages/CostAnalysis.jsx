import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  ArrowUpDown,
  Download,
  Filter,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { fetchCosts } from '../services/api';
import ChartCard from '../components/ChartCard';
import FilterBar from '../components/FilterBar';
import { ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatNumber, formatPercentage, getServiceColor, DEFAULT_PALETTE } from '../utils/formatters';

export default function CostAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchResource, setSearchResource] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCosts(filters);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load cost analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const CustomCurrencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="font-mono font-medium">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const filteredResources = data?.highest_cost_resources?.filter((r) =>
    r.resource_id.toLowerCase().includes(searchResource.toLowerCase()) ||
    r.service.toLowerCase().includes(searchResource.toLowerCase()) ||
    r.project?.toLowerCase().includes(searchResource.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          AWS Cost & Financial Spend Analysis
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep-dive cost breakdown by service, region, environment, resource level, and Pareto 80/20 distribution
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={8} />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Row 1: Pareto Cumulative Cost Curve & Environment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pareto Chart */}
            <ChartCard
              title="Pareto 80/20 Cost Concentration"
              subtitle="Cumulative % contribution of services toward total spend"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.pareto_analysis} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="service" stroke="#94A3B8" fontSize={10} angle={-30} textAnchor="end" />
                  <YAxis yAxisId="left" stroke="#FF9900" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'Cumulative Share' ? `${val}%` : formatCurrency(val),
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar yAxisId="left" dataKey="cost" name="Service Cost" fill="#FF9900" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" name="Cumulative Share" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Environment Share */}
            <ChartCard
              title="Spend by Environment"
              subtitle="Production vs Non-Production cost ratio"
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.environment_breakdown}
                    dataKey="total_cost"
                    nameKey="environment"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.environment_breakdown.map((_, index) => (
                      <Cell key={`cell-env-${index}`} fill={['#EF4444', '#3B82F6', '#10B981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatCurrency(val), 'Cost']} contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Service Cost Table with Visual Progress Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Service-Wise Cost Distribution</h3>
                <p className="text-xs text-slate-400">Total expenditure and percentage share by AWS service</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-slate-800 rounded-lg text-slate-300 font-bold border border-slate-700">
                Total: {formatCurrency(data.total_cost)}
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Cost Share %</th>
                    <th className="py-3 px-4 text-right">Total Cost (USD)</th>
                    <th className="py-3 px-4 text-right">Resources Count</th>
                    <th className="py-3 px-4">Primary Region</th>
                    <th className="py-3 px-4 text-right">Usage Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.service_breakdown.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getServiceColor(s.service, idx) }}></span>
                        <span>{s.service}</span>
                      </td>
                      <td className="py-3 px-4 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${s.percentage_contribution}%`,
                                backgroundColor: getServiceColor(s.service, idx)
                              }}
                            ></div>
                          </div>
                          <span className="text-slate-400 text-[11px] w-12 text-right">{s.percentage_contribution}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatCurrency(s.total_cost)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {s.resource_count}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        {s.primary_region}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-300">
                        {formatNumber(s.usage_quantity)} <span className="text-slate-500 font-sans">{s.usage_unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Highest-Cost Individual Resources */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Top Highest-Cost AWS Resources</h3>
                <p className="text-xs text-slate-400">Identify top resource IDs driving the highest financial footprint</p>
              </div>

              <input
                type="text"
                placeholder="Search by resource ID, service, project..."
                value={searchResource}
                onChange={(e) => setSearchResource(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 w-64"
              />
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Resource Identifier</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Project Tag</th>
                    <th className="py-3 px-4 text-right">Usage Volume</th>
                    <th className="py-3 px-4 text-right">Total Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredResources.slice(0, 15).map((res, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-sky-400 truncate max-w-[200px]" title={res.resource_id}>
                        {res.resource_id}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {res.service}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {res.region}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          res.environment === 'Production'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {res.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">
                        {res.project}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {formatNumber(res.usage_quantity)} <span className="text-slate-500">{res.usage_unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatCurrency(res.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState onReset={() => setFilters({})} />
      )}
    </div>
  );
}
