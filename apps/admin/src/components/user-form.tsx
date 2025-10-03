'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  EntityForm,
  EntityFormActions,
  FormField,
  FormLabel,
  FormSection,
  Input,
  SearchableSelect,
  Textarea,
  type SearchableSelectOption,
} from '@brainliest/ui';
import { useFormState, useFormStatus } from 'react-dom';
import type { UserFormState } from '@/app/(panel)/users/actions';
import { userFormInitialState } from '@/app/(panel)/users/actions';

const statusOptions: SearchableSelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

interface UserFormValues {
  id?: string;
  email: string;
  role: string;
  status: string;
  profile: string;
  password?: string;
}

export interface UserFormProps {
  readonly action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  readonly roleOptions: ReadonlyArray<SearchableSelectOption>;
  readonly defaultValues?: Partial<UserFormValues>;
  readonly headline?: string;
  readonly description?: string;
  readonly submitLabel?: string;
  readonly passwordLabel?: string;
  readonly passwordDescription?: string;
}

function FormSubmitActions({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <EntityFormActions>
      <Button type="submit" isLoading={pending} disabled={pending}>
        {submitLabel}
      </Button>
    </EntityFormActions>
  );
}

function normaliseDefaults(defaults?: Partial<UserFormValues>): UserFormValues {
  return {
    id: defaults?.id,
    email: defaults?.email ?? '',
    role: defaults?.role ?? '',
    status: defaults?.status ?? 'active',
    profile: defaults?.profile ?? '',
    password: undefined,
  };
}

export function UserForm({
  action,
  roleOptions,
  defaultValues,
  headline = 'User details',
  description = 'Manage account information and access controls.',
  submitLabel = 'Save user',
  passwordLabel = 'Password',
  passwordDescription,
}: UserFormProps) {
  const hydratedDefaults = useMemo(() => normaliseDefaults(defaultValues), [defaultValues]);
  const [formState, formAction] = useFormState(action, userFormInitialState);
  const [values, setValues] = useState<UserFormValues>(hydratedDefaults);

  useEffect(() => {
    setValues(hydratedDefaults);
  }, [hydratedDefaults]);

  useEffect(() => {
    if (!values.role && roleOptions.length > 0) {
      setValues((previous) => ({
        ...previous,
        role: roleOptions[0]?.value ?? '',
      }));
    }
  }, [roleOptions, values.role]);

  const handleChange = useCallback(<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const fieldErrors = formState.fieldErrors ?? {};
  const roleSelectOptions = useMemo(() => roleOptions, [roleOptions]);
  const singleRole = roleSelectOptions.length === 1;
  const roleValue = values.role || (singleRole ? roleSelectOptions[0]?.value ?? '' : '');

  return (
    <EntityForm
      action={formAction}
      title={headline}
      description={description}
      footer={<FormSubmitActions submitLabel={submitLabel} />}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <input type="hidden" name="role" value={roleValue} />
      <input type="hidden" name="status" value={values.status} />

      {formState.status === 'error' && formState.message ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">
          {formState.message}
        </div>
      ) : null}

      {formState.status === 'success' && formState.message ? (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-900">
          {formState.message}
        </div>
      ) : null}

      <FormSection title="Account" description="Primary identifiers and authentication controls.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField error={fieldErrors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="name@example.com"
              required
            />
          </FormField>

          <FormField error={fieldErrors.status}>
            <FormLabel>Status</FormLabel>
            <SearchableSelect
              options={statusOptions}
              value={values.status}
              onChange={(status) => handleChange('status', status)}
              placeholder="Select status"
            />
          </FormField>
        </div>

        {singleRole ? (
          <FormField>
            <FormLabel>Role</FormLabel>
            <p className="text-sm text-gray-700">{roleSelectOptions[0]?.label ?? roleValue}</p>
          </FormField>
        ) : (
          <FormField error={fieldErrors.role}>
            <FormLabel>Role</FormLabel>
            <SearchableSelect
              options={roleSelectOptions}
              value={roleValue}
              onChange={(role) => handleChange('role', role)}
              placeholder="Select role"
            />
          </FormField>
        )}

        <FormField error={fieldErrors.password} description={passwordDescription}>
          <FormLabel>{passwordLabel}</FormLabel>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current password"
            onChange={(event) => handleChange('password', event.target.value)}
          />
        </FormField>
      </FormSection>

      <FormSection title="Profile metadata" description="Optional JSON payload stored on the user profile.">
        <FormField error={fieldErrors.profile}>
          <FormLabel>Profile (JSON)</FormLabel>
          <Textarea
            name="profile"
            rows={6}
            value={values.profile}
            onChange={(event) => handleChange('profile', event.target.value)}
            placeholder={`{
  "bio": "",
  "tags": []
}`}
          />
        </FormField>
      </FormSection>
    </EntityForm>
  );
}
