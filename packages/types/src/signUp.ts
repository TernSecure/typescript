import type { TernSecureUser } from './all';
import type {
    SignUpUIConfig
} from './theme'
import type { 
    AuthErrorTree,
    SignInResponseTree
} from './errors';

export type SignUpFormValuesTree = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};

export type SignUpInitialValueTree = Partial<SignUpFormValuesTree>;

/**
 * Props for SignUp component focusing on UI concerns
 */
export interface SignUpPropsTree {
  /** Initial form values */
  initialValue?: SignUpInitialValueTree;
  /** UI configuration */
  ui?: SignUpUIConfig;
  /** Callbacks */
  onSubmit?: (values: SignUpFormValuesTree) => Promise<void>;
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
}

export interface SignUpResource {
    status?: SignUpStatus | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string | null;
    phoneNumber?: string | null;
   /**
    * @param provider - The identifier of the social provider (e.g., 'google', 'microsoft', 'github').
    * @param options - Optional configuration for the social sign-in flow.
    * @returns A promise that resolves with the sign-in response or void if redirecting.
    */
   withSocialProvider: (provider: string, options?: { mode?: 'popup' | 'redirect' }) => Promise<SignInResponseTree | void>;
}

export type SignUpStatus = 'missing_requirements' | 'complete' | 'abandoned';