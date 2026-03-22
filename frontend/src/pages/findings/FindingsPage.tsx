import { useState } from 'react';
import { useFindings, useBulkUpdateFindings } from '@/hooks/useFindings';
import { useServers } from '@/hooks/useServers';
import { formatDate } from '@/lib/utils';
import { SEVERITY_BG } from '@/lib/constants';
import type { Finding, FindingStatus, Severity } from '@/types/api';

export default function FindingsPage() {
  const [serverFilter, setServerFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data: serversData } = useServers();
  const { data, isLoading } = useFindings({
    serverId: serverFilter || undefined,
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
    page,
  });
  const bulkUpdate = useBulkUpdateFindings();

  const servers = serversData?.data ?? [];
  const findings = data?.data ?? [];
  const meta = data?.meta;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === findings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(findings.map((f) => f.id)));
    }
  };

  const handleBulkAction = (status: FindingStatus) => {
    if (selected.size === 0) return;
    bulkUpdate.mutate(
      { ids: Array.from(selected), status },
      { onSuccess: () => setSelected(new Set()) },
    );
  };

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
        <h1 className="text-2xl font-bold text-white">Findings</h1>
        <p className="mt-1 text-sm text-slate-400">Review and manage security findings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={serverFilter}
          onChange={(e) => { setServerFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Servers</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Severities</option>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {(['open', 'acknowledged', 'resolved', 'false_positive'] as FindingStatus[]).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1">
            <span className="text-xs text-slate-300">{selected.size} selected</span>
            <button
              onClick={() => handleBulkAction('acknowledged')}
              disabled={bulkUpdate.isPending}
              className="rounded bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20"
            >
              Acknowledge
            </button>
            <button
              onClick={() => handleBulkAction('resolved')}
              disabled={bulkUpdate.isPending}
              className="rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20"
            >
              Resolve
            </button>
            <button
              onClick={() => handleBulkAction('false_positive')}
              disabled={bulkUpdate.isPending}
              className="rounded bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-500/20"
            >
              False Positive
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={findings.length > 0 && selected.size === findings.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </th>
              <th className="px-4 py-3 font-medium text-slate-400">Rule</th>
              <th className="px-4 py-3 font-medium text-slate-400">Severity</th>
              <th className="px-4 py-3 font-medium text-slate-400">File</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {findings.map((f: Finding) => (
              <tr key={f.id} className="transition hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={() => toggleSelect(f.id)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{f.ruleName}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{f.message}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_BG[f.severity]}`}>
                    {f.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {f.file}:{f.line}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    f.status === 'open'
                      ? 'bg-red-500/10 text-red-400'
                      : f.status === 'acknowledged'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : f.status === 'resolved'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {f.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{formatDate(f.createdAt)}</td>
              </tr>
            ))}
            {findings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No findings match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
