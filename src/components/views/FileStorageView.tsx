import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronRight,
  Download,
  Eye,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  HardDrive,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  StorageKindFilter,
  StorageNode,
  StorageSortField,
  StorageViewMode,
} from '../../types/storage';
import {
  buildStorageTree,
  computeFolderStats,
  computeStorageSummary,
  createFileNode,
  createFolderNode,
  deleteStorageNode,
  getAllFolders,
  getChildrenForFolder,
  getFolderBreadcrumbPath,
  INITIAL_STORAGE_NODES,
  isFolderWithinRoot,
  matchesAllowedExtensions,
  renameStorageNode,
  resolveScopedRootId,
  type UploadFileInput,
  updateFileContentNode,
  uploadFilesIntoFolder,
} from '../../utils/fileStorage';
import { formatBytesValue } from '../../utils/numberFormat';
import { useI18n } from '../../i18n/I18nContext';
import { AdaptiveDrawer } from '../ui/AdaptiveDrawer';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';
import { useNotifications } from '../ui/NotificationSystem';
import {
  CreateFileModal,
  CreateFolderModal,
  DeleteNodeConfirmModal,
  RenameNodeModal,
  UploadFilesModal,
} from '../storage/StorageModals';
import { getFileGlyph, StorageTreePanel } from '../storage/StorageTreePanel';
import { StorageInspectorPanel } from '../storage/StorageInspectorPanel';

export interface FileStorageExplorerProps {
  variant?: 'page' | 'modal';
  rootFolderId?: string | null;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedFileIds?: string[];
  onSelectionChange?: (files: StorageNode[]) => void;
  onConfirmFile?: (file: StorageNode) => void;
  allowedExtensions?: string[];
  initialViewMode?: StorageViewMode;
  onSubModalChange?: (open: boolean) => void;
}

export function FileStorageExplorer({
  variant = 'page',
  rootFolderId = null,
  selectionMode = 'none',
  selectedFileIds = [],
  onSelectionChange,
  onConfirmFile,
  allowedExtensions,
  initialViewMode = 'open-folder',
  onSubModalChange,
}: FileStorageExplorerProps) {
  const { t } = useI18n();
  const { addToast } = useNotifications();

  const [nodes, setNodes] = useState<StorageNode[]>(INITIAL_STORAGE_NODES);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<StorageViewMode>(initialViewMode);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    rootFolderId ?? null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(['fld-compliance', 'fld-audits-q4', 'fld-settlements', 'fld-regional-ledgers', 'fld-contracts'])
  );

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<StorageKindFilter>('all');
  const [sortField, setSortField] = useState<StorageSortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Action Modals
  const [createFolderTarget, setCreateFolderTarget] = useState<{
    open: boolean;
    parentId: string | null;
  }>({ open: false, parentId: null });
  const [createFileTarget, setCreateFileTarget] = useState<{
    open: boolean;
    parentId: string | null;
  }>({ open: false, parentId: null });
  const [uploadTarget, setUploadTarget] = useState<{
    open: boolean;
    parentId: string | null;
  }>({ open: false, parentId: null });
  const [renamingNode, setRenamingNode] = useState<StorageNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<StorageNode | null>(null);
  const [draggingOverFolder, setDraggingOverFolder] = useState(false);

  const isPicker = selectionMode !== 'none';
  const pickedFileIdSet = useMemo(
    () => new Set(selectedFileIds),
    [selectedFileIds]
  );

  const loadStorage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/storage');
      if (res.ok) {
        const data = (await res.json()) as { nodes?: StorageNode[] };
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
        }
      }
    } catch {
      // Keep local seed dataset if server unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStorage();
  }, [loadStorage]);

  const effectiveRootId = useMemo(
    () => resolveScopedRootId(nodes, rootFolderId),
    [nodes, rootFolderId]
  );

  const rootNode = useMemo(
    () =>
      effectiveRootId
        ? nodes.find((n) => n.id === effectiveRootId && n.kind === 'folder') ??
          null
        : null,
    [nodes, effectiveRootId]
  );

  const rootLabel = rootNode?.name ?? t('storageRootLabel');

  const effectiveCurrentFolderId = useMemo(() => {
    if (!effectiveRootId) return currentFolderId;
    return isFolderWithinRoot(nodes, currentFolderId, effectiveRootId)
      ? currentFolderId
      : effectiveRootId;
  }, [nodes, currentFolderId, effectiveRootId]);

  useEffect(() => {
    setCurrentFolderId(effectiveRootId);
    setSelectedNodeId(null);
    setDrawerNodeId(null);
    setSearch('');
  }, [effectiveRootId]);

  const hasOpenSubModal = Boolean(
    createFolderTarget.open ||
      createFileTarget.open ||
      uploadTarget.open ||
      renamingNode ||
      deletingNode ||
      drawerNodeId
  );

  useEffect(() => {
    onSubModalChange?.(hasOpenSubModal);
  }, [hasOpenSubModal, onSubModalChange]);

  const summary = useMemo(
    () => computeStorageSummary(nodes, effectiveRootId),
    [nodes, effectiveRootId]
  );

  const folderBreadcrumb = useMemo(
    () =>
      getFolderBreadcrumbPath(nodes, effectiveCurrentFolderId, effectiveRootId),
    [nodes, effectiveCurrentFolderId, effectiveRootId]
  );

  const visibleItems = useMemo(
    () =>
      getChildrenForFolder(nodes, effectiveCurrentFolderId, {
        search,
        kindFilter,
        sort: { field: sortField, direction: sortDirection },
        rootFolderId: effectiveRootId,
        allowedExtensions,
      }),
    [
      nodes,
      effectiveCurrentFolderId,
      search,
      kindFilter,
      sortField,
      sortDirection,
      effectiveRootId,
      allowedExtensions,
    ]
  );

  const treeBranches = useMemo(
    () =>
      buildStorageTree(nodes, {
        search,
        sort: { field: sortField, direction: sortDirection },
        rootFolderId: effectiveRootId,
        allowedExtensions,
      }),
    [nodes, search, sortField, sortDirection, effectiveRootId, allowedExtensions]
  );

  const selectedTreeNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const drawerNode = useMemo(
    () => nodes.find((n) => n.id === drawerNodeId) ?? null,
    [nodes, drawerNodeId]
  );

  const activeParentForNew = useMemo(() => {
    if (viewMode === 'open-folder') return effectiveCurrentFolderId;
    if (
      selectedTreeNode?.kind === 'folder' &&
      isFolderWithinRoot(nodes, selectedTreeNode.id, effectiveRootId)
    ) {
      return selectedTreeNode.id;
    }
    if (
      selectedTreeNode?.parentId &&
      isFolderWithinRoot(nodes, selectedTreeNode.parentId, effectiveRootId)
    ) {
      return selectedTreeNode.parentId;
    }
    return effectiveRootId;
  }, [viewMode, effectiveCurrentFolderId, selectedTreeNode, nodes, effectiveRootId]);

  const ensureExpanded = (folderId: string | null) => {
    if (!folderId) return;
    setExpandedFolderIds((prev) => {
      if (prev.has(folderId)) return prev;
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  };

  const togglePickFile = useCallback(
    (file: StorageNode) => {
      if (!isPicker || file.kind !== 'file') return;
      if (selectionMode === 'single') {
        onSelectionChange?.([file]);
        return;
      }
      const nextIds = new Set(pickedFileIdSet);
      if (nextIds.has(file.id)) nextIds.delete(file.id);
      else nextIds.add(file.id);
      const nextFiles = nodes.filter(
        (n) => n.kind === 'file' && nextIds.has(n.id)
      );
      onSelectionChange?.(nextFiles);
    },
    [isPicker, selectionMode, onSelectionChange, pickedFileIdSet, nodes]
  );

  const autoPickCreatedFiles = useCallback(
    (created: StorageNode[] | undefined, nextNodes: StorageNode[]) => {
      if (!isPicker || !created || created.length === 0) return;
      const eligible = created.filter(
        (item) =>
          item.kind === 'file' &&
          matchesAllowedExtensions(item, allowedExtensions)
      );
      if (eligible.length === 0) return;
      if (selectionMode === 'single') {
        onSelectionChange?.([eligible[0]]);
        return;
      }
      const nextIds = new Set(pickedFileIdSet);
      eligible.forEach((f) => nextIds.add(f.id));
      onSelectionChange?.(
        nextNodes.filter((n) => n.kind === 'file' && nextIds.has(n.id))
      );
    },
    [isPicker, allowedExtensions, selectionMode, onSelectionChange, pickedFileIdSet]
  );

  const handleCreateFolder = async (
    parentId: string | null,
    name: string
  ): Promise<string | null> => {
    const resolvedParent = isFolderWithinRoot(nodes, parentId, effectiveRootId)
      ? parentId ?? effectiveRootId
      : effectiveRootId;

    try {
      const res = await fetch('/api/storage/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: resolvedParent,
          name,
          owner: 'Elena Rostova',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        nodes?: StorageNode[];
        node?: StorageNode;
        error?: string;
      };
      if (!res.ok) {
        return data.error ?? 'Failed to create folder.';
      }
      if (Array.isArray(data.nodes)) setNodes(data.nodes);
      ensureExpanded(resolvedParent);
      if (data.node) setSelectedNodeId(data.node.id);
      addToast({
        title: t('storageCreatedFolderToast', { name: name.trim() }),
        variant: 'success',
      });
      return null;
    } catch {
      const local = createFolderNode(nodes, { parentId: resolvedParent, name });
      if (!local.ok) return local.error ?? 'Failed to create folder.';
      setNodes(local.nodes);
      ensureExpanded(resolvedParent);
      if (local.createdNodes?.[0]) setSelectedNodeId(local.createdNodes[0].id);
      addToast({
        title: t('storageCreatedFolderToast', { name: name.trim() }),
        variant: 'success',
      });
      return null;
    }
  };

  const handleCreateFile = async (params: {
    parentId: string | null;
    name: string;
    content: string;
  }): Promise<string | null> => {
    const resolvedParent = isFolderWithinRoot(
      nodes,
      params.parentId,
      effectiveRootId
    )
      ? params.parentId ?? effectiveRootId
      : effectiveRootId;

    try {
      const res = await fetch('/api/storage/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: resolvedParent,
          name: params.name,
          content: params.content,
          owner: 'Elena Rostova',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        nodes?: StorageNode[];
        node?: StorageNode;
        error?: string;
      };
      if (!res.ok) {
        return data.error ?? 'Failed to create file.';
      }
      const nextNodes = Array.isArray(data.nodes) ? data.nodes : nodes;
      if (Array.isArray(data.nodes)) setNodes(data.nodes);
      ensureExpanded(resolvedParent);
      if (data.node) {
        setSelectedNodeId(data.node.id);
        autoPickCreatedFiles([data.node], nextNodes);
      }
      addToast({
        title: t('storageCreatedFileToast', { name: params.name.trim() }),
        variant: 'success',
      });
      return null;
    } catch {
      const local = createFileNode(nodes, {
        ...params,
        parentId: resolvedParent,
      });
      if (!local.ok) return local.error ?? 'Failed to create file.';
      setNodes(local.nodes);
      ensureExpanded(resolvedParent);
      if (local.createdNodes?.[0]) {
        setSelectedNodeId(local.createdNodes[0].id);
        autoPickCreatedFiles(local.createdNodes, local.nodes);
      }
      addToast({
        title: t('storageCreatedFileToast', { name: params.name.trim() }),
        variant: 'success',
      });
      return null;
    }
  };

  const handleUploadFiles = async (
    parentId: string | null,
    files: UploadFileInput[]
  ): Promise<string | null> => {
    const resolvedParent = isFolderWithinRoot(nodes, parentId, effectiveRootId)
      ? parentId ?? effectiveRootId
      : effectiveRootId;

    const folderLabel =
      nodes.find((n) => n.id === resolvedParent)?.name ?? rootLabel;

    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: resolvedParent,
          files,
          owner: 'Elena Rostova',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        nodes?: StorageNode[];
        createdNodes?: StorageNode[];
        error?: string;
      };
      if (!res.ok) {
        return data.error ?? 'Upload failed.';
      }
      const nextNodes = Array.isArray(data.nodes) ? data.nodes : nodes;
      if (Array.isArray(data.nodes)) setNodes(data.nodes);
      ensureExpanded(resolvedParent);
      if (data.createdNodes?.[0]) {
        setSelectedNodeId(data.createdNodes[0].id);
        autoPickCreatedFiles(data.createdNodes, nextNodes);
      }
      addToast({
        title: t('storageUploadedToast', {
          count: files.length,
          folder: folderLabel,
        }),
        variant: 'success',
      });
      return null;
    } catch {
      const local = uploadFilesIntoFolder(nodes, {
        parentId: resolvedParent,
        files,
      });
      if (!local.ok) return local.error ?? 'Upload failed.';
      setNodes(local.nodes);
      ensureExpanded(resolvedParent);
      if (local.createdNodes?.[0]) {
        setSelectedNodeId(local.createdNodes[0].id);
        autoPickCreatedFiles(local.createdNodes, local.nodes);
      }
      addToast({
        title: t('storageUploadedToast', {
          count: files.length,
          folder: folderLabel,
        }),
        variant: 'success',
      });
      return null;
    }
  };

  const handleRenameNode = async (
    id: string,
    newName: string
  ): Promise<string | null> => {
    try {
      const res = await fetch(`/api/storage/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = (await res.json()) as {
        nodes?: StorageNode[];
        error?: string;
      };
      if (!res.ok) return data.error ?? 'Rename failed.';
      if (Array.isArray(data.nodes)) setNodes(data.nodes);
      addToast({
        title: t('storageRenamedToast', { name: newName.trim() }),
        variant: 'success',
      });
      return null;
    } catch {
      const local = renameStorageNode(nodes, id, newName);
      if (!local.ok) return local.error ?? 'Rename failed.';
      setNodes(local.nodes);
      addToast({
        title: t('storageRenamedToast', { name: newName.trim() }),
        variant: 'success',
      });
      return null;
    }
  };

  const handleSaveFileContent = async (id: string, content: string) => {
    const fileName = nodes.find((n) => n.id === id)?.name ?? 'file';
    try {
      const res = await fetch(`/api/storage/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = (await res.json()) as { nodes?: StorageNode[] };
        if (Array.isArray(data.nodes)) setNodes(data.nodes);
      } else {
        const local = updateFileContentNode(nodes, id, content);
        if (local.ok) setNodes(local.nodes);
      }
    } catch {
      const local = updateFileContentNode(nodes, id, content);
      if (local.ok) setNodes(local.nodes);
    }
    addToast({
      title: t('storageSavedToast', { name: fileName }),
      variant: 'success',
    });
  };

  const handleDeleteNode = async (id: string) => {
    const targetName = nodes.find((n) => n.id === id)?.name ?? '';
    let nextNodes = nodes;
    try {
      const res = await fetch(`/api/storage/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = (await res.json()) as { nodes?: StorageNode[] };
        if (Array.isArray(data.nodes)) {
          nextNodes = data.nodes;
          setNodes(data.nodes);
        }
      } else {
        const local = deleteStorageNode(nodes, id);
        if (local.ok) {
          nextNodes = local.nodes;
          setNodes(local.nodes);
        }
      }
    } catch {
      const local = deleteStorageNode(nodes, id);
      if (local.ok) {
        nextNodes = local.nodes;
        setNodes(local.nodes);
      }
    }

    if (selectedNodeId === id) setSelectedNodeId(null);
    if (drawerNodeId === id) setDrawerNodeId(null);
    if (effectiveCurrentFolderId === id) setCurrentFolderId(effectiveRootId);
    if (isPicker && pickedFileIdSet.has(id)) {
      const surviving = nextNodes.filter(
        (n) => n.kind === 'file' && pickedFileIdSet.has(n.id) && n.id !== id
      );
      onSelectionChange?.(surviving);
    }
    addToast({
      title: t('storageDeletedToast', { name: targetName }),
      variant: 'warning',
    });
  };

  const handleDropIntoOpenFolder = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOverFolder(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    const prepared: UploadFileInput[] = await Promise.all(
      dropped.map(async (f) => ({
        name: f.name,
        sizeBytes: f.size,
        mimeType: f.type || undefined,
        content:
          f.type.startsWith('text/') || /\.(md|txt|json|csv)$/i.test(f.name)
            ? await f.text()
            : undefined,
      }))
    );
    await handleUploadFiles(effectiveCurrentFolderId, prepared);
  };

  const handleDownloadQuick = (node: StorageNode) => {
    const anchor = document.createElement('a');
    if (node.dataUrl) {
      anchor.href = node.dataUrl;
    } else {
      const blob = new Blob([node.content ?? ''], {
        type: node.mimeType || 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      anchor.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    anchor.download = node.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const toggleTreeFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const expandAllFolders = () => {
    setExpandedFolderIds(
      new Set(getAllFolders(nodes, effectiveRootId).map((f) => f.id))
    );
  };

  const collapseAllFolders = () => {
    setExpandedFolderIds(new Set());
  };

  const openFolderInExplorer = (folderId: string | null) => {
    const nextFolder = isFolderWithinRoot(nodes, folderId, effectiveRootId)
      ? folderId ?? effectiveRootId
      : effectiveRootId;
    setCurrentFolderId(nextFolder);
    setViewMode('open-folder');
    if (search) setSearch('');
  };

  const parentFolderId =
    folderBreadcrumb.length > 1
      ? folderBreadcrumb[folderBreadcrumb.length - 2].id
      : effectiveRootId;

  return (
    <div
      className={variant === 'modal' ? 'space-y-3' : 'space-y-6'}
      data-testid={
        variant === 'modal' ? 'file-storage-modal-explorer' : 'file-storage-view'
      }
    >
      {/* Header & View Switcher + Primary Actions */}
      {variant === 'modal' ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span
              data-testid="storage-picker-root-badge"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white"
            >
              {rootNode ? (
                <Folder
                  className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              ) : (
                <HardDrive
                  className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              )}
              <span>{t('storagePickerRootLabel', { name: rootLabel })}</span>
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {t('storageSubtitle', {
                folders: summary.totalFolders,
                files: summary.totalFiles,
                size: formatBytesValue(summary.totalBytes),
              })}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Open Folder vs Tree View Switcher */}
            <div
              role="tablist"
              aria-label="Storage view mode"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'open-folder'}
                onClick={() => setViewMode('open-folder')}
                data-testid="storage-view-open"
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'open-folder'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('storageModeOpenFolder')}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'tree'}
                onClick={() => setViewMode('tree')}
                data-testid="storage-view-tree"
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'tree'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('storageModeTree')}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FolderPlus className="w-4 h-4" />}
                onClick={() =>
                  setCreateFolderTarget({ open: true, parentId: activeParentForNew })
                }
                data-testid="storage-new-folder-btn"
              >
                {t('storageNewFolder')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FilePlus2 className="w-4 h-4" />}
                onClick={() =>
                  setCreateFileTarget({ open: true, parentId: activeParentForNew })
                }
                data-testid="storage-new-file-btn"
              >
                {t('storageNewFile')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() =>
                  setUploadTarget({ open: true, parentId: activeParentForNew })
                }
                data-testid="storage-upload-btn"
              >
                {t('storageUploadFile')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('storageTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {t('storageSubtitle', {
                folders: summary.totalFolders,
                files: summary.totalFiles,
                size: formatBytesValue(summary.totalBytes),
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Open Folder vs Tree View Switcher */}
            <div
              role="tablist"
              aria-label="Storage view mode"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'open-folder'}
                onClick={() => setViewMode('open-folder')}
                data-testid="storage-view-open"
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'open-folder'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('storageModeOpenFolder')}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'tree'}
                onClick={() => setViewMode('tree')}
                data-testid="storage-view-tree"
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewMode === 'tree'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('storageModeTree')}</span>
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderPlus className="w-4 h-4" />}
              onClick={() =>
                setCreateFolderTarget({ open: true, parentId: activeParentForNew })
              }
              data-testid="storage-new-folder-btn"
            >
              {t('storageNewFolder')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FilePlus2 className="w-4 h-4" />}
              onClick={() =>
                setCreateFileTarget({ open: true, parentId: activeParentForNew })
              }
              data-testid="storage-new-file-btn"
            >
              {t('storageNewFile')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() =>
                setUploadTarget({ open: true, parentId: activeParentForNew })
              }
              data-testid="storage-upload-btn"
            >
              {t('storageUploadFile')}
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Filter / Search / Sort Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('storageSearchPlaceholder')}
              aria-label={t('storageSearchPlaceholder')}
              data-testid="storage-search-input"
              className="w-full min-h-[40px] ps-10 pe-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'open-folder' ? (
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(
                  [
                    ['all', t('storageFilterAll')],
                    ['folder', t('storageFilterFolders')],
                    ['file', t('storageFilterFiles')],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKindFilter(value)}
                    className={`min-h-[32px] px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      kindFilter === value
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={expandAllFolders}
                  data-testid="storage-expand-all-btn"
                >
                  {t('storageExpandAll')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={collapseAllFolders}
                  data-testid="storage-collapse-all-btn"
                >
                  {t('storageCollapseAll')}
                </Button>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5">
              <label htmlFor={`storage-sort-select-${variant}`} className="sr-only">
                Sort items
              </label>
              <select
                id={`storage-sort-select-${variant}`}
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as StorageSortField)
                }
                className="min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="name">{t('storageSortName')}</option>
                <option value="sizeBytes">{t('storageSortSize')}</option>
                <option value="updatedAt">{t('storageSortDate')}</option>
              </select>
              <button
                type="button"
                aria-label="Toggle sort direction"
                onClick={() =>
                  setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
                }
                className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={variant === 'modal' ? 4 : 6} />
          </div>
        ) : viewMode === 'open-folder' ? (
          /* OPEN FOLDER EXPLORER MODE */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingOverFolder(true);
            }}
            onDragLeave={() => setDraggingOverFolder(false)}
            onDrop={(e) => void handleDropIntoOpenFolder(e)}
            className={`transition-colors ${
              draggingOverFolder ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
            }`}
          >
            {/* Interactive Folder Path Breadcrumb */}
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <nav
                aria-label="Folder path"
                className="flex items-center flex-wrap gap-1 text-xs"
                data-testid="storage-folder-breadcrumb"
              >
                <button
                  type="button"
                  onClick={() => openFolderInExplorer(effectiveRootId)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    effectiveCurrentFolderId === effectiveRootId
                      ? 'font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {rootNode ? (
                    <Folder className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{rootLabel}</span>
                </button>

                {folderBreadcrumb.map((folder, index) => {
                  const isLast = index === folderBreadcrumb.length - 1;
                  return (
                    <React.Fragment key={folder.id}>
                      <ChevronRight
                        className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180 shrink-0"
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        onClick={() => openFolderInExplorer(folder.id)}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-[180px] ${
                          isLast
                            ? 'font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {folder.name}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>

              {effectiveCurrentFolderId !== effectiveRootId && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={
                    <ArrowLeft
                      className="w-3.5 h-3.5 rtl:rotate-180"
                      aria-hidden="true"
                    />
                  }
                  onClick={() => openFolderInExplorer(parentFolderId)}
                  data-testid="storage-up-btn"
                >
                  {t('storageUpOneLevel')}
                </Button>
              )}
            </div>

            {visibleItems.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={
                    search.trim() ? (
                      <Search className="w-6 h-6" aria-hidden="true" />
                    ) : (
                      <FolderOpen className="w-6 h-6" aria-hidden="true" />
                    )
                  }
                  title={
                    search.trim()
                      ? t('storageNoMatchTitle')
                      : t('storageEmptyFolderTitle')
                  }
                  description={
                    search.trim()
                      ? t('storageNoMatchDesc')
                      : t('storageEmptyFolderDesc')
                  }
                  actionLabel={
                    search.trim()
                      ? t('storageClearSearch')
                      : t('storageUploadFile')
                  }
                  onAction={() => {
                    if (search.trim()) setSearch('');
                    else
                      setUploadTarget({
                        open: true,
                        parentId: effectiveCurrentFolderId,
                      });
                  }}
                />
              </div>
            ) : (
              <>
                {/* Desktop Open-Folder Table */}
                <div
                  className={`hidden md:block overflow-x-auto ${
                    variant === 'modal' ? 'max-h-[340px] overflow-y-auto' : ''
                  }`}
                >
                  <table
                    className="w-full text-start border-collapse"
                    data-testid="storage-open-table"
                  >
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 text-start">
                          {t('storageColName')}
                        </th>
                        <th className="py-3 px-4 text-start">
                          {t('storageColOwner')}
                        </th>
                        <th className="py-3 px-4 text-end">
                          {t('storageColSize')}
                        </th>
                        <th className="py-3 px-4 text-start">
                          {t('storageColModified')}
                        </th>
                        <th className="py-3 px-4 text-end">
                          {t('storageColActions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                      {visibleItems.map((item) => {
                        const isFolder = item.kind === 'folder';
                        const isPicked = !isFolder && pickedFileIdSet.has(item.id);
                        const FileIcon = getFileGlyph(item);
                        const stats = isFolder
                          ? computeFolderStats(nodes, item.id)
                          : null;
                        return (
                          <tr
                            key={item.id}
                            data-testid={`storage-row-${item.id}`}
                            data-selected={isPicked ? 'true' : 'false'}
                            className={`transition-colors ${
                              isPicked
                                ? 'bg-blue-50/80 dark:bg-blue-950/35'
                                : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isFolder) {
                                    openFolderInExplorer(item.id);
                                  } else if (isPicker) {
                                    togglePickFile(item);
                                  } else {
                                    setDrawerNodeId(item.id);
                                  }
                                }}
                                onDoubleClick={() => {
                                  if (!isFolder && isPicker) {
                                    onConfirmFile?.(item);
                                  }
                                }}
                                className="flex items-center gap-3 text-start cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
                              >
                                <span
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isPicked
                                      ? 'bg-blue-600 text-white'
                                      : isFolder
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {isPicked ? (
                                    <Check className="w-4 h-4" aria-hidden="true" />
                                  ) : isFolder ? (
                                    <Folder
                                      className="w-4 h-4"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <FileIcon
                                      className="w-4 h-4"
                                      aria-hidden="true"
                                    />
                                  )}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                    {item.name}
                                  </span>
                                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                                    {isFolder && stats
                                      ? `${t('storageFolderTypeLabel')} · ${t(
                                          'storageItemsCount',
                                          { count: stats.directChildCount }
                                        )}`
                                      : (item.extension?.toUpperCase() ?? 'FILE')}
                                  </span>
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                              {item.owner}
                            </td>
                            <td className="py-3 px-4 text-end font-mono tabular-nums text-sm text-slate-700 dark:text-slate-300">
                              {isFolder && stats
                                ? formatBytesValue(stats.recursiveSizeBytes)
                                : formatBytesValue(item.sizeBytes)}
                            </td>
                            <td
                              dir="ltr"
                              className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 text-start"
                            >
                              {item.updatedAt.slice(0, 16).replace('T', ' ')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                {isFolder ? (
                                  <button
                                    type="button"
                                    aria-label={`${t('storageOpenFolderBtn')} ${item.name}`}
                                    onClick={() => openFolderInExplorer(item.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    {t('storageOpenFolderBtn')}
                                  </button>
                                ) : isPicker ? (
                                  <button
                                    type="button"
                                    aria-label={`Inspect ${item.name}`}
                                    onClick={() => setDrawerNodeId(item.id)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Eye
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Inspect ${item.name}`}
                                    onClick={() => setDrawerNodeId(item.id)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    {t('storageOpenFolderBtn')}
                                  </button>
                                )}
                                {!isFolder && (
                                  <button
                                    type="button"
                                    aria-label={`${t('storageDownloadBtn')} ${item.name}`}
                                    onClick={() => handleDownloadQuick(item)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Download
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  aria-label={`${t('storageRenameBtn')} ${item.name}`}
                                  onClick={() => setRenamingNode(item)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Pencil
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`${t('delete')} ${item.name}`}
                                  onClick={() => setDeletingNode(item)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 cursor-pointer"
                                >
                                  <Trash2
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleItems.map((item) => {
                    const isFolder = item.kind === 'folder';
                    const isPicked = !isFolder && pickedFileIdSet.has(item.id);
                    const FileIcon = getFileGlyph(item);
                    const stats = isFolder
                      ? computeFolderStats(nodes, item.id)
                      : null;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center justify-between gap-3 ${
                          isPicked ? 'bg-blue-50/80 dark:bg-blue-950/35' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isFolder) openFolderInExplorer(item.id);
                            else if (isPicker) togglePickFile(item);
                            else setDrawerNodeId(item.id);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 text-start cursor-pointer"
                        >
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isPicked
                                ? 'bg-blue-600 text-white'
                                : isFolder
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {isPicked ? (
                              <Check className="w-5 h-5" aria-hidden="true" />
                            ) : isFolder ? (
                              <Folder className="w-5 h-5" aria-hidden="true" />
                            ) : (
                              <FileIcon
                                className="w-5 h-5"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                              {isFolder && stats
                                ? `${t('storageItemsCount', {
                                    count: stats.directChildCount,
                                  })} · ${formatBytesValue(stats.recursiveSizeBytes)}`
                                : `${formatBytesValue(item.sizeBytes)} · ${item.owner}`}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`${t('delete')} ${item.name}`}
                          onClick={() => setDeletingNode(item)}
                          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          /* TREE VIEW MODE + SIDE INSPECTOR */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-s divide-slate-200 dark:divide-slate-800">
            <div
              className={`lg:col-span-7 p-4 ${
                variant === 'modal' ? 'max-h-[340px] overflow-y-auto' : ''
              }`}
            >
              {treeBranches.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-6 h-6" aria-hidden="true" />}
                  title={t('storageNoMatchTitle')}
                  description={t('storageNoMatchDesc')}
                  actionLabel={t('storageClearSearch')}
                  onAction={() => setSearch('')}
                />
              ) : (
                <StorageTreePanel
                  branches={treeBranches}
                  expandedIds={expandedFolderIds}
                  selectedNodeId={selectedNodeId}
                  pickedFileIds={pickedFileIdSet}
                  onToggleExpand={toggleTreeFolder}
                  onSelectNode={(node) => {
                    setSelectedNodeId(node.id);
                    if (isPicker && node.kind === 'file') {
                      togglePickFile(node);
                    } else if (
                      typeof window !== 'undefined' &&
                      window.innerWidth < 1024 &&
                      node.kind === 'file'
                    ) {
                      setDrawerNodeId(node.id);
                    }
                  }}
                  onDoubleClickFile={(node) => {
                    if (isPicker && node.kind === 'file') {
                      onConfirmFile?.(node);
                    }
                  }}
                  onOpenFolderDirect={openFolderInExplorer}
                  onCreateFolderIn={(parentId) =>
                    setCreateFolderTarget({ open: true, parentId })
                  }
                  onCreateFileIn={(parentId) =>
                    setCreateFileTarget({ open: true, parentId })
                  }
                  onUploadIn={(parentId) =>
                    setUploadTarget({ open: true, parentId })
                  }
                />
              )}
            </div>

            <div
              className={`hidden lg:block lg:col-span-5 p-5 bg-slate-50/40 dark:bg-slate-950/30 ${
                variant === 'modal' ? 'max-h-[340px] overflow-y-auto' : ''
              }`}
            >
              {selectedTreeNode ? (
                <StorageInspectorPanel
                  node={selectedTreeNode}
                  allNodes={nodes}
                  onSaveFileContent={handleSaveFileContent}
                  onOpenFolder={openFolderInExplorer}
                  onCreateFolderIn={(parentId) =>
                    setCreateFolderTarget({ open: true, parentId })
                  }
                  onCreateFileIn={(parentId) =>
                    setCreateFileTarget({ open: true, parentId })
                  }
                  onUploadIn={(parentId) =>
                    setUploadTarget({ open: true, parentId })
                  }
                  onRequestRename={setRenamingNode}
                  onRequestDelete={setDeletingNode}
                />
              ) : (
                <EmptyState
                  icon={<FolderTree className="w-6 h-6" aria-hidden="true" />}
                  title={t('storageInspectorEmptyTitle')}
                  description={t('storageInspectorEmptyDesc')}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* File / Node Inspector Drawer (Open Folder Mode + Mobile Tree) */}
      <AdaptiveDrawer
        open={Boolean(drawerNode)}
        onClose={() => setDrawerNodeId(null)}
        title={drawerNode?.name ?? ''}
        subtitle={drawerNode?.owner ?? ''}
      >
        {drawerNode && (
          <StorageInspectorPanel
            node={drawerNode}
            allNodes={nodes}
            onSaveFileContent={handleSaveFileContent}
            onOpenFolder={(folderId) => {
              setDrawerNodeId(null);
              openFolderInExplorer(folderId);
            }}
            onCreateFolderIn={(parentId) =>
              setCreateFolderTarget({ open: true, parentId })
            }
            onCreateFileIn={(parentId) =>
              setCreateFileTarget({ open: true, parentId })
            }
            onUploadIn={(parentId) =>
              setUploadTarget({ open: true, parentId })
            }
            onRequestRename={setRenamingNode}
            onRequestDelete={setDeletingNode}
          />
        )}
      </AdaptiveDrawer>

      {/* Modals */}
      <CreateFolderModal
        open={createFolderTarget.open}
        initialParentId={createFolderTarget.parentId}
        rootFolderId={effectiveRootId}
        rootLabel={rootLabel}
        nodes={nodes}
        onClose={() =>
          setCreateFolderTarget((prev) => ({ ...prev, open: false }))
        }
        onSubmit={handleCreateFolder}
      />

      <CreateFileModal
        open={createFileTarget.open}
        initialParentId={createFileTarget.parentId}
        rootFolderId={effectiveRootId}
        rootLabel={rootLabel}
        nodes={nodes}
        onClose={() =>
          setCreateFileTarget((prev) => ({ ...prev, open: false }))
        }
        onSubmit={handleCreateFile}
      />

      <UploadFilesModal
        open={uploadTarget.open}
        initialParentId={uploadTarget.parentId}
        rootFolderId={effectiveRootId}
        rootLabel={rootLabel}
        nodes={nodes}
        onClose={() => setUploadTarget((prev) => ({ ...prev, open: false }))}
        onUpload={handleUploadFiles}
      />

      <RenameNodeModal
        node={renamingNode}
        onClose={() => setRenamingNode(null)}
        onSubmit={handleRenameNode}
      />

      <DeleteNodeConfirmModal
        node={deletingNode}
        allNodes={nodes}
        onClose={() => setDeletingNode(null)}
        onConfirm={handleDeleteNode}
      />
    </div>
  );
}

export function FileStorageView() {
  return <FileStorageExplorer variant="page" />;
}

