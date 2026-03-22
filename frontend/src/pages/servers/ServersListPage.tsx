import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServers, useCreateServer } from '@/hooks/useServers';
import { scoreColor } from '@/lib/utils';
import type { Server } from '@/types/api';

function ScoreCircle({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-700"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={scoreColor(score)}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

function LanguageBadge({ language }: { language: string | null }) {
  if (!language) return null;
  return (
    <span className="inline-flex rounded-md bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
      {language}
    </span>
  );
}

function AddServerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createServer = useCreateServer();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [repository, setRepository] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createServer.mutateAsync({
      name,
      description: description || undefined,
      language: language || undefined,
      repository: repository || undefined,
    });
    setName('');
    setDescription('');
    setLanguage('');
    setRepository('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Add Server</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="my-mcp-server"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">Select...</option>
                <option value="TypeScript">TypeScript</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="Go">Go</option>
                <option value="Java">Java</option>
                <option value="Ruby">Ruby</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Repository</label>
              <input
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="https://github.com/..."
              />
            </div>
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
              disabled={createServer.isPending}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {createServer.isPending ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServersListPage() {
  const { data, isLoading } = useServers();
  const [dialogOpen, setDialogOpen] = useState(false);

  const servers = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Servers</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your MCP servers</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Add Server
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 py-16 text-center">
          <p className="text-slate-400">No servers registered yet.</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Add your first server
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server: Server) => (
            <Link
              key={server.id}
              to={`/servers/${server.id}`}
              className="group rounded-xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-white group-hover:text-cyan-400">
                    {server.name}
                  </h3>
                  {server.description && (
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {server.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <LanguageBadge language={server.language} />
                  </div>
                </div>
                <ScoreCircle score={server.securityScore} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <AddServerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
