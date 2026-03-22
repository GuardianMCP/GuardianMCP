import { useScans } from '@/hooks/useScans';
import { formatDate, scoreColor } from '@/lib/utils';
import type { Scan } from '@/types/api';

export default function ReportsPage() {
  const { data, isLoading } = useScans();
  const scans = data?.data ?? [];
  const completedScans = scans.filter((s) => s.status === 'completed');

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
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-slate-400">Download security scan reports</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Server</th>
              <th className="px-4 py-3 font-medium text-slate-400">Score</th>
              <th className="px-4 py-3 font-medium text-slate-400">Findings</th>
              <th className="px-4 py-3 font-medium text-slate-400">Date</th>
              <th className="px-4 py-3 font-medium text-slate-400">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {completedScans.map((scan: Scan) => (
              <tr key={scan.id} className="transition hover:bg-slate-700/50">
                <td className="px-4 py-3 font-medium text-white">
                  {scan.server?.name ?? scan.serverId}
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
                <td className="px-4 py-3 text-slate-300">{formatDate(scan.completedAt)}</td>
                <td className="px-4 py-3">
                  {scan.reportUrl ? (
                    <a
                      href={scan.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-600/20"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Not available</span>
                  )}
                </td>
              </tr>
            ))}
            {completedScans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No completed scans with reports available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
