import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import type { OrderStatus } from '../../types/admin';

export interface StatusIndicatorProps {
  status: OrderStatus | 'Healthy' | 'Attention' | 'At Risk';
  className?: string;
  forceLight?: boolean;
}

const STATUS_CONFIG: Record<
  StatusIndicatorProps['status'],
  { colorClass: string; lightOnlyClass: string; Icon: typeof CheckCircle2 }
> = {
  Completed: {
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    lightOnlyClass: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  Healthy: {
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    lightOnlyClass: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  Processing: {
    colorClass: 'text-blue-700 dark:text-blue-400',
    lightOnlyClass: 'text-blue-800',
    Icon: Clock,
  },
  Pending: {
    colorClass: 'text-amber-700 dark:text-amber-400',
    lightOnlyClass: 'text-amber-800',
    Icon: AlertCircle,
  },
  Attention: {
    colorClass: 'text-amber-700 dark:text-amber-400',
    lightOnlyClass: 'text-amber-800',
    Icon: AlertCircle,
  },
  Flagged: {
    colorClass: 'text-red-700 dark:text-red-400',
    lightOnlyClass: 'text-red-800',
    Icon: ShieldAlert,
  },
  'At Risk': {
    colorClass: 'text-red-700 dark:text-red-400',
    lightOnlyClass: 'text-red-800',
    Icon: ShieldAlert,
  },
  Refunded: {
    colorClass: 'text-slate-600 dark:text-slate-400',
    lightOnlyClass: 'text-slate-700',
    Icon: RotateCcw,
  },
};

import { useI18n } from '../../i18n/I18nContext';

export function StatusIndicator({
  status,
  className = '',
  forceLight = false,
}: StatusIndicatorProps) {
  const { tStatus } = useI18n();
  const { colorClass, lightOnlyClass, Icon } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
        forceLight ? lightOnlyClass : colorClass
      } ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{tStatus(status)}</span>
    </span>
  );
}
