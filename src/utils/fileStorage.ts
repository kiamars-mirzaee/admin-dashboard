import type {
  StorageKindFilter,
  StorageMutationResult,
  StorageNode,
  StorageSortConfig,
  StorageSummary,
  StorageTreeBranch,
} from '../types/storage';

export const MAX_STORAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per file

const INVALID_NAME_CHARS_RE = /[\\/\0<>:"|?*]/;

export const INITIAL_STORAGE_NODES: StorageNode[] = [
  {
    id: 'fld-compliance',
    parentId: null,
    kind: 'folder',
    name: 'Compliance & SOC2',
    sizeBytes: 0,
    updatedAt: '2026-11-24T09:15:00Z',
    owner: 'Elena Rostova',
  },
  {
    id: 'fld-audits-q4',
    parentId: 'fld-compliance',
    kind: 'folder',
    name: '2026 Q4 Audits',
    sizeBytes: 0,
    updatedAt: '2026-11-23T16:40:00Z',
    owner: 'Elena Rostova',
  },
  {
    id: 'file-soc2-checklist',
    parentId: 'fld-audits-q4',
    kind: 'file',
    name: 'soc2-type2-controls.md',
    extension: 'md',
    mimeType: 'text/markdown',
    sizeBytes: 1840,
    content: `# SOC2 Type II Control Matrix — Q4 2026

- CC6.1 Logical Access Security: Verified via SSO + hardware MFA across 100% of admin seats.
- CC7.2 Anomaly Monitoring: Flagged ledger reviews require VP Operations sign-off prior to settlement.
- CC8.1 Change Management: All schema migrations require code review + CI test gate.`,
    updatedAt: '2026-11-23T16:40:00Z',
    owner: 'Elena Rostova',
  },
  {
    id: 'file-access-matrix',
    parentId: 'fld-audits-q4',
    kind: 'file',
    name: 'rbac-permissions.json',
    extension: 'json',
    mimeType: 'application/json',
    sizeBytes: 642,
    content: JSON.stringify(
      {
        version: '2026.4',
        roles: [
          { id: 'vp_ops', scopes: ['orders:*', 'storage:*', 'exports:pdf'] },
          { id: 'auditor', scopes: ['orders:read', 'storage:read'] },
        ],
      },
      null,
      2
    ),
    updatedAt: '2026-11-22T11:20:00Z',
    owner: 'Marcus Chen',
  },
  {
    id: 'file-retention-policy',
    parentId: 'fld-compliance',
    kind: 'file',
    name: 'data-retention-policy.txt',
    extension: 'txt',
    mimeType: 'text/plain',
    sizeBytes: 412,
    content:
      'Operational settlement ledgers and signed partner dispatch PDFs are archived for 7 fiscal years in encrypted regional buckets (EU-West, US-East).',
    updatedAt: '2026-11-20T14:05:00Z',
    owner: 'Elena Rostova',
  },
  {
    id: 'fld-settlements',
    parentId: null,
    kind: 'folder',
    name: 'Invoices & Settlements',
    sizeBytes: 0,
    updatedAt: '2026-11-24T17:30:00Z',
    owner: 'Clara Lindqvist',
  },
  {
    id: 'fld-regional-ledgers',
    parentId: 'fld-settlements',
    kind: 'folder',
    name: 'Regional Ledgers',
    sizeBytes: 0,
    updatedAt: '2026-11-24T17:30:00Z',
    owner: 'Clara Lindqvist',
  },
  {
    id: 'file-eu-november',
    parentId: 'fld-regional-ledgers',
    kind: 'file',
    name: 'eu-west-nov-settlement.csv',
    extension: 'csv',
    mimeType: 'text/csv',
    sizeBytes: 318,
    content: `order_id,company,channel,amount_usd,status
ORD-8492,Northstar Labs,Enterprise,4850,Completed
ORD-8489,Nordic Freight Co.,Direct,890,Completed
ORD-8486,Velora Health,Enterprise,5200,Completed`,
    updatedAt: '2026-11-24T17:30:00Z',
    owner: 'Clara Lindqvist',
  },
  {
    id: 'file-flagged-review-note',
    parentId: 'fld-settlements',
    kind: 'file',
    name: 'ORD-8490-dispute-brief.md',
    extension: 'md',
    mimeType: 'text/markdown',
    sizeBytes: 512,
    content: `# Dispatch & Settlement Review: ORD-8490

Customer: Devon Alverez (Gridline Mobility)
Amount: $3,290 (Partner channel)
Reason: Billing ZIP mismatch flagged by automated clearing rule. Awaiting signed address verification upload.`,
    updatedAt: '2026-11-21T10:12:00Z',
    owner: 'Devon Alverez',
  },
  {
    id: 'fld-contracts',
    parentId: null,
    kind: 'folder',
    name: 'Partner Contracts',
    sizeBytes: 0,
    updatedAt: '2026-11-19T08:45:00Z',
    owner: 'Samuel Okafor',
  },
  {
    id: 'file-partner-msa',
    parentId: 'fld-contracts',
    kind: 'file',
    name: 'gridline-partner-msa.pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 248320,
    content:
      'PDF binary placeholder preview — Partner Master Services Agreement executed with Gridline Mobility (Ref #MSA-2026-118).',
    updatedAt: '2026-11-19T08:45:00Z',
    owner: 'Samuel Okafor',
  },
  {
    id: 'file-ops-runbook',
    parentId: null,
    kind: 'file',
    name: 'operations-runbook.md',
    extension: 'md',
    mimeType: 'text/markdown',
    sizeBytes: 620,
    content: `# Kestrel Operations Runbook

1. Inspect flagged items every 2 hours in the Orders Ledger.
2. Archive reconciled CSV/PDF snapshots under Invoices & Settlements.
3. Attach signed carrier manifests directly inside Compliance & SOC2.`,
    updatedAt: '2026-11-25T07:50:00Z',
    owner: 'Elena Rostova',
  },
  {
    id: 'file-release-manifest',
    parentId: null,
    kind: 'file',
    name: 'storage-bucket-manifest.json',
    extension: 'json',
    mimeType: 'application/json',
    sizeBytes: 384,
    content: JSON.stringify(
      {
        bucket: 'kestrel-ops-vault',
        encryption: 'AES-256-GCM',
        region: 'eu-west-2',
        versioning: true,
      },
      null,
      2
    ),
    updatedAt: '2026-11-25T08:10:00Z',
    owner: 'Elena Rostova',
  },
];

export function inferExtensionAndMime(fileName: string): {
  extension: string;
  mimeType: string;
} {
  const trimmed = fileName.trim();
  const dotIdx = trimmed.lastIndexOf('.');
  const extension =
    dotIdx > 0 && dotIdx < trimmed.length - 1
      ? trimmed.slice(dotIdx + 1).toLowerCase()
      : 'txt';

  switch (extension) {
    case 'md':
      return { extension, mimeType: 'text/markdown' };
    case 'json':
      return { extension, mimeType: 'application/json' };
    case 'csv':
      return { extension, mimeType: 'text/csv' };
    case 'pdf':
      return { extension, mimeType: 'application/pdf' };
    case 'png':
      return { extension, mimeType: 'image/png' };
    case 'jpg':
    case 'jpeg':
      return { extension, mimeType: 'image/jpeg' };
    case 'svg':
      return { extension, mimeType: 'image/svg+xml' };
    case 'webp':
      return { extension, mimeType: 'image/webp' };
    case 'html':
      return { extension, mimeType: 'text/html' };
    case 'ts':
    case 'tsx':
    case 'js':
      return { extension, mimeType: 'text/javascript' };
    default:
      return { extension, mimeType: 'text/plain' };
  }
}

export function computeTextByteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function validateNodeName(
  rawName: string,
  siblingNames: string[]
): { valid: boolean; normalized: string; error?: string } {
  const normalized = rawName.trim();
  if (!normalized) {
    return { valid: false, normalized: '', error: 'Name is required.' };
  }
  if (normalized === '.' || normalized === '..') {
    return {
      valid: false,
      normalized,
      error: 'Reserved directory names (. or ..) are not allowed.',
    };
  }
  if (INVALID_NAME_CHARS_RE.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: 'Name cannot contain slashes or special path characters.',
    };
  }
  if (normalized.length > 120) {
    return {
      valid: false,
      normalized,
      error: 'Name must be 120 characters or fewer.',
    };
  }
  const lower = normalized.toLowerCase();
  const hasConflict = siblingNames.some((s) => s.trim().toLowerCase() === lower);
  if (hasConflict) {
    return {
      valid: false,
      normalized,
      error: 'An item with this name already exists in the current folder.',
    };
  }
  return { valid: true, normalized };
}

export function deduplicateSiblingName(
  desiredName: string,
  siblingNames: string[]
): string {
  const clean = desiredName.trim().replace(/[\\/\0<>:"|?*]/g, '_') || 'untitled';
  const existing = new Set(siblingNames.map((n) => n.trim().toLowerCase()));
  if (!existing.has(clean.toLowerCase())) {
    return clean;
  }

  const dotIdx = clean.lastIndexOf('.');
  const hasExt = dotIdx > 0 && dotIdx < clean.length - 1;
  const stem = hasExt ? clean.slice(0, dotIdx) : clean;
  const ext = hasExt ? clean.slice(dotIdx) : '';

  let counter = 1;
  while (counter < 1000) {
    const candidate = `${stem} (${counter})${ext}`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter += 1;
  }
  return `${stem}-${Date.now()}${ext}`;
}

function getSiblingNames(
  nodes: readonly StorageNode[],
  parentId: string | null,
  excludeId?: string
): string[] {
  return nodes
    .filter((n) => n.parentId === parentId && n.id !== excludeId)
    .map((n) => n.name);
}

function createStorageId(prefix: 'fld' | 'file'): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function createFolderNode(
  nodes: readonly StorageNode[],
  params: {
    parentId: string | null;
    name: string;
    owner?: string;
    nowIso?: string;
  }
): StorageMutationResult {
  if (
    params.parentId !== null &&
    !nodes.some((n) => n.id === params.parentId && n.kind === 'folder')
  ) {
    return {
      ok: false,
      nodes: [...nodes],
      error: 'Target parent folder does not exist.',
    };
  }

  const check = validateNodeName(
    params.name,
    getSiblingNames(nodes, params.parentId)
  );
  if (!check.valid) {
    return { ok: false, nodes: [...nodes], error: check.error };
  }

  const folder: StorageNode = {
    id: createStorageId('fld'),
    parentId: params.parentId,
    kind: 'folder',
    name: check.normalized,
    sizeBytes: 0,
    updatedAt: params.nowIso ?? new Date().toISOString(),
    owner: params.owner?.trim() || 'Elena Rostova',
  };

  return {
    ok: true,
    nodes: [folder, ...nodes],
    createdNodes: [folder],
  };
}

export function createFileNode(
  nodes: readonly StorageNode[],
  params: {
    parentId: string | null;
    name: string;
    content?: string;
    mimeType?: string;
    owner?: string;
    nowIso?: string;
  }
): StorageMutationResult {
  if (
    params.parentId !== null &&
    !nodes.some((n) => n.id === params.parentId && n.kind === 'folder')
  ) {
    return {
      ok: false,
      nodes: [...nodes],
      error: 'Target parent folder does not exist.',
    };
  }

  const check = validateNodeName(
    params.name,
    getSiblingNames(nodes, params.parentId)
  );
  if (!check.valid) {
    return { ok: false, nodes: [...nodes], error: check.error };
  }

  const content = params.content ?? '';
  const inferred = inferExtensionAndMime(check.normalized);
  const fileNode: StorageNode = {
    id: createStorageId('file'),
    parentId: params.parentId,
    kind: 'file',
    name: check.normalized,
    extension: inferred.extension,
    mimeType: params.mimeType?.trim() || inferred.mimeType,
    sizeBytes: computeTextByteSize(content),
    content,
    updatedAt: params.nowIso ?? new Date().toISOString(),
    owner: params.owner?.trim() || 'Elena Rostova',
  };

  return {
    ok: true,
    nodes: [fileNode, ...nodes],
    createdNodes: [fileNode],
  };
}

export interface UploadFileInput {
  name: string;
  sizeBytes: number;
  mimeType?: string;
  content?: string;
  dataUrl?: string;
}

export function uploadFilesIntoFolder(
  nodes: readonly StorageNode[],
  params: {
    parentId: string | null;
    files: UploadFileInput[];
    owner?: string;
    nowIso?: string;
  }
): StorageMutationResult {
  if (
    params.parentId !== null &&
    !nodes.some((n) => n.id === params.parentId && n.kind === 'folder')
  ) {
    return {
      ok: false,
      nodes: [...nodes],
      error: 'Target parent folder does not exist.',
    };
  }

  if (params.files.length === 0) {
    return {
      ok: false,
      nodes: [...nodes],
      error: 'Select at least one file to upload.',
    };
  }

  const tooLarge = params.files.find((f) => f.sizeBytes > MAX_STORAGE_UPLOAD_BYTES);
  if (tooLarge) {
    return {
      ok: false,
      nodes: [...nodes],
      error: `${tooLarge.name} exceeds the 10 MB upload limit.`,
    };
  }

  const siblingNames = getSiblingNames(nodes, params.parentId);
  const createdNodes: StorageNode[] = [];
  const timestamp = params.nowIso ?? new Date().toISOString();
  const owner = params.owner?.trim() || 'Elena Rostova';

  for (const incoming of params.files) {
    const resolvedName = deduplicateSiblingName(incoming.name, siblingNames);
    siblingNames.push(resolvedName);
    const inferred = inferExtensionAndMime(resolvedName);

    createdNodes.push({
      id: createStorageId('file'),
      parentId: params.parentId,
      kind: 'file',
      name: resolvedName,
      extension: inferred.extension,
      mimeType: incoming.mimeType?.trim() || inferred.mimeType,
      sizeBytes: Math.max(0, Math.round(incoming.sizeBytes)),
      content: incoming.content,
      dataUrl: incoming.dataUrl,
      updatedAt: timestamp,
      owner,
    });
  }

  return {
    ok: true,
    nodes: [...createdNodes, ...nodes],
    createdNodes,
  };
}

export function renameStorageNode(
  nodes: readonly StorageNode[],
  id: string,
  newName: string,
  nowIso?: string
): StorageMutationResult {
  const target = nodes.find((n) => n.id === id);
  if (!target) {
    return { ok: false, nodes: [...nodes], error: 'Item not found.' };
  }

  const check = validateNodeName(
    newName,
    getSiblingNames(nodes, target.parentId, id)
  );
  if (!check.valid) {
    return { ok: false, nodes: [...nodes], error: check.error };
  }

  const inferred =
    target.kind === 'file' ? inferExtensionAndMime(check.normalized) : null;

  const updatedNode: StorageNode = {
    ...target,
    name: check.normalized,
    extension: inferred ? inferred.extension : target.extension,
    mimeType: inferred ? inferred.mimeType : target.mimeType,
    updatedAt: nowIso ?? new Date().toISOString(),
  };

  return {
    ok: true,
    nodes: nodes.map((n) => (n.id === id ? updatedNode : n)),
    updatedNode,
  };
}

export function updateFileContentNode(
  nodes: readonly StorageNode[],
  id: string,
  content: string,
  nowIso?: string
): StorageMutationResult {
  const target = nodes.find((n) => n.id === id);
  if (!target || target.kind !== 'file') {
    return { ok: false, nodes: [...nodes], error: 'File not found.' };
  }

  const updatedNode: StorageNode = {
    ...target,
    content,
    sizeBytes: computeTextByteSize(content),
    updatedAt: nowIso ?? new Date().toISOString(),
  };

  return {
    ok: true,
    nodes: nodes.map((n) => (n.id === id ? updatedNode : n)),
    updatedNode,
  };
}

export function collectDescendantIds(
  nodes: readonly StorageNode[],
  rootId: string
): Set<string> {
  const removed = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (removed.has(current)) continue;
    removed.add(current);
    for (const child of nodes) {
      if (child.parentId === current && !removed.has(child.id)) {
        queue.push(child.id);
      }
    }
  }

  return removed;
}

export function deleteStorageNode(
  nodes: readonly StorageNode[],
  id: string
): StorageMutationResult {
  const exists = nodes.some((n) => n.id === id);
  if (!exists) {
    return { ok: false, nodes: [...nodes], error: 'Item not found.' };
  }

  const removedIds = collectDescendantIds(nodes, id);
  return {
    ok: true,
    nodes: nodes.filter((n) => !removedIds.has(n.id)),
    removedCount: removedIds.size,
  };
}

export function resolveScopedRootId(
  nodes: readonly StorageNode[],
  rootFolderId?: string | null
): string | null {
  if (!rootFolderId) return null;
  const exists = nodes.some(
    (n) => n.id === rootFolderId && n.kind === 'folder'
  );
  return exists ? rootFolderId : null;
}

export function getScopedDescendantIds(
  nodes: readonly StorageNode[],
  rootFolderId?: string | null
): Set<string> | null {
  const effectiveRoot = resolveScopedRootId(nodes, rootFolderId);
  if (!effectiveRoot) return null;
  const descendants = collectDescendantIds(nodes, effectiveRoot);
  descendants.delete(effectiveRoot);
  return descendants;
}

export function isFolderWithinRoot(
  nodes: readonly StorageNode[],
  folderId: string | null,
  rootFolderId?: string | null
): boolean {
  const effectiveRoot = resolveScopedRootId(nodes, rootFolderId);
  if (!effectiveRoot) return true;
  if (folderId === effectiveRoot) return true;
  if (!folderId) return false;
  const descendants = collectDescendantIds(nodes, effectiveRoot);
  return descendants.has(folderId);
}

export function matchesAllowedExtensions(
  node: StorageNode,
  allowedExtensions?: readonly string[]
): boolean {
  if (node.kind === 'folder') return true;
  if (!allowedExtensions || allowedExtensions.length === 0) return true;
  const normalizedSet = new Set(
    allowedExtensions.map((ext) => ext.replace(/^\./, '').trim().toLowerCase())
  );
  const ext = (node.extension ?? '').trim().toLowerCase();
  return normalizedSet.has(ext);
}

export function getFolderBreadcrumbPath(
  nodes: readonly StorageNode[],
  folderId: string | null,
  rootFolderId?: string | null
): StorageNode[] {
  const effectiveRoot = resolveScopedRootId(nodes, rootFolderId);
  if (!folderId || folderId === effectiveRoot) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chain: StorageNode[] = [];
  const visited = new Set<string>();

  let currentId: string | null = folderId;
  while (currentId && !visited.has(currentId)) {
    if (effectiveRoot && currentId === effectiveRoot) break;
    visited.add(currentId);
    const node = byId.get(currentId);
    if (!node || node.kind !== 'folder') break;
    chain.unshift(node);
    currentId = node.parentId;
  }

  return chain;
}

export function compareStorageNodes(
  a: StorageNode,
  b: StorageNode,
  sort: StorageSortConfig
): number {
  // Folders always group before files for classic file explorer scanability
  if (a.kind !== b.kind) {
    return a.kind === 'folder' ? -1 : 1;
  }

  const factor = sort.direction === 'asc' ? 1 : -1;
  switch (sort.field) {
    case 'sizeBytes':
      return (a.sizeBytes - b.sizeBytes) * factor || a.name.localeCompare(b.name);
    case 'updatedAt':
      return (
        a.updatedAt.localeCompare(b.updatedAt) * factor ||
        a.name.localeCompare(b.name)
      );
    case 'name':
    default:
      return a.name.localeCompare(b.name) * factor;
  }
}

export function getChildrenForFolder(
  nodes: readonly StorageNode[],
  folderId: string | null,
  options?: {
    search?: string;
    kindFilter?: StorageKindFilter;
    sort?: StorageSortConfig;
    rootFolderId?: string | null;
    allowedExtensions?: readonly string[];
  }
): StorageNode[] {
  const search = options?.search?.trim().toLowerCase() ?? '';
  const kindFilter = options?.kindFilter ?? 'all';
  const sort = options?.sort ?? { field: 'name', direction: 'asc' };
  const effectiveRoot = resolveScopedRootId(nodes, options?.rootFolderId);
  const scopedIds = getScopedDescendantIds(nodes, effectiveRoot);
  const targetParentId =
    folderId === null
      ? effectiveRoot
      : isFolderWithinRoot(nodes, folderId, effectiveRoot)
        ? folderId
        : effectiveRoot;

  const base = search
    ? nodes.filter((n) => {
        if (scopedIds && !scopedIds.has(n.id)) return false;
        const matchesQuery =
          n.name.toLowerCase().includes(search) ||
          n.owner.toLowerCase().includes(search) ||
          (n.extension?.toLowerCase().includes(search) ?? false);
        return matchesQuery;
      })
    : nodes.filter((n) => n.parentId === targetParentId);

  const filtered = base.filter((n) => {
    if (kindFilter !== 'all' && n.kind !== kindFilter) return false;
    return matchesAllowedExtensions(n, options?.allowedExtensions);
  });

  return [...filtered].sort((a, b) => compareStorageNodes(a, b, sort));
}

export function computeFolderStats(
  nodes: readonly StorageNode[],
  folderId: string
): { directChildCount: number; recursiveFileCount: number; recursiveSizeBytes: number } {
  const directChildCount = nodes.filter((n) => n.parentId === folderId).length;
  const descendants = collectDescendantIds(nodes, folderId);
  let recursiveFileCount = 0;
  let recursiveSizeBytes = 0;

  for (const node of nodes) {
    if (descendants.has(node.id) && node.kind === 'file') {
      recursiveFileCount += 1;
      recursiveSizeBytes += node.sizeBytes;
    }
  }

  return { directChildCount, recursiveFileCount, recursiveSizeBytes };
}

export function buildStorageTree(
  nodes: readonly StorageNode[],
  options?: {
    search?: string;
    sort?: StorageSortConfig;
    rootFolderId?: string | null;
    allowedExtensions?: readonly string[];
  }
): StorageTreeBranch[] {
  const sort = options?.sort ?? { field: 'name', direction: 'asc' };
  const search = options?.search?.trim().toLowerCase() ?? '';
  const effectiveRoot = resolveScopedRootId(nodes, options?.rootFolderId);

  const buildBranch = (parentId: string | null): StorageTreeBranch[] => {
    const children = nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => compareStorageNodes(a, b, sort));

    const branches: StorageTreeBranch[] = [];
    for (const node of children) {
      if (
        node.kind === 'file' &&
        !matchesAllowedExtensions(node, options?.allowedExtensions)
      ) {
        continue;
      }
      const subBranches = node.kind === 'folder' ? buildBranch(node.id) : [];
      const selfMatches =
        !search ||
        node.name.toLowerCase().includes(search) ||
        node.owner.toLowerCase().includes(search);

      if (search && !selfMatches && subBranches.length === 0) {
        continue;
      }

      const stats =
        node.kind === 'folder'
          ? computeFolderStats(nodes, node.id)
          : {
              directChildCount: 0,
              recursiveFileCount: 0,
              recursiveSizeBytes: node.sizeBytes,
            };

      branches.push({
        node,
        children: subBranches,
        directChildCount: stats.directChildCount,
        recursiveFileCount: stats.recursiveFileCount,
        recursiveSizeBytes: stats.recursiveSizeBytes,
      });
    }
    return branches;
  };

  return buildBranch(effectiveRoot);
}

export function computeStorageSummary(
  nodes: readonly StorageNode[],
  rootFolderId?: string | null
): StorageSummary {
  const scopedIds = getScopedDescendantIds(nodes, rootFolderId);
  let totalFiles = 0;
  let totalFolders = 0;
  let totalBytes = 0;

  for (const node of nodes) {
    if (scopedIds && !scopedIds.has(node.id)) continue;
    if (node.kind === 'folder') {
      totalFolders += 1;
    } else {
      totalFiles += 1;
      totalBytes += node.sizeBytes;
    }
  }

  return { totalFiles, totalFolders, totalBytes };
}

export function getAllFolders(
  nodes: readonly StorageNode[],
  rootFolderId?: string | null
): StorageNode[] {
  const scopedIds = getScopedDescendantIds(nodes, rootFolderId);
  return nodes
    .filter((n) => {
      if (n.kind !== 'folder') return false;
      if (scopedIds && !scopedIds.has(n.id)) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
