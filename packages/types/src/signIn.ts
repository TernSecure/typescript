import type { TernSecureUser } from './all';
import type {
    SignInUIConfig
} from './theme'
import type { 
  AuthErrorTree,
  SignInResponseTree
} from './errors';

export type SignInStatus =
  | 'idle'
  | 'pending_email_password'
  | 'pending_social'
  | 'pending_mfa'
  | 'redirecting'
  | 'success'
  | 'error';



export type SignInFormValuesTree = {
  email: string;
  password: string;
  phoneNumber?: string;
};

export type SignInInitialValueTree = Partial<SignInFormValuesTree>;


export interface ResendEmailVerification extends SignInResponseTree {
  isVerified?: boolean;
}

export function isSignInResponseTree(value: any): value is SignInResponseTree {
  return (
    typeof value === 'object' &&
    'success' in value &&
    typeof value.success === 'boolean'
  );
}

/**
 * Props for SignIn component focusing on UI concerns
 */
export interface SignInPropsTree {
  /** Initial form values */
  initialValue?: SignInInitialValueTree;
  /** UI configuration */
  ui?: SignInUIConfig;
  /** Callbacks */
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
  //authProvider?: TernSecureAuthProvider; 
}


export interface SignInResource {
  /**
   * The current status of the sign-in process.
   */
  status?: SignInStatus;
  /**
   * Signs in a user with their email and password.
   * @param params - The sign-in form values.
   * @returns A promise that resolves with the sign-in response.
   */
  withEmailAndPassword: (params: SignInFormValuesTree) => Promise<SignInResponseTree>;
  /**
   * @param provider - The identifier of the social provider (e.g., 'google', 'microsoft', 'github').
   * @param options - Optional configuration for the social sign-in flow.
   * @returns A promise that resolves with the sign-in response or void if redirecting.
   */
  withSocialProvider: (provider: string, options?: { mode?: 'popup' | 'redirect' }) => Promise<SignInResponseTree | void>;
  /**
   * Completes an MFA (Multi-Factor Authentication) step after a primary authentication attempt.
   * @param mfaToken - The MFA token or code submitted by the user.
   * @param mfaContext - Optional context or session data from the MFA initiation step.
   * @returns A promise that resolves with the sign-in response upon successful MFA verification.
   */
  completeMfaSignIn: (mfaToken: string, mfaContext?: any) => Promise<SignInResponseTree>;
  /**
   * Sends a password reset email to the given email address.
   * @param email - The user's email address.
   * @returns A promise that resolves when the email is sent.
   */
  sendPasswordResetEmail: (email: string) => Promise<void>;
  /**
   * Resends the email verification link to the user's email address.
   * @returns A promise that resolves with the sign-in response.
   */
  resendEmailVerification: () => Promise<ResendEmailVerification>;
}