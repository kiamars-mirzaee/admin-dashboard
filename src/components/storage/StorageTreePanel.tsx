import {
  ChevronRight,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
} from 'lucide-react';
import type { StorageNode, StorageTreeBranch } from '../../types/storage';
import { formatBytesValue } from '../../utils/numberFormat';
import { useI18n } from '../../i18n/I18nContext';

export function getFileGlyph(node: StorageNode) {
  const ext = node.extension?.toLowerCase();
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg' || ext === 'webp') {
    return FileImage;
  }
  if (ext === 'csv' || ext === 'xlsx') {
    return FileSpreadsheet;
  }
  if (ext === 'json' || ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'html') {
    return FileCode2;
  }
  return FileText;
}

export interface StorageTreePanelProps {
  branches: StorageTreeBranch[];
  expandedIds: Set<string>;
  selectedNodeId: string | null;
  pickedFileIds?: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onSelectNode: (node: StorageNode) => void;
  onDoubleClickFile?: (node: StorageNode) => void;
  onOpenFolderDirect: (folderId: string) => void;
  onCreateFolderIn: (parentId: string | null) => void;
  onCreateFileIn: (parentId: string | null) => void;
  onUploadIn: (parentId: string | null) => void;
}

export function StorageTreePanel({
  branches,
  expandedIds,
  selectedNodeId,
  pickedFileIds,
  onToggleExpand,
  onSelectNode,
  onDoubleClickFile,
  onOpenFolderDirect,
  onCreateFolderIn,
  onCreateFileIn,
  onUploadIn,
}: StorageTreePanelProps) {
  const { t } = useI18n();

  const renderBranch = (branch: StorageTreeBranch, depth: number) => {
    const { node, children, recursiveFileCount, recursiveSizeBytes } = branch;
    const isFolder = node.kind === 'folder';
    const isExpanded = isFolder && expandedIds.has(node.id);
    const isPicked = !isFolder && Boolean(pickedFileIds?.has(node.id));
    const isSelected = selectedNodeId === node.id || isPicked;
    const FileIcon = getFileGlyph(node);

    return (
      <li key={node.id} className="select-none">
        <div
          className={`group flex items-center justify-between gap-2 min-h-[42px] md:min-h-[38px] px-2.5 py-1 rounded-xl transition-colors ${
            isSelected
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              <button
                type="button"
                onClick={() => onToggleExpand(node.id)}
                aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
                aria-expanded={isExpanded}
                data-testid={`tree-toggle-${node.id}`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'hover:bg-white/15 text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isExpanded ? 'rotate-90' : 'rtl:rotate-180'
                  }`}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <span className="w-7 h-7 shrink-0" aria-hidden="true" />
            )}

            <button
              type="button"
              onClick={() => {
                onSelectNode(node);
                if (isFolder && !isExpanded) {
                  onToggleExpand(node.id);
                }
              }}
              onDoubleClick={() => {
                if (isFolder) onOpenFolderDirect(node.id);
                else onDoubleClickFile?.(node);
              }}
              data-testid={`tree-node-${node.id}`}
              className="flex items-center gap-2 min-w-0 flex-1 text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg py-1"
            >
              {isFolder ? (
                isExpanded ? (
                  <FolderOpen
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}
                    aria-hidden="true"
                  />
                ) : (
                  <Folder
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}
                    aria-hidden="true"
                  />
                )
              ) : (
                <FileIcon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-white/90' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-medium truncate">{node.name}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`hidden sm:inline text-xs font-mono tabular-nums whitespace-nowrap ${
                isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isFolder
                ? `${recursiveFileCount} · ${formatBytesValue(recursiveSizeBytes)}`
                : formatBytesValue(node.sizeBytes)}
            </span>

            {isFolder && (
              <div
                className={`flex items-center gap-0.5 ${
                  isSelected
                    ? 'opacity-100'
                    : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
                } transition-opacity`}
              >
                <button
                  type="button"
                  title={`${t('storageNewFolder')} (${node.name})`}
                  aria-label={`${t('storageNewFolder')} in ${node.name}`}
                  onClick={() => onCreateFolderIn(node.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/15 text-white'
                      : 'hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title={`${t('storageNewFile')} (${node.name})`}
                  aria-label={`${t('storageNewFile')} in ${node.name}`}
                  onClick={() => onCreateFileIn(node.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/15 text-white'
                      : 'hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title={`${t('storageUploadFile')} (${node.name})`}
                  aria-label={`${t('storageUploadFile')} into ${node.name}`}
                  onClick={() => onUploadIn(node.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/15 text-white'
                      : 'hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isFolder && isExpanded && children.length > 0 && (
          <ul
            className={`mt-1 ms-4 ps-3 border-s border-slate-200 dark:border-slate-800 space-y-1`}
            data-depth={depth + 1}
          >
            {children.map((child) => renderBranch(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul className="space-y-1" data-testid="storage-tree-list">
      {branches.map((branch) => renderBranch(branch, 0))}
    </ul>
  );
}
