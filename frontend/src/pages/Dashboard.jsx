import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Layers,
  Server,
  TrendingUp,
  Globe,
  Activity,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { fetchDashboard } from '../services/api';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import FilterBar from '../components/FilterBar';
import InsightsSection from '../components/InsightsSection';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatNumber, formatPercentage, getServiceColor, DEFAULT_PALETTE } from '../utils/formatters';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboard(filters);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({});
  };

  const kpis = data?.kpis;

  // Custom Chart Tooltips
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

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="font-semibold text-white">{p.name}</p>
          <p className="font-mono text-amber-400 font-bold">{formatCurrency(p.value)}</p>
          <p className="text-slate-400 text-[11px]">{p.payload.percentage_contribution || p.payload.percentage_share}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>AWS Cloud Spending & Usage Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial telemetry, usage trends, and automated optimization analytics
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total AWS Cost"
            value={formatCurrency(kpis.total_cost)}
            icon={DollarSign}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10 border-amber-500/20"
            subtext="Cumulative expenditure"
            tooltip="Total billed cost across all filtered AWS resources"
          />

          <StatCard
            title="Monthly Cost"
            value={formatCurrency(kpis.current_month_cost)}
            change={kpis.cost_change_percentage}
            changeLabel="MoM"
            icon={Calendar}
            iconColor="text-sky-400"
            iconBg="bg-sky-500/10 border-sky-500/20"
            tooltip="Current billing period run-rate"
          />

          <StatCard
            title="Total Usage"
            value={formatNumber(kpis.total_usage)}
            icon={Activity}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            subtext="Meter units consumed"
            tooltip="Sum of all compute hours, storage GB-Mo, and API request units"
          />

          <StatCard
            title="Active Services"
            value={kpis.total_services_count}
            icon={Layers}
            iconColor="text-indigo-400"
            iconBg="bg-indigo-500/10 border-indigo-500/20"
            subtext="AWS product footprint"
            tooltip="Distinct AWS service families with non-zero usage"
          />

          <StatCard
            title="Top Cost Driver"
            value={kpis.most_expensive_service}
            icon={Server}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/10 border-purple-500/20"
            subtext={formatCurrency(kpis.most_expensive_service_cost)}
            tooltip="Single service contributing the highest financial share"
          />

          <StatCard
            title="Cost Change"
            value={formatPercentage(kpis.cost_change_percentage)}
            change={kpis.cost_change_percentage}
            changeLabel="vs prev mo"
            icon={TrendingUp}
            iconColor={kpis.cost_change_percentage > 0 ? "text-red-400" : "text-emerald-400"}
            iconBg={kpis.cost_change_percentage > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}
            tooltip="Month-over-month expenditure percentage variance"
          />
        </div>
      ) : null}

      {/* Dynamic Rule-based Insights & Recommendations */}
      {!loading && data?.insights && (
        <InsightsSection insights={data.insights} />
      )}

      {/* Charts Grid: 5 Visualizations */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Row 1: Monthly Cost Trend & Cost by Service Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Monthly Cost Trend */}
            <ChartCard
              title="Monthly AWS Spend Trajectory"
              subtitle="Historical monthly billing progression"
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.monthly_costs} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthlyCostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9900" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF9900" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomCurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total_cost"
                    name="Cost (USD)"
                    stroke="#FF9900"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#monthlyCostGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Cost by AWS Service (Donut) */}
            <ChartCard
              title="Spend by AWS Service"
              subtitle="Percentage distribution of cloud bill"
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.service_costs}
                    dataKey="total_cost"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {data.service_costs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getServiceColor(entry.service, index)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-[11px] text-slate-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Usage Volume by Service & Cost by Region */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3. Usage Volume by Service */}
            <ChartCard
              title="Usage Quantity by Service"
              subtitle="Operational workload consumption"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.service_costs}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                  <YAxis type="category" dataKey="service" stroke="#94A3B8" fontSize={11} width={90} />
                  <Tooltip
                    formatter={(value, name, item) => [
                      `${formatNumber(value)} ${item.payload.usage_unit}`,
                      'Usage Volume'
                    ]}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="usage_quantity" name="Usage Quantity" radius={[0, 4, 4, 0]}>
                    {data.service_costs.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={getServiceColor(entry.service, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Cost by AWS Region */}
            <ChartCard
              title="Cost by AWS Region"
              subtitle="Regional infrastructure investment"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.region_costs} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="region" stroke="#94A3B8" fontSize={11} angle={-25} textAnchor="end" />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomCurrencyTooltip />} />
                  <Bar dataKey="total_cost" name="Spend (USD)" fill="#0073BB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Daily Cost Trend Timeline */}
          {data.daily_trend && data.daily_trend.length > 0 && (
            <ChartCard
              title="Daily Cost Run-Rate Trend"
              subtitle="Daily billing distribution across recent active days"
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.daily_trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyCostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip content={<CustomCurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total_cost"
                    name="Daily Spend (USD)"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dailyCostGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Recent Activity Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Recent AWS Usage Records</h3>
                <p className="text-xs text-slate-400">Latest granular usage meters retrieved from Athena query engine</p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Usage Type</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Cost (USD)</th>
                    <th className="py-3 px-4">Resource ID</th>
                    <th className="py-3 px-4">Environment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recent_activity.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors font-mono">
                      <td className="py-3 px-4 text-slate-400">{item.date}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getServiceColor(item.service) }}></span>
                        {item.service}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.usage_type}</td>
                      <td className="py-3 px-4 text-slate-400">{item.region}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatNumber(item.usage_quantity)} <span className="text-slate-500 font-sans">{item.usage_unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[130px]" title={item.resource_id}>
                        {item.resource_id}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.tag_environment === 'Production'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.tag_environment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState onReset={handleResetFilters} />
      )}
    </div>
  );
}
