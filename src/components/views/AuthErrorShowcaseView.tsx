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

type AuthTabMode =
  | 'login'
  | 'register'
  | 'forgot'
  | 'reset'
  | 'otp'
  | 'lock'
  | '2fa-setup'
  | 'verify-invite'
  | 'onboarding';

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
    lock: { label: 'Account Lockout & Unlock', icon: <Lock className="w-5 h-5" /> },
    '2fa-setup': { label: '2FA Setup & Recovery Codes', icon: <ShieldCheck className="w-5 h-5" /> },
    'verify-invite': { label: 'Email Verify & Invite Accept', icon: <Mail className="w-5 h-5" /> },
    onboarding: { label: 'First-Login Onboarding', icon: <UserPlus className="w-5 h-5" /> },
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
            { value: 'reset', label: 'Change Pwd' },
            { value: 'otp', label: t('authTabOtp') },
            { value: '2fa-setup', label: '2FA Setup' },
            { value: 'verify-invite', label: 'Verify/Invite' },
            { value: 'lock', label: 'Lockout' },
            { value: 'onboarding', label: 'Onboarding' },
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

              <div className="relative py-1 flex items-center justify-center text-[11px] text-slate-400">
                <span className="px-2 bg-white dark:bg-slate-900 z-10">or continue with SSO / Magic Link</span>
                <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['Google SSO', 'GitHub OAuth', 'Magic Link'].map((provider) => (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAuthNotice(
                        provider === 'Magic Link'
                          ? `One-time Magic Link dispatched to ${email}`
                          : `Redirecting via ${provider} SAML/OIDC...`
                      )
                    }
                  >
                    {provider}
                  </Button>
                ))}
              </div>
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
              <Alert
                variant="warning"
                title="Account Lockout Policy (5 failed attempts)"
                description="Cooldown active for 14m 20s or unlock immediately with master recovery passkey."
              />
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

          {authTab === '2fa-setup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-white p-2 border border-slate-200 grid grid-cols-5 gap-0.5 shrink-0" aria-label="2FA QR Code">
                  {Array.from({ length: 25 }, (_, i) => (
                    <span
                      key={i}
                      className={i % 2 === 0 || i % 7 === 0 ? 'bg-slate-900 rounded-[1px]' : 'bg-white'}
                    />
                  ))}
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Scan Authenticator QR Code
                  </p>
                  <p className="text-slate-500">Manual Setup Secret Key:</p>
                  <code dir="ltr" className="inline-block px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    KSTL-49XP-99QR-2026
                  </code>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Single-Use Backup Recovery Codes
                </p>
                <div dir="ltr" className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  {['8492-A1B2', '3301-C9D4', '7741-E2F8', '5019-G6H3'].map((code) => (
                    <div key={code} className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setAuthNotice('2FA Hardware Authenticator enabled & recovery codes confirmed')}
              >
                Activate 2FA Protection
              </Button>
            </div>
          )}

          {authTab === 'verify-invite' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Workspace Invitation · Kestrel EU Clearing
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Elena Rostova invited <strong dir="ltr">{email}</strong> as <strong>Operations Lead</strong>.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setAuthNotice('Email verified & workspace invitation accepted')}
                  >
                    Verify Email &amp; Accept Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAuthNotice(`Verification link re-sent to ${email}`)}
                  >
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            </div>
          )}

          {authTab === 'onboarding' && (
            <div className="space-y-3 text-xs">
              {[
                { step: '1. Organization Profile', detail: 'Kestrel EU Clearing · Currency EUR/USD', done: true },
                { step: '2. Settlement Rails & Webhooks', detail: 'SEPA Instant + Dual-Control Approval', done: true },
                { step: '3. Invite Compliance Reviewers', detail: 'Add at least 1 reviewer to enable go-live', done: false },
              ].map((item) => (
                <div key={item.step} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.step}</p>
                    <p className="text-[11px] text-slate-500">{item.detail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${item.done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                    {item.done ? 'Complete' : 'Pending'}
                  </span>
                </div>
              ))}
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setAuthNotice('First-login workspace onboarding completed!')}
              >
                Complete Workspace Setup
              </Button>
            </div>
          )}
        </div>
      </AuthLayout>
    </div>
  );
}
