export interface TotpChallengeFormState {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const totpChallengeInitialState: TotpChallengeFormState = { status: 'idle' };
