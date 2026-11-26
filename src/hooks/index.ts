import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle, setIsOpen };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint(): BreakpointName {
  const is2xl = useMediaQuery('(min-width: 1536px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isSm = useMediaQuery('(min-width: 640px)');
  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore storage quota
        }
        return resolved;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setValue, remove];
}

export function useQueryParams() {
  const [searchStr, setSearchStr] = useState(() =>
    typeof window !== 'undefined' ? window.location.search : ''
  );

  useEffect(() => {
    const onPop = () => setSearchStr(window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const setParam = useCallback((name: string, value: string | null) => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    if (value === null || value === '') next.delete(name);
    else next.set(name, value);
    const qs = next.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    setSearchStr(qs ? `?${qs}` : '');
  }, []);

  return { params, setParam };
}

export function useUrlState<T extends string>(
  paramName: string,
  defaultValue: T
): [T, (next: T) => void] {
  const { params, setParam } = useQueryParams();
  const value = (params.get(paramName) as T | null) ?? defaultValue;
  const setValue = useCallback(
    (next: T) => setParam(paramName, next === defaultValue ? null : next),
    [paramName, defaultValue, setParam]
  );
  return [value, setValue];
}

export function usePagination(totalItems: number, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const clampedPage = Math.min(page, totalPages);

  const goTo = useCallback(
    (nextPage: number) => {
      setPage(Math.max(1, Math.min(totalPages, nextPage)));
    },
    [totalPages]
  );

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    setPage: goTo,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    nextPage: () => goTo(clampedPage + 1),
    prevPage: () => goTo(clampedPage - 1),
  };
}

export function useSelection<T extends string = string>(initial: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<T[]>(initial);

  const isSelected = useCallback(
    (id: T) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectMany = useCallback((ids: T[]) => {
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  return {
    selectedIds,
    count: selectedIds.length,
    isSelected,
    toggle,
    selectMany,
    clear,
    setSelectedIds,
  };
}

export function useTableState<SortFieldT extends string = string>(
  initialSortField: SortFieldT,
  initialDirection: 'asc' | 'desc' = 'desc',
  initialPageSize = 10
) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [sortField, setSortField] = useState<SortFieldT>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialDirection);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const selection = useSelection<string>();

  const toggleSort = useCallback(
    (field: SortFieldT) => {
      if (sortField === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    sortField,
    sortDirection,
    toggleSort,
    density,
    setDensity,
    pageSizeDefault: initialPageSize,
    selection,
  };
}

export function useHotkeys(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const normalized = combo.toLowerCase().split('+').map((p) => p.trim());
    const needMod = normalized.includes('mod') || normalized.includes('ctrl') || normalized.includes('cmd');
    const needShift = normalized.includes('shift');
    const needAlt = normalized.includes('alt');
    const targetKey = normalized[normalized.length - 1];

    const onKeyDown = (e: KeyboardEvent) => {
      const modPressed = e.metaKey || e.ctrlKey;
      if (needMod !== modPressed) return;
      if (needShift !== e.shiftKey) return;
      if (needAlt !== e.altKey) return;
      if (e.key.toLowerCase() === targetKey) {
        handlerRef.current(e);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo, enabled]);
}

export function useClipboard(timeoutMs = 1800) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const el = document.createElement('textarea');
          el.value = text;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeoutMs);
        return true;
      } catch {
        return false;
      }
    },
    [timeoutMs]
  );

  return { copied, copy };
}

export const useCopy = useClipboard;
