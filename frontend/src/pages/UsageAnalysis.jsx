import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Cpu,
  HardDrive,
  BarChart2,
  TrendingUp,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

import { fetchUsage } from '../services/api';
import ChartCard from '../components/ChartCard';
import FilterBar from '../components/FilterBar';
import { ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatNumber, getServiceColor } from '../utils/formatters';

export default function UsageAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUsage(filters);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load usage analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          AWS Workload & Usage Consumption Analysis
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate operational capacity, compute instance hours, storage volume tiers, and API request meters
        </p>
      </div>

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
          {/* Row 1: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Usage Chart */}
            <ChartCard
              title="Workload Volume by Service"
              subtitle="Total quantity units consumed per service"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.service_usage} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="service" stroke="#94A3B8" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    formatter={(val, name, item) => [`${formatNumber(val)} ${item.payload.usage_unit}`, 'Total Usage']}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="total_quantity" name="Quantity Units" fill="#10B981" radius={[4, 4, 0, 0]}>
                    {data.service_usage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getServiceColor(entry.service, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Regional Usage Distribution */}
            <ChartCard
              title="Regional Usage Concentration"
              subtitle="Operational activity by AWS Region"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.regional_usage.slice(0, 10)} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="region" stroke="#94A3B8" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    formatter={(val, name, item) => [`${formatNumber(val)} units (${formatCurrency(item.payload.cost)})`, item.payload.service]}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="usage_quantity" name="Regional Usage" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Usage Meter Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Granular Usage Meters & Effective Unit Rates</h3>
                <p className="text-xs text-slate-400">Detailed pricing telemetry across individual billing meters</p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-800 rounded-lg text-slate-300 font-mono font-bold border border-slate-700">
                {data.usage_type_breakdown.length} Meters Tracked
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Usage Type / Meter</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Total Consumed</th>
                    <th className="py-3 px-4 text-right">Total Cost (USD)</th>
                    <th className="py-3 px-4 text-right">Effective Rate / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.usage_type_breakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getServiceColor(item.service, idx) }}></span>
                        <span>{item.service}</span>
                      </td>
                      <td className="py-3 px-4 text-sky-300">{item.usage_type}</td>
                      <td className="py-3 px-4 text-slate-400">{item.usage_unit}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-200">
                        {formatNumber(item.total_quantity)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatCurrency(item.total_cost)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                        ${item.unit_rate.toFixed(5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Top Resource Consumers */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white tracking-tight">Top High-Volume AWS Resources</h3>
              <p className="text-xs text-slate-400">Individual resources with highest volumetric throughput and utilization</p>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Resource ID</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4 text-right">Usage Volume</th>
                    <th className="py-3 px-4 text-right">Incurred Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data.top_resource_consumers.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-300">{r.resource_id}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">{r.service}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{r.region}</td>
                      <td className="py-3 px-4 text-right text-slate-200">
                        {formatNumber(r.total_usage)} <span className="text-slate-500 font-sans">{r.usage_unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatCurrency(r.total_cost)}
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
