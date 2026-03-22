import { Link } from 'react-router-dom';
import { useServers } from '@/hooks/useServers';
import { useScans } from '@/hooks/useScans';
import { useFindings } from '@/hooks/useFindings';
import { formatDate, scoreColor } from '@/lib/utils';
import { SEVERITY_BG } from '@/lib/constants';
import type { Scan, Finding } from '@/types/api';

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: serversData, isLoading: serversLoading } = useServers();
  const { data: scansData, isLoading: scansLoading } = useScans({ page: 1 });
  const { data: findingsData, isLoading: findingsLoading } = useFindings({
    severity: 'CRITICAL',
    page: 1,
  });
  const { data: highData } = useFindings({ severity: 'HIGH', page: 1 });

  const totalServers = serversData?.meta.total ?? 0;
  const criticalCount = findingsData?.meta.total ?? 0;
  const highCount = highData?.meta.total ?? 0;

  const avgScore =
    serversData && serversData.data.length > 0
      ? Math.round(
          serversData.data.reduce((sum, s) => sum + s.securityScore, 0) /
            serversData.data.length,
        )
      : 0;

  const recentScans = scansData?.data.slice(0, 5) ?? [];
  const topRisks = findingsData?.data.slice(0, 5) ?? [];

  const isLoading = serversLoading || scansLoading || findingsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Security overview across all MCP servers</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Servers" value={totalServers} />
        <StatCard label="Critical Findings" value={criticalCount} color="text-red-400" />
        <StatCard label="High Findings" value={highCount} color="text-orange-400" />
        <StatCard label="Avg. Score" value={`${avgScore}/100`} color={scoreColor(avgScore)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Scans */}
        <div className="rounded-xl border border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
            <Link to="/scans" className="text-sm text-cyan-400 hover:text-cyan-300">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {recentScans.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No scans yet</p>
            )}
            {recentScans.map((scan: Scan) => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="flex items-center justify-between px-6 py-3 transition hover:bg-slate-700/50"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {scan.server?.name ?? scan.serverId}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(scan.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      scan.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : scan.status === 'running'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : scan.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {scan.status}
                  </span>
                  {scan.securityScore !== null && (
                    <span className={`text-sm font-semibold ${scoreColor(scan.securityScore)}`}>
                      {scan.securityScore}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Risks */}
        <div className="rounded-xl border border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Top Risks</h2>
            <Link to="/findings" className="text-sm text-cyan-400 hover:text-cyan-300">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {topRisks.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No critical findings</p>
            )}
            {topRisks.map((finding: Finding) => (
              <div
                key={finding.id}
                className="flex items-start justify-between px-6 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{finding.ruleName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {finding.file}:{finding.line}
                  </p>
                </div>
                <span
                  className={`ml-3 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_BG[finding.severity]}`}
                >
                  {finding.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
