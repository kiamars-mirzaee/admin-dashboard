import { useEffect, useId, useRef, useState } from 'react';
import { FolderOpen, Paperclip, X } from 'lucide-react';
import type { StorageNode, StorageViewMode } from '../../types/storage';
import { formatBytesValue } from '../../utils/numberFormat';
import { useI18n } from '../../i18n/I18nContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FileStorageExplorer } from '../views/FileStorageView';
import { getFileGlyph } from './StorageTreePanel';

export interface FileStoragePickerModalProps {
  open: boolean;
  onClose: () => void;
  rootFolderId?: string | null;
  title?: string;
  description?: string;
  selectionMode?: 'single' | 'multiple';
  initialSelectedFiles?: StorageNode[];
  allowedExtensions?: string[];
  initialViewMode?: StorageViewMode;
  onConfirm: (files: StorageNode[]) => void;
}

export function FileStoragePickerModal({
  open,
  onClose,
  rootFolderId = null,
  title,
  description,
  selectionMode = 'single',
  initialSelectedFiles = [],
  allowedExtensions,
  initialViewMode = 'open-folder',
  onConfirm,
}: FileStoragePickerModalProps) {
  const { t } = useI18n();
  const [pickedFiles, setPickedFiles] = useState<StorageNode[]>(initialSelectedFiles);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const prevOpenRef = useRef(false);
  const prevRootRef = useRef<string | null>(rootFolderId);

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    const rootChangedWhileOpen = open && prevRootRef.current !== rootFolderId;
    if (justOpened || rootChangedWhileOpen) {
      setPickedFiles(initialSelectedFiles);
      setSubModalOpen(false);
    }
    prevOpenRef.current = open;
    prevRootRef.current = rootFolderId;
  }, [open, rootFolderId, initialSelectedFiles]);

  const handleConfirm = () => {
    if (pickedFiles.length === 0) return;
    onConfirm(pickedFiles);
    onClose();
  };

  const selectedLabel =
    pickedFiles.length === 0
      ? t('storagePickerSelectedNone')
      : pickedFiles.length === 1
        ? `${pickedFiles[0].name} · ${formatBytesValue(pickedFiles[0].sizeBytes)}`
        : t('storageItemsCount', { count: pickedFiles.length });

  const confirmText =
    selectionMode === 'multiple' && pickedFiles.length > 1
      ? t('storagePickerSelectCountBtn', { count: pickedFiles.length })
      : t('storagePickerSelectBtn');

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableEscapeClose={subModalOpen}
      size="xl"
      title={title ?? t('storagePickerTitle')}
      description={description ?? t('storagePickerDesc')}
      footer={
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            data-testid="storage-picker-selection-summary"
            className="flex items-center gap-2 min-w-0 text-xs text-slate-600 dark:text-slate-300"
          >
            <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">{selectedLabel}</span>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
              data-testid="storage-picker-cancel-btn"
            >
              {t('storageCancelBtn')}
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={pickedFiles.length === 0}
              onClick={handleConfirm}
              className="w-full sm:w-auto"
              data-testid="storage-picker-confirm-btn"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      }
    >
      {open && (
        <FileStorageExplorer
          variant="modal"
          rootFolderId={rootFolderId}
          selectionMode={selectionMode}
          selectedFileIds={pickedFiles.map((f) => f.id)}
          onSelectionChange={setPickedFiles}
          onConfirmFile={(file) => {
            if (selectionMode === 'single') {
              onConfirm([file]);
              onClose();
            }
          }}
          allowedExtensions={allowedExtensions}
          initialViewMode={initialViewMode}
          onSubModalChange={setSubModalOpen}
        />
      )}
    </Modal>
  );
}

export interface StorageFormFieldProps {
  id?: string;
  label: string;
  placeholder?: string;
  rootFolderId?: string | null;
  allowedExtensions?: string[];
  value: StorageNode | null;
  onChange: (file: StorageNode | null) => void;
  modalTitle?: string;
  modalDescription?: string;
  initialViewMode?: StorageViewMode;
  testIdPrefix?: string;
  onPickerOpenChange?: (open: boolean) => void;
}

export function StorageFormField({
  id,
  label,
  placeholder,
  rootFolderId = null,
  allowedExtensions,
  value,
  onChange,
  modalTitle,
  modalDescription,
  initialViewMode = 'open-folder',
  testIdPrefix = 'storage-field',
  onPickerOpenChange,
}: StorageFormFieldProps) {
  const { t } = useI18n();
  const autoId = useId();
  const fieldId = id ?? autoId;
  const labelId = `${fieldId}-label`;
  const [pickerOpen, setPickerOpen] = useState(false);

  const setOpenState = (next: boolean) => {
    setPickerOpen(next);
    onPickerOpenChange?.(next);
  };

  const FileIcon = value ? getFileGlyph(value) : Paperclip;

  return (
    <div>
      <span
        id={labelId}
        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {label}
      </span>

      <div
        id={fieldId}
        role="group"
        aria-labelledby={labelId}
        data-testid={`${testIdPrefix}-box`}
        className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              value
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            <FileIcon className="w-3.5 h-3.5" aria-hidden="true" />
          </span>

          {value ? (
            <div className="min-w-0 flex-1">
              <p
                data-testid={`${testIdPrefix}-filename`}
                className="text-sm font-medium text-slate-900 dark:text-white truncate"
              >
                {value.name}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                {formatBytesValue(value.sizeBytes)} · {value.owner}
              </p>
            </div>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
              {placeholder ?? t('storageFormAttachPlaceholder')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t('storagePickerClearBtn')}
              data-testid={`${testIdPrefix}-clear-btn`}
              className="min-h-[34px] min-w-[34px] rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
            onClick={() => setOpenState(true)}
            data-testid={`${testIdPrefix}-browse-btn`}
          >
            {value ? t('storagePickerChangeBtn') : t('storagePickerBrowseBtn')}
          </Button>
        </div>
      </div>

      <FileStoragePickerModal
        open={pickerOpen}
        onClose={() => setOpenState(false)}
        rootFolderId={rootFolderId}
        allowedExtensions={allowedExtensions}
        initialSelectedFiles={value ? [value] : []}
        initialViewMode={initialViewMode}
        title={modalTitle}
        description={modalDescription}
        onConfirm={(files) => {
          onChange(files[0] ?? null);
        }}
      />
    </div>
  );
}
