import { useBranches } from '@/hooks/useBranches';

interface BranchSelectorProps {
  serverId: string;
  hasRepository: boolean;
  value: string;
  onChange: (branch: string) => void;
}

export default function BranchSelector({
  serverId,
  hasRepository,
  value,
  onChange,
}: BranchSelectorProps) {
  const { data, isLoading } = useBranches(serverId, hasRepository);

  if (!hasRepository) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <span className="text-xs text-slate-400">Loading branches...</span>
      </div>
    );
  }

  const branches = data?.branches ?? [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none"
    >
      {branches.map((branch) => (
        <option key={branch} value={branch}>
          {branch}
          {branch === data?.defaultBranch ? ' (default)' : ''}
        </option>
      ))}
      {branches.length === 0 && <option value="main">main</option>}
    </select>
  );
}
