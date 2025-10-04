'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Button, Card, FormField, FormLabel, Input, Stack, Badge } from '@brainliest/ui';
import { DataTable } from '@/components/data-table';

import type { AdminMfaStatus, TotpSetupDetails } from '@/lib/auth/totp-service';
import {
  confirmTotpEnrollmentAction,
  disableTotpAction,
  regenerateRecoveryCodesAction,
  revokeAllRememberDevicesAction,
  revokeRememberDeviceAction,
  startTotpEnrollmentAction,
  totpEnrollmentInitialState,
  type TotpEnrollmentFormState,
} from '@/app/(panel)/settings/security/actions';

interface TotpManagerProps {
  readonly status: AdminMfaStatus;
  readonly email: string;
}

export function TotpManager({ status, email }: TotpManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [setup, setSetup] = useState<TotpSetupDetails | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [enrollmentState, enrollmentAction] = useFormState<TotpEnrollmentFormState, FormData>(
    confirmTotpEnrollmentAction,
    totpEnrollmentInitialState
  );

  useEffect(() => {
    if (enrollmentState.status === 'success' && enrollmentState.recoveryCodes) {
      setRecoveryCodes(enrollmentState.recoveryCodes);
      setSetup(null);
      setSetupError(null);
      startTransition(() => {
        router.refresh();
      });
    }
    if (enrollmentState.status === 'error' && enrollmentState.message) {
      setSetupError(enrollmentState.message);
    }
  }, [enrollmentState, router]);

  const unusedRecoveryCodes = useMemo(() => status.recoveryCodes.filter((code) => !code.usedAt).length, [status]);

  const handleStartSetup = () => {
    setSetupError(null);
    setRecoveryCodes(null);
    startTransition(async () => {
      try {
        const action = startTotpEnrollmentAction.bind(null) as () => Promise<TotpSetupDetails>;
        const details = await action();
        setSetup(details);
      } catch (error) {
        console.error('[totp] failed to start enrollment', error);
        setSetupError('Unable to start enrollment. Please try again.');
      }
    });
  };

  const handleDisable = () => {
    setSetupError(null);
    setRecoveryCodes(null);
    startTransition(async () => {
      const action = disableTotpAction.bind(null);
      const result = await action();
      if (result.status === 'error' && result.message) {
        setSetupError(result.message);
        return;
      }
      router.refresh();
    });
  };

  const handleRegenerateCodes = () => {
    setSetupError(null);
    startTransition(async () => {
      const action = regenerateRecoveryCodesAction.bind(null);
      const result = await action();
      if (result.status === 'error') {
        setSetupError(result.message);
        return;
      }
      setRecoveryCodes(result.recoveryCodes);
    });
  };

  const handleRevokeDevice = (deviceId: string) => {
    startTransition(async () => {
      const action = revokeRememberDeviceAction.bind(null, deviceId);
      const result = await action();
      if (result.status === 'error' && result.message) {
        setSetupError(result.message);
        return;
      }
      router.refresh();
    });
  };

  const handleRevokeAllDevices = () => {
    startTransition(async () => {
      const action = revokeAllRememberDevicesAction.bind(null);
      const result = await action();
      if (result.status === 'error' && result.message) {
        setSetupError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Stack direction="col" gap={6}>
      <Card
        padding="md"
        header={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Authenticator app</h2>
              <p className="text-sm text-gray-600">
                Protect your admin account with a second factor. Signed in as <span className="font-medium">{email}</span>.
              </p>
            </div>
            <Badge variant={status.enabled ? 'success' : 'secondary'}>
              {status.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        }
      >
        {setupError ? (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">
            {setupError}
          </div>
        ) : null}

        {setup ? (
          <Stack direction="col" gap={4}>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">Scan this QR code</h3>
              <p className="text-sm text-gray-600">
                Scan the QR code below with Google Authenticator, 1Password, or any TOTP-compatible app.
              </p>
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
                  <img src={setup.qrCodeUrl} alt="Authenticator QR code" className="h-48 w-48" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900">Manual key</h3>
                <p className="text-sm text-gray-600">If you cannot scan the QR code, enter this key manually in your app.</p>
                <code className="inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-mono font-semibold text-white">
                  {setup.secret}
                </code>
              </div>

              <form action={enrollmentAction} className="space-y-4">
                <input type="hidden" name="setupToken" value={setup.setupToken} />
                <FormField error={enrollmentState.message}>
                  <FormLabel>Verification code</FormLabel>
                  <Input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    required
                    maxLength={6}
                  />
                </FormField>
                <div className="flex items-center gap-3">
                  <Button type="submit" isLoading={isPending} disabled={isPending}>
                    Verify and enable
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => {
                      setSetup(null);
                      setSetupError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Stack>
          ) : (
            <Stack direction="col" gap={4}>
              {status.enabled ? (
                <Stack direction="row" gap={3} className="flex-wrap">
                  <Button onClick={handleRegenerateCodes} isLoading={isPending} disabled={isPending}>
                    Regenerate recovery codes
                  </Button>
                  <Button variant="outline" onClick={handleDisable} disabled={isPending}>
                    Disable multi-factor auth
                  </Button>
                </Stack>
              ) : (
                <Button onClick={handleStartSetup} isLoading={isPending} disabled={isPending}>
                  Enable authenticator app
                </Button>
              )}

              {status.enabled ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    MFA enabled on{' '}
                    <span className="font-medium">
                      {status.enabledAt ? new Date(status.enabledAt).toLocaleString() : 'unknown date'}
                    </span>
                    .
                  </p>
                  <p>
                    {unusedRecoveryCodes} recovery code{unusedRecoveryCodes === 1 ? '' : 's'} remain unused.
                  </p>
                </div>
              ) : null}
            </Stack>
          )}

        {recoveryCodes ? (
          <div className="mt-6 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Store these recovery codes in a safe place. They will be shown only once.</p>
            <Stack direction="col" gap={1}>
              {recoveryCodes.map((code) => (
                <code key={code} className="font-mono text-base">
                  {code}
                </code>
              ))}
            </Stack>
          </div>
        ) : null}
      </Card>

      <Card
        padding="md"
        header={
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trusted devices</h2>
              <p className="text-sm text-gray-600">
                Remove remembered devices to require your MFA code the next time those devices sign in.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevokeAllDevices}
              disabled={isPending || status.rememberDevices.length === 0}
            >
              Revoke all
            </Button>
          </div>
        }
      >
        <DataTable
          data={status.rememberDevices}
          getRowKey={(device) => device.id}
          columns={[
            {
              id: 'device',
              header: 'Device',
              cell: (device) => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{`${device.id.slice(0, 8)}…`}</p>
                  <p className="text-xs text-gray-500">{device.userAgent ?? 'Unknown device'}</p>
                </div>
              ),
            },
            {
              id: 'last-used',
              header: 'Last used',
              cell: (device) =>
                device.lastUsedAt ? (
                  <Badge variant="secondary">{new Date(device.lastUsedAt).toLocaleString()}</Badge>
                ) : (
                  <span className="text-xs text-gray-500">Never</span>
                ),
            },
            {
              id: 'expires',
              header: 'Expires',
              cell: (device) => <span className="text-xs text-gray-600">{new Date(device.expiresAt).toLocaleString()}</span>,
            },
            {
              id: 'ip',
              header: 'IP',
              cell: (device) => <span className="text-xs text-gray-500">{device.ipAddress ?? '—'}</span>,
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              cell: (device) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevokeDevice(device.id)}
                  disabled={isPending}
                >
                  Revoke
                </Button>
              ),
            },
          ]}
          emptyState="No trusted devices."
          dense
        />
      </Card>
    </Stack>
  );
}
