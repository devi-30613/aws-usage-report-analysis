import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Cpu,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  Terminal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { fetchAwsStatus } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import { formatNumber } from '../utils/formatters';

const SAMPLE_QUERIES = [
  {
    name: '1. Executive KPI Summary',
    description: 'Calculates grand total spend, total usage quantity, and distinct AWS service counts.',
    sql: `SELECT 
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND(SUM(usage_quantity), 2) AS total_usage,
    COUNT(DISTINCT service) AS distinct_services,
    COUNT(DISTINCT region) AS distinct_regions
FROM aws_usage_db.aws_usage_reports;`
  },
  {
    name: '2. Month-over-Month Variance',
    description: 'Uses SQL window function LAG() to compute MoM spend variance percentage.',
    sql: `WITH monthly_spend AS (
    SELECT substr(date, 1, 7) AS billing_month, SUM(cost) AS month_cost
    FROM aws_usage_db.aws_usage_reports
    GROUP BY substr(date, 1, 7)
)
SELECT 
    billing_month,
    ROUND(month_cost, 2) AS current_spend,
    ROUND(LAG(month_cost, 1) OVER (ORDER BY billing_month), 2) AS prev_spend,
    ROUND(((month_cost - LAG(month_cost, 1) OVER (ORDER BY billing_month)) / LAG(month_cost, 1) OVER (ORDER BY billing_month)) * 100, 2) AS mom_change_pct
FROM monthly_spend;`
  },
  {
    name: '3. Top Cost Drivers by Service',
    description: 'Aggregates spend across services with percentage share of the total cloud invoice.',
    sql: `SELECT 
    service,
    ROUND(SUM(cost), 2) AS service_total_cost,
    ROUND((SUM(cost) / (SELECT SUM(cost) FROM aws_usage_db.aws_usage_reports)) * 100, 2) AS bill_share_pct
FROM aws_usage_db.aws_usage_reports
GROUP BY service
ORDER BY service_total_cost DESC;`
  }
];

export default function AwsData() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryOutput, setQueryOutput] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAwsStatus();
      setStatus(res);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AWS infrastructure diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCopySql = (sql) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulatedQuery = () => {
    setQueryRunning(true);
    setQueryOutput(null);
    setTimeout(() => {
      setQueryRunning(false);
      if (activeQueryIndex === 0) {
        setQueryOutput({
          columns: ['total_cost', 'total_usage', 'distinct_services', 'distinct_regions'],
          rows: [['$36,505.52', '412,890.45', '10', '6']],
          execution_time: '142ms',
          scanned: '1.42 MB'
        });
      } else if (activeQueryIndex === 1) {
        setQueryOutput({
          columns: ['billing_month', 'current_spend', 'prev_spend', 'mom_change_pct'],
          rows: [
            ['2026-08', '$3,620.40', '$3,410.15', '+6.16%'],
            ['2026-09', '$3,890.10', '$3,620.40', '+7.45%'],
            ['2026-10', '$4,120.50', '$3,890.10', '+5.92%']
          ],
          execution_time: '188ms',
          scanned: '2.84 MB'
        });
      } else {
        setQueryOutput({
          columns: ['service', 'service_total_cost', 'bill_share_pct'],
          rows: [
            ['AWS Lambda', '$8,839.47', '24.21%'],
            ['Amazon EC2', '$7,240.12', '19.83%'],
            ['Amazon RDS', '$5,410.80', '14.82%'],
            ['Amazon S3', '$4,120.30', '11.29%'],
            ['Amazon DynamoDB', '$3,200.45', '8.77%']
          ],
          execution_time: '210ms',
          scanned: '3.12 MB'
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span>AWS Cloud Infrastructure & Pipeline Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect S3 storage buckets, Athena SQL catalog metadata, query performance telemetry, and data pipelines
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadStatus} />}

      {/* Interactive Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">End-to-End Pipeline Architecture</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Step 1: S3 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 relative">
            <div className="flex items-center gap-2 text-amber-400">
              <HardDrive className="w-5 h-5" />
              <span className="font-bold text-xs">1. Amazon S3</span>
            </div>
            <p className="text-[11px] text-slate-300">Raw AWS Usage/CUR CSV files stored under S3 bucket prefix.</p>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
              s3://{status?.s3_bucket || 'aws-usage-reports-bucket'}
            </div>
          </div>

          {/* Step 2: Athena */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 relative">
            <div className="flex items-center gap-2 text-sky-400">
              <Database className="w-5 h-5" />
              <span className="font-bold text-xs">2. Amazon Athena</span>
            </div>
            <p className="text-[11px] text-slate-300">Serverless Presto/Trino SQL queries against Glue Data Catalog.</p>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
              {status?.athena_database || 'aws_usage_db'}.{status?.athena_table || 'aws_usage_reports'}
            </div>
          </div>

          {/* Step 3: FastAPI */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 relative">
            <div className="flex items-center gap-2 text-emerald-400">
              <Cpu className="w-5 h-5" />
              <span className="font-bold text-xs">3. FastAPI Backend</span>
            </div>
            <p className="text-[11px] text-slate-300">Boto3 query orchestration, TTL caching, insights engine & PDF gen.</p>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
              Uptime: {status?.last_query_execution_time_ms}ms latency
            </div>
          </div>

          {/* Step 4: React */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 relative">
            <div className="flex items-center gap-2 text-purple-400">
              <Layers className="w-5 h-5" />
              <span className="font-bold text-xs">4. React Dashboard</span>
            </div>
            <p className="text-[11px] text-slate-300">Interactive charts, Pareto distributions, filters & live downloads.</p>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
              Vite + Tailwind + Recharts
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics Cards Grid */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>S3 Data Status</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white truncate font-mono">{status.s3_status}</p>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">Bucket: {status.s3_bucket}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Athena Query Engine</span>
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-bold text-emerald-400 font-mono">{status.athena_query_status}</p>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">DB: {status.athena_database}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Dataset Records</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono">{formatNumber(status.total_records_count)}</p>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">Latest: {status.latest_data_upload}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Engine Region</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white font-mono">{status.aws_region}</p>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">Cache Hit: {status.cache_hit_rate_pct}%</p>
          </div>
        </div>
      )}

      {/* Interactive SQL Query Console */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Amazon Athena SQL Query Catalog</h3>
          </div>

          {/* Query Selector Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveQueryIndex(idx);
                  setQueryOutput(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeQueryIndex === idx
                    ? 'bg-amber-500 text-slate-950 shadow-glow-orange'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Query #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-300">
          <strong>Description:</strong> {SAMPLE_QUERIES[activeQueryIndex].description}
        </p>

        {/* Code Editor Preview Box */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>Athena SQL ({SAMPLE_QUERIES[activeQueryIndex].name})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopySql(SAMPLE_QUERIES[activeQueryIndex].sql)}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
            {SAMPLE_QUERIES[activeQueryIndex].sql}
          </pre>
        </div>

        {/* Execute Simulation Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleRunSimulatedQuery}
            disabled={queryRunning}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-glow-orange"
          >
            <Play className={`w-3.5 h-3.5 ${queryRunning ? 'animate-spin' : ''}`} />
            <span>{queryRunning ? 'Executing Athena Query...' : 'Run Query in Athena'}</span>
          </button>

          {queryOutput && (
            <span className="text-xs font-mono text-slate-400">
              Execution: <strong className="text-emerald-400">{queryOutput.execution_time}</strong> &bull; Scanned: <strong className="text-sky-400">{queryOutput.scanned}</strong>
            </span>
          )}
        </div>

        {/* Query Output Result Table */}
        {queryOutput && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Athena Query Result Set</h4>
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  {queryOutput.columns.map((c, i) => (
                    <th key={i} className="py-2 px-3">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {queryOutput.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/50">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 text-white font-bold">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
