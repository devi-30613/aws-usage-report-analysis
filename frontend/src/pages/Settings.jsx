import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  Terminal,
  ArrowRight,
  ExternalLink,
  Check
} from 'lucide-react';
import { fetchAwsStatus, clearBackendCache, switchDataSourceMode, testAwsConnection, saveAwsConfig } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [cacheClearing, setCacheClearing] = useState(false);

  // AWS Connection Form State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [athenaDb, setAthenaDb] = useState('aws_usage_db');
  const [athenaTable, setAthenaTable] = useState('aws_usage_reports');
  const [athenaOutput, setAthenaOutput] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAwsStatus();
      setStatus(res);
      if (res.aws_region) setRegion(res.aws_region);
      if (res.s3_bucket) setS3Bucket(res.s3_bucket);
      if (res.athena_database) setAthenaDb(res.athena_database);
      if (res.athena_table) setAthenaTable(res.athena_table);
      if (res.athena_output_bucket) setAthenaOutput(res.athena_output_bucket);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AWS settings & diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggleMode = async (targetMode) => {
    try {
      const res = await switchDataSourceMode(targetMode);
      setToast(`Engine mode switched to: ${res.data_source.toUpperCase()}`);
      await loadStatus();
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast('Failed to switch data source mode');
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleClearCache = async () => {
    try {
      setCacheClearing(true);
      await clearBackendCache();
      setToast('TTL cache flushed. Hit/Miss metrics reset.');
      await loadStatus();
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast('Failed to flush cache');
      setTimeout(() => setToast(null), 3500);
    } finally {
      setCacheClearing(false);
    }
  };

  const handleTestAwsConnection = async (e) => {
    if (e) e.preventDefault();
    if (!accessKey || !secretKey) {
      setTestError('Please enter both AWS Access Key ID and Secret Access Key.');
      return;
    }

    try {
      setTestingConnection(true);
      setTestResult(null);
      setTestError(null);

      const payload = {
        region: region,
        aws_region: region,
        access_key_id: accessKey,
        aws_access_key_id: accessKey,
        secret_access_key: secretKey,
        aws_secret_access_key: secretKey,
        session_token: sessionToken || null,
        aws_session_token: sessionToken || null,
        s3_bucket: s3Bucket || null,
        athena_database: athenaDb || 'aws_usage_db',
        athena_table: athenaTable || 'aws_usage_reports',
        athena_output_location: athenaOutput || null
      };

      const result = await testAwsConnection(payload);
      setTestResult(result);
    } catch (err) {
      setTestError(err.response?.data?.detail || err.message || 'Failed to authenticate with AWS.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveAndConnect = async () => {
    if (!accessKey || !secretKey) {
      setTestError('Please enter both AWS Access Key ID and Secret Access Key.');
      return;
    }

    try {
      setSavingConfig(true);
      const payload = {
        region: region,
        aws_region: region,
        access_key_id: accessKey,
        aws_access_key_id: accessKey,
        secret_access_key: secretKey,
        aws_secret_access_key: secretKey,
        session_token: sessionToken || null,
        aws_session_token: sessionToken || null,
        s3_bucket: s3Bucket || null,
        athena_database: athenaDb || 'aws_usage_db',
        athena_table: athenaTable || 'aws_usage_reports',
        athena_output_location: athenaOutput || null
      };

      const res = await saveAwsConfig(payload);
      setToast('AWS Credentials saved & Platform is now LIVE on AWS!');
      setShowConnectModal(false);
      await loadStatus();
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setTestError(err.response?.data?.detail || 'Failed to save configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Platform Settings & AWS Connection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect live Amazon S3 & Athena resources, configure IAM credentials, and manage cache
          </p>
        </div>

        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-glow-orange"
        >
          <Cloud className="w-4 h-4" />
          <span>Connect Real AWS Account</span>
        </button>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={loadStatus} />}

      {/* Automated Setup Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-card-dark space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Automated 1-Click AWS Provisioning Script Available</h3>
            <p className="text-xs text-slate-300">
              You can automatically create S3 buckets, upload data, provision Athena database & tables with a single command:
            </p>
          </div>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between">
          <code>python scripts/setup_aws_resources.py</code>
          <span className="text-[10px] text-slate-500">Run in terminal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Data Engine Mode Selector */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Data Engine Operational Mode</h3>
              <p className="text-[11px] text-slate-400">Toggle between local mock emulation and live AWS Athena queries</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div
              onClick={() => handleToggleMode('mock')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                status?.data_source === 'mock'
                  ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="font-bold text-xs text-white">Mock Development Mode (Zero AWS Cost)</span>
                </div>
                {status?.data_source === 'mock' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Uses local 10,000+ record sample dataset from <code>data/sample_aws_usage.csv</code>. Instant response times, ideal for presentations and testing.
              </p>
            </div>

            <div
              onClick={() => handleToggleMode('aws')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                status?.data_source === 'aws'
                  ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="font-bold text-xs text-white">Live AWS Mode (Amazon Athena + S3)</span>
                </div>
                {status?.data_source === 'aws' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Submits real Presto SQL queries via Boto3 to Amazon Athena and pulls billed data from your S3 bucket.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Cache Management */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Athena & API Query Caching</h3>
              <p className="text-[11px] text-slate-400">Prevents repeated Athena scans and eliminates redundant charges</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <p className="text-slate-400">Cached Query Entries</p>
              <p className="text-xl font-bold font-mono text-white mt-1">{status?.cached_queries_count ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <p className="text-slate-400">Cache Hit Rate</p>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{status?.cache_hit_rate_pct ?? 0}%</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Default TTL is 300 seconds (5 minutes). Flushing cache forces Athena to re-scan datasets on subsequent requests.
          </p>

          <button
            onClick={handleClearCache}
            disabled={cacheClearing}
            className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cacheClearing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{cacheClearing ? 'Flushing Cache...' : 'Flush Backend Query Cache'}</span>
          </button>
        </div>

        {/* Card 3: Active AWS Identifiers */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Server className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Active AWS Resource Parameters</h3>
              <p className="text-[11px] text-slate-400">Current configuration loaded by FastAPI backend</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 font-sans">AWS Region:</span>
              <span className="text-white font-bold">{status?.aws_region || 'us-east-1'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 font-sans">Athena Database:</span>
              <span className="text-amber-400 font-bold">{status?.athena_database || 'aws_usage_db'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 font-sans">Athena Table:</span>
              <span className="text-sky-400 font-bold">{status?.athena_table || 'aws_usage_reports'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-slate-400 font-sans">S3 Data Bucket:</span>
              <span className="text-emerald-400 font-bold truncate max-w-[200px]">{status?.s3_bucket}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Security Policy */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-card-dark space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Zero Frontend Secret Exposure Policy</h3>
              <p className="text-[11px] text-slate-400">Production IAM and security best practices</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Secure Server-Side Boto3 Execution</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AWS credentials are stored strictly in backend server environment variables. Browser requests only receive sanitized query analytics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <Check className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">IAM Least Privilege</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The provided policy in <code>docs/aws-setup.md</code> restricts permissions strictly to Athena query execution and S3 read/write on the designated buckets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Real AWS Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Connect Real AWS Account</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            {testError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            {testResult && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{testResult.message}</span>
                </div>
                <p>AWS Account ID: <strong>{testResult.account_id}</strong></p>
                <p>IAM Principal: <code className="text-[11px]">{testResult.user_arn}</code></p>
                <p>Latency: <strong>{testResult.latency_ms}ms</strong> &bull; S3 Status: <strong>{testResult.s3_bucket_status}</strong></p>
              </div>
            )}

            <form onSubmit={handleTestAwsConnection} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">AWS Region *</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="us-east-1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">AWS Access Key ID *</label>
                  <input
                    type="text"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">AWS Secret Access Key *</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">AWS Session Token (Optional, for AWS Academy / SSO)</label>
                <input
                  type="password"
                  value={sessionToken}
                  onChange={(e) => setSessionToken(e.target.value)}
                  placeholder="IQoJb3JpZ2luX2Vj..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">S3 Data Bucket Name</label>
                  <input
                    type="text"
                    value={s3Bucket}
                    onChange={(e) => setS3Bucket(e.target.value)}
                    placeholder="my-aws-usage-reports-bucket"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Athena Database Name</label>
                  <input
                    type="text"
                    value={athenaDb}
                    onChange={(e) => setAthenaDb(e.target.value)}
                    placeholder="aws_usage_db"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={testingConnection}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{testingConnection ? 'Testing STS Identity...' : '1. Test Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  disabled={savingConfig}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-glow-orange transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingConfig ? 'Saving & Switching...' : '2. Save & Connect Live AWS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
