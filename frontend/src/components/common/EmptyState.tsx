import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-6 py-16 text-center',
        className,
      )}
    >
      <Icon className="mb-4 h-12 w-12 text-slate-500" />
      <h3 className="mb-1 text-lg font-semibold text-slate-200">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-slate-400">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
