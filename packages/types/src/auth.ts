import type { TernSecureUser } from './all';
import type { 
    SignInFormValuesTree, 
    SignInResponseTree
} from './signin';

export type AuthProviderStatus = 'idle' | 'pending' | 'error' | 'success';

export interface TernSecureAuthProvider {
  /** Current status of the auth provider */
  status?: AuthProviderStatus;

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
  
  /**
   * Get ID token for the current user
   */
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
  
  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: TernSecureUser | null) => void): () => void;
}