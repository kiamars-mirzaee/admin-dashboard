import { useEffect, useState } from 'react';
import {
  Download,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import type { StorageNode } from '../../types/storage';
import {
  computeFolderStats,
  getFolderBreadcrumbPath,
} from '../../utils/fileStorage';
import { formatBytesValue } from '../../utils/numberFormat';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/Button';
import { getFileGlyph } from './StorageTreePanel';

export interface StorageInspectorPanelProps {
  node: StorageNode;
  allNodes: StorageNode[];
  onSaveFileContent: (id: string, content: string) => Promise<void>;
  onOpenFolder: (folderId: string) => void;
  onCreateFolderIn: (parentId: string) => void;
  onCreateFileIn: (parentId: string) => void;
  onUploadIn: (parentId: string) => void;
  onRequestRename: (node: StorageNode) => void;
  onRequestDelete: (node: StorageNode) => void;
}

export function StorageInspectorPanel({
  node,
  allNodes,
  onSaveFileContent,
  onOpenFolder,
  onCreateFolderIn,
  onCreateFileIn,
  onUploadIn,
  onRequestRename,
  onRequestDelete,
}: StorageInspectorPanelProps) {
  const { t } = useI18n();
  const [draftContent, setDraftContent] = useState(node.content ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftContent(node.content ?? '');
    setSaving(false);
  }, [node.id, node.content]);

  const isFolder = node.kind === 'folder';
  const FileIcon = getFileGlyph(node);
  const ancestors = getFolderBreadcrumbPath(allNodes, node.parentId);
  const pathText =
    ancestors.length > 0
      ? `/${ancestors.map((a) => a.name).join('/')}`
      : `/${t('storageRootLabel')}`;
  const folderStats = isFolder
    ? computeFolderStats(allNodes, node.id)
    : null;
  const formattedUpdated = node.updatedAt.slice(0, 16).replace('T', ' ');
  const isDirty = !isFolder && draftContent !== (node.content ?? '');
  const isImage =
    !isFolder && Boolean(node.dataUrl && node.mimeType?.startsWith('image/'));

  const handleDownload = () => {
    if (isFolder) return;
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

  return (
    <div className="space-y-5" data-testid="storage-inspector">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isFolder
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {isFolder ? (
              <Folder className="w-5 h-5" aria-hidden="true" />
            ) : (
              <FileIcon className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {node.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {pathText}
              {!isFolder && node.mimeType ? ` · ${node.mimeType}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata Strip (unboxed tabular clarity) */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">
            {t('storageColOwner')}
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100 truncate">
            {node.owner}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">
            {t('storageColSize')}
          </dt>
          <dd className="mt-0.5 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {isFolder && folderStats
              ? `${formatBytesValue(folderStats.recursiveSizeBytes)} (${folderStats.recursiveFileCount})`
              : formatBytesValue(node.sizeBytes)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500 dark:text-slate-400">
            {t('storageColModified')}
          </dt>
          <dd
            dir="ltr"
            className="mt-0.5 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100 text-start"
          >
            {formattedUpdated}
          </dd>
        </div>
      </dl>

      {/* Body by kind */}
      {isFolder ? (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            leftIcon={<FolderOpen className="w-4 h-4" />}
            onClick={() => onOpenFolder(node.id)}
            data-testid="inspector-open-folder-btn"
          >
            {t('storageOpenInsideBtn')}
          </Button>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
              onClick={() => onCreateFolderIn(node.id)}
            >
              {t('storageNewFolder')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FilePlus2 className="w-3.5 h-3.5" />}
              onClick={() => onCreateFileIn(node.id)}
            >
              {t('storageNewFile')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => onUploadIn(node.id)}
            >
              {t('storageUploadFile')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          {isImage && node.dataUrl ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center justify-center">
              <img
                src={node.dataUrl}
                alt={node.name}
                referrerPolicy="no-referrer"
                className="max-h-60 rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`inspector-editor-${node.id}`}
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {t('storageInspectorContentLabel')}
                </label>
                {isDirty && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={saving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    onClick={async () => {
                      setSaving(true);
                      await onSaveFileContent(node.id, draftContent);
                      setSaving(false);
                    }}
                    data-testid="inspector-save-content-btn"
                  >
                    {t('storageSaveContentBtn')}
                  </Button>
                )}
              </div>
              <textarea
                id={`inspector-editor-${node.id}`}
                rows={9}
                dir="ltr"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                data-testid="inspector-file-content-editor"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownload}
              data-testid="inspector-download-btn"
            >
              {t('storageDownloadBtn')}
            </Button>
            {isDirty && (
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={async () => {
                  setSaving(true);
                  await onSaveFileContent(node.id, draftContent);
                  setSaving(false);
                }}
              >
                {t('storageSaveContentBtn')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Footer Mutations */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil className="w-3.5 h-3.5" />}
          onClick={() => onRequestRename(node)}
          data-testid="inspector-rename-btn"
        >
          {t('storageRenameBtn')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => onRequestDelete(node)}
          data-testid="inspector-delete-btn"
        >
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}
