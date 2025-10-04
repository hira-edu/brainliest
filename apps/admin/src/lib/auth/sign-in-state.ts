export type SignInStatus = 'idle' | 'error' | 'challenge';

export interface SignInChallengeDetails {
  readonly id: string;
  readonly email: string;
  readonly rememberSession: boolean;
}

export interface SignInFormState {
  status: SignInStatus;
  message?: string;
  fieldErrors?: Record<string, string>;
  cooldownSeconds?: number;
  challenge?: SignInChallengeDetails;
}

export const signInInitialState: SignInFormState = { status: 'idle' };
