import { useState } from 'react';
import { useAlerts, useCreateAlert, useDeleteAlert } from '@/hooks/useAlerts';
import type { AlertRule } from '@/types/api';

function CreateAlertDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createAlert = useCreateAlert();
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('scan_completed');
  const [channel, setChannel] = useState('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAlert.mutateAsync({
      name,
      triggerType,
      channel,
      conditions: {},
      channelConfig: {},
      enabled: true,
    });
    setName('');
    setTriggerType('scan_completed');
    setChannel('email');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Create Alert Rule</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Critical finding alert"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Trigger Type</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="scan_completed">Scan Completed</option>
              <option value="critical_finding">Critical Finding</option>
              <option value="score_drop">Score Drop</option>
              <option value="new_vulnerability">New Vulnerability</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAlert.isPending}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {createAlert.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const deleteAlert = useDeleteAlert();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const alertRules = alerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="mt-1 text-sm text-slate-400">Manage alert rules and notifications</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Create Alert
        </button>
      </div>

      {alertRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 py-16 text-center">
          <p className="text-slate-400">No alert rules configured.</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Create your first alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alertRules.map((alert: AlertRule) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-white">{alert.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      alert.enabled
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}
                  >
                    {alert.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    {alert.triggerType.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {alert.channel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteAlert.mutate(alert.id)}
                disabled={deleteAlert.isPending}
                className="ml-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateAlertDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
