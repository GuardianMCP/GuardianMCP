import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SEVERITY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SeveritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface SeverityDonutChartProps {
  summary: SeveritySummary;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-lg">
      <p className="text-sm font-medium" style={{ color: payload[0].payload.fill }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SeverityDonutChart({ summary, className }: SeverityDonutChartProps) {
  const data = [
    { name: 'Critical', value: summary.critical },
    { name: 'High', value: summary.high },
    { name: 'Medium', value: summary.medium },
    { name: 'Low', value: summary.low },
    { name: 'Info', value: summary.info },
  ].filter((d) => d.value > 0);

  const colors = [
    SEVERITY_COLORS.CRITICAL,
    SEVERITY_COLORS.HIGH,
    SEVERITY_COLORS.MEDIUM,
    SEVERITY_COLORS.LOW,
    SEVERITY_COLORS.INFO,
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        className={cn(
          'flex h-64 items-center justify-center text-sm text-slate-500',
          className,
        )}
      >
        No findings to display
      </div>
    );
  }

  return (
    <div className={cn('h-64 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={colors[['Critical', 'High', 'Medium', 'Low', 'Info'].indexOf(entry.name)]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {/* Center label */}
          <text
            x="50%"
            y="43%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-200 text-2xl font-bold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-500 text-xs"
          >
            findings
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
