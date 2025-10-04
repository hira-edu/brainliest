'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  EntityForm,
  EntityFormActions,
  FormField,
  FormLabel,
  Input,
  SearchableSelect,
  Textarea,
} from '@brainliest/ui';
import { useFormState, useFormStatus } from 'react-dom';
import type { IntegrationEnvironment } from '@brainliest/db';
import type { CreateIntegrationKeyPayload } from '@/lib/shared-schemas';
import {
  integrationKeyInitialState,
  type IntegrationKeyFormState,
} from '@/app/(panel)/integrations/keys/actions';

type IntegrationKeyMode = 'create' | 'rotate';

interface IntegrationKeyFormProps {
  readonly action: (state: IntegrationKeyFormState, formData: FormData) => Promise<IntegrationKeyFormState>;
  readonly mode?: IntegrationKeyMode;
  readonly formId?: string;
  readonly submitLabel?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly defaultValues?: Partial<CreateIntegrationKeyPayload> & { id?: string };
  readonly onSuccess?: (state: IntegrationKeyFormState) => void;
}

const typeOptions = [
  { value: 'OPENAI', label: 'OpenAI' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'RESEND', label: 'Resend' },
  { value: 'CAPTCHA', label: 'Captcha' },
  { value: 'GOOGLE_RECAPTCHA_V2_SITE', label: 'Google reCAPTCHA v2 (site key)' },
  { value: 'GOOGLE_RECAPTCHA_V2_SECRET', label: 'Google reCAPTCHA v2 (secret key)' },
  { value: 'GOOGLE_RECAPTCHA_V3_SITE', label: 'Google reCAPTCHA v3 (site key)' },
  { value: 'GOOGLE_RECAPTCHA_V3_SECRET', label: 'Google reCAPTCHA v3 (secret key)' },
];

const environmentOptions = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
];

interface IntegrationFormValues {
  id: string;
  name: string;
  type: CreateIntegrationKeyPayload['type'];
  environment: IntegrationEnvironment;
  description: string;
  value: string;
}

function generateSecret(length = 40): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
  }

  return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}

function FormActions({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <EntityFormActions>
      <Button type="submit" isLoading={pending} disabled={pending}>
        {submitLabel}
      </Button>
    </EntityFormActions>
  );
}

export function IntegrationKeyForm({
  action,
  mode = 'create',
  formId,
  submitLabel = mode === 'create' ? 'Create key' : 'Rotate key',
  headline = mode === 'create' ? 'Integration key details' : 'Rotate integration key',
  description =
    mode === 'create'
      ? 'Provide contextual information and the secret value that will be encrypted before storage.'
      : 'Rotate the integration key value. Existing consumers must be updated to use the new secret.',
  defaultValues,
  onSuccess,
}: IntegrationKeyFormProps) {
  const initialValues = useMemo<IntegrationFormValues>(() => {
    return {
      id: defaultValues?.id ?? '',
      name: defaultValues?.name ?? '',
      type: (defaultValues?.type ?? 'OPENAI') as CreateIntegrationKeyPayload['type'],
      environment: (defaultValues?.environment ?? 'development') as IntegrationEnvironment,
      description: defaultValues?.description ?? '',
      value: defaultValues?.value ?? (mode === 'create' ? generateSecret() : ''),
    };
  }, [defaultValues, mode]);

  const [formState, formAction] = useFormState(action, integrationKeyInitialState);
  const [values, setValues] = useState<IntegrationFormValues>(initialValues);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (formState.status === 'success') {
      setShowSecret(true);
      onSuccess?.(formState);
    }
  }, [formState, onSuccess]);

  const setField = useCallback(<K extends keyof typeof values>(field: K, value: (typeof values)[K]) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const fieldErrors = formState.fieldErrors ?? {};

  const handleRegenerate = useCallback(() => {
    setValues((previous) => ({
      ...previous,
      value: generateSecret(),
    }));
    setShowSecret(false);
  }, []);

  return (
    <EntityForm
      id={formId}
      action={formAction}
      title={headline}
      description={description}
      footer={<FormActions submitLabel={submitLabel} />}
    >
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

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

      <div className="space-y-6">
        {mode === 'create' ? (
          <FormField error={fieldErrors.name}>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. OpenAI Production"
              required
            />
          </FormField>
        ) : (
          <FormField>
            <FormLabel>Name</FormLabel>
            <Input value={values.name} readOnly disabled />
          </FormField>
        )}

        {mode === 'create' ? (
          <FormField error={fieldErrors.type}>
            <FormLabel>Integration type</FormLabel>
            <SearchableSelect
              options={typeOptions}
              value={values.type}
              onChange={(nextType) =>
                setField('type', nextType as CreateIntegrationKeyPayload['type'])
              }
              placeholder="Select provider"
            />
          </FormField>
        ) : (
          <FormField>
            <FormLabel>Integration type</FormLabel>
            <Input value={typeOptions.find((option) => option.value === values.type)?.label ?? values.type} readOnly disabled />
          </FormField>
        )}

        {mode === 'create' ? (
          <FormField error={fieldErrors.environment}>
            <FormLabel>Environment</FormLabel>
            <SearchableSelect
              options={environmentOptions}
              value={values.environment}
              onChange={(environment) => setField('environment', environment as IntegrationEnvironment)}
              placeholder="Select environment"
            />
          </FormField>
        ) : (
          <FormField>
            <FormLabel>Environment</FormLabel>
            <Input
              value={environmentOptions.find((option) => option.value === values.environment)?.label ?? values.environment}
              readOnly
              disabled
            />
          </FormField>
        )}

        {mode === 'create' ? (
          <FormField error={fieldErrors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              rows={3}
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="Optional context for operators"
            />
          </FormField>
        ) : values.description ? (
          <FormField>
            <FormLabel>Description</FormLabel>
            <Textarea value={values.description} readOnly disabled rows={3} />
          </FormField>
        ) : null}

        <FormField error={fieldErrors.value} description="This value is stored encrypted and only shown immediately after submission.">
          <div className="flex items-center justify-between gap-2">
            <FormLabel>Key value</FormLabel>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSecret((previous) => !previous)}
              >
                {showSecret ? 'Hide' : 'Show'}
              </Button>
              {mode === 'create' ? (
                <Button type="button" variant="ghost" size="sm" onClick={handleRegenerate}>
                  Regenerate
                </Button>
              ) : null}
            </div>
          </div>
          <Input
            name="value"
            type={showSecret ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={values.value}
            onChange={(event) => setField('value', event.target.value)}
            placeholder="Paste or generate the secret value"
            required
          />
        </FormField>

        {formState.secret ? (
          <FormField>
            <FormLabel>New secret</FormLabel>
            <Textarea value={formState.secret} readOnly rows={3} className="font-mono" />
          </FormField>
        ) : null}
      </div>
    </EntityForm>
  );
}
