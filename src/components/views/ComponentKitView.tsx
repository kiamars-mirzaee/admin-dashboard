import { useState } from 'react';
import { Bell, Inbox, Layers, PanelRightOpen, Sparkles } from 'lucide-react';
import { REVENUE_SERIES_BY_RANGE, INITIAL_CUSTOMERS, INITIAL_ORDERS } from '../../data/seedData';
import type { CustomerProfile, OrderRecord } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import type { NumberFormatStyle, NumeralScript } from '../../utils/numberFormat';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { Breadcrumb } from '../ui/Breadcrumb';
import { Button } from '../ui/Button';
import { ChannelBreakdownChart, RevenueAreaChart } from '../ui/Charts';
import { TimeSeriesAnalytics } from '../ui/TimeSeriesAnalytics';
import { ColorPicker } from '../ui/ColorPicker';
import { DatePicker } from '../ui/DatePicker';
import { DateRangePicker, type DateRangeValue } from '../ui/DateRangePicker';
import { DateTimePicker } from '../ui/DateTimePicker';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmModal, Modal } from '../ui/Modal';
import { MultiSelect, type MultiSelectOption } from '../ui/MultiSelect';
import { MultipartUploader } from '../ui/MultipartUploader';
import { useNotifications } from '../ui/NotificationSystem';
import { NumberFormatter, PersianNumber } from '../ui/NumberDisplay';
import { PersianDatePicker } from '../ui/PersianDatePicker';
import { QrCodeScanner } from '../ui/QrCodeScanner';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TableSkeleton } from '../ui/Skeleton';
import { StatCard } from '../ui/StatCard';
import { StatusIndicator } from '../ui/StatusIndicator';
import { TaskWithSubtaskTemplate } from '../ui/TaskWithSubtaskTemplate';
import { ProjectWithSubprojectTemplate } from '../ui/ProjectWithSubprojectTemplate';
import { TicketWithTasks } from '../ui/TicketWithTasks';
import { TicketConversionLog } from '../ui/TicketConversionLog';
import { WysiwygEditor } from '../ui/WysiwygEditor';
import {
  createTicketConversionEntry,
  INITIAL_TICKET_CONVERSION_LOG,
  type TicketConversionEntry,
} from '../../utils/workTemplates';

export type ComponentKitCategory =
  | 'all'
  | 'inputs'
  | 'workflows'
  | 'overlays'
  | 'charts'
  | 'states';

export interface ComponentKitViewProps {
  activeCategory?: ComponentKitCategory;
  onChangeCategory?: (category: ComponentKitCategory) => void;
  orders?: OrderRecord[];
  customers?: CustomerProfile[];
  onInspectOrder?: (order: OrderRecord) => void;
  onInspectCustomer?: (customer: CustomerProfile) => void;
}

const REGION_TAG_OPTIONS: MultiSelectOption[] = [
  { value: 'eu-west', label: 'EU-West (Frankfurt)', description: 'SEPA & GDPR zone' },
  { value: 'us-east', label: 'US-East (Virginia)', description: 'ACH & FedNow primary' },
  { value: 'mena-hub', label: 'MENA Hub (Dubai)', description: 'Cross-border settlement' },
  { value: 'apac-sg', label: 'APAC (Singapore)', description: 'FAST instant rail' },
  { value: 'soc2-type2', label: 'SOC 2 Type II', description: 'Continuous compliance' },
  { value: 'pci-dss', label: 'PCI-DSS v4.0', description: 'Tokenized vaulting' },
];

export function ComponentKitView({
  activeCategory = 'all',
  onChangeCategory,
  orders = INITIAL_ORDERS,
  customers = INITIAL_CUSTOMERS,
  onInspectOrder,
  onInspectCustomer,
}: ComponentKitViewProps) {
  const { t, locale } = useI18n();
  const { addToast, pushNotification, setDrawerOpen } = useNotifications();

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false);
  const [previewState, setPreviewState] = useState<'loaded' | 'skeleton' | 'empty'>('loaded');
  const [chartTab, setChartTab] = useState<'area' | 'channel'>('area');
  const [internalCat, setInternalCat] = useState<ComponentKitCategory>(activeCategory);

  // Interactive states for the 9 components
  const [selectedTags, setSelectedTags] = useState<string[]>(['eu-west', 'soc2-type2']);
  const [accentHex, setAccentHex] = useState('#2563EB');
  const [gregorianDate, setGregorianDate] = useState('2026-11-22');
  const [dateTimeValue, setDateTimeValue] = useState('2026-11-22T14:30');
  const [persianDate, setPersianDate] = useState('2026-11-22');
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: '2026-11-16',
    endDate: '2026-11-22',
  });
  const [richHtml, setRichHtml] = useState(
    '<h3>Settlement Batch #412</h3><p>All <b>APAC</b> and <i>EMEA</i> wire instructions verified cleanly.</p><ul><li>Dual-control sign-off completed</li><li>Audit bundle attached</li></ul>'
  );
  const [numericInput, setNumericInput] = useState('128450.75');
  const [formatStyle, setFormatStyle] = useState<NumberFormatStyle>('currency');
  const [numScript, setNumScript] = useState<NumeralScript>(
    locale === 'fa' ? 'persian' : locale === 'ar' ? 'arabic' : 'latin'
  );
  const [decimals, setDecimals] = useState<number>(2);
  const [conversionLogs, setConversionLogs] = useState<TicketConversionEntry[]>(
    INITIAL_TICKET_CONVERSION_LOG
  );
  const [bcDepth, setBcDepth] = useState<'2' | '4' | '5'>('5');
  const [bcSeparator, setBcSeparator] = useState<'chevron' | 'slash'>('chevron');

  const selectedCategory = onChangeCategory ? activeCategory : internalCat;
  const setSelectedCategory = onChangeCategory ?? setInternalCat;

  const showInputs = selectedCategory === 'all' || selectedCategory === 'inputs';
  const showWorkflows = selectedCategory === 'all' || selectedCategory === 'workflows';
  const showOverlays = selectedCategory === 'all' || selectedCategory === 'overlays';
  const showCharts = selectedCategory === 'all' || selectedCategory === 'charts';
  const showStates = selectedCategory === 'all' || selectedCategory === 'states';

  const parsedNum = Number(numericInput);
  const safeNum = Number.isFinite(parsedNum) ? parsedNum : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('kitTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('kitSubtitle')}
          </p>
        </div>
        <SegmentedControl
          ariaLabel={t('kitTitle')}
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={[
            { value: 'all', label: t('kitTabAll') },
            { value: 'inputs', label: t('kitTabInputs') },
            { value: 'workflows', label: t('kitTabWorkflows') },
            { value: 'overlays', label: t('kitTabOverlays') },
            { value: 'charts', label: t('kitTabCharts') },
            { value: 'states', label: t('kitTabStates') },
          ]}
        />
      </div>

      {/* 1-4. Inputs, Pickers, WYSIWYG, Multipart Uploader, Numbers */}
      {showInputs && (
        <>
          {/* 01. Multi-Select & Color Picker */}
          <section id="kit-section-pickers" className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecPickers')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecPickersDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className="space-y-2.5">
                <MultiSelect
                  label={t('msLabel')}
                  options={REGION_TAG_OPTIONS}
                  value={selectedTags}
                  onChange={setSelectedTags}
                />
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                  <span>{t('msSelectedItems', { count: selectedTags.length })}</span>
                  <span dir="ltr" className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedTags.length > 0 ? selectedTags.join(', ') : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <ColorPicker
                  label={t('cpLabel')}
                  value={accentHex}
                  onChange={setAccentHex}
                />
                <div
                  className="p-3 rounded-xl flex items-center justify-between text-xs font-semibold text-white transition-colors"
                  style={{ backgroundColor: accentHex }}
                >
                  <span>{t('brandName')} UI Accent</span>
                  <span dir="ltr" className="font-mono">
                    {accentHex}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 02. Date Picker, Persian (Jalali) Date Picker & Range Picker */}
          <section id="kit-section-dates" className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecCalendars')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecCalendarsDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label={t('dpLabel')}
                value={gregorianDate}
                onChange={setGregorianDate}
              />
              <DateTimePicker
                label={t('dtpLabel')}
                value={dateTimeValue}
                onChange={setDateTimeValue}
              />
              <PersianDatePicker
                label={t('pdpLabel')}
                value={persianDate}
                onChange={setPersianDate}
              />
              <DateRangePicker
                label={t('rpLabel')}
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </section>

          {/* 03. WYSIWYG Editor & Multipart File Uploader */}
          <section id="kit-section-editor-upload" className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecEditorUpload')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecEditorUploadDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <WysiwygEditor
                label={t('wysLabel')}
                value={richHtml}
                onChange={setRichHtml}
                minHeight={170}
              />
              <MultipartUploader
                label={t('upTitle')}
                onUploadComplete={(fileName, chunks) =>
                  addToast({
                    title: fileName,
                    description: t('upChunkProgress', { done: chunks, total: chunks }),
                    variant: 'success',
                  })
                }
              />
            </div>
          </section>

          {/* 04. Persian Number & Number Formatter */}
          <section id="kit-section-numbers" className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecNumbers')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecNumbersDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="num-playground-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {t('numPlaygroundValue')}
                </label>
                <input
                  id="num-playground-input"
                  type="number"
                  dir="ltr"
                  step="any"
                  value={numericInput}
                  onChange={(e) => setNumericInput(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="num-style-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {t('numStyleLabel')}
                </label>
                <select
                  id="num-style-select"
                  value={formatStyle}
                  onChange={(e) => setFormatStyle(e.target.value as NumberFormatStyle)}
                  className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="decimal">{t('numStyleDecimal')}</option>
                  <option value="currency">{t('numStyleCurrency')}</option>
                  <option value="percent">{t('numStylePercent')}</option>
                  <option value="compact">{t('numStyleCompact')}</option>
                  <option value="bytes">{t('numStyleBytes')}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="num-script-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  {t('numScriptLabel')}
                </label>
                <select
                  id="num-script-select"
                  value={numScript}
                  onChange={(e) => setNumScript(e.target.value as NumeralScript)}
                  className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="latin">{t('numScriptLatin')}</option>
                  <option value="persian">{t('numScriptPersian')}</option>
                  <option value="arabic">{t('numScriptArabic')}</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  {t('numDecimalsLabel')}
                </span>
                <div className="min-h-[44px] flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {[0, 1, 2, 3].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDecimals(d)}
                      className={`flex-1 h-8 rounded-lg text-xs font-semibold tabular-nums cursor-pointer transition-colors ${
                        decimals === d
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PersianNumber Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('numPersianTitle')}
                </p>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <PersianNumber
                    value={safeNum}
                    decimals={decimals}
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                  />
                  <PersianNumber
                    value="1405/09/01"
                    className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                  <span>
                    FA: <PersianNumber value={safeNum} decimals={decimals} className="font-semibold" />
                  </span>
                  <span>
                    AR:{' '}
                    <PersianNumber
                      value={safeNum}
                      script="arabic"
                      decimals={decimals}
                      className="font-semibold"
                    />
                  </span>
                </div>
              </div>

              {/* NumberFormatter Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('numFormatterTitle')}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <NumberFormatter
                    value={safeNum}
                    format={formatStyle}
                    decimals={decimals}
                    script={numScript}
                    copyable
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t('numStyleCompact')}</span>
                    <NumberFormatter value={safeNum} format="compact" decimals={1} script={numScript} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t('numStylePercent')}</span>
                    <NumberFormatter
                      value={safeNum > 100 ? 24.8 : safeNum}
                      format="percent"
                      decimals={1}
                      script={numScript}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t('numStyleBytes')}</span>
                    <NumberFormatter value={Math.max(0, safeNum * 1024)} format="bytes" decimals={1} script={numScript} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 04b / 05b. Camera QR Scanner & Printable Tags */}
          <section
            id="kit-section-qr"
            className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('qrKitSectionTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('qrKitSectionDesc')}
              </p>
            </div>
            <QrCodeScanner
              orders={orders}
              customers={customers}
              onOpenOrder={(order) =>
                onInspectOrder
                  ? onInspectOrder(order)
                  : addToast({
                      title: order.id,
                      description: `${order.company} · ${order.customerName}`,
                      variant: 'success',
                    })
              }
              onOpenCustomer={(customer) =>
                onInspectCustomer
                  ? onInspectCustomer(customer)
                  : addToast({
                      title: customer.name,
                      description: `${customer.company} · ${customer.id}`,
                      variant: 'success',
                    })
              }
            />
          </section>
        </>
      )}

      {/* 5-6. Workflows: Task/Subtask Template, Project/Subproject Template, Ticket with Tasks & Conversion Log */}
      {showWorkflows && (
        <>
          <section id="kit-section-workflows" className="scroll-mt-20 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecWorkflowTemplates')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecWorkflowTemplatesDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <TaskWithSubtaskTemplate
                onCreateTask={(payload) =>
                  addToast({
                    title: t('tskCreatedToast', {
                      title: payload.title,
                      count: payload.subtasks.length,
                    }),
                    variant: 'success',
                  })
                }
              />
              <ProjectWithSubprojectTemplate
                onCreateProject={(payload) =>
                  addToast({
                    title: t('prjCreatedToast', {
                      name: payload.name,
                      count: payload.subprojects.length,
                    }),
                    variant: 'success',
                  })
                }
              />
            </div>
          </section>

          <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('kitSecTicketWorkflows')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('kitSecTicketWorkflowsDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <TicketWithTasks
                onCreateTicket={(payload) => {
                  const summary = t('tktCreatedSummary', {
                    id: payload.id,
                    count: payload.linkedTasks.length,
                  });
                  const firstTaskId = payload.linkedTasks[0]?.id;
                  const newEntry = createTicketConversionEntry({
                    ticketId: payload.id,
                    kind: 'conversion',
                    actor: 'Elena Rostova',
                    timestamp: '2026-11-22 12:20',
                    summary: `${payload.subject} (${payload.linkedTasks.length} linked tasks)`,
                    fromValue: payload.id,
                    toValue: firstTaskId ?? 'Task Queue',
                    targetEntityId: firstTaskId,
                    targetEntityType: 'Task',
                  });
                  setConversionLogs((prev) => [newEntry, ...prev]);
                  addToast({
                    title: summary,
                    variant: 'success',
                  });
                }}
              />
              <TicketConversionLog
                entries={conversionLogs}
                onAppendEntry={(entry) =>
                  setConversionLogs((prev) => [entry, ...prev])
                }
              />
            </div>
          </section>
        </>
      )}

      {/* 7. Drawers, Modals & Notifications Playground */}
      {showOverlays && (
      <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('kitSecOverlays')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('kitSecOverlaysDesc')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PanelRightOpen className="w-4 h-4" />}
            onClick={() => setDemoDrawerOpen(true)}
          >
            {t('kitBtnDrawer')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={() => setDemoModalOpen(true)}
          >
            {t('kitBtnModal')}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => setDemoConfirmOpen(true)}
          >
            {t('kitBtnConfirm')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Bell className="w-4 h-4" />}
            onClick={() => setDrawerOpen(true)}
          >
            {t('kitBtnNotif')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() =>
              pushNotification({
                title: t('kitBtnToast'),
                message: t('kitSecOverlaysDesc'),
                category: 'system',
                severity: 'success',
              })
            }
          >
            {t('kitBtnToast')}
          </Button>
        </div>

        {/* Dynamic Breadcrumb Playground */}
        <div id="kit-section-breadcrumbs" className="scroll-mt-20 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('breadcrumbDemoTitle')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('breadcrumbDemoDesc')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                ariaLabel={t('breadcrumbDepthLabel')}
                value={bcDepth}
                onChange={setBcDepth}
                options={[
                  { value: '2', label: '2' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                ]}
              />
              <SegmentedControl
                ariaLabel={t('breadcrumbSeparatorLabel')}
                value={bcSeparator}
                onChange={setBcSeparator}
                options={[
                  { value: 'chevron', label: '>' },
                  { value: 'slash', label: '/' },
                ]}
              />
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <Breadcrumb
              showHomeIcon
              separator={bcSeparator}
              maxVisible={4}
              items={(() => {
                const fullNodes = [
                  { id: 'bc-root', label: t('navOverview'), isRoot: true },
                  { id: 'bc-commerce', label: t('navCommerce') },
                  { id: 'bc-orders', label: t('navOrders') },
                  { id: 'bc-flagged', label: t('navOrdersFlagged') },
                  { id: 'bc-ord', label: 'ORD-8490', preserveLtr: true },
                ].slice(0, Number(bcDepth));

                return fullNodes.map((node, index) => {
                  const isCurrent = index === fullNodes.length - 1;
                  return {
                    ...node,
                    isCurrent,
                    onClick: isCurrent
                      ? undefined
                      : () => {
                          const targetDepth = index + 1;
                          setBcDepth(targetDepth <= 2 ? '2' : targetDepth <= 4 ? '4' : '5');
                          addToast({
                            title: node.label,
                            description: `${t('breadcrumbLabel')}: ${fullNodes
                              .slice(0, index + 1)
                              .map((n) => n.label)
                              .join(' / ')}`,
                            variant: 'info',
                          });
                        },
                  };
                });
              })()}
            />
          </div>
        </div>
      </section>
      )}

      {/* 6. Interactive Charts */}
      {showCharts && (
      <>
      <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('kitSecCharts')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('kitSecChartsDesc')}
            </p>
          </div>
          <SegmentedControl
            ariaLabel={t('kitSecCharts')}
            value={chartTab}
            onChange={setChartTab}
            options={[
              { value: 'area', label: t('kitTabArea') },
              { value: 'channel', label: t('kitTabChannel') },
            ]}
          />
        </div>

        {chartTab === 'area' ? (
          <RevenueAreaChart data={REVENUE_SERIES_BY_RANGE['7d']} />
        ) : (
          <ChannelBreakdownChart
            items={[
              { channel: 'Enterprise', amount: 23050, count: 4 },
              { channel: 'Direct', amount: 8890, count: 6 },
              { channel: 'Partner', amount: 6310, count: 3 },
              { channel: 'Marketplace', amount: 3640, count: 3 },
            ]}
          />
        )}
      </section>

      <TimeSeriesAnalytics
        orders={orders}
        defaultChartType="composed"
      />

      {/* 7. KPI Cards & Semantic Statuses */}
      <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('kitSecKpis')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('kitSecKpisDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label={t('kpiSettledRevenue')}
            value="4.82%"
            delta="+0.6%"
            trend="up"
            context={t('date30d')}
            sparkline={[3.8, 4.1, 4.0, 4.4, 4.6, 4.82]}
          />
          <StatCard
            label={t('kpiFlaggedReview')}
            value="0.18%"
            delta="-0.05%"
            trend="down"
            positiveIsGood
            context={t('kpiFlaggedContext')}
            sparkline={[0.29, 0.25, 0.24, 0.21, 0.19, 0.18]}
          />
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-5 border-t border-slate-100 dark:border-slate-800">
          <StatusIndicator status="Completed" />
          <StatusIndicator status="Processing" />
          <StatusIndicator status="Pending" />
          <StatusIndicator status="Flagged" />
          <StatusIndicator status="Refunded" />
        </div>
      </section>
      </>
      )}

      {/* 8. Data States (Loaded, Skeleton, Empty) */}
      {showStates && (
      <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('kitSecStates')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('kitSecStatesDesc')}
            </p>
          </div>
          <SegmentedControl
            ariaLabel={t('kitSecStates')}
            value={previewState}
            onChange={setPreviewState}
            options={[
              { value: 'loaded', label: t('kitTabReady') },
              { value: 'skeleton', label: t('kitTabSkeleton') },
              { value: 'empty', label: t('kitTabEmpty') },
            ]}
          />
        </div>

        {previewState === 'loaded' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
            {t('kitReadyDesc')}
          </div>
        )}
        {previewState === 'skeleton' && <TableSkeleton rows={3} />}
        {previewState === 'empty' && (
          <EmptyState
            icon={<Inbox className="w-5 h-5" />}
            title={t('kitEmptyTitle')}
            description={t('kitEmptyDesc')}
            actionLabel={t('kitRestorePreview')}
            onAction={() => setPreviewState('loaded')}
          />
        )}
      </section>
      )}

      {/* Interactive Demo Overlays */}
      <AdaptiveDrawer
        open={demoDrawerOpen}
        onClose={() => setDemoDrawerOpen(false)}
        title={t('kitBtnDrawer')}
        subtitle={t('kitSecOverlaysDesc')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDemoDrawerOpen(false)}>
              {t('close')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDemoDrawerOpen(false);
                addToast({
                  title: t('saveChanges'),
                  variant: 'success',
                });
              }}
            >
              {t('saveChanges')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('kitSecOverlaysDesc')}
        </p>
      </AdaptiveDrawer>

      <Modal
        open={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title={t('kitBtnModal')}
        description={t('kitSecOverlaysDesc')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDemoModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDemoModalOpen(false);
                addToast({
                  title: t('saveChanges'),
                  variant: 'info',
                });
              }}
            >
              {t('saveChanges')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('kitSecOverlaysDesc')}
        </p>
      </Modal>

      <ConfirmModal
        open={demoConfirmOpen}
        onClose={() => setDemoConfirmOpen(false)}
        onConfirm={() =>
          addToast({
            title: t('deleteSelected'),
            variant: 'warning',
          })
        }
        title={t('kitBtnConfirm')}
        message={t('bulkDeleteMsg')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        destructive
      />
    </div>
  );
}
