import { useState } from 'react';
import type { Finding } from '@/types/api';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { cn } from '@/lib/utils';

interface FindingsTableProps {
  findings: Finding[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (finding: Finding) => void;
}

const statusStyles: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  acknowledged: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  false_positive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function StatusBadge({ status }: { status: string }) {
  const label = status.replace('_', ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        statusStyles[status] ?? statusStyles.open,
      )}
    >
      {label}
    </span>
  );
}

export function FindingsTable({
  findings,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
}: FindingsTableProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const selected = onSelectionChange ? selectedIds : internalSelected;
  const setSelected = onSelectionChange ?? setInternalSelected;

  const allSelected = findings.length > 0 && selected.length === findings.length;

  function toggleAll() {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(findings.map((f) => f.id));
    }
  }

  function toggleOne(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-700 bg-slate-800/60">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
              </th>
            )}
            <th className="px-4 py-3 font-medium text-slate-400">Severity</th>
            <th className="px-4 py-3 font-medium text-slate-400">Rule</th>
            <th className="px-4 py-3 font-medium text-slate-400">Location</th>
            <th className="px-4 py-3 font-medium text-slate-400">Message</th>
            <th className="px-4 py-3 font-medium text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {findings.map((finding) => (
            <tr
              key={finding.id}
              onClick={() => onRowClick?.(finding)}
              className={cn(
                'transition-colors hover:bg-slate-800/50',
                onRowClick && 'cursor-pointer',
                selected.includes(finding.id) && 'bg-slate-800/80',
              )}
            >
              {selectable && (
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(finding.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOne(finding.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <SeverityBadge severity={finding.severity} />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-300">
                {finding.ruleName}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                {finding.file}:{finding.line}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-300">
                {finding.message}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={finding.status} />
              </td>
            </tr>
          ))}
          {findings.length === 0 && (
            <tr>
              <td
                colSpan={selectable ? 6 : 5}
                className="px-4 py-8 text-center text-slate-500"
              >
                No findings to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
