import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  FilePlus2,
  FileUp,
  FolderPlus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import type { StorageNode } from '../../types/storage';
import {
  collectDescendantIds,
  getAllFolders,
  MAX_STORAGE_UPLOAD_BYTES,
  type UploadFileInput,
} from '../../utils/fileStorage';
import { formatBytesValue } from '../../utils/numberFormat';
import { useI18n } from '../../i18n/I18nContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

async function readBrowserFileToUploadInput(file: File): Promise<UploadFileInput> {
  const mime = file.type || '';
  const lowerName = file.name.toLowerCase();
  const isText =
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    /\.(md|txt|json|csv|ts|tsx|js|html|css|yml|yaml|xml|log)$/i.test(lowerName);

  if (isText && file.size <= 2 * 1024 * 1024) {
    const content = await file.text();
    return {
      name: file.name,
      sizeBytes: file.size,
      mimeType: mime || undefined,
      content,
    };
  }

  const isPreviewImage =
    mime.startsWith('image/') && file.size <= 4 * 1024 * 1024;
  if (isPreviewImage) {
    const dataUrl = await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === 'string' ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
    return {
      name: file.name,
      sizeBytes: file.size,
      mimeType: mime || undefined,
      dataUrl,
    };
  }

  return {
    name: file.name,
    sizeBytes: file.size,
    mimeType: mime || undefined,
  };
}

interface FolderSelectProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (nextParentId: string | null) => void;
  nodes: StorageNode[];
  rootFolderId?: string | null;
  rootLabel?: string;
}

function TargetFolderSelect({
  id,
  label,
  value,
  onChange,
  nodes,
  rootFolderId,
  rootLabel,
}: FolderSelectProps) {
  const { t } = useI18n();
  const folders = getAllFolders(nodes, rootFolderId);
  const rootValue = rootFolderId ?? '';
  const resolvedRootName = rootLabel ?? t('storageRootLabel');

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label}
      </label>
      <select
        id={id}
        value={value ?? rootValue}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <option value={rootValue}>/ {resolvedRootName}</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            /{folder.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface CreateFolderModalProps {
  open: boolean;
  initialParentId: string | null;
  rootFolderId?: string | null;
  rootLabel?: string;
  nodes: StorageNode[];
  onClose: () => void;
  onSubmit: (parentId: string | null, name: string) => Promise<string | null>;
}

export function CreateFolderModal({
  open,
  initialParentId,
  rootFolderId,
  rootLabel,
  nodes,
  onClose,
  onSubmit,
}: CreateFolderModalProps) {
  const { t } = useI18n();
  const nameInputId = useId();
  const folderSelectId = useId();
  const [parentId, setParentId] = useState<string | null>(
    initialParentId ?? rootFolderId ?? null
  );
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setParentId(initialParentId ?? rootFolderId ?? null);
      setName('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, initialParentId, rootFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const errMsg = await onSubmit(parentId, name);
    setSubmitting(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('storageCreateFolderTitle')}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('storageCancelBtn')}
          </Button>
          <Button
            type="submit"
            form="create-folder-form"
            variant="primary"
            size="sm"
            loading={submitting}
            leftIcon={<FolderPlus className="w-4 h-4" />}
            data-testid="storage-create-folder-submit"
          >
            {t('storageCreateBtn')}
          </Button>
        </div>
      }
    >
      <form
        id="create-folder-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <TargetFolderSelect
          id={folderSelectId}
          label={t('storageTargetFolderLabel')}
          value={parentId}
          onChange={setParentId}
          nodes={nodes}
          rootFolderId={rootFolderId}
          rootLabel={rootLabel}
        />
        <div>
          <label
            htmlFor={nameInputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {t('storageFolderNameLabel')}
          </label>
          <input
            id={nameInputId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('storageFolderNamePlaceholder')}
            autoFocus
            data-testid="storage-folder-name-input"
            className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

export interface CreateFileModalProps {
  open: boolean;
  initialParentId: string | null;
  rootFolderId?: string | null;
  rootLabel?: string;
  nodes: StorageNode[];
  onClose: () => void;
  onSubmit: (params: {
    parentId: string | null;
    name: string;
    content: string;
  }) => Promise<string | null>;
}

export function CreateFileModal({
  open,
  initialParentId,
  rootFolderId,
  rootLabel,
  nodes,
  onClose,
  onSubmit,
}: CreateFileModalProps) {
  const { t } = useI18n();
  const nameInputId = useId();
  const contentInputId = useId();
  const folderSelectId = useId();
  const [parentId, setParentId] = useState<string | null>(
    initialParentId ?? rootFolderId ?? null
  );
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setParentId(initialParentId ?? rootFolderId ?? null);
      setName('');
      setContent('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, initialParentId, rootFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const errMsg = await onSubmit({ parentId, name, content });
    setSubmitting(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('storageCreateFileTitle')}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('storageCancelBtn')}
          </Button>
          <Button
            type="submit"
            form="create-file-form"
            variant="primary"
            size="sm"
            loading={submitting}
            leftIcon={<FilePlus2 className="w-4 h-4" />}
            data-testid="storage-create-file-submit"
          >
            {t('storageCreateBtn')}
          </Button>
        </div>
      }
    >
      <form id="create-file-form" onSubmit={handleSubmit} className="space-y-4">
        <TargetFolderSelect
          id={folderSelectId}
          label={t('storageTargetFolderLabel')}
          value={parentId}
          onChange={setParentId}
          nodes={nodes}
          rootFolderId={rootFolderId}
          rootLabel={rootLabel}
        />
        <div>
          <label
            htmlFor={nameInputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {t('storageFileNameLabel')}
          </label>
          <input
            id={nameInputId}
            type="text"
            dir="ltr"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('storageFileNamePlaceholder')}
            autoFocus
            data-testid="storage-file-name-input"
            className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={contentInputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {t('storageFileContentLabel')}
          </label>
          <textarea
            id={contentInputId}
            rows={7}
            dir="ltr"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('storageFileContentPlaceholder')}
            data-testid="storage-file-content-input"
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </form>
    </Modal>
  );
}

export interface UploadFilesModalProps {
  open: boolean;
  initialParentId: string | null;
  rootFolderId?: string | null;
  rootLabel?: string;
  nodes: StorageNode[];
  onClose: () => void;
  onUpload: (
    parentId: string | null,
    files: UploadFileInput[]
  ) => Promise<string | null>;
}

export function UploadFilesModal({
  open,
  initialParentId,
  rootFolderId,
  rootLabel,
  nodes,
  onClose,
  onUpload,
}: UploadFilesModalProps) {
  const { t } = useI18n();
  const folderSelectId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parentId, setParentId] = useState<string | null>(
    initialParentId ?? rootFolderId ?? null
  );
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setParentId(initialParentId ?? rootFolderId ?? null);
      setStagedFiles([]);
      setDragging(false);
      setError(null);
      setUploading(false);
    }
  }, [open, initialParentId, rootFolderId]);

  const appendFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const oversized = incoming.find((f) => f.size > MAX_STORAGE_UPLOAD_BYTES);
    if (oversized) {
      setError(`${oversized.name} exceeds 10 MB limit.`);
      return;
    }
    setError(null);
    setStagedFiles((prev) => [...prev, ...incoming]);
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const prepared = await Promise.all(
        stagedFiles.map(readBrowserFileToUploadInput)
      );
      const errMsg = await onUpload(parentId, prepared);
      if (errMsg) {
        setError(errMsg);
        setUploading(false);
        return;
      }
      onClose();
    } catch {
      setError('Failed to read selected files.');
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('storageUploadTitle')}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('storageCancelBtn')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={uploading}
            disabled={stagedFiles.length === 0}
            leftIcon={<FileUp className="w-4 h-4" />}
            onClick={() => void handleUploadSubmit()}
            data-testid="storage-upload-submit-btn"
          >
            {uploading ? t('storageUploading') : t('storageUploadConfirmBtn')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TargetFolderSelect
          id={folderSelectId}
          label={t('storageTargetFolderLabel')}
          value={parentId}
          onChange={setParentId}
          nodes={nodes}
          rootFolderId={rootFolderId}
          rootLabel={rootLabel}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            appendFiles(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60'
          }`}
        >
          <UploadCloud
            className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {t('storageUploadDropTitle')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {t('storageUploadDropHint')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            data-testid="storage-upload-file-input"
            onChange={(e) => {
              appendFiles(e.target.files);
              e.target.value = '';
            }}
            className="sr-only"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('storageSelectFilesBtn')}
          </Button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        {stagedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t('storagePendingUploads', { count: stagedFiles.length })}
            </p>
            <ul className="max-h-44 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {stagedFiles.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      dir="ltr"
                      className="font-mono font-medium text-slate-800 dark:text-slate-100 truncate text-start"
                    >
                      {file.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {formatBytesValue(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setStagedFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

export interface RenameNodeModalProps {
  node: StorageNode | null;
  onClose: () => void;
  onSubmit: (id: string, newName: string) => Promise<string | null>;
}

export function RenameNodeModal({
  node,
  onClose,
  onSubmit,
}: RenameNodeModalProps) {
  const { t } = useI18n();
  const inputId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (node) {
      setName(node.name);
      setError(null);
      setSaving(false);
    }
  }, [node]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!node) return;
    setSaving(true);
    const errMsg = await onSubmit(node.id, name);
    setSaving(false);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={Boolean(node)}
      onClose={onClose}
      title={t('storageRenameTitle')}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('storageCancelBtn')}
          </Button>
          <Button
            type="submit"
            form="rename-storage-node-form"
            variant="primary"
            size="sm"
            loading={saving}
          >
            {t('storageSaveContentBtn')}
          </Button>
        </div>
      }
    >
      <form
        id="rename-storage-node-form"
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {t('storageRenameLabel')}
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          autoFocus
          className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </form>
    </Modal>
  );
}

export interface DeleteNodeConfirmModalProps {
  node: StorageNode | null;
  allNodes: StorageNode[];
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteNodeConfirmModal({
  node,
  allNodes,
  onClose,
  onConfirm,
}: DeleteNodeConfirmModalProps) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  const nestedCount = node
    ? Math.max(0, collectDescendantIds(allNodes, node.id).size - 1)
    : 0;

  return (
    <Modal
      open={Boolean(node)}
      onClose={onClose}
      title={
        node ? t('storageDeleteConfirmTitle', { name: node.name }) : ''
      }
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('storageCancelBtn')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={async () => {
              if (!node) return;
              setDeleting(true);
              await onConfirm(node.id);
              setDeleting(false);
              onClose();
            }}
            data-testid="storage-delete-confirm-btn"
          >
            {t('delete')}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {node?.kind === 'folder'
            ? t('storageDeleteFolderWarning', { count: nestedCount })
            : t('storageDeleteFileWarning')}
        </p>
      </div>
    </Modal>
  );
}
