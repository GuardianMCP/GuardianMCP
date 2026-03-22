import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useScan } from '@/hooks/useScans';
import { useFindings } from '@/hooks/useFindings';
import { formatDate, scoreColor } from '@/lib/utils';
import { SEVERITY_BG } from '@/lib/constants';
import type { Finding, Severity } from '@/types/api';

const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function ScanDetailPage() {
  const { scanId: id } = useParams<{ scanId: string }>();
  const { data: scan, isLoading } = useScan(id!);
  const { data: findingsData } = useFindings({ page: 1 });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter findings that belong to this scan
  const allFindings = findingsData?.data ?? [];
  const findings = allFindings.filter((f) => f.scanId === id);

  const toggleRow = (findingId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  };

  if (isLoading || !scan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const groupedFindings = severityOrder.reduce(
    (acc, sev) => {
      const group = findings.filter((f) => f.severity === sev);
      if (group.length > 0) acc[sev] = group;
      return acc;
    },
    {} as Record<Severity, Finding[]>,
  );

  const statusBadge =
    scan.status === 'completed'
      ? 'bg-green-500/10 text-green-400'
      : scan.status === 'running'
        ? 'bg-cyan-500/10 text-cyan-400'
        : scan.status === 'failed'
          ? 'bg-red-500/10 text-red-400'
          : 'bg-slate-500/10 text-slate-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Scan Details</h1>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge}`}>
              {scan.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Server:{' '}
            <Link to={`/servers/${scan.serverId}`} className="text-cyan-400 hover:text-cyan-300">
              {scan.server?.name ?? scan.serverId}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-6">
          {scan.securityScore !== null && (
            <div className="text-center">
              <p className={`text-4xl font-bold ${scoreColor(scan.securityScore)}`}>
                {scan.securityScore}
              </p>
              <p className="text-xs text-slate-400">Score</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '-'}
            </p>
            <p className="text-xs text-slate-400">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{scan.filesScanned}</p>
            <p className="text-xs text-slate-400">Files</p>
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Started: {formatDate(scan.startedAt)}</span>
        <span>Completed: {formatDate(scan.completedAt)}</span>
        {scan.cliVersion && <span>CLI: v{scan.cliVersion}</span>}
        <span>Rules checked: {scan.rulesChecked}</span>
      </div>

      {/* Summary bar */}
      {scan.summary && (
        <div className="flex flex-wrap gap-2">
          {severityOrder.map((sev) => {
            const count = scan.summary![sev.toLowerCase() as keyof typeof scan.summary] as number;
            return (
              <span
                key={sev}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${SEVERITY_BG[sev]}`}
              >
                {sev}
                <span className="font-bold">{count}</span>
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300">
            TOTAL <span className="font-bold">{scan.summary.total}</span>
          </span>
        </div>
      )}

      {/* Findings grouped by severity */}
      {Object.keys(groupedFindings).length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 py-12 text-center">
          <p className="text-slate-400">
            {scan.status === 'completed'
              ? 'No findings detected -- clean scan!'
              : 'Findings will appear once the scan completes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {severityOrder.map((sev) => {
            const group = groupedFindings[sev];
            if (!group) return null;
            return (
              <div key={sev} className="overflow-hidden rounded-xl border border-slate-700">
                <div className={`border-b border-slate-700 px-4 py-3 ${SEVERITY_BG[sev]} bg-opacity-5`}>
                  <h3 className="text-sm font-semibold">
                    {sev} ({group.length})
                  </h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800/50">
                    <tr>
                      <th className="w-8 px-4 py-2" />
                      <th className="px-4 py-2 font-medium text-slate-400">Rule</th>
                      <th className="px-4 py-2 font-medium text-slate-400">File</th>
                      <th className="px-4 py-2 font-medium text-slate-400">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 bg-slate-800">
                    {group.map((f: Finding) => (
                      <>
                        <tr
                          key={f.id}
                          onClick={() => toggleRow(f.id)}
                          className="cursor-pointer transition hover:bg-slate-700/50"
                        >
                          <td className="px-4 py-2 text-slate-400">
                            {expandedRows.has(f.id) ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-white">{f.ruleName}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-300">
                            {f.file}:{f.line}:{f.column}
                          </td>
                          <td className="px-4 py-2 text-slate-300">{f.message}</td>
                        </tr>
                        {expandedRows.has(f.id) && (
                          <tr key={`${f.id}-detail`}>
                            <td colSpan={4} className="bg-slate-900 px-6 py-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-medium uppercase text-slate-500">Code Snippet</p>
                                  <pre className="mt-1 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                                    {f.snippet}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs font-medium uppercase text-slate-500">Remediation</p>
                                  <p className="mt-1 text-sm text-slate-300">{f.remediation}</p>
                                </div>
                                {f.owaspRefs.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium uppercase text-slate-500">OWASP References</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {f.owaspRefs.map((ref) => (
                                        <span key={ref} className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                          {ref}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
