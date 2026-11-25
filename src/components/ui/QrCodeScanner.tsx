import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Upload,
  Users,
} from 'lucide-react';
import type { CustomerProfile, OrderRecord } from '../../types/admin';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency } from '../../utils/tableLogic';
import {
  appendQrScanHistory,
  formatQrTagPayload,
  resolveQrEntityLookup,
  type QrLookupResult,
  type QrScanHistoryEntry,
} from '../../utils/qrLookup';
import { Button } from './Button';
import { Modal } from './Modal';
import { StatusIndicator } from './StatusIndicator';

export type CameraStatus =
  | 'idle'
  | 'starting'
  | 'active'
  | 'denied'
  | 'unavailable';

export interface QrCodeScannerProps {
  orders: OrderRecord[];
  customers: CustomerProfile[];
  onOpenOrder: (order: OrderRecord) => void;
  onOpenCustomer: (customer: CustomerProfile) => void;
  autoStartCamera?: boolean;
}

interface SampleTagItem {
  kind: 'order' | 'customer';
  id: string;
  label: string;
  sublabel: string;
  payload: string;
}

/**
 * Decodes an image source (HTMLImageElement or HTMLCanvasElement) with jsQR.
 */
function decodeImageSourceWithJsQr(
  source: CanvasImageSource,
  width: number,
  height: number
): string | null {
  if (width <= 0 || height <= 0) return null;
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const decoded = jsQR(imageData.data, w, h, {
    inversionAttempts: 'attemptBoth',
  });
  return decoded?.data ?? null;
}

export function QrCodeScanner({
  orders,
  customers,
  onOpenOrder,
  onOpenCustomer,
  autoStartCamera = false,
}: QrCodeScannerProps) {
  const { t } = useI18n();

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [decodeNotice, setDecodeNotice] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<QrLookupResult>({ status: 'empty' });
  const [scanHistory, setScanHistory] = useState<QrScanHistoryEntry[]>([]);
  const [sampleTagDataUrls, setSampleTagDataUrls] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastDecodedRef = useRef<{ value: string; ts: number }>({ value: '', ts: 0 });

  const sampleTags: SampleTagItem[] = [
    {
      kind: 'order',
      id: 'ORD-8490',
      label: 'ORD-8490',
      sublabel: 'Gridline Mobility',
      payload: formatQrTagPayload('order', 'ORD-8490'),
    },
    {
      kind: 'order',
      id: 'ORD-8492',
      label: 'ORD-8492',
      sublabel: 'Northstar Labs',
      payload: formatQrTagPayload('order', 'ORD-8492'),
    },
    {
      kind: 'customer',
      id: 'CUS-101',
      label: 'CUS-101',
      sublabel: 'Marcus Chen',
      payload: formatQrTagPayload('customer', 'CUS-101'),
    },
    {
      kind: 'customer',
      id: 'CUS-104',
      label: 'CUS-104',
      sublabel: 'Samuel Okafor',
      payload: formatQrTagPayload('customer', 'CUS-104'),
    },
  ];

  // Generate real scannable QR PNG data URLs via `qrcode`
  useEffect(() => {
    let cancelled = false;
    const generateTags = async () => {
      const entries: Array<[string, string]> = [];
      for (const tag of sampleTags) {
        try {
          const url = await QRCode.toDataURL(tag.payload, {
            width: 180,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          entries.push([tag.id, url]);
        } catch {
          // Ignore individual generation error
        }
      }
      if (!cancelled) {
        setSampleTagDataUrls(Object.fromEntries(entries));
      }
    };
    void generateTags();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus((prev) =>
      prev === 'active' || prev === 'starting' ? 'idle' : prev
    );
  }, []);

  const processDecodedText = useCallback(
    (rawText: string) => {
      setDecodeNotice(null);
      const resolved = resolveQrEntityLookup(rawText, { orders, customers });
      setLookupResult(resolved);

      if (resolved.status === 'matched') {
        const nowLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (resolved.kind === 'order') {
          setScanHistory((prev) =>
            appendQrScanHistory(prev, {
              id: `${resolved.order.id}-${Date.now()}`,
              rawPayload: resolved.rawPayload,
              kind: 'order',
              entityId: resolved.order.id,
              label: resolved.order.id,
              sublabel: `${resolved.order.company} · ${resolved.order.customerName}`,
              scannedAt: nowLabel,
            })
          );
        } else {
          setScanHistory((prev) =>
            appendQrScanHistory(prev, {
              id: `${resolved.customer.id}-${Date.now()}`,
              rawPayload: resolved.rawPayload,
              kind: 'customer',
              entityId: resolved.customer.id,
              label: resolved.customer.name,
              sublabel: `${resolved.customer.company} · ${resolved.customer.id}`,
              scannedAt: nowLabel,
            })
          );
        }
      }
    },
    [orders, customers]
  );

  const scanCurrentVideoFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw <= 0 || vh <= 0) return;

    if (!frameCanvasRef.current) {
      frameCanvasRef.current = document.createElement('canvas');
    }
    const canvas = frameCanvasRef.current;
    const maxDim = 720;
    const scale = Math.min(1, maxDim / Math.max(vw, vh));
    const cw = Math.max(1, Math.round(vw * scale));
    const ch = Math.max(1, Math.round(vh * scale));

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, cw, ch);
    const frame = ctx.getImageData(0, 0, cw, ch);
    const hit = jsQR(frame.data, cw, ch, {
      inversionAttempts: 'dontInvert',
    });

    if (hit?.data) {
      const now = Date.now();
      if (
        hit.data !== lastDecodedRef.current.value ||
        now - lastDecodedRef.current.ts > 2000
      ) {
        lastDecodedRef.current = { value: hit.data, ts: now };
        processDecodedText(hit.data);
      }
    }
  }, [processDecodedText]);

  const startCamera = useCallback(
    async (requestedFacing: 'environment' | 'user' = facingMode) => {
      stopCamera();
      setDecodeNotice(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setCameraStatus('unavailable');
        return;
      }

      setCameraStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: requestedFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        if (typeof navigator.mediaDevices.enumerateDevices === 'function') {
          const devices = await navigator.mediaDevices
            .enumerateDevices()
            .catch(() => []);
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        }

        setCameraStatus('active');
        scanTimerRef.current = window.setInterval(scanCurrentVideoFrame, 150);
      } catch (err) {
        const domErr = err as { name?: string };
        if (
          domErr?.name === 'NotAllowedError' ||
          domErr?.name === 'PermissionDeniedError' ||
          domErr?.name === 'SecurityError'
        ) {
          setCameraStatus('denied');
        } else {
          setCameraStatus('unavailable');
        }
      }
    },
    [facingMode, scanCurrentVideoFrame, stopCamera]
  );

  useEffect(() => {
    if (autoStartCamera) {
      void startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, [autoStartCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraStatus === 'active' || cameraStatus === 'starting') {
      void startCamera(next);
    }
  };

  const decodeDataUrlOrFile = useCallback(
    (srcUrl: string) => {
      setDecodeNotice(null);
      const img = new Image();
      img.onload = () => {
        const decoded = decodeImageSourceWithJsQr(
          img,
          img.naturalWidth || img.width,
          img.naturalHeight || img.height
        );
        if (decoded) {
          processDecodedText(decoded);
        } else {
          setDecodeNotice(t('qrDecodeNoHit'));
        }
      };
      img.onerror = () => {
        setDecodeNotice(t('qrDecodeNoHit'));
      };
      img.src = srcUrl;
    },
    [processDecodedText, t]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        decodeDataUrlOrFile(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processDecodedText(manualInput.trim());
  };

  const handleDownloadSamplePng = (tag: SampleTagItem) => {
    const dataUrl = sampleTagDataUrls[tag.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${tag.id.toLowerCase()}-qr-tag.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Live Camera Viewfinder + Controls */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] sm:max-h-[280px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                cameraStatus === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
              }`}
            />

            {/* Viewfinder Target Reticle Overlay when camera is active */}
            {cameraStatus === 'active' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.48)]">
                  <span className="absolute top-0 start-0 w-7 h-7 border-t-[3px] border-s-[3px] border-blue-400 rounded-tl-xl" />
                  <span className="absolute top-0 end-0 w-7 h-7 border-t-[3px] border-e-[3px] border-blue-400 rounded-tr-xl" />
                  <span className="absolute bottom-0 start-0 w-7 h-7 border-b-[3px] border-s-[3px] border-blue-400 rounded-bl-xl" />
                  <span className="absolute bottom-0 end-0 w-7 h-7 border-b-[3px] border-e-[3px] border-blue-400 rounded-br-xl" />
                  <div className="absolute inset-x-3 top-1/2 h-0.5 bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse" />
                </div>
                <span className="mt-4 px-3 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-medium backdrop-blur-xs">
                  {t('qrCameraActive')}
                </span>
              </div>
            )}

            {/* Standby / Permission Denied / Unavailable View */}
            {cameraStatus !== 'active' && (
              <div className="relative z-10 max-w-sm px-5 py-5 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-800/90 text-slate-200 flex items-center justify-center mx-auto border border-slate-700">
                  {cameraStatus === 'denied' || cameraStatus === 'unavailable' ? (
                    <CameraOff className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  ) : (
                    <QrCode className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {cameraStatus === 'starting'
                      ? t('qrCameraStarting')
                      : cameraStatus === 'denied'
                        ? t('qrCameraDeniedTitle')
                        : cameraStatus === 'unavailable'
                          ? t('qrCameraUnavailableTitle')
                          : t('qrCameraIdleTitle')}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {cameraStatus === 'denied'
                      ? t('qrCameraDeniedDesc')
                      : cameraStatus === 'unavailable'
                        ? t('qrCameraUnavailableDesc')
                        : t('qrCameraIdleDesc')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<Camera className="w-4 h-4" />}
                    onClick={() => void startCamera(facingMode)}
                    disabled={cameraStatus === 'starting'}
                  >
                    {t('qrStartCamera')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('qrUploadImage')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Camera Toolbar (only rendered while streaming/starting so controls never duplicate) */}
          {(cameraStatus === 'active' || cameraStatus === 'starting') && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<CameraOff className="w-4 h-4" />}
                onClick={stopCamera}
              >
                {t('qrStopCamera')}
              </Button>

              {hasMultipleCameras && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleToggleFacing}
                >
                  {t('qrSwitchCamera')}
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('qrUploadImage')}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label={t('qrUploadImage')}
          />

          {decodeNotice && (
            <div
              role="status"
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{decodeNotice}</span>
            </div>
          )}
        </div>

        {/* Right: Lookup Result, Manual Fallback, Recent Scans */}
        <div className="lg:col-span-5 space-y-3">
          {/* Matched / Not Found Result Card */}
          {lookupResult.status === 'matched' && lookupResult.kind === 'order' && (
            <div
              data-testid="qr-match-card"
              className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t('qrMatchFoundOrder')}</span>
                </div>
                <StatusIndicator status={lookupResult.order.status} />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    dir="ltr"
                    className="font-mono text-sm font-bold text-slate-900 dark:text-white text-start"
                  >
                    {lookupResult.order.id}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {lookupResult.order.company}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {lookupResult.order.customerName} · {lookupResult.order.planOrItem}
                  </p>
                </div>
                <span
                  dir="ltr"
                  className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white shrink-0"
                >
                  {formatCurrency(lookupResult.order.amount)}
                </span>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                rightIcon={<ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />}
                onClick={() => onOpenOrder(lookupResult.order)}
                className="w-full"
              >
                {t('qrOpenRecord')}
              </Button>
            </div>
          )}

          {lookupResult.status === 'matched' && lookupResult.kind === 'customer' && (
            <div
              data-testid="qr-match-card"
              className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{t('qrMatchFoundCustomer')}</span>
                </div>
                <StatusIndicator status={lookupResult.customer.healthStatus} />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {lookupResult.customer.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {lookupResult.customer.company} · {lookupResult.customer.role}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span dir="ltr" className="font-mono">{lookupResult.customer.id}</span> ·{' '}
                    {lookupResult.customer.email}
                  </p>
                </div>
                <span
                  dir="ltr"
                  className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white shrink-0"
                >
                  {formatCurrency(lookupResult.customer.totalSpend)}
                </span>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                rightIcon={<ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />}
                onClick={() => onOpenCustomer(lookupResult.customer)}
                className="w-full"
              >
                {t('qrOpenRecord')}
              </Button>
            </div>
          )}

          {lookupResult.status === 'not_found' && (
            <div
              data-testid="qr-not-found-card"
              className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5"
            >
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t('qrNotFoundTitle')}</span>
              </p>
              <p className="text-xs text-rose-700/90 dark:text-rose-200/90 break-all">
                {t('qrNotFoundDesc', { payload: lookupResult.rawPayload })}
              </p>
            </div>
          )}

          {/* Manual Tag / Code Fallback */}
          <form
            onSubmit={handleManualLookup}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
          >
            <label
              htmlFor="qr-manual-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              {t('qrManualLabel')}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="qr-manual-input"
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={t('qrManualPlaceholder')}
                  className="w-full min-h-[40px] ps-8 pe-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                {t('qrLookupBtn')}
              </Button>
            </div>
          </form>

          {/* Recent Scans */}
          {scanHistory.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t('qrRecentScans')}
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {scanHistory.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => processDecodedText(entry.rawPayload)}
                    className="w-full py-2 flex items-center justify-between gap-2 text-start hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.kind === 'order' ? (
                        <ReceiptText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {entry.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {entry.sublabel}
                        </p>
                      </div>
                    </div>
                    <span dir="ltr" className="text-[11px] font-mono text-slate-400 shrink-0">
                      {entry.scannedAt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Physical Document Tags (Real QR PNGs + Real jsQR Decoder Test) */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {t('qrSampleTagsTitle')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('qrSampleTagsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleTags.map((tag) => {
            const qrSrc = sampleTagDataUrls[tag.id];
            return (
              <div
                key={tag.id}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-14 h-14 rounded-lg bg-white p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                    {qrSrc ? (
                      <img
                        src={qrSrc}
                        alt={`QR code for ${tag.label}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-6 h-6 text-slate-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      dir="ltr"
                      className="font-mono text-xs font-bold text-slate-900 dark:text-white text-start truncate"
                    >
                      {tag.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tag.sublabel}
                    </p>
                    <p
                      dir="ltr"
                      className="font-mono text-[10px] text-slate-400 truncate mt-0.5 text-start"
                    >
                      {tag.payload}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!qrSrc}
                    onClick={() => qrSrc && decodeDataUrlOrFile(qrSrc)}
                    data-testid={`qr-decode-sample-${tag.id}`}
                    className="flex-1 min-h-[34px] px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t('qrScanSampleTag')}
                  </button>
                  <button
                    type="button"
                    disabled={!qrSrc}
                    onClick={() => handleDownloadSamplePng(tag)}
                    aria-label={`${t('qrDownloadTag')} ${tag.label}`}
                    title={t('qrDownloadTag')}
                    className="min-h-[34px] min-w-[34px] rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  customers: CustomerProfile[];
  onOpenOrder: (order: OrderRecord) => void;
  onOpenCustomer: (customer: CustomerProfile) => void;
}

export function QrScannerModal({
  open,
  onClose,
  orders,
  customers,
  onOpenOrder,
  onOpenCustomer,
}: QrScannerModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('qrScannerTitle')}
      description={t('qrScannerSubtitle')}
      size="xl"
      footer={
        <div className="w-full flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      }
    >
      <QrCodeScanner
        orders={orders}
        customers={customers}
        autoStartCamera={open}
        onOpenOrder={(order) => {
          onClose();
          onOpenOrder(order);
        }}
        onOpenCustomer={(customer) => {
          onClose();
          onOpenCustomer(customer);
        }}
      />
    </Modal>
  );
}
