import React from 'react';
import { Database, Server, HardDrive, Zap, CheckCircle, AlertCircle } from 'lucide-react';

export default function AwsStatusBadge({ statusData }) {
  if (!statusData) return null;

  const isConnected = statusData.is_aws_connected;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
      {/* Engine Status */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <span className="text-slate-400 font-medium">Pipeline:</span>
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{statusData.data_source === 'aws' ? 'Live Athena + S3' : 'Mock Development Engine'}</span>
        </div>
      </div>

      {/* S3 Bucket */}
      <div className="flex items-center gap-1.5 text-slate-300 pr-3 border-r border-slate-800 hidden md:flex">
        <HardDrive className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-slate-400">S3:</span>
        <span className="font-mono text-[11px] text-slate-200 truncate max-w-[140px]">{statusData.s3_bucket}</span>
      </div>

      {/* Athena DB */}
      <div className="flex items-center gap-1.5 text-slate-300 pr-3 border-r border-slate-800 hidden lg:flex">
        <Database className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-slate-400">DB:</span>
        <span className="font-mono text-[11px] text-slate-200">{statusData.athena_database}</span>
      </div>

      {/* Query Latency */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <Zap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Latency: <strong className="text-emerald-400 font-mono">{statusData.last_query_execution_time_ms}ms</strong></span>
      </div>
    </div>
  );
}
