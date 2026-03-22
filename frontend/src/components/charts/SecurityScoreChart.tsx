import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SCORE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DataPoint {
  date: string;
  score: number;
}

interface SecurityScoreChartProps {
  data: DataPoint[];
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const score = payload[0].value;
  const color =
    score >= 80
      ? SCORE_COLORS.good
      : score >= 50
        ? SCORE_COLORS.warn
        : SCORE_COLORS.bad;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>
        Score: {score}
      </p>
    </div>
  );
}

export function SecurityScoreChart({ data, className }: SecurityScoreChartProps) {
  return (
    <div className={cn('h-64 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
            activeDot={{ fill: '#60a5fa', r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
