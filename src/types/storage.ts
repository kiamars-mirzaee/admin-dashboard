import type { SortDirection } from './admin';

export type StorageNodeKind = 'folder' | 'file';

export type StorageViewMode = 'open-folder' | 'tree';

export type StorageSortField = 'name' | 'sizeBytes' | 'updatedAt';

export type StorageKindFilter = 'all' | 'folder' | 'file';

export interface StorageSortConfig {
  field: StorageSortField;
  direction: SortDirection;
}

export interface StorageNode {
  id: string;
  parentId: string | null;
  kind: StorageNodeKind;
  name: string;
  extension?: string;
  mimeType?: string;
  sizeBytes: number;
  content?: string;
  dataUrl?: string;
  updatedAt: string; // ISO string or YYYY-MM-DD HH:mm
  owner: string;
}

export interface StorageSummary {
  totalFiles: number;
  totalFolders: number;
  totalBytes: number;
}

export interface StorageTreeBranch {
  node: StorageNode;
  children: StorageTreeBranch[];
  directChildCount: number;
  recursiveFileCount: number;
  recursiveSizeBytes: number;
}

export interface StorageMutationResult {
  ok: boolean;
  nodes: StorageNode[];
  createdNodes?: StorageNode[];
  updatedNode?: StorageNode;
  removedCount?: number;
  error?: string;
}
