import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Code2,
  Copy,
  Filter,
  Search,
  X,
} from 'lucide-react';
import {
  buildJsonTree,
  collectCollapsiblePaths,
  formatPrimitiveValue,
  getJsonTreeStats,
  parseJsonInput,
  searchJsonTree,
  splitSearchHighlight,
  type JsonTreeNode,
} from '../../utils/jsonViewer';
import { useClipboard, useDebounce } from '../../hooks/index';

export interface JSONViewerProps {
  /** JSON object, array, primitive, or raw JSON string */
  data: unknown;
  /** Optional header label (e.g. endpoint path or config filename) */
  title?: string;
  /** Initial depth to expand automatically (default: 2) */
  defaultExpandDepth?: number;
  /** Show persistent search & filter bar (default: true) */
  searchable?: boolean;
  /** Persist search query across reloads & data updates via localStorage (default: true) */
  persistSearch?: boolean;
  /** Optional custom storage key for persisted search query */
  persistSearchKey?: string;
  /** Allow toggling between interactive Tree view and formatted Raw JSON (default: true) */
  allowRawToggle?: boolean;
  /** Max vertical scroll height for the body container */
  maxHeight?: string;
  /** Visual surface theme ('dark' code console or 'auto' synced with app theme) */
  surface?: 'dark' | 'auto';
  className?: string;
}

function HighlightText({
  text,
  query,
  isDarkSurface,
}: {
  text: string;
  query: string;
  isDarkSurface: boolean;
}) {
  const segments = useMemo(() => splitSearchHighlight(text, query), [text, query]);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className={
              isDarkSurface
                ? 'rounded px-0.5 bg-amber-400/35 text-amber-200 font-semibold'
                : 'rounded px-0.5 bg-amber-200 text-amber-950 font-semibold dark:bg-amber-400/35 dark:text-amber-200'
            }
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

interface TreeNodeRowProps {
  node: JsonTreeNode;
  isLast: boolean;
  expandedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  searchQuery: string;
  matchedPaths: Set<string>;
  ancestorPaths: Set<string>;
  activeMatchPath: string | null;
  filterOnlyMatches: boolean;
  isDarkSurface: boolean;
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
  activeNodeRef: React.MutableRefObject<HTMLDivElement | null>;
}

function JsonTreeNodeRow({
  node,
  isLast,
  expandedPaths,
  onTogglePath,
  searchQuery,
  matchedPaths,
  ancestorPaths,
  activeMatchPath,
  filterOnlyMatches,
  isDarkSurface,
  onCopyPath,
  copiedPath,
  activeNodeRef,
}: TreeNodeRowProps) {
  const hasSearch = searchQuery.trim().length > 0;
  const isMatched = matchedPaths.has(node.path);
  const isAncestor = ancestorPaths.has(node.path);

  if (hasSearch && filterOnlyMatches && !isMatched && !isAncestor) {
    return null;
  }

  const isContainer = node.type === 'object' || node.type === 'array';
  const isExpandable = isContainer && node.childCount > 0;
  const isExpanded =
    isExpandable &&
    (expandedPaths.has(node.path) || (hasSearch && isAncestor));
  const isActiveMatch = activeMatchPath === node.path;

  const openBracket = node.type === 'array' ? '[' : '{';
  const closeBracket = node.type === 'array' ? ']' : '}';
  const comma = isLast ? '' : ',';

  const keyClass = isDarkSurface
    ? 'text-sky-300'
    : 'text-sky-700 dark:text-sky-300';
  const punctClass = isDarkSurface
    ? 'text-slate-500'
    : 'text-slate-400 dark:text-slate-500';

  const valueToneClass = (() => {
    switch (node.type) {
      case 'string':
        return isDarkSurface
          ? 'text-emerald-300'
          : 'text-emerald-700 dark:text-emerald-300';
      case 'number':
        return isDarkSurface
          ? 'text-amber-300'
          : 'text-amber-700 dark:text-amber-300';
      case 'boolean':
        return isDarkSurface
          ? 'text-violet-300 font-semibold'
          : 'text-violet-700 dark:text-violet-300 font-semibold';
      case 'null':
        return isDarkSurface
          ? 'text-rose-400 italic'
          : 'text-rose-600 dark:text-rose-400 italic';
      default:
        return isDarkSurface
          ? 'text-slate-300'
          : 'text-slate-700 dark:text-slate-200';
    }
  })();

  const rowHighlightClass = isActiveMatch
    ? isDarkSurface
      ? 'bg-blue-500/20 ring-1 ring-blue-400/60'
      : 'bg-blue-50 ring-1 ring-blue-400 dark:bg-blue-500/20'
    : isMatched
      ? isDarkSurface
        ? 'bg-amber-400/10'
        : 'bg-amber-50/80 dark:bg-amber-400/10'
      : isDarkSurface
        ? 'hover:bg-slate-800/50'
        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50';

  const renderKeyPrefix = () => {
    if (node.keyName === null) return null;
    const isArrayIndex = /^\d+$/.test(node.keyName) && node.path.endsWith(`[${node.keyName}]`);
    if (isArrayIndex) {
      return (
        <span className={`${punctClass} select-none me-1.5`}>
          {node.keyName}:
        </span>
      );
    }
    return (
      <span className="me-1.5">
        <span className={keyClass}>
          &quot;
          <HighlightText
            text={node.keyName}
            query={searchQuery}
            isDarkSurface={isDarkSurface}
          />
          &quot;
        </span>
        <span className={punctClass}>:</span>
      </span>
    );
  };

  if (!isContainer) {
    const formattedVal = formatPrimitiveValue(node.value, node.type);
    return (
      <div
        ref={isActiveMatch ? activeNodeRef : undefined}
        data-json-path={node.path}
        className={`group flex items-start justify-between gap-2 rounded-md px-2 py-0.5 leading-6 transition-colors ${rowHighlightClass}`}
        style={{ paddingLeft: `${node.depth * 18 + 20}px` }}
      >
        <div className="min-w-0 break-all">
          {renderKeyPrefix()}
          <span className={valueToneClass}>
            <HighlightText
              text={formattedVal}
              query={searchQuery}
              isDarkSurface={isDarkSurface}
            />
          </span>
          <span className={punctClass}>{comma}</span>
        </div>

        <button
          type="button"
          onClick={() => onCopyPath(node.path)}
          title={`Copy path ${node.path}`}
          aria-label={`Copy path ${node.path}`}
          className={`opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-opacity cursor-pointer ${
            isDarkSurface
              ? 'bg-slate-800/80 text-slate-300 hover:text-white'
              : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          {copiedPath === node.path ? 'Path copied' : 'Path'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={isActiveMatch ? activeNodeRef : undefined}
        data-json-path={node.path}
        className={`group flex items-center justify-between gap-2 rounded-md px-2 py-0.5 leading-6 transition-colors ${rowHighlightClass}`}
        style={{ paddingLeft: `${node.depth * 18 + 4}px` }}
      >
        <div className="flex items-center min-w-0">
          {isExpandable ? (
            <button
              type="button"
              onClick={() => onTogglePath(node.path)}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.keyName ?? 'root'}`}
              className={`w-4 h-4 me-1 inline-flex items-center justify-center rounded transition-colors cursor-pointer shrink-0 ${
                isDarkSurface
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
          ) : (
            <span className="w-4 me-1 shrink-0" aria-hidden="true" />
          )}

          {renderKeyPrefix()}

          <span className={punctClass}>{openBracket}</span>

          {!isExpanded && (
            <>
              <button
                type="button"
                onClick={() => isExpandable && onTogglePath(node.path)}
                disabled={!isExpandable}
                className={`mx-1.5 px-1.5 py-0 rounded text-[10px] font-sans font-medium ${
                  isDarkSurface
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                } ${isExpandable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {node.childCount === 0
                  ? 'empty'
                  : node.type === 'array'
                    ? `${node.childCount} ${node.childCount === 1 ? 'item' : 'items'}`
                    : `${node.childCount} ${node.childCount === 1 ? 'key' : 'keys'}`}
              </button>
              <span className={punctClass}>
                {closeBracket}
                {comma}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onCopyPath(node.path)}
          title={`Copy path ${node.path}`}
          aria-label={`Copy path ${node.path}`}
          className={`opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-opacity cursor-pointer ${
            isDarkSurface
              ? 'bg-slate-800/80 text-slate-300 hover:text-white'
              : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          {copiedPath === node.path ? 'Path copied' : 'Path'}
        </button>
      </div>

      {isExpanded && (
        <div>
          {node.children.map((child, idx) => (
            <JsonTreeNodeRow
              key={child.path}
              node={child}
              isLast={idx === node.children.length - 1}
              expandedPaths={expandedPaths}
              onTogglePath={onTogglePath}
              searchQuery={searchQuery}
              matchedPaths={matchedPaths}
              ancestorPaths={ancestorPaths}
              activeMatchPath={activeMatchPath}
              filterOnlyMatches={filterOnlyMatches}
              isDarkSurface={isDarkSurface}
              onCopyPath={onCopyPath}
              copiedPath={copiedPath}
              activeNodeRef={activeNodeRef}
            />
          ))}
          <div
            className={`px-2 py-0.5 leading-6 ${punctClass}`}
            style={{ paddingLeft: `${node.depth * 18 + 20}px` }}
          >
            {closeBracket}
            {comma}
          </div>
        </div>
      )}
    </div>
  );
}

export function JSONViewer({
  data,
  title = 'payload.json',
  defaultExpandDepth = 2,
  searchable = true,
  persistSearch = true,
  persistSearchKey,
  allowRawToggle = true,
  maxHeight = '360px',
  surface = 'dark',
  className = '',
}: JSONViewerProps) {
  const isDarkSurface = surface === 'dark';
  const { copied, copy } = useClipboard(1600);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const resolvedStorageKey = persistSearchKey ?? `kestrel:json-search:${title}`;
  const [searchInput, setSearchInput] = useState<string>(() => {
    if (!persistSearch || typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(resolvedStorageKey) ?? '';
    } catch {
      return '';
    }
  });
  const debouncedQuery = useDebounce(searchInput, 120);
  const [filterOnlyMatches, setFilterOnlyMatches] = useState(false);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const activeNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!persistSearch || typeof window === 'undefined') return;
    try {
      if (searchInput) {
        window.localStorage.setItem(resolvedStorageKey, searchInput);
      } else {
        window.localStorage.removeItem(resolvedStorageKey);
      }
    } catch {
      // ignore storage quota/privacy errors
    }
  }, [persistSearch, resolvedStorageKey, searchInput]);

  const parsed = useMemo(() => parseJsonInput(data), [data]);
  const rootNode = useMemo(() => buildJsonTree(parsed.value), [parsed.value]);
  const stats = useMemo(() => getJsonTreeStats(rootNode), [rootNode]);
  const prettyRaw = useMemo(() => {
    if (!parsed.ok && typeof data === 'string') return data;
    try {
      return JSON.stringify(parsed.value, null, 2);
    } catch {
      return String(parsed.value);
    }
  }, [parsed, data]);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    collectCollapsiblePaths(rootNode, defaultExpandDepth)
  );

  // Reset default expansion cleanly when input payload changes
  useEffect(() => {
    setExpandedPaths(collectCollapsiblePaths(rootNode, defaultExpandDepth));
    setActiveMatchIdx(0);
  }, [rootNode, defaultExpandDepth]);

  const searchResult = useMemo(
    () => searchJsonTree(rootNode, debouncedQuery),
    [rootNode, debouncedQuery]
  );

  useEffect(() => {
    setActiveMatchIdx(0);
  }, [debouncedQuery]);

  const activeMatchPath =
    searchResult.matchList.length > 0
      ? searchResult.matchList[activeMatchIdx % searchResult.matchList.length]
      : null;

  useEffect(() => {
    if (activeMatchPath && activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeMatchPath]);

  const handleTogglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedPaths(collectCollapsiblePaths(rootNode, Infinity));
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set(['$']));
  };

  const handleCopyPath = (path: string) => {
    void copy(path);
    setCopiedPath(path);
    window.setTimeout(() => setCopiedPath((cur) => (cur === path ? null : cur)), 1400);
  };

  const stepMatch = (delta: number) => {
    if (searchResult.matchList.length === 0) return;
    setActiveMatchIdx(
      (idx) =>
        (idx + delta + searchResult.matchList.length) %
        searchResult.matchList.length
    );
  };

  const containerCls = isDarkSurface
    ? 'rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100'
    : 'rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100';

  const headerBorderCls = isDarkSurface
    ? 'border-slate-800 bg-slate-900/80'
    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80';

  const btnCls = isDarkSurface
    ? 'px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer'
    : 'px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer';

  return (
    <div className={`${containerCls} ${className}`} data-testid="json-viewer">
      {/* Header Toolbar */}
      <div
        className={`px-3.5 py-2.5 border-b ${headerBorderCls} flex flex-wrap items-center justify-between gap-2 text-xs`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            dir="ltr"
            className={`font-mono font-semibold truncate ${
              isDarkSurface ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {title}
          </span>
          <span
            dir="ltr"
            className="font-mono text-[11px] text-slate-400 whitespace-nowrap"
          >
            · {stats.totalNodes} nodes · depth {stats.maxDepth}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {viewMode === 'tree' && (
            <>
              <button
                type="button"
                onClick={handleExpandAll}
                className={btnCls}
                title="Expand all nodes"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Expand</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className={btnCls}
                title="Collapse all nodes"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Collapse</span>
              </button>
            </>
          )}

          {allowRawToggle && (
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'tree' ? 'raw' : 'tree'))}
              className={btnCls}
              title={viewMode === 'tree' ? 'View raw JSON' : 'View interactive tree'}
            >
              <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{viewMode === 'tree' ? 'Raw' : 'Tree'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void copy(prettyRaw)}
            className={btnCls}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Persistent Search Bar */}
      {searchable && (
        <div
          dir="ltr"
          className={`px-3.5 py-2 border-b ${
            isDarkSurface
              ? 'border-slate-800/80 bg-slate-950'
              : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950'
          } flex flex-wrap items-center gap-2`}
        >
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  stepMatch(e.shiftKey ? -1 : 1);
                } else if (e.key === 'Escape') {
                  setSearchInput('');
                }
              }}
              placeholder="Search keys or values..."
              aria-label="Search JSON keys or values"
              className={`w-full min-h-[32px] pl-8 pr-7 rounded-lg border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkSurface
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400'
              }`}
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear JSON search"
                onClick={() => setSearchInput('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer ${
                  isDarkSurface
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {debouncedQuery.trim() && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span
                className={
                  searchResult.totalMatches > 0
                    ? isDarkSurface
                      ? 'text-emerald-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                    : isDarkSurface
                      ? 'text-rose-400'
                      : 'text-rose-600 dark:text-rose-400'
                }
              >
                {searchResult.totalMatches === 0
                  ? '0 matches'
                  : `${(activeMatchIdx % searchResult.totalMatches) + 1} / ${searchResult.totalMatches}`}
              </span>
              <button
                type="button"
                disabled={searchResult.totalMatches === 0}
                onClick={() => stepMatch(-1)}
                aria-label="Previous match"
                className={`${btnCls} disabled:opacity-35`}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={searchResult.totalMatches === 0}
                onClick={() => stepMatch(1)}
                aria-label="Next match"
                className={`${btnCls} disabled:opacity-35`}
              >
                ↓
              </button>
            </div>
          )}

          <button
            type="button"
            aria-pressed={filterOnlyMatches}
            onClick={() => setFilterOnlyMatches((f) => !f)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 border transition-colors cursor-pointer ${
              filterOnlyMatches
                ? isDarkSurface
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                  : 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500/60 dark:text-blue-300'
                : isDarkSurface
                  ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Filter className="w-3 h-3" aria-hidden="true" />
            <span>Matches only</span>
          </button>
        </div>
      )}

      {/* Malformed JSON Warning Banner */}
      {!parsed.ok && (
        <div
          dir="ltr"
          role="alert"
          className="px-3.5 py-2 bg-rose-950/60 border-b border-rose-800/70 text-rose-200 text-xs flex items-center gap-2 font-mono"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span className="truncate">Parse error: {parsed.error}</span>
        </div>
      )}

      {/* Body */}
      <div
        dir="ltr"
        style={{ maxHeight }}
        className="overflow-auto p-3 font-mono text-xs"
      >
        {viewMode === 'raw' || !parsed.ok ? (
          <pre className="leading-relaxed whitespace-pre-wrap break-words">
            {debouncedQuery.trim() ? (
              <HighlightText
                text={prettyRaw}
                query={debouncedQuery}
                isDarkSurface={isDarkSurface}
              />
            ) : (
              prettyRaw
            )}
          </pre>
        ) : debouncedQuery.trim() &&
          filterOnlyMatches &&
          searchResult.totalMatches === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-sans">
            No keys or values matched &ldquo;{debouncedQuery}&rdquo;.
          </div>
        ) : (
          <JsonTreeNodeRow
            node={rootNode}
            isLast
            expandedPaths={expandedPaths}
            onTogglePath={handleTogglePath}
            searchQuery={debouncedQuery}
            matchedPaths={searchResult.matchedPaths}
            ancestorPaths={searchResult.ancestorPaths}
            activeMatchPath={activeMatchPath}
            filterOnlyMatches={filterOnlyMatches}
            isDarkSurface={isDarkSurface}
            onCopyPath={handleCopyPath}
            copiedPath={copiedPath}
            activeNodeRef={activeNodeRef}
          />
        )}
      </div>
    </div>
  );
}

export const JsonViewer = JSONViewer;
