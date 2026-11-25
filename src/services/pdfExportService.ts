import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { OrderChannel, OrderRecord, OrderStatus } from '../types/admin';
import type { GridColumnSchema, GridOrderRow } from '../types/dataGrid';
import { formatCurrency } from '../utils/tableLogic';
import {
  PRINT_OPTIMIZED_PALETTE,
  buildDataGridPdfSpec,
  buildOrderPdfSpec,
  containsNonLatinScript,
  getStatusPrintColor,
} from '../utils/pdfDocument';

export interface PdfExportResult {
  filename: string;
  pageCount: number;
  rowCount: number;
  byteLength: number;
  blob: Blob;
}

export interface OrderPdfExportOptions {
  brandName?: string;
  title?: string;
  preparedBy?: string;
  billToLabel?: string;
  settlementLabel?: string;
  notesLabel?: string;
  totalLabel?: string;
  authorizationLabel?: string;
  qrCaption?: string;
  includeNotes?: boolean;
  includeQr?: boolean;
  autoDownload?: boolean;
  rtl?: boolean;
  statusLabel?: (s: OrderStatus) => string;
  channelLabel?: (c: OrderChannel) => string;
  labels?: {
    channel?: string;
    payment?: string;
    status?: string;
    date?: string;
    planItem?: string;
    amount?: string;
    generatedAt?: string;
    documentNo?: string;
  };
}

export interface GridPdfExportPayload {
  rows: ReadonlyArray<GridOrderRow | OrderRecord>;
  columns: GridColumnSchema[];
  visibleColumnKeys?: string[] | null;
  filterChips?: ReadonlyArray<{ label: string }>;
  scopeLabel?: string;
}

export interface GridPdfExportOptions {
  brandName?: string;
  title?: string;
  noFiltersLabel?: string;
  activeFiltersLabel?: string;
  generatedLabel?: string;
  recordsLabel?: string;
  grossVolumeLabel?: string;
  settledLabel?: string;
  averageOrderLabel?: string;
  totalLabel?: string;
  autoDownload?: boolean;
  rtl?: boolean;
  statusLabel?: (s: OrderStatus) => string;
  channelLabel?: (c: OrderChannel) => string;
}

export function triggerDownloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function drawWrappedTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'left'
): number {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  let line = '';
  let curY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = words[i];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

async function renderUnicodeFallbackPdf(
  drawFn: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => void,
  orientation: 'portrait' | 'landscape'
): Promise<jsPDF> {
  const pageW = orientation === 'landscape' ? 1684 : 1190;
  const pageH = orientation === 'landscape' ? 1190 : 1684;
  const canvas = document.createElement('canvas');
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for Unicode PDF fallback');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, pageW, pageH);
  drawFn(ctx, pageW, pageH);

  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  const pdfW = doc.internal.pageSize.getWidth();
  const pdfH = doc.internal.pageSize.getHeight();
  doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
  return doc;
}

function finalizeDocResult(
  doc: jsPDF,
  filename: string,
  rowCount: number,
  autoDownload: boolean
): PdfExportResult {
  const blob = doc.output('blob');
  if (autoDownload) {
    triggerDownloadBlob(blob, filename);
  }
  return {
    filename,
    pageCount: doc.getNumberOfPages(),
    rowCount,
    byteLength: blob.size,
    blob,
  };
}

export async function exportOrderToPdf(
  order: OrderRecord,
  options: OrderPdfExportOptions = {}
): Promise<PdfExportResult> {
  const spec = buildOrderPdfSpec(order, {
    title: options.title,
    includeNotes: options.includeNotes,
    statusLabel: options.statusLabel,
    channelLabel: options.channelLabel,
    labels: options.labels,
  });

  const includeQr = options.includeQr ?? true;
  const autoDownload = options.autoDownload ?? true;
  const brandName = options.brandName ?? 'Kestrel';

  let qrDataUrl = '';
  if (includeQr) {
    try {
      qrDataUrl = await QRCode.toDataURL(spec.qrPayload, {
        width: 144,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch {
      qrDataUrl = '';
    }
  }

  const stringsToCheck = [
    brandName,
    spec.title,
    spec.statusText,
    ...spec.customerBlock,
    ...spec.settlementRows.flat(),
    ...spec.lineItemHeaders,
    ...spec.lineItemRows.flat(),
    spec.notesText,
    options.billToLabel,
    options.settlementLabel,
  ];

  // Use print-styled high-DPI canvas page for Arabic/Persian/Unicode scripts
  if (
    typeof document !== 'undefined' &&
    (options.rtl || containsNonLatinScript(stringsToCheck))
  ) {
    const rtl = Boolean(options.rtl);
    const qrImg = qrDataUrl
      ? await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = qrDataUrl;
        })
      : null;

    const doc = await renderUnicodeFallbackPdf((ctx, w, h) => {
      const m = 84;
      const startX = rtl ? w - m : m;
      const endX = rtl ? m : w - m;
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';

      // Brand + Header
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 32px "Vazirmatn", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(brandName, startX, 108);

      ctx.font = '700 28px "Vazirmatn", "Plus Jakarta Sans", sans-serif';
      ctx.fillText(spec.title, startX, 152);

      ctx.fillStyle = '#475569';
      ctx.font = '400 18px "Vazirmatn", "DM Sans", sans-serif';
      ctx.fillText(`${spec.documentNumber} · ${spec.generatedAt}`, startX, 186);

      // Right/End side Order ID + QR
      ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText(spec.orderId, rtl ? m + (qrImg ? 132 : 0) : w - m - (qrImg ? 132 : 0), 118);

      ctx.fillStyle = '#475569';
      ctx.font = '600 18px "Vazirmatn", "DM Sans", sans-serif';
      ctx.fillText(spec.statusText, rtl ? m + (qrImg ? 132 : 0) : w - m - (qrImg ? 132 : 0), 152);

      if (qrImg) {
        const qx = rtl ? m : w - m - 110;
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.strokeRect(qx - 6, 86, 122, 122);
        ctx.drawImage(qrImg, qx, 92, 110, 110);
      }

      // Header Hairline Rule
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m, 232);
      ctx.lineTo(w - m, 232);
      ctx.stroke();

      // Metadata Two Columns
      let yLeft = 282;
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '600 18px "Vazirmatn", sans-serif';
      ctx.fillText(options.billToLabel ?? 'Customer & Organization', startX, yLeft);
      yLeft += 34;

      ctx.fillStyle = '#0F172A';
      ctx.font = '500 20px "Vazirmatn", sans-serif';
      for (const line of spec.customerBlock) {
        ctx.fillText(line, startX, yLeft);
        yLeft += 32;
      }

      const midX = w / 2 + (rtl ? -40 : 40);
      let yRight = 282;
      ctx.fillStyle = '#64748B';
      ctx.font = '600 18px "Vazirmatn", sans-serif';
      ctx.fillText(options.settlementLabel ?? 'Settlement & Routing', rtl ? midX : midX, yRight);
      yRight += 34;
      ctx.font = '500 19px "Vazirmatn", sans-serif';
      for (const [k, v] of spec.settlementRows) {
        ctx.fillStyle = '#64748B';
        ctx.textAlign = rtl ? 'right' : 'left';
        ctx.fillText(k, midX, yRight);
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = rtl ? 'left' : 'right';
        ctx.fillText(v, endX, yRight);
        yRight += 32;
      }

      // Line Items Table
      let tableY = Math.max(yLeft, yRight) + 46;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(m, tableY, w - m * 2, 52);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(m, tableY + 52);
      ctx.lineTo(w - m, tableY + 52);
      ctx.stroke();

      const colXs = rtl
        ? [w - m - 16, w - m - 480, w - m - 700, m + 16]
        : [m + 16, m + 480, m + 700, w - m - 16];

      ctx.fillStyle = '#334155';
      ctx.font = '700 18px "Vazirmatn", sans-serif';
      spec.lineItemHeaders.forEach((hLabel, idx) => {
        ctx.textAlign = idx === 3 ? (rtl ? 'left' : 'right') : rtl ? 'right' : 'left';
        ctx.fillText(hLabel, colXs[idx], tableY + 34);
      });

      tableY += 94;
      ctx.fillStyle = '#0F172A';
      ctx.font = '500 20px "Vazirmatn", sans-serif';
      spec.lineItemRows[0].forEach((cellVal, idx) => {
        ctx.textAlign = idx === 3 ? (rtl ? 'left' : 'right') : rtl ? 'right' : 'left';
        ctx.fillText(cellVal, colXs[idx], tableY);
      });

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(m, tableY + 26);
      ctx.lineTo(w - m, tableY + 26);
      ctx.stroke();

      // Total Row
      tableY += 74;
      ctx.fillStyle = '#475569';
      ctx.font = '600 20px "Vazirmatn", sans-serif';
      ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillText(
        `${options.totalLabel ?? 'Total amount'}:   ${spec.totalAmountFormatted}`,
        endX,
        tableY
      );

      // Notes Box
      if (spec.notesText !== null) {
        const boxY = tableY + 48;
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(m, boxY, w - m * 2, 130);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(m, boxY, w - m * 2, 130);

        ctx.textAlign = rtl ? 'right' : 'left';
        ctx.fillStyle = '#334155';
        ctx.font = '700 18px "Vazirmatn", sans-serif';
        ctx.fillText(options.notesLabel ?? 'Operations Notes', rtl ? w - m - 24 : m + 24, boxY + 36);

        ctx.fillStyle = '#334155';
        ctx.font = '400 18px "Vazirmatn", sans-serif';
        drawWrappedTextBlock(
          ctx,
          spec.notesText,
          rtl ? w - m - 24 : m + 24,
          boxY + 72,
          w - m * 2 - 48,
          28,
          rtl ? 'right' : 'left'
        );
      }

      // Footer
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(m, h - 120);
      ctx.lineTo(w - m, h - 120);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.font = '400 16px "Vazirmatn", sans-serif';
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(
        `${options.preparedBy ?? 'VP of Operations'} · ${spec.qrPayload}`,
        startX,
        h - 82
      );
      ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillText(options.authorizationLabel ?? 'Authorization sign-off', endX, h - 82);
    }, 'portrait');

    return finalizeDocResult(doc, spec.filename, 1, autoDownload);
  }

  // Native Print-Optimized Vector PDF (Portrait A4, 14mm margin)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const P = PRINT_OPTIMIZED_PALETTE;

  // Brand emblem box
  doc.setFillColor(...P.ink);
  doc.roundedRect(margin, margin, 8, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('K', margin + 4, margin + 5.6, { align: 'center' });

  doc.setTextColor(...P.ink);
  doc.setFontSize(12);
  doc.text(brandName, margin + 10.5, margin + 5.8);

  // Document Title & Metadata
  doc.setFontSize(16);
  doc.text(spec.title, margin, margin + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...P.muted);
  doc.text(
    `${options.labels?.documentNo ?? 'Document'}: ${spec.documentNumber}   ·   ${
      options.labels?.generatedAt ?? 'Generated'
    }: ${spec.generatedAt}`,
    margin,
    margin + 21.5
  );

  // Order ID + Status Badge + QR on Top Right
  const qrSize = qrDataUrl ? 21 : 0;
  const rightMetaX = pageW - margin - (qrSize > 0 ? qrSize + 4 : 0);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...P.ink);
  doc.text(spec.orderId, rightMetaX, margin + 5.5, { align: 'right' });

  const statusColor = getStatusPrintColor(order.status);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...statusColor);
  doc.text(spec.statusText.toUpperCase(), rightMetaX, margin + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...P.muted);
  doc.text(order.date, rightMetaX, margin + 16.5, { align: 'right' });

  if (qrDataUrl) {
    doc.setDrawColor(...P.lightRule);
    doc.setFillColor(...P.paper);
    doc.roundedRect(pageW - margin - qrSize - 1, margin - 1, qrSize + 2, qrSize + 2, 1.5, 1.5, 'FD');
    doc.addImage(qrDataUrl, 'PNG', pageW - margin - qrSize, margin, qrSize, qrSize);
  }

  // Horizontal Divider
  let cursorY = margin + 27;
  doc.setDrawColor(...P.rule);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 7;

  // Two-column Metadata Section
  const colGap = 10;
  const halfW = (contentW - colGap) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...P.subtle);
  doc.text((options.billToLabel ?? 'CUSTOMER & ORGANIZATION').toUpperCase(), margin, cursorY);
  doc.text(
    (options.settlementLabel ?? 'SETTLEMENT & ROUTING').toUpperCase(),
    margin + halfW + colGap,
    cursorY
  );

  let yCust = cursorY + 5.5;
  spec.customerBlock.forEach((line, idx) => {
    doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
    doc.setFontSize(idx === 0 ? 10 : 9);
    doc.setTextColor(...(idx === 0 ? P.ink : P.muted));
    doc.text(line, margin, yCust);
    yCust += 5;
  });

  let ySettle = cursorY + 5.5;
  spec.settlementRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...P.subtle);
    doc.text(label, margin + halfW + colGap, ySettle);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...P.ink);
    doc.text(val, pageW - margin, ySettle, { align: 'right' });
    ySettle += 5.2;
  });

  cursorY = Math.max(yCust, ySettle) + 6;
  doc.setDrawColor(...P.lightRule);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 6;

  // Line-Item Table using jspdf-autotable
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [spec.lineItemHeaders],
    body: spec.lineItemRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      textColor: P.ink,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 },
      lineColor: P.lightRule,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: P.surfaceAlt,
      textColor: P.ink,
      fontStyle: 'bold',
      fontSize: 8.5,
      lineColor: P.ink,
      lineWidth: { bottom: 0.6 },
    },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' },
    },
    foot: [
      [
        '',
        '',
        options.totalLabel ?? 'Total amount',
        spec.totalAmountFormatted,
      ],
    ],
    footStyles: {
      fillColor: P.paper,
      textColor: P.ink,
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'right',
    },
  });

  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  cursorY = (lastTable?.finalY ?? cursorY + 32) + 8;

  // Operational Notes Box
  if (spec.notesText !== null) {
    const noteLines = doc.splitTextToSize(spec.notesText, contentW - 8) as string[];
    const boxH = Math.max(20, noteLines.length * 4.8 + 12);
    doc.setFillColor(...P.surfaceAlt);
    doc.setDrawColor(...P.lightRule);
    doc.roundedRect(margin, cursorY, contentW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...P.ink);
    doc.text(options.notesLabel ?? 'Operations Notes', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...P.muted);
    doc.text(noteLines, margin + 4, cursorY + 11.5);
  }

  // Verification Footer
  const footerY = pageH - 18;
  doc.setDrawColor(...P.lightRule);
  doc.line(margin, footerY - 6, pageW - margin, footerY - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...P.subtle);
  doc.text(
    `${options.preparedBy ?? 'Prepared by: VP of Operations'}${
      includeQr ? `   ·   ${spec.qrPayload}` : ''
    }`,
    margin,
    footerY
  );
  doc.line(pageW - margin - 52, footerY + 1.5, pageW - margin, footerY + 1.5);
  doc.text(
    options.authorizationLabel ?? 'Authorization sign-off',
    pageW - margin,
    footerY + 5.5,
    { align: 'right' }
  );

  return finalizeDocResult(doc, spec.filename, 1, autoDownload);
}

export async function exportDataGridToPdf(
  payload: GridPdfExportPayload,
  options: GridPdfExportOptions = {}
): Promise<PdfExportResult> {
  const spec = buildDataGridPdfSpec(payload.rows, payload.columns, {
    visibleColumnKeys: payload.visibleColumnKeys,
    filterChips: payload.filterChips,
    scopeLabel: payload.scopeLabel,
    title: options.title,
    noFiltersLabel: options.noFiltersLabel,
    totalLabel: options.totalLabel,
    statusLabel: options.statusLabel,
    channelLabel: options.channelLabel,
  });

  const autoDownload = options.autoDownload ?? true;
  const brandName = options.brandName ?? 'Kestrel';

  const textSample = [
    brandName,
    spec.title,
    spec.scopeLabel,
    spec.filterSummary,
    ...spec.headers,
    ...spec.rows.slice(0, 12).flat(),
  ];

  // Unicode-safe raster sheet fallback when RTL / non-Latin glyphs appear
  if (
    typeof document !== 'undefined' &&
    (options.rtl || containsNonLatinScript(textSample))
  ) {
    const rtl = Boolean(options.rtl);
    const doc = await renderUnicodeFallbackPdf((ctx, w, h) => {
      const m = 64;
      const startX = rtl ? w - m : m;
      const endX = rtl ? m : w - m;
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 28px "Vazirmatn", sans-serif';
      ctx.fillText(`${brandName} — ${spec.title}`, startX, 82);

      ctx.fillStyle = '#475569';
      ctx.font = '400 17px "Vazirmatn", sans-serif';
      ctx.fillText(
        `${options.activeFiltersLabel ?? 'Filters'}: ${spec.filterSummary}`,
        startX,
        116
      );

      ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillText(`${spec.scopeLabel} · ${spec.generatedAt}`, endX, 82);

      // Summary Row
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m, 144);
      ctx.lineTo(w - m, 144);
      ctx.stroke();

      const kpis = [
        `${options.recordsLabel ?? 'Records'}: ${spec.summary.count}`,
        `${options.grossVolumeLabel ?? 'Gross volume'}: ${formatCurrency(spec.summary.grossVolume)}`,
        `${options.settledLabel ?? 'Settled'}: ${formatCurrency(spec.summary.settledRevenue)}`,
        `${options.averageOrderLabel ?? 'Avg order'}: ${formatCurrency(spec.summary.averageOrder)}`,
      ];
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 18px "Vazirmatn", sans-serif';
      kpis.forEach((k, idx) => {
        const kx = rtl ? w - m - idx * 380 : m + idx * 380;
        ctx.fillText(k, kx, 180);
      });

      // Table Header + First Page Rows
      const colCount = Math.max(1, spec.columns.length);
      const tableW = w - m * 2;
      const colW = tableW / colCount;
      let y = 216;

      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(m, y, tableW, 44);
      ctx.strokeStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(m, y + 44);
      ctx.lineTo(w - m, y + 44);
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = '700 15px "Vazirmatn", sans-serif';
      spec.headers.forEach((hdr, i) => {
        const cx = rtl ? w - m - i * colW - 10 : m + i * colW + 10;
        ctx.textAlign = rtl ? 'right' : 'left';
        ctx.fillText(hdr.slice(0, 18), cx, y + 28);
      });

      y += 44;
      const maxRows = Math.min(spec.rows.length, 22);
      ctx.font = '400 15px "Vazirmatn", sans-serif';
      for (let rIdx = 0; rIdx < maxRows; rIdx += 1) {
        const row = spec.rows[rIdx];
        if (rIdx % 2 === 1) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(m, y, tableW, 38);
        }
        ctx.fillStyle = '#0F172A';
        row.forEach((cell, cIdx) => {
          const cx = rtl ? w - m - cIdx * colW - 10 : m + cIdx * colW + 10;
          ctx.textAlign = rtl ? 'right' : 'left';
          ctx.fillText(cell.slice(0, 22), cx, y + 25);
        });
        y += 38;
      }

      ctx.fillStyle = '#64748B';
      ctx.font = '400 14px "Vazirmatn", sans-serif';
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.fillText(`${brandName} Ledger Export · ${spec.generatedAt}`, startX, h - 38);
    }, spec.orientation);

    return finalizeDocResult(doc, spec.filename, spec.rows.length, autoDownload);
  }

  // Native Print-Optimized Vector Data Grid PDF
  const doc = new jsPDF({
    orientation: spec.orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;
  const P = PRINT_OPTIMIZED_PALETTE;

  // Header Block
  doc.setFillColor(...P.ink);
  doc.roundedRect(margin, margin, 7, 7, 1.2, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('K', margin + 3.5, margin + 4.9, { align: 'center' });

  doc.setTextColor(...P.ink);
  doc.setFontSize(11);
  doc.text(brandName, margin + 9.5, margin + 5.1);

  doc.setFontSize(15);
  doc.text(spec.title, margin, margin + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...P.muted);
  doc.text(
    `${options.activeFiltersLabel ?? 'Active filters'}: ${spec.filterSummary}`,
    margin,
    margin + 18.5,
    { maxWidth: contentW * 0.68 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...P.ink);
  doc.text(spec.scopeLabel, pageW - margin, margin + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...P.muted);
  doc.text(
    `${options.generatedLabel ?? 'Generated'}: ${spec.generatedAt}`,
    pageW - margin,
    margin + 10.5,
    { align: 'right' }
  );

  // Executive Summary Strip
  const summaryY = margin + 23;
  doc.setFillColor(...P.surfaceAlt);
  doc.setDrawColor(...P.lightRule);
  doc.roundedRect(margin, summaryY, contentW, 14, 1.5, 1.5, 'FD');

  const kpiCells = [
    { label: options.recordsLabel ?? 'Records', val: String(spec.summary.count) },
    { label: options.grossVolumeLabel ?? 'Gross volume', val: formatCurrency(spec.summary.grossVolume) },
    { label: options.settledLabel ?? 'Settled revenue', val: formatCurrency(spec.summary.settledRevenue) },
    { label: options.averageOrderLabel ?? 'Average order', val: formatCurrency(spec.summary.averageOrder) },
  ];
  const cellW = contentW / kpiCells.length;
  kpiCells.forEach((cell, idx) => {
    const cx = margin + idx * cellW + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...P.subtle);
    doc.text(cell.label.toUpperCase(), cx, summaryY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...P.ink);
    doc.text(cell.val, cx, summaryY + 10.8);
  });

  // Column alignment map
  const columnStyles: Record<number, { halign?: 'left' | 'right' | 'center'; fontStyle?: 'normal' | 'bold' }> = {};
  spec.columns.forEach((col, idx) => {
    if (col.align === 'right') {
      columnStyles[idx] = {
        halign: 'right',
        fontStyle: col.type === 'currency' ? 'bold' : 'normal',
      };
    } else if (col.type === 'id') {
      columnStyles[idx] = { fontStyle: 'bold' };
    }
  });

  autoTable(doc, {
    startY: summaryY + 18,
    margin: { top: 14, bottom: 16, left: margin, right: margin },
    head: [spec.headers],
    body: spec.rows,
    foot: spec.totalFooterRow ? [spec.totalFooterRow] : undefined,
    showHead: 'everyPage',
    showFoot: 'lastPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: P.ink,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2.2, right: 2.2 },
      lineColor: P.lightRule,
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: P.tableHeadFill,
      textColor: P.ink,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: P.ink,
      lineWidth: { bottom: 0.5 },
    },
    alternateRowStyles: {
      fillColor: P.surfaceAlt,
    },
    footStyles: {
      fillColor: P.tableHeadFill,
      textColor: P.ink,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: P.ink,
      lineWidth: { top: 0.5 },
    },
    columnStyles,
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...P.subtle);
      doc.text(
        `${brandName} · ${spec.title} · ${spec.generatedAt}`,
        margin,
        pageH - 7
      );
      doc.text(
        `Page ${hookData.pageNumber} of ${pageCount}`,
        pageW - margin,
        pageH - 7,
        { align: 'right' }
      );
    },
  });

  return finalizeDocResult(doc, spec.filename, spec.rows.length, autoDownload);
}
