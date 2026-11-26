import React, { useState } from 'react';
import type { OrderChannel, OrderRecord, OrderStatus } from '../../types/admin';
import type { StorageNode } from '../../types/storage';
import { REFERENCE_TODAY } from '../../data/seedData';
import { useI18n } from '../../i18n/I18nContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StorageFormField } from '../storage/FileStoragePickerModal';

export interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreateOrder: (order: Omit<OrderRecord, 'id'>) => void;
}

interface FormErrors {
  customerName?: string;
  customerEmail?: string;
  company?: string;
  planOrItem?: string;
  amount?: string;
}

export function CreateOrderModal({
  open,
  onClose,
  onCreateOrder,
}: CreateOrderModalProps) {
  const { t, tStatus, tChannel } = useI18n();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [company, setCompany] = useState('');
  const [planOrItem, setPlanOrItem] = useState('Growth Operations Suite');
  const [channel, setChannel] = useState<OrderChannel>('Direct');
  const [status, setStatus] = useState<OrderStatus>('Processing');
  const [amount, setAmount] = useState('');
  const [region, setRegion] = useState('New York, US');
  const [attachedFile, setAttachedFile] = useState<StorageNode | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCompany('');
    setPlanOrItem('Growth Operations Suite');
    setChannel('Direct');
    setStatus('Processing');
    setAmount('');
    setRegion('New York, US');
    setAttachedFile(null);
    setPickerOpen(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};

    if (!customerName.trim()) {
      nextErrors.customerName = t('errNameRequired');
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      nextErrors.customerEmail = t('errEmailInvalid');
    }
    if (!company.trim()) {
      nextErrors.company = t('errCompanyRequired');
    }
    if (!planOrItem.trim()) {
      nextErrors.planOrItem = t('errPlanRequired');
    }
    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = t('errAmountPositive');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onCreateOrder({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      company: company.trim(),
      planOrItem: planOrItem.trim(),
      channel,
      status,
      amount: Math.round(parsedAmount),
      date: REFERENCE_TODAY,
      region: region.trim() || 'Remote',
      paymentMethod: 'Invoice Net-30',
      notes: attachedFile ? `Attachment: ${attachedFile.name}` : undefined,
    });

    handleClose();
  };

  const inputClass =
    'w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      disableEscapeClose={pickerOpen}
      title={t('createOrderTitle')}
      description={t('createOrderDesc')}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="create-order-form"
            variant="primary"
            className="w-full sm:w-auto"
          >
            {t('createOrderBtn')}
          </Button>
        </>
      }
    >
      <form id="create-order-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="new-customer-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('customerNameLabel')}
            </label>
            <input
              id="new-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors({ ...errors, customerName: undefined });
              }}
              placeholder="e.g. Jordan Mercer"
              className={inputClass}
            />
            {errors.customerName && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.customerName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="new-customer-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('emailLabel')}
            </label>
            <input
              id="new-customer-email"
              type="email"
              dir="ltr"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                if (errors.customerEmail) setErrors({ ...errors, customerEmail: undefined });
              }}
              placeholder="jordan@company.io"
              className={inputClass}
            />
            {errors.customerEmail && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.customerEmail}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="new-company"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('companyLabel')}
            </label>
            <input
              id="new-company"
              type="text"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (errors.company) setErrors({ ...errors, company: undefined });
              }}
              placeholder="e.g. Mercer Freight"
              className={inputClass}
            />
            {errors.company && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.company}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="new-amount"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('amountLabel')}
            </label>
            <input
              id="new-amount"
              type="number"
              dir="ltr"
              min="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors({ ...errors, amount: undefined });
              }}
              placeholder="1500"
              className={`${inputClass} font-mono tabular-nums`}
            />
            {errors.amount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errors.amount}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="new-plan"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {t('planLabel')}
          </label>
          <input
            id="new-plan"
            type="text"
            value={planOrItem}
            onChange={(e) => {
              setPlanOrItem(e.target.value);
              if (errors.planOrItem) setErrors({ ...errors, planOrItem: undefined });
            }}
            className={inputClass}
          />
          {errors.planOrItem && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {errors.planOrItem}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label
              htmlFor="new-channel"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('channelLabel')}
            </label>
            <select
              id="new-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as OrderChannel)}
              className={inputClass}
            >
              <option value="Direct">{tChannel('Direct')}</option>
              <option value="Enterprise">{tChannel('Enterprise')}</option>
              <option value="Partner">{tChannel('Partner')}</option>
              <option value="Marketplace">{tChannel('Marketplace')}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="new-status"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('initialStatusLabel')}
            </label>
            <select
              id="new-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className={inputClass}
            >
              <option value="Processing">{tStatus('Processing')}</option>
              <option value="Pending">{tStatus('Pending')}</option>
              <option value="Completed">{tStatus('Completed')}</option>
              <option value="Flagged">{tStatus('Flagged')}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="new-region"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              {t('regionLabel')}
            </label>
            <input
              id="new-region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <StorageFormField
          label={t('storageFormAttachLabel')}
          rootFolderId="fld-contracts"
          value={attachedFile}
          onChange={setAttachedFile}
          onPickerOpenChange={setPickerOpen}
          testIdPrefix="create-order-file"
        />
      </form>
    </Modal>
  );
}
