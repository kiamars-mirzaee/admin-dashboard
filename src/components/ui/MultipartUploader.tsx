import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  createChunkPlan,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_MAX_FILE_SIZE,
  type UploadChunk,
  validateUploadFile,
} from '../../utils/multipartUpload';
import { formatBytesValue } from '../../utils/numberFormat';
import { Button } from './Button';

type UploadStatus = 'queued' | 'uploading' | 'paused' | 'completed' | 'error';

interface UploadQueueItem {
  id: string;
  file: File;
  chunks: UploadChunk[];
  completedChunks: number;
  status: UploadStatus;
  errorMessage?: string;
}

export interface MultipartUploaderProps {
  label?: string;
  maxFileSizeBytes?: number;
  acceptedExtensions?: string[];
  onUploadComplete?: (fileName: string, totalChunks: number) => void;
  className?: string;
}

const CHUNK_SIZE_OPTIONS = [
  { label: '256 KB', bytes: 256 * 1024 },
  { label: '512 KB', bytes: 512 * 1024 },
  { label: '1 MB', bytes: 1024 * 1024 },
];

export function MultipartUploader({
  label,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE,
  acceptedExtensions = ['.pdf', '.csv', '.json', '.png', '.zip'],
  onUploadComplete,
  className = '',
}: MultipartUploaderProps) {
  const { t } = useI18n();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runningFlagsRef = useRef<Map<string, boolean>>(new Map());
  const mountedRef = useRef(true);

  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runningFlagsRef.current.clear();
    };
  }, []);

  const runChunkUpload = async (item: UploadQueueItem, startAtChunk: number) => {
    runningFlagsRef.current.set(item.id, true);

    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
    );

    for (let idx = startAtChunk; idx < item.chunks.length; idx += 1) {
      if (!mountedRef.current || !runningFlagsRef.current.get(item.id)) {
        return;
      }
      const chunk = item.chunks[idx];
      // Slice real file bytes for multipart transfer
      const slice = item.file.slice(chunk.startByte, chunk.endByte);
      await slice.arrayBuffer();
      await new Promise((resolve) => window.setTimeout(resolve, 140));

      if (!mountedRef.current || !runningFlagsRef.current.get(item.id)) {
        return;
      }

      const nextDone = idx + 1;
      const doneAll = nextDone >= item.chunks.length;
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                completedChunks: nextDone,
                status: doneAll ? 'completed' : 'uploading',
              }
            : q
        )
      );

      if (doneAll) {
        runningFlagsRef.current.delete(item.id);
        onUploadComplete?.(item.file.name, item.chunks.length);
      }
    }
  };

  const enqueueFiles = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = [];
    for (const file of Array.from(files)) {
      const validation = validateUploadFile(file, {
        maxFileSizeBytes,
        acceptedExtensions,
      });
      const chunks = createChunkPlan(file.size, chunkSize);
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (!validation.valid) {
        newItems.push({
          id,
          file,
          chunks,
          completedChunks: 0,
          status: 'error',
          errorMessage:
            validation.reason === 'too-large'
              ? t('upErrTooLarge', { max: formatBytesValue(maxFileSizeBytes, 0) })
              : t('upErrInvalidType'),
        });
      } else {
        newItems.push({
          id,
          file,
          chunks,
          completedChunks: 0,
          status: 'queued',
        });
      }
    }

    setQueue((prev) => [...newItems, ...prev]);

    for (const item of newItems) {
      if (item.status === 'queued') {
        void runChunkUpload(item, 0);
      }
    }
  };

  const handlePause = (itemId: string) => {
    runningFlagsRef.current.set(itemId, false);
    setQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'paused' } : q))
    );
  };

  const handleResume = (item: UploadQueueItem) => {
    void runChunkUpload(item, item.completedChunks);
  };

  const handleRetry = (item: UploadQueueItem) => {
    const validation = validateUploadFile(item.file, {
      maxFileSizeBytes,
      acceptedExtensions,
    });
    if (!validation.valid) return;
    void runChunkUpload(item, 0);
  };

  const handleRemove = (itemId: string) => {
    runningFlagsRef.current.delete(itemId);
    setQueue((prev) => prev.filter((q) => q.id !== itemId));
  };

  const handleLoadSample = () => {
    const sampleBytes = new Uint8Array(920 * 1024); // ~920 KB (4 chunks @ 256 KB)
    const sampleFile = new File([sampleBytes], 'settlement-audit-bundle.pdf', {
      type: 'application/pdf',
    });
    enqueueFiles([sampleFile]);
  };

  const completedCount = queue.filter((q) => q.status === 'completed').length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {label ?? t('upTitle')}
        </label>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">{t('upChunkSizeLabel')}:</span>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            {CHUNK_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.bytes}
                type="button"
                onClick={() => setChunkSize(opt.bytes)}
                className={`px-2 py-0.5 rounded-md font-medium tabular-nums cursor-pointer transition-colors ${
                  chunkSize === opt.bytes
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length > 0) {
            enqueueFiles(e.dataTransfer.files);
          }
        }}
        className={`p-5 rounded-2xl border-2 border-dashed transition-colors text-center space-y-3 ${
          dragging
            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              enqueueFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="sr-only"
        />

        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
          <UploadCloud className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {t('upDropHint')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {t('upMaxSizeHint', { max: formatBytesValue(maxFileSizeBytes, 0) })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileUp className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('upBrowseBtn')}
          </Button>
          <Button size="sm" variant="primary" onClick={handleLoadSample}>
            {t('upLoadSampleBtn')}
          </Button>
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          {t('upEmptyQueue')}
        </p>
      ) : (
        <div className="space-y-2">
          {completedCount > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setQueue((prev) => prev.filter((q) => q.status !== 'completed'))
                }
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                {t('upClearCompleted')}
              </button>
            </div>
          )}

          {queue.map((item) => {
            const pct = Math.round(
              (item.completedChunks / Math.max(1, item.chunks.length)) * 100
            );
            const statusText =
              item.status === 'completed'
                ? t('upStatusCompleted')
                : item.status === 'uploading'
                  ? t('upStatusUploading')
                  : item.status === 'paused'
                    ? t('upStatusPaused')
                    : item.status === 'error'
                      ? t('upStatusError')
                      : t('upStatusQueued');

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      dir="ltr"
                      className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate"
                    >
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5 flex flex-wrap items-center gap-2">
                      <span dir="ltr">{formatBytesValue(item.file.size, 1)}</span>
                      <span>·</span>
                      <span>
                        {t('upChunkProgress', {
                          done: item.completedChunks,
                          total: item.chunks.length,
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'uploading' && (
                      <button
                        type="button"
                        aria-label={t('upPause')}
                        onClick={() => handlePause(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {item.status === 'paused' && (
                      <button
                        type="button"
                        aria-label={t('upResume')}
                        onClick={() => handleResume(item)}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {item.status === 'error' && !item.errorMessage && (
                      <button
                        type="button"
                        aria-label={t('upRetry')}
                        onClick={() => handleRetry(item)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={t('upRemove')}
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      item.status === 'completed'
                        ? 'bg-emerald-600'
                        : item.status === 'error'
                          ? 'bg-red-500'
                          : item.status === 'paused'
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                    }`}
                    style={{ width: `${item.status === 'error' ? 100 : pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      item.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : item.status === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.status === 'completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{item.errorMessage ?? statusText}</span>
                  </span>
                  <span dir="ltr" className="tabular-nums font-mono text-slate-500 dark:text-slate-400">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
