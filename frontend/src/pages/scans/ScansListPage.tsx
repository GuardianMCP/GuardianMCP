import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScans } from '@/hooks/useScans';
import { useServers } from '@/hooks/useServers';
import { formatDate, scoreColor } from '@/lib/utils';
import type { Scan, ScanStatus } from '@/types/api';

const statusStyles: Record<ScanStatus, string> = {
  completed: 'bg-green-500/10 text-green-400',
  running: 'bg-cyan-500/10 text-cyan-400',
  failed: 'bg-red-500/10 text-red-400',
  pending: 'bg-slate-500/10 text-slate-400',
};

export default function ScansListPage() {
  const [serverFilter, setServerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: serversData } = useServers();
  const { data, isLoading } = useScans({
    serverId: serverFilter || undefined,
  });

  const servers = serversData?.data ?? [];
  const scans = data?.data ?? [];
  const filteredScans = statusFilter
    ? scans.filter((s) => s.status === statusFilter)
    : scans;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scans</h1>
        <p className="mt-1 text-sm text-slate-400">View all scan results</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Servers</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Server</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Score</th>
              <th className="px-4 py-3 font-medium text-slate-400">Findings</th>
              <th className="px-4 py-3 font-medium text-slate-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {filteredScans.map((scan: Scan) => (
              <tr key={scan.id} className="transition hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <Link to={`/scans/${scan.id}`} className="font-medium text-white hover:text-cyan-400">
                    {scan.server?.name ?? scan.serverId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[scan.status]}`}>
                    {scan.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {scan.securityScore !== null ? (
                    <span className={`font-bold ${scoreColor(scan.securityScore)}`}>
                      {scan.securityScore}
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {scan.summary ? scan.summary.total : '-'}
                </td>
                <td className="px-4 py-3 text-slate-300">{formatDate(scan.createdAt)}</td>
              </tr>
            ))}
            {filteredScans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No scans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
