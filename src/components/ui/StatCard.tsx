import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  positiveIsGood?: boolean;
  context: string;
  sparkline?: number[];
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  positiveIsGood = true,
  context,
  sparkline,
  onClick,
}: StatCardProps) {
  const isGood = positiveIsGood ? trend === 'up' : trend === 'down';
  const trendColor = isGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-700 dark:text-red-400';

  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const width = 76;
    const height = 28;
    const points = sparkline
      .map((val, idx) => {
        const x = (idx / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0 overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={isGood ? '#16A34A' : '#DC2626'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-start w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors ${
        onClick
          ? 'hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        <span
          dir="ltr"
          className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums whitespace-nowrap shrink-0 ${trendColor}`}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {delta}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            dir="ltr"
            className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white tabular-nums font-display inline-block"
          >
            {value}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {context}
          </p>
        </div>
        {renderSparkline()}
      </div>
    </Wrapper>
  );
}
