import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  ShieldCheck,
  Underline,
  Undo2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { isSafeHref, sanitizeRichHtml, stripHtmlToText } from '../../utils/htmlSanitizer';
import { Button } from './Button';

export interface WysiwygEditorProps {
  value: string;
  onChange: (sanitizedHtml: string) => void;
  label?: string;
  minHeight?: number;
  className?: string;
}

function syncSanitizedDom(target: HTMLDivElement, html: string) {
  const safe = sanitizeRichHtml(html);
  const parsed = new DOMParser().parseFromString(safe, 'text/html');
  target.replaceChildren(...Array.from(parsed.body.childNodes));
}

export function WysiwygEditor({
  value,
  onChange,
  label,
  minHeight = 160,
  className = '',
}: WysiwygEditorProps) {
  const { t } = useI18n();
  const id = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [linkBarOpen, setLinkBarOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Sync sanitized DOM when switching into visual mode or initializing
  useEffect(() => {
    if (mode !== 'visual') return;
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    syncSanitizedDom(el, value);
  }, [mode, value]);

  const emitCleaned = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeRichHtml(el.innerHTML));
  };

  const runCommand = (cmd: string, cmdArg?: string) => {
    const el = editorRef.current;
    if (!el || mode !== 'visual') return;
    el.focus();
    document.execCommand(cmd, false, cmdArg);
    emitCleaned();
  };

  const handleOpenLinkBar = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkUrl('https://');
    setLinkBarOpen((v) => !v);
  };

  const handleApplyLink = () => {
    const el = editorRef.current;
    if (!el) return;
    const trimmed = linkUrl.trim();
    if (!isSafeHref(trimmed)) {
      setLinkBarOpen(false);
      return;
    }
    el.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand('createLink', false, trimmed);
    emitCleaned();
    setLinkBarOpen(false);
  };

  const stats = useMemo(() => {
    const text = stripHtmlToText(value);
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    return { words, chars: text.length };
  }, [value]);

  const toolbarButtons = [
    { label: t('wysBold'), icon: Bold, onClick: () => runCommand('bold') },
    { label: t('wysItalic'), icon: Italic, onClick: () => runCommand('italic') },
    { label: t('wysUnderline'), icon: Underline, onClick: () => runCommand('underline') },
    { label: t('wysHeading2'), icon: Heading2, onClick: () => runCommand('formatBlock', '<h2>') },
    { label: t('wysHeading3'), icon: Heading3, onClick: () => runCommand('formatBlock', '<h3>') },
    { label: t('wysBulletList'), icon: List, onClick: () => runCommand('insertUnorderedList') },
    { label: t('wysOrderedList'), icon: ListOrdered, onClick: () => runCommand('insertOrderedList') },
    { label: t('wysQuote'), icon: Quote, onClick: () => runCommand('formatBlock', '<blockquote>') },
    { label: t('wysCode'), icon: Code, onClick: () => runCommand('formatBlock', '<pre>') },
    { label: t('wysLink'), icon: LinkIcon, onClick: handleOpenLinkBar },
    { label: t('wysClearFormat'), icon: Eraser, onClick: () => runCommand('removeFormat') },
    { label: t('wysUndo'), icon: Undo2, onClick: () => runCommand('undo') },
    { label: t('wysRedo'), icon: Redo2, onClick: () => runCommand('redo') },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {label}
          </label>
        )}

        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              mode === 'visual'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('wysModeVisual')}
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              mode === 'html'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t('wysModeHtml')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
        {/* Toolbar */}
        <div className="p-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 flex flex-wrap items-center gap-1">
          {toolbarButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
                type="button"
                title={btn.label}
                aria-label={btn.label}
                disabled={mode !== 'visual'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={btn.onClick}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Inline safe link bar (no window.prompt) */}
        {linkBarOpen && mode === 'visual' && (
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/30 flex flex-wrap items-center gap-2">
            <input
              type="url"
              dir="ltr"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={t('wysLinkPlaceholder')}
              className="flex-1 min-w-[180px] min-h-[36px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Button size="sm" variant="primary" onClick={handleApplyLink}>
              {t('wysApply')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLinkBarOpen(false)}
            >
              {t('cancel')}
            </Button>
          </div>
        )}

        {mode === 'visual' ? (
          <div
            id={id}
            ref={editorRef}
            dir="auto"
            contentEditable
            suppressContentEditableWarning
            onInput={emitCleaned}
            onBlur={emitCleaned}
            style={{ minHeight }}
            className="p-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_blockquote]:border-s-2 [&_blockquote]:border-blue-500 [&_blockquote]:ps-3 [&_blockquote]:text-slate-500 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-900 [&_pre]:font-mono [&_pre]:text-xs [&_a]:text-blue-600 [&_a]:underline"
          />
        ) : (
          <textarea
            id={id}
            dir="ltr"
            value={sanitizeRichHtml(value)}
            onChange={(e) => onChange(sanitizeRichHtml(e.target.value))}
            style={{ minHeight }}
            className="w-full p-3.5 bg-slate-950 text-emerald-300 font-mono text-xs focus:outline-none resize-y"
          />
        )}

        {/* Footer metadata */}
        <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t('wysSanitizedHint')}</span>
          </span>
          <span className="tabular-nums font-medium">
            {t('wysWordsChars', { words: stats.words, chars: stats.chars })}
          </span>
        </div>
      </div>
    </div>
  );
}
