import { SCORE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.good;
  if (score >= 50) return SCORE_COLORS.warn;
  return SCORE_COLORS.bad;
}

function getScoreTextClass(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

const sizeMap = {
  sm: { container: 'h-10 w-10', text: 'text-xs', stroke: 3 },
  md: { container: 'h-14 w-14', text: 'text-sm', stroke: 3 },
  lg: { container: 'h-20 w-20', text: 'text-lg', stroke: 4 },
};

export function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const { container, text, stroke } = sizeMap[size];
  const color = getScoreColor(score);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', container, className)}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-700"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn('font-bold', text, getScoreTextClass(score))}>
        {score}
      </span>
    </div>
  );
}
