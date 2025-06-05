import { SignedInSession } from 'session';
import type { TernSecureUser } from './all';
import type { 
    SignInFormValuesTree, 
    SignInResponseTree
} from './signin';

export type AuthProviderStatus = 'idle' | 'pending' | 'error' | 'success';

export interface TernSecureAuthProvider {
  /** Current status of the auth provider */
  status?: AuthProviderStatus;

  /** Current user*/
  ternSecureUser(): TernSecureUser | null;

  /** Current session */
  currentSession: SignedInSession | null;

  /**
   * Authenticate a user with email and password
   */
  withEmailAndPassword(params: SignInFormValuesTree): Promise<SignInResponseTree>;
  
  /**
   * Authenticate a user with a social provider
   */
  withSocialProvider(
    provider: string, 
    options?: {mode?: 'popup' | 'redirect'}
): Promise<SignInResponseTree | void>;
  
  /**
   * Complete multi-factor authentication
   */
  completeMfaSignIn(mfaToken: string, mfaContext?: any): Promise<SignInResponseTree>;
  
  /**
   * Send a password reset email
   */
  sendPasswordResetEmail(email: string): Promise<void>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;
  
}