import type { 
  Appearance,
  BaseAuthUIConfig,
  SignInUIConfig,
 } from './theme';
import type { TernSecureUser } from './all';
import type { TernSecureAuthProvider } from 'auth';
import type { 
  AuthErrorTree,
  SignInPropsTree,
  SignInResponseTree,
} from './signin'

export type SessionStatus = 'active' | 'expired' | 'revoked' | 'pending';

export declare interface ParsedToken {
    /** Expiration time of the token. */
    'exp'?: string;
    /** UID of the user. */
    'sub'?: string;
    /** Time at which authentication was performed. */
    'auth_time'?: string;
    /** Issuance time of the token. */
    'iat'?: string;
    /** Firebase specific claims, containing the provider(s) used to authenticate the user. */
    'firebase'?: {
        'sign_in_provider'?: string;
        'sign_in_second_factor'?: string;
        'identities'?: Record<string, string>;
    };
    /** Map of any additional custom claims. */
    [key: string]: unknown;
}

/**
 * Core properties for any session that is or was authenticated.
 * These properties are guaranteed to exist for active, expired, or revoked sessions.
 */
interface AuthenticatedSessionBase {
  /** The Firebase Auth ID token JWT string. */
  token: string;
  /** The ID token expiration time (e.g., UTC string or Unix timestamp). */
  expirationTime: string;
  /** The ID token issuance time. */
  issuedAtTime: string;
  /** Time at which authentication was performed (from token claims). */
  authTime: string;
  /**
  * The entire payload claims of the ID token including the standard reserved claims
  * as well as custom claims.
  */
  claims: ParsedToken;
   /**
   * Time the user last signed in.
   * This could be from Firebase User metadata or persisted by TernSecure.
   */
  lastSignedAt?: number;
}


/**
 * Represents a session when the user is authenticated and the token is considered active.
 */
export interface ActiveSession extends AuthenticatedSessionBase {
  status: 'active';
}

/**
 * Represents a session when the user was authenticated, but the token has expired.
 */
export interface ExpiredSession extends AuthenticatedSessionBase {
  status: 'expired';
}

/**
 * Represents a session when the user was authenticated, but the token has been revoked.
 */
export interface RevokedSession extends AuthenticatedSessionBase {
  status: 'revoked';
}

/**
 * Represents a session that is awaiting some action.
 */
export interface PendingSession extends AuthenticatedSessionBase { 
  status: 'pending';
}


/**
 * Defines the possible states of a user's session within TernSecure.
 * This is a discriminated union based on the `status` property.
 * The actual `TernSecureUser` (Firebase User object) is typically stored separately,
 * for example, in `TernSecureInstanceTree.auth.user`.
 */
export type TernSecureSessionTree = ActiveSession | ExpiredSession | RevokedSession;


export type SignedInSession = ActiveSession | PendingSession | ExpiredSession | RevokedSession;

export type SignUpFormValuesTree = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};

export type SignUpInitialValueTree = Partial<SignUpFormValuesTree>;


/**
 * Sign-up specific UI configuration
 */
export interface SignUpUIConfig extends BaseAuthUIConfig {
  /** Password requirements display configuration */
  passwordRequirements?: {
    show?: boolean;
    rules?: Array<{
      rule: string;
      description: string;
    }>;
  };
  /** Terms and conditions configuration */
  terms?: {
    enabled?: boolean;
    text?: string;
    link?: string;
  };
}


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

type Mode = 'browser' | 'server';

export type TernSecureInstanceTreeOptions = {
  initialSession?: TernSecureSessionTree | null;
  defaultAppearance?: Appearance;
  platform?: {
    defaultLoginRedirectUrl?: string;
    defaultLogoutRedirectUrl?: string;
    oauthRedirectUrl?: string;
  }
  mode?: Mode;
  onAuthStateChanged?: (user: TernSecureUser | null) => void;
  onError?: (error: AuthErrorTree) => void;
  environment?: string | undefined;
  requireverification?: boolean;
}

export type TernSecureInstanceTreeStatus = 'error' | 'loading' | 'ready';

/**
 * Instance interface for managing auth UI state
 */
export interface TernSecureInstanceTree {
  customDomain?: string;
  proxyUrl?: string;
  apiKey?: string;
  projectId?: string;
  environment?: string | undefined;
  mode?: Mode;
  isReady: boolean;
  status: TernSecureInstanceTreeStatus; 
  isVisible: boolean;
  currentView: 'signIn' | 'signUp' | 'verify' | null;
  isLoading: boolean;
  error: Error | null;
  /** Authentication State */
  auth: {
    /** Current authenticated user */
    user: TernSecureUser | null;
    /** Current session information */
    session: SignedInSession | null;
  };

  /** Core Authentication Methods */
  ternAuth: TernSecureAuthProvider;

  /** User Management Methods */
  user: {
    /** Sign out current user */
    signOut: () => Promise<void>;
    /** Get current user's ID token */
    getIdToken: () => Promise<string | null>;
    /** Send email verification */
    sendVerificationEmail: () => Promise<void>;
    /** Create new user account */
    create: (email: string, password: string) => Promise<SignInResponseTree>;
  };

  showSignIn: (targetNode: HTMLDivElement, config?: SignInPropsTree) => void;
  hideSignIn: (targetNode: HTMLDivElement) => void;
  showSignUp: (targetNode: HTMLDivElement, config?: SignUpUIConfig) => void;
  hideSignUp: (targetNode: HTMLDivElement) => void;
  //showVerify: (targetNode: HTMLDivElement) => void;
  //hideVerify: (targetNode: HTMLDivElement) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;

  /** Get redirect result from OAuth flows */
  getRedirectResult: () => Promise<any>;
  /** Check if redirect is needed */
  shouldRedirect: (currentPath: string) => boolean | string;
  /** Construct URL with redirect parameters */
  constructUrlWithRedirect: (baseUrl: string) => string;
  /** Navigate to login page */
  redirectToLogin: (redirectUrl?: string) => void;

  /** Error and Event Handling */
  events: {
    /** Subscribe to auth state changes */
    onAuthStateChanged: (callback: (user: TernSecureUser | null) => void) => () => void;
    /** Subscribe to error events */
    onError: (callback: (error: AuthErrorTree) => void) => () => void;
    /** Status */
    onStatusChanged: (callback: (status: TernSecureInstanceTreeStatus) => void) => () => void;
  };
}
