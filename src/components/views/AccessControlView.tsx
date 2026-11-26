import { useState } from 'react';
import {
  CheckCircle2,
  Laptop,
  LogOut,
  Shield,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import type {
  AdminTeamMember,
  PermissionAction,
  PermissionMatrixState,
  PermissionResource,
  RoleId,
  UserSessionRecord,
} from '../../types/admin';
import { ADMIN_PROFILE } from '../../data/seedData';
import {
  INITIAL_ROLES,
  INITIAL_SESSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  countRoleEnabledPermissions,
  createInitialPermissionMatrix,
  setRoleResourcePermissions,
  togglePermissionCell,
} from '../../utils/adminSuite';
import { useI18n } from '../../i18n/I18nContext';
import { Avatar, AvatarGroup } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useNotifications } from '../ui/NotificationSystem';

const INITIAL_TEAM_MEMBERS: AdminTeamMember[] = [
  {
    id: 'USR-01',
    name: ADMIN_PROFILE.name,
    email: ADMIN_PROFILE.email,
    roleId: 'super_admin',
    avatar: ADMIN_PROFILE.avatar,
    status: 'Active',
    lastActive: 'Now',
    twoFactorEnabled: true,
  },
  {
    id: 'USR-02',
    name: 'Soraia Abbasi',
    email: 'soraia@kestrelops.io',
    roleId: 'ops_lead',
    status: 'Active',
    lastActive: '12m ago',
    twoFactorEnabled: true,
  },
  {
    id: 'USR-03',
    name: 'Tariq Al-Mansoor',
    email: 'tariq@kestrelops.io',
    roleId: 'finance_analyst',
    status: 'Active',
    lastActive: '1h ago',
    twoFactorEnabled: true,
  },
  {
    id: 'USR-04',
    name: 'Camila Vega',
    email: 'camila@kestrelops.io',
    roleId: 'support_agent',
    status: 'Invited',
    lastActive: 'Pending invite',
    twoFactorEnabled: false,
  },
];

export function AccessControlView() {
  const { t } = useI18n();
  const { addToast } = useNotifications();

  const [selectedRole, setSelectedRole] = useState<RoleId>('ops_lead');
  const [matrix, setMatrix] = useState<PermissionMatrixState>(
    createInitialPermissionMatrix
  );
  const [members, setMembers] = useState<AdminTeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [sessions, setSessions] = useState<UserSessionRecord[]>(INITIAL_SESSIONS);
  const [inviteEmail, setInviteEmail] = useState('');

  const resourceLabel = (res: PermissionResource) => {
    switch (res) {
      case 'overview':
        return t('accessResOverview');
      case 'orders':
        return t('accessResOrders');
      case 'customers':
        return t('accessResCustomers');
      case 'storage':
        return t('accessResStorage');
      case 'reports':
        return t('accessResReports');
      case 'access':
        return t('accessResAccess');
      case 'settings':
        return t('accessResSettings');
    }
  };

  const actionLabel = (act: PermissionAction) => {
    switch (act) {
      case 'view':
        return t('accessActView');
      case 'create':
        return t('accessActCreate');
      case 'edit':
        return t('accessActEdit');
      case 'delete':
        return t('accessActDelete');
    }
  };

  const handleToggleCell = (res: PermissionResource, act: PermissionAction) => {
    setMatrix((prev) => togglePermissionCell(prev, selectedRole, res, act));
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    addToast({
      title: `Session ${id} revoked`,
      variant: 'warning',
    });
  };

  const handleRevokeOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    addToast({
      title: 'Signed out all other devices',
      variant: 'success',
    });
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) return;
    const namePart = email.split('@')[0].replace(/[._-]+/g, ' ');
    const displayName = namePart
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ');
    setMembers((prev) => [
      {
        id: `USR-${prev.length + 10}`,
        name: displayName || email,
        email,
        roleId: selectedRole,
        status: 'Invited',
        lastActive: 'Invited just now',
        twoFactorEnabled: false,
      },
      ...prev,
    ]);
    setInviteEmail('');
    addToast({
      title: `Invitation sent to ${email}`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6" data-testid="access-control-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('accessTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('accessSubtitle')}
          </p>
        </div>

        <AvatarGroup
          members={members.map((m) => ({ id: m.id, name: m.name, src: m.avatar }))}
          max={4}
          size="md"
        />
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {INITIAL_ROLES.map((role) => {
          const active = role.id === selectedRole;
          const enabledCount = countRoleEnabledPermissions(matrix, role.id);
          return (
            <button
              key={role.id}
              type="button"
              data-testid={`role-card-${role.id}`}
              onClick={() => setSelectedRole(role.id)}
              className={`p-4 rounded-2xl border text-start transition-colors cursor-pointer space-y-2 ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{role.name}</span>
                </span>
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {enabledCount}/28
                </span>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {role.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Permission Matrix */}
      <section
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
        data-testid="permission-matrix"
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('accessMatrixTitle')} —{' '}
              {INITIAL_ROLES.find((r) => r.id === selectedRole)?.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle cell checkboxes or grant full resource access per row.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {countRoleEnabledPermissions(matrix, selectedRole)} /{' '}
            {PERMISSION_RESOURCES.length * PERMISSION_ACTIONS.length} enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="px-5 py-3 text-start">Module</th>
                {PERMISSION_ACTIONS.map((act) => (
                  <th key={act} className="px-4 py-3 text-center">
                    {actionLabel(act)}
                  </th>
                ))}
                <th className="px-5 py-3 text-end">Quick</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {PERMISSION_RESOURCES.map((res) => {
                const rowPerms = matrix[selectedRole][res];
                const allGranted = PERMISSION_ACTIONS.every((a) => rowPerms[a]);
                return (
                  <tr key={res} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                      {resourceLabel(res)}
                    </td>
                    {PERMISSION_ACTIONS.map((act) => (
                      <td key={act} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rowPerms[act]}
                          onChange={() => handleToggleCell(res, act)}
                          data-testid={`perm-${selectedRole}-${res}-${act}`}
                          aria-label={`${selectedRole} ${res} ${act}`}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                      </td>
                    ))}
                    <td className="px-5 py-3 text-end">
                      <button
                        type="button"
                        onClick={() =>
                          setMatrix((prev) =>
                            setRoleResourcePermissions(
                              prev,
                              selectedRole,
                              res,
                              !allGranted
                            )
                          )
                        }
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {allGranted ? 'Revoke' : 'Full'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom 2 Columns: Workspace Team + Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Members */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('accessMembersTitle')}
          </h3>

          <form onSubmit={handleInviteMember} className="flex gap-2">
            <input
              type="email"
              dir="ltr"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@kestrelops.io"
              aria-label="Invite teammate email"
              className="flex-1 min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Invite
            </Button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((m) => (
              <div
                key={m.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={m.avatar} name={m.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {m.name}
                    </p>
                    <p dir="ltr" className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label={`Role for ${m.name}`}
                    value={m.roleId}
                    onChange={(e) => {
                      const nextRole = e.target.value as RoleId;
                      setMembers((prev) =>
                        prev.map((item) =>
                          item.id === m.id ? { ...item, roleId: nextRole } : item
                        )
                      );
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
                  >
                    {INITIAL_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Sessions & Devices */}
        <section
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
          data-testid="active-sessions-card"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('accessSessionsTitle')}
            </h3>
            {sessions.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleRevokeOtherSessions}
              >
                {t('accessRevokeOthers')}
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className="py-3 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                    {ses.device.toLowerCase().includes('iphone') ? (
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Laptop className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {ses.device}
                      </p>
                      {ses.current && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          <span>{t('accessCurrentSession')}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ses.browser} · {ses.location} ·{' '}
                      <span dir="ltr" className="font-mono">
                        {ses.ip}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ses.lastActive}
                    </p>
                  </div>
                </div>

                {!ses.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(ses.id)}
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 shrink-0"
                  >
                    {t('accessRevokeSession')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
