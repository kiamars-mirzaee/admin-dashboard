import type { CustomerProfile, OrderRecord } from '../types/admin';

export type QrEntityKind = 'order' | 'customer';

export interface ParsedQrPayload {
  kindHint: QrEntityKind | 'unknown';
  identifier: string;
  raw: string;
}

export type QrLookupResult =
  | {
      status: 'matched';
      kind: 'order';
      order: OrderRecord;
      rawPayload: string;
      matchedBy: string;
    }
  | {
      status: 'matched';
      kind: 'customer';
      customer: CustomerProfile;
      rawPayload: string;
      matchedBy: string;
    }
  | {
      status: 'not_found';
      rawPayload: string;
      parsedHint?: string;
    }
  | {
      status: 'empty';
    };

export interface QrScanHistoryEntry {
  id: string;
  rawPayload: string;
  kind: QrEntityKind;
  entityId: string;
  label: string;
  sublabel: string;
  scannedAt: string;
}

/**
 * Generates canonical scannable URI payload for physical order invoices or customer badges.
 */
export function formatQrTagPayload(kind: QrEntityKind, id: string): string {
  return `kestrel://${kind}/${id.trim()}`;
}

/**
 * Extracts entity hint and lookup identifier from structured JSON, URI, prefixed tag, or raw text.
 */
export function parseQrLookupPayload(rawInput: string): ParsedQrPayload | null {
  const raw = rawInput.trim();
  if (!raw) return null;

  // 1. JSON payload: {"type":"order","id":"ORD-8490"} or {"orderId":"ORD-8490"} or {"customerId":"CUS-101"}
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (typeof parsed.orderId === 'string' && parsed.orderId.trim()) {
        return { kindHint: 'order', identifier: parsed.orderId.trim(), raw };
      }
      if (typeof parsed.customerId === 'string' && parsed.customerId.trim()) {
        return { kindHint: 'customer', identifier: parsed.customerId.trim(), raw };
      }
      const rawType = typeof parsed.type === 'string' ? parsed.type.toLowerCase() : '';
      const rawId = typeof parsed.id === 'string' ? parsed.id.trim() : '';
      if (rawId) {
        return {
          kindHint:
            rawType === 'order'
              ? 'order'
              : rawType === 'customer'
                ? 'customer'
                : 'unknown',
          identifier: rawId,
          raw,
        };
      }
    } catch {
      // Fall through to string rules
    }
  }

  // 2. Custom URI scheme or HTTP URL: kestrel://order/ORD-8490, https://.../orders/ORD-8490, ?id=CUS-101
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const queryId =
        url.searchParams.get('orderId') ??
        url.searchParams.get('customerId') ??
        url.searchParams.get('id') ??
        url.searchParams.get('code');

      const combinedPath = `${url.hostname}/${url.pathname}`
        .split('/')
        .map((seg) => seg.trim())
        .filter(Boolean);

      const hasOrderSegment = combinedPath.some((s) => /^orders?$/i.test(s));
      const hasCustomerSegment = combinedPath.some((s) => /^customers?$/i.test(s));

      if (queryId && queryId.trim()) {
        return {
          kindHint: hasOrderSegment
            ? 'order'
            : hasCustomerSegment
              ? 'customer'
              : 'unknown',
          identifier: decodeURIComponent(queryId.trim()),
          raw,
        };
      }

      const lastSeg = combinedPath[combinedPath.length - 1];
      if (lastSeg) {
        return {
          kindHint: hasOrderSegment
            ? 'order'
            : hasCustomerSegment
              ? 'customer'
              : 'unknown',
          identifier: decodeURIComponent(lastSeg),
          raw,
        };
      }
    } catch {
      // Fall through to prefix parsing
    }
  }

  // 3. Key-value / colon-prefixed tag: ORDER:ORD-8490 or CUSTOMER:CUS-101
  const prefixed = raw.match(/^(order|ord|customer|cus)\s*[:=#]\s*(.+)$/i);
  if (prefixed) {
    const prefix = prefixed[1].toLowerCase();
    const id = prefixed[2].trim();
    if (id) {
      return {
        kindHint: prefix.startsWith('ord') ? 'order' : 'customer',
        identifier: id,
        raw,
      };
    }
  }

  // 4. Bare identifiers (ORD-8490, CUS-101, email, etc.)
  const upper = raw.toUpperCase();
  if (/^ORD-\d+/.test(upper)) {
    return { kindHint: 'order', identifier: upper, raw };
  }
  if (/^CUS-\d+/.test(upper)) {
    return { kindHint: 'customer', identifier: upper, raw };
  }

  return { kindHint: 'unknown', identifier: raw, raw };
}

/**
 * Resolves a scanned QR payload against live orders and customers.
 */
export function resolveQrEntityLookup(
  rawInput: string,
  collections: { orders: OrderRecord[]; customers: CustomerProfile[] }
): QrLookupResult {
  const parsed = parseQrLookupPayload(rawInput);
  if (!parsed) {
    return { status: 'empty' };
  }

  const needle = parsed.identifier.trim().toLowerCase();
  const { orders, customers } = collections;

  const findOrder = (): { order: OrderRecord; matchedBy: string } | null => {
    const exactId = orders.find((o) => o.id.toLowerCase() === needle);
    if (exactId) return { order: exactId, matchedBy: 'orderId' };

    // Numeric suffix shorthand (e.g. "8490" -> "ORD-8490")
    if (/^\d{3,}$/.test(needle)) {
      const byDigits = orders.find((o) => o.id.toLowerCase() === `ord-${needle}`);
      if (byDigits) return { order: byDigits, matchedBy: 'orderNumber' };
    }
    return null;
  };

  const findCustomer = (): { customer: CustomerProfile; matchedBy: string } | null => {
    const exactId = customers.find((c) => c.id.toLowerCase() === needle);
    if (exactId) return { customer: exactId, matchedBy: 'customerId' };

    const byEmail = customers.find((c) => c.email.toLowerCase() === needle);
    if (byEmail) return { customer: byEmail, matchedBy: 'customerEmail' };

    if (/^\d{3,}$/.test(needle)) {
      const byDigits = customers.find((c) => c.id.toLowerCase() === `cus-${needle}`);
      if (byDigits) return { customer: byDigits, matchedBy: 'customerNumber' };
    }

    const byCompanyExact = customers.find(
      (c) => c.company.toLowerCase() === needle || c.name.toLowerCase() === needle
    );
    if (byCompanyExact) return { customer: byCompanyExact, matchedBy: 'customerName' };

    return null;
  };

  if (parsed.kindHint === 'order') {
    const orderHit = findOrder();
    if (orderHit) {
      return {
        status: 'matched',
        kind: 'order',
        order: orderHit.order,
        rawPayload: parsed.raw,
        matchedBy: orderHit.matchedBy,
      };
    }
  } else if (parsed.kindHint === 'customer') {
    const customerHit = findCustomer();
    if (customerHit) {
      return {
        status: 'matched',
        kind: 'customer',
        customer: customerHit.customer,
        rawPayload: parsed.raw,
        matchedBy: customerHit.matchedBy,
      };
    }
  } else {
    const orderHit = findOrder();
    if (orderHit) {
      return {
        status: 'matched',
        kind: 'order',
        order: orderHit.order,
        rawPayload: parsed.raw,
        matchedBy: orderHit.matchedBy,
      };
    }
    const customerHit = findCustomer();
    if (customerHit) {
      return {
        status: 'matched',
        kind: 'customer',
        customer: customerHit.customer,
        rawPayload: parsed.raw,
        matchedBy: customerHit.matchedBy,
      };
    }
  }

  return {
    status: 'not_found',
    rawPayload: parsed.raw,
    parsedHint: parsed.identifier,
  };
}

export function appendQrScanHistory(
  history: QrScanHistoryEntry[],
  entry: QrScanHistoryEntry,
  maxItems = 5
): QrScanHistoryEntry[] {
  const deduped = history.filter(
    (item) => !(item.kind === entry.kind && item.entityId === entry.entityId)
  );
  return [entry, ...deduped].slice(0, maxItems);
}
