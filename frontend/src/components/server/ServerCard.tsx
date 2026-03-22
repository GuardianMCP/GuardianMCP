import type { Server } from '@/types/api';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  server: Server;
  findingCount?: number;
  onClick?: () => void;
  className?: string;
}

export function ServerCard({
  server,
  findingCount,
  onClick,
  className,
}: ServerCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-slate-700 bg-slate-800 p-5 transition-colors hover:border-slate-600 hover:bg-slate-800/80',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-100">
            {server.name}
          </h3>
          {server.description && (
            <p className="mt-1 truncate text-sm text-slate-400">
              {server.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            {/* Language badge */}
            {server.language && (
              <span className="inline-flex items-center rounded-md bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                {server.language}
              </span>
            )}

            {/* Finding count */}
            {findingCount !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {findingCount} finding{findingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <ScoreBadge score={server.securityScore} size="md" className="ml-4 shrink-0" />
      </div>
    </div>
  );
}
