import { useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { ErrorStateView, type HttpErrorCode } from '../ui/ErrorPages';
import { CheckboxField, PasswordInput } from '../ui/FormControls';
import { Input, OTPInput } from '../ui/ExtendedInputs';
import { AuthLayout } from '../ui/LayoutPrimitives';
import { useNotifications } from '../ui/NotificationSystem';
import { MaintenancePage, OfflinePage } from '../ui/OverlayExtras';
import { SegmentedControl } from '../ui/SegmentedControl';

export interface AuthErrorShowcaseViewProps {
  initialMode?: 'auth' | '403' | '404' | '500' | 'maintenance' | 'offline';
  onGoHome: () => void;
}

type AuthTabMode = 'login' | 'register' | 'forgot' | 'reset' | 'otp' | 'lock';

export function AuthErrorShowcaseView({
  initialMode = 'auth',
  onGoHome,
}: AuthErrorShowcaseViewProps) {
  const { t } = useI18n();
  const { addToast } = useNotifications();

  const [authTab, setAuthTab] = useState<AuthTabMode>('login');
  const [fullName, setFullName] = useState('Elena Rostova');
  const [email, setEmail] = useState('elena.rostova@kestrelops.io');
  const [password, setPassword] = useState('KestrelOps#2026');
  const [confirmPassword, setConfirmPassword] = useState('KestrelOps#2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [otpValue, setOtpValue] = useState('482910');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  if (initialMode === 'maintenance') {
    return <MaintenancePage onGoHome={onGoHome} />;
  }

  if (initialMode === 'offline') {
    return (
      <OfflinePage
        onGoHome={onGoHome}
        onRetry={() =>
          addToast({
            title: 'Connection restored — ledger synced',
            variant: 'success',
          })
        }
      />
    );
  }

  if (initialMode === '403' || initialMode === '404' || initialMode === '500') {
    const code = Number(initialMode) as HttpErrorCode;
    return (
      <div className="space-y-5">
        <ErrorStateView
          code={code}
          onGoHome={onGoHome}
          onRetry={
            code === 500
              ? () =>
                  addToast({
                    title: 'Gateway health check passed',
                    variant: 'success',
                  })
              : undefined
          }
        />
      </div>
    );
  }

  const tabMeta: Record<
    AuthTabMode,
    { label: string; icon: React.ReactNode }
  > = {
    login: { label: t('authTabLogin'), icon: <Lock className="w-5 h-5" /> },
    register: { label: 'Register', icon: <UserPlus className="w-5 h-5" /> },
    forgot: { label: t('authTabForgot'), icon: <Mail className="w-5 h-5" /> },
    reset: { label: 'Reset Password', icon: <KeyRound className="w-5 h-5" /> },
    otp: { label: t('authTabOtp'), icon: <ShieldCheck className="w-5 h-5" /> },
    lock: { label: 'Lock Screen', icon: <Lock className="w-5 h-5" /> },
  };

  return (
    <div className="space-y-6" data-testid="auth-flows-view">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('authTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('authSubtitle')}
          </p>
        </div>

        <SegmentedControl
          ariaLabel={t('authTitle')}
          value={authTab}
          onChange={(v) => {
            setAuthTab(v);
            setAuthNotice(null);
          }}
          options={[
            { value: 'login', label: t('authTabLogin') },
            { value: 'register', label: 'Register' },
            { value: 'forgot', label: t('authTabForgot') },
            { value: 'reset', label: 'Reset' },
            { value: 'otp', label: t('authTabOtp') },
            { value: 'lock', label: 'Lock' },
          ]}
        />
      </div>

      {/* Interactive Split AuthLayout */}
      <AuthLayout
        brandTitle="Kestrel Identity & Access Gateway"
        brandSubtitle="Zero-trust authentication flows supporting TOTP 2FA, hardware passkeys, session locking, and instant workspace recovery."
        highlights={[
          'SOC 2 Type II compliant audit trail on every login attempt',
          'Full RTL + dark mode parity across all identity screens',
          'Password strength meter and one-time recovery tokens',
        ]}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center">
              {tabMeta[authTab].icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tabMeta[authTab].label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('brandName')} Identity Console
              </p>
            </div>
          </div>

          {authNotice && (
            <Alert
              variant="success"
              title={authNotice}
              onDismiss={() => setAuthNotice(null)}
            />
          )}

          {authTab === 'login' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthNotice(`Authenticated as ${email}`);
                setAuthTab('otp');
              }}
              className="space-y-4"
            >
              <Input
                label={t('emailLabel')}
                type="email"
                required
                value={email}
                onChange={setEmail}
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                required
              />

              <div className="flex items-center justify-between gap-2">
                <CheckboxField
                  label="Keep session for 12 hours"
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
                <button
                  type="button"
                  onClick={() => setAuthTab('forgot')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {t('authTabForgot')}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="w-full"
              >
                {t('authSignInBtn')}
              </Button>
            </form>
          )}

          {authTab === 'register' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthNotice(`Workspace operator invited: ${fullName} (${email})`);
              }}
              className="space-y-4"
            >
              <Input
                label="Full Name"
                required
                value={fullName}
                onChange={setFullName}
              />
              <Input
                label={t('emailLabel')}
                type="email"
                required
                value={email}
                onChange={setEmail}
              />
              <PasswordInput
                label="Create Password"
                value={password}
                onChange={setPassword}
                showStrength
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="w-full"
              >
                Create Operator Account
              </Button>
            </form>
          )}

          {authTab === 'forgot' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthNotice(`Recovery instructions sent to ${email}`);
              }}
              className="space-y-4"
            >
              <Input
                label={t('emailLabel')}
                type="email"
                required
                value={email}
                onChange={setEmail}
              />
              <Button type="submit" variant="primary" size="md" className="w-full">
                {t('authSendResetBtn')}
              </Button>
            </form>
          )}

          {authTab === 'reset' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password !== confirmPassword) {
                  addToast({
                    title: 'Passwords do not match',
                    variant: 'error',
                  });
                  return;
                }
                setAuthNotice('Password updated and active sessions rotated');
              }}
              className="space-y-4"
            >
              <PasswordInput
                label="New Password"
                value={password}
                onChange={setPassword}
                showStrength
                required
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
              />
              <Button type="submit" variant="primary" size="md" className="w-full">
                Confirm Password Reset
              </Button>
            </form>
          )}

          {authTab === 'otp' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addToast({
                  title: `2FA OTP ${otpValue} verified`,
                  variant: 'success',
                });
                setAuthNotice(`Verified TOTP code ${otpValue}`);
              }}
              className="space-y-4"
            >
              <OTPInput
                label="Authenticator 6-digit code"
                value={otpValue}
                onChange={setOtpValue}
                length={6}
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="w-full"
              >
                {t('authVerifyOtpBtn')}
              </Button>
            </form>
          )}

          {authTab === 'lock' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthNotice(`Session unlocked for ${fullName}`);
              }}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {fullName}
                  </p>
                  <p dir="ltr" className="font-mono text-xs text-slate-500">
                    {email}
                  </p>
                </div>
                <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>
              <PasswordInput
                label="Unlock Password"
                value={password}
                onChange={setPassword}
                required
              />
              <Button type="submit" variant="primary" size="md" className="w-full">
                Unlock Console Session
              </Button>
            </form>
          )}
        </div>
      </AuthLayout>
    </div>
  );
}
