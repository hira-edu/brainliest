export interface SignInFormState {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const signInInitialState: SignInFormState = { status: 'idle' };
