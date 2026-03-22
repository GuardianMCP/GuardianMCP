import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer, useDeleteServer, useTriggerScan } from '@/hooks/useServers';
import { useScans } from '@/hooks/useScans';
import { useFindings } from '@/hooks/useFindings';
import { useBranches } from '@/hooks/useBranches';
import { formatDate, scoreColor, cn } from '@/lib/utils';
import { SEVERITY_BG } from '@/lib/constants';
import BranchSelector from '@/components/BranchSelector';
import ScanProgressPanel from '@/components/ScanProgressPanel';
import type { Scan, Finding, FindingStatus, Severity } from '@/types/api';

const tabs = ['Overview', 'Findings', 'Scans', 'Settings'] as const;
type Tab = (typeof tabs)[number];

function SeverityPill({ severity, count }: { severity: string; count: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_BG[severity]}`}>
      {severity} <span className="font-bold">{count}</span>
    </span>
  );
}

export default function ServerDetailPage() {
  const { serverId: id } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [findingSeverity, setFindingSeverity] = useState<string>('');
  const [findingStatus, setFindingStatus] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const { data: server, isLoading } = useServer(id!);
  const { data: scansData, refetch: refetchScans } = useScans({ serverId: id });
  const { data: findingsData, refetch: refetchFindings } = useFindings({
    serverId: id,
    severity: findingSeverity || undefined,
    status: findingStatus || undefined,
  });
  const { data: branchesData } = useBranches(id, !!server?.repository);
  const deleteServer = useDeleteServer();
  const triggerScan = useTriggerScan();

  const scans = scansData?.data ?? [];
  const findings = findingsData?.data ?? [];

  // Set default branch when branches load
  useEffect(() => {
    if (branchesData?.defaultBranch) {
      setSelectedBranch(branchesData.defaultBranch);
    }
  }, [branchesData?.defaultBranch]);

  if (isLoading || !server) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this server?')) {
      await deleteServer.mutateAsync(server.id);
      navigate('/servers');
    }
  };

  const handleScan = () => {
    triggerScan.mutate(
      { serverId: server.id, branch: selectedBranch },
      {
        onSuccess: (scan) => {
          setActiveScanId(scan.id);
        },
      },
    );
  };

  const handleScanComplete = () => {
    setActiveScanId(null);
    refetchScans();
    refetchFindings();
  };

  // Aggregate finding severity counts
  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{server.name}</h1>
          {server.description && (
            <p className="mt-1 text-sm text-slate-400">{server.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-bold ${scoreColor(server.securityScore)}`}>
            {server.securityScore}
          </span>
          <span className="text-sm text-slate-400">/100</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'border-b-2 pb-3 text-sm font-medium transition',
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Score & Findings Summary */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-sm font-medium text-slate-400">Security Score</h3>
            <p className={`mt-2 text-5xl font-bold ${scoreColor(server.securityScore)}`}>
              {server.securityScore}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((sev) => (
                <SeverityPill key={sev} severity={sev} count={severityCounts[sev] ?? 0} />
              ))}
            </div>
          </div>

          {/* Server Details */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-sm font-medium text-slate-400">Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Language</dt>
                <dd className="text-white">{server.language ?? '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Repository</dt>
                <dd className="truncate text-white">{server.repository ?? '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="text-white">{formatDate(server.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Total Scans</dt>
                <dd className="text-white">{scans.length}</dd>
              </div>
            </dl>
          </div>

          {/* Scan Trigger + Progress */}
          {activeScanId && (
            <div className="lg:col-span-2">
              <ScanProgressPanel
                scanId={activeScanId}
                onComplete={handleScanComplete}
              />
            </div>
          )}

          {/* Recent Scans */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h3 className="font-semibold text-white">Recent Scans</h3>
              <div className="flex items-center gap-3">
                {server.repository && (
                  <BranchSelector
                    serverId={server.id}
                    hasRepository={!!server.repository}
                    value={selectedBranch}
                    onChange={setSelectedBranch}
                  />
                )}
                <button
                  onClick={handleScan}
                  disabled={triggerScan.isPending || !!activeScanId}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  {triggerScan.isPending ? 'Starting...' : activeScanId ? 'Scanning...' : 'Scan Now'}
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-700">
              {scans.slice(0, 5).map((scan: Scan) => (
                <div key={scan.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm text-white">{formatDate(scan.createdAt)}</p>
                    <p className="text-xs text-slate-400">
                      {scan.filesScanned} files &middot; {scan.rulesChecked} rules
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                      <span className={`text-sm font-bold ${scoreColor(scan.securityScore)}`}>
                        {scan.securityScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {scans.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-slate-500">No scans yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Findings Tab */}
      {activeTab === 'Findings' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              value={findingSeverity}
              onChange={(e) => setFindingSeverity(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Severities</option>
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={findingStatus}
              onChange={(e) => setFindingStatus(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {(['open', 'acknowledged', 'resolved', 'false_positive'] as FindingStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">Rule</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Severity</th>
                  <th className="px-4 py-3 font-medium text-slate-400">File</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800">
                {findings.map((f: Finding) => (
                  <tr key={f.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">{f.ruleName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_BG[f.severity]}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {f.file}:{f.line}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-300">{f.status}</td>
                  </tr>
                ))}
                {findings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No findings match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scans Tab */}
      {activeTab === 'Scans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-3">
            {server.repository && (
              <BranchSelector
                serverId={server.id}
                hasRepository={!!server.repository}
                value={selectedBranch}
                onChange={setSelectedBranch}
              />
            )}
            <button
              onClick={handleScan}
              disabled={triggerScan.isPending || !!activeScanId}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {triggerScan.isPending ? 'Starting...' : 'Scan Now'}
            </button>
          </div>

          {activeScanId && (
            <ScanProgressPanel
              scanId={activeScanId}
              onComplete={handleScanComplete}
            />
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Branch</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Trigger</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Score</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Files</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800">
                {scans.map((scan: Scan) => (
                  <tr key={scan.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">{formatDate(scan.createdAt)}</td>
                    <td className="px-4 py-3">
                      {scan.branch ? (
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                          {scan.branch}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          scan.trigger === 'dashboard'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {scan.trigger ?? 'cli'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                    <td className="px-4 py-3 text-slate-300">{scan.filesScanned}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '-'}
                    </td>
                  </tr>
                ))}
                {scans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No scans yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'Settings' && (
        <div className="max-w-lg space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="font-semibold text-white">Server Settings</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  defaultValue={server.name}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <input
                  defaultValue={server.description ?? ''}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
                Save Changes
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <h3 className="font-semibold text-red-400">Danger Zone</h3>
            <p className="mt-2 text-sm text-slate-400">
              Deleting a server is permanent and removes all scans and findings.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleteServer.isPending}
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {deleteServer.isPending ? 'Deleting...' : 'Delete Server'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
