import { FileQuestion, Home, RefreshCw, ServerCrash, ShieldOff } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from './Button';

export type HttpErrorCode = 403 | 404 | 500;

export interface ErrorStateViewProps {
  code: HttpErrorCode;
  onGoHome: () => void;
  onRetry?: () => void;
}

export function ErrorStateView({ code, onGoHome, onRetry }: ErrorStateViewProps) {
  const { t } = useI18n();

  const meta =
    code === 403
      ? {
          icon: <ShieldOff className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
          badgeClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300',
          title: t('err403Title'),
          desc: t('err403Desc'),
        }
      : code === 500
        ? {
            icon: <ServerCrash className="w-7 h-7 text-red-600 dark:text-red-400" aria-hidden="true" />,
            badgeClass: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300',
            title: t('err500Title'),
            desc: t('err500Desc'),
          }
        : {
            icon: <FileQuestion className="w-7 h-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
            badgeClass: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300',
            title: t('err404Title'),
            desc: t('err404Desc'),
          };

  return (
    <div
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-12 sm:py-16 flex flex-col items-center text-center"
      data-testid={`error-page-${code}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
        {meta.icon}
      </div>

      <span
        dir="ltr"
        className={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md border mb-3 ${meta.badgeClass}`}
      >
        HTTP {code}
      </span>

      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {meta.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {meta.desc}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
        <Button
          variant="primary"
          size="md"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={onGoHome}
        >
          {t('errBackOverview')}
        </Button>
        {onRetry && (
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={onRetry}
          >
            {t('errRetryAction')}
          </Button>
        )}
      </div>
    </div>
  );
}
