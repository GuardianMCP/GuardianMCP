import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrg, useInviteMember, useCreateApiKey, useApiKeys } from '@/hooks/useOrg';
import { cn } from '@/lib/utils';

const settingsTabs = ['Organization', 'Team', 'API Keys', 'Billing', 'Profile'] as const;
type SettingsTab = (typeof settingsTabs)[number];

function OrgTab() {
  const { data: org } = useOrg();
  const [name, setName] = useState(org?.name ?? '');

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">Organization Settings</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Organization Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Slug</label>
            <input
              readOnly
              value={org?.slug ?? ''}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-slate-400"
            />
          </div>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const { data: org } = useOrg();
  const inviteMember = useInviteMember();
  const [email, setEmail] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteMember.mutateAsync(email);
    setEmail('');
  };

  const members = org?.members ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Invite form */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">Invite Member</h3>
        <form onSubmit={handleInvite} className="mt-4 flex gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={inviteMember.isPending}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            {inviteMember.isPending ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      </div>

      {/* Members list */}
      <div className="overflow-hidden rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Name</th>
              <th className="px-4 py-3 font-medium text-slate-400">Email</th>
              <th className="px-4 py-3 font-medium text-slate-400">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 text-white">{member.name ?? '-'}</td>
                <td className="px-4 py-3 text-slate-300">{member.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium capitalize text-slate-300">
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No team members yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const { data: apiKeys } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const [keyName, setKeyName] = useState('');
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createApiKey.mutateAsync(keyName);
    setNewRawKey(result.rawKey);
    setKeyName('');
  };

  const keys = Array.isArray(apiKeys) ? apiKeys : [];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Create form */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">Create API Key</h3>
        <form onSubmit={handleCreate} className="mt-4 flex gap-3">
          <input
            required
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name (e.g., CI/CD)"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={createApiKey.isPending}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
          >
            {createApiKey.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>

        {newRawKey && (
          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm font-medium text-yellow-400">
              Copy your API key now. It will not be shown again.
            </p>
            <code className="mt-2 block break-all rounded bg-slate-900 px-3 py-2 font-mono text-sm text-white">
              {newRawKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newRawKey);
              }}
              className="mt-2 rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600"
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </div>

      {/* Keys list */}
      <div className="overflow-hidden rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Name</th>
              <th className="px-4 py-3 font-medium text-slate-400">Key</th>
              <th className="px-4 py-3 font-medium text-slate-400">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {keys.map((key: { id: string; name?: string; prefix?: string; createdAt?: string }) => (
              <tr key={key.id}>
                <td className="px-4 py-3 text-white">{key.name ?? '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {key.prefix ? `${key.prefix}...` : '****'}
                </td>
                <td className="px-4 py-3 text-slate-300">{key.createdAt ?? '-'}</td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No API keys yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingTab() {
  const { data: org } = useOrg();
  const plan = org?.plan ?? 'free';

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">Current Plan</h3>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10">
            <span className="text-lg font-bold capitalize text-cyan-400">{plan[0]}</span>
          </div>
          <div>
            <p className="text-lg font-semibold capitalize text-white">{plan}</p>
            <p className="text-sm text-slate-400">
              {plan === 'free'
                ? 'Limited to 3 servers'
                : plan === 'pro'
                  ? 'Unlimited servers, advanced features'
                  : 'Custom limits, priority support'}
            </p>
          </div>
        </div>
        {plan !== 'enterprise' && (
          <button className="mt-6 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
            {plan === 'free' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="font-semibold text-white">Profile Settings</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Organization');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your organization and account</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {settingsTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition',
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

      {/* Tab Content */}
      {activeTab === 'Organization' && <OrgTab />}
      {activeTab === 'Team' && <TeamTab />}
      {activeTab === 'API Keys' && <ApiKeysTab />}
      {activeTab === 'Billing' && <BillingTab />}
      {activeTab === 'Profile' && <ProfileTab />}
    </div>
  );
}
