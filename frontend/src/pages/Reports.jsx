import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Globe,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Printer
} from 'lucide-react';
import { generateReport, getReportPdfUrl, getReportCsvUrl } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';

const AWS_SERVICES = [
  'Amazon EC2', 'Amazon S3', 'Amazon RDS', 'AWS Lambda',
  'Amazon DynamoDB', 'Amazon CloudFront', 'Amazon CloudWatch',
  'Amazon ECS', 'AWS Athena', 'Amazon SNS/SQS'
];

const AWS_REGIONS = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)' }
];

export default function Reports() {
  const [title, setTitle] = useState('Executive Cloud Cost & Usage Analysis');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-10-01');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [includeRecs, setIncludeRecs] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    try {
      setGenerating(true);
      setError(null);
      const payload = {
        report_title: title,
        start_date: startDate || null,
        end_date: endDate || null,
        services: selectedServices.length ? selectedServices : null,
        regions: selectedRegions.length ? selectedRegions : null,
        include_recommendations: includeRecs
      };

      const res = await generateReport(payload);
      setReportResult(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate cloud analysis report.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleService = (s) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const toggleRegion = (r) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  // Generate direct download URLs based on active form state
  const filterParams = {
    report_title: title,
    start_date: startDate,
    end_date: endDate,
    services: selectedServices,
    regions: selectedRegions
  };
  const pdfDownloadUrl = getReportPdfUrl(filterParams);
  const csvDownloadUrl = getReportCsvUrl(filterParams);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <span>AWS Usage & Cost Report Generator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Generate comprehensive audit reports, executive summaries, and downloadable PDF/CSV exports
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={handleGenerate} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Report Configuration Form */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Report Configuration</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* Report Title */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Report Heading</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Date Horizons */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Service Filters */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-semibold">Filter Services ({selectedServices.length || 'All'})</label>
                {selectedServices.length > 0 && (
                  <button type="button" onClick={() => setSelectedServices([])} className="text-[10px] text-amber-400 hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {AWS_SERVICES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s)}
                      onChange={() => toggleService(s)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Region Filters */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-semibold">Filter Regions ({selectedRegions.length || 'All'})</label>
                {selectedRegions.length > 0 && (
                  <button type="button" onClick={() => setSelectedRegions([])} className="text-[10px] text-amber-400 hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {AWS_REGIONS.map((r) => (
                  <label key={r.code} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(r.code)}
                      onChange={() => toggleRegion(r.code)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Include Recommendations checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRecs}
                  onChange={(e) => setIncludeRecs(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Include AI/Rule-based Optimization Insights</span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-glow-orange transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Compiling Analytics...' : 'Generate Live Preview'}</span>
            </button>
          </form>

          {/* Direct Downloads Box */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Export Attachments</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={pdfDownloadUrl}
                download
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </a>
              <a
                href={csvDownloadUrl}
                download
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Sheet</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Report Live Preview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                REPORT PREVIEW
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{title}</h3>
              <p className="text-xs text-slate-400">
                Period: <strong className="text-slate-200">{startDate || 'All'}</strong> to <strong className="text-slate-200">{endDate || 'Latest'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={pdfDownloadUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>Save PDF</span>
              </a>
              <a
                href={csvDownloadUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save CSV</span>
              </a>
            </div>
          </div>

          {reportResult ? (
            <div className="space-y-6 text-xs">
              {/* Executive KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-slate-400">Total Filtered Spend</p>
                  <p className="text-base font-bold font-mono text-amber-400 mt-1">
                    {formatCurrency(reportResult.summary_metrics.total_cost)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-slate-400">Current Month Spend</p>
                  <p className="text-base font-bold font-mono text-sky-400 mt-1">
                    {formatCurrency(reportResult.summary_metrics.current_month_cost)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-slate-400">MoM Variance</p>
                  <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {formatPercentage(reportResult.summary_metrics.cost_change_pct)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-slate-400">Top Service Driver</p>
                  <p className="text-sm font-bold text-white truncate mt-1">
                    {reportResult.summary_metrics.top_service}
                  </p>
                </div>
              </div>

              {/* Service Table Preview */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2">Service Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3 text-right">Cost (USD)</th>
                        <th className="py-2.5 px-3 text-right">Bill Share</th>
                        <th className="py-2.5 px-3">Primary Region</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {reportResult.service_breakdown.slice(0, 5).map((s, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-sans text-white">{s.service}</td>
                          <td className="py-2 px-3 text-right font-bold text-amber-400">{formatCurrency(s.total_cost)}</td>
                          <td className="py-2 px-3 text-right text-slate-300">{s.percentage_contribution}%</td>
                          <td className="py-2 px-3 font-sans text-slate-400">{s.primary_region}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Recommendations Preview */}
              {reportResult.insights && reportResult.insights.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-200 mb-2">Included Optimization Recommendations</h4>
                  <div className="space-y-2">
                    {reportResult.insights.slice(0, 3).map((ins, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{ins.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                            {ins.severity}
                          </span>
                        </div>
                        <p className="text-slate-400">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No Report Generated Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Customize your date range and service filters on the left and click "Generate Live Preview" or download PDF directly.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-glow-orange"
              >
                Compile Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
