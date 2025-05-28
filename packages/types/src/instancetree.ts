import { Appearance } from './theme';
import { TernSecureUser } from './all';

export interface TernSecureSessionTree {
  token: string | null;
  expiresAt?: number;
}

export type SignInFormValuesTree = {
  email: string;
  password: string;
  phoneNumber?: string;
};

export type SignInInitialValueTree = Partial<SignInFormValuesTree>;

export type SignUpFormValuesTree = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};

export type SignUpInitialValueTree = Partial<SignUpFormValuesTree>;

export interface SignInResponseTree {
  success: boolean;
  message?: string;
  error?: any | undefined;
  user?: any;
}

export interface AuthErrorTree extends Error {
  code?: any | string;
  message: string;
  response?: SignInResponseTree;
}

export function isSignInResponseTree(value: any): value is SignInResponseTree {
  return (
    typeof value === 'object' &&
    'success' in value &&
    typeof value.success === 'boolean'
  );
}

/**
 * Base UI configuration shared between SignIn and SignUp
 */
export interface BaseAuthUIConfig {
  /** Visual appearance configuration */
  appearance?: Appearance;
  /** Application logo URL or SVG string */
  logo?: string;
  /** Application name for display */
  appName?: string;
  /** Render mode for cross-platform support */
  renderMode?: 'modal' | 'page' | 'embedded';
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
  /** Custom loading message */
  loadingMessage?: string;
  /** Loading spinner variant */
  loadingSpinnerVariant?: 'circular' | 'linear' | 'dots';
  /** Accessibility configuration */
  a11y?: {
    /** ARIA labels and descriptions */
    labels?: Record<string, string>;
    /** Element to receive initial focus */
    initialFocus?: string;
    /** Whether to trap focus within the auth UI */
    trapFocus?: boolean;
  };
}

/**
 * Sign-in specific UI configuration
 */
export interface SignInUIConfig extends BaseAuthUIConfig {
  /** Social sign-in buttons configuration */
  socialButtons?: {
    google?: boolean;
    microsoft?: boolean;
    layout?: 'vertical' | 'horizontal';
    size?: 'small' | 'medium' | 'large';
  };
  /** "Remember me" checkbox configuration */
  rememberMe?: {
    enabled?: boolean;
    defaultChecked?: boolean;
  };
  /** Sign-up link configuration */
  signUpLink?: {
    enabled?: boolean;
    text?: string;
    href?: string;
  };
}

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
  /** The actual sign-in methods */
  signIn: TernSecureInstanceTree['signIn'];
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
  /** The sign-in methods, potentially for linking to sign-in or other shared auth actions */
  signIn: TernSecureInstanceTree['signIn'];
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
    session: TernSecureSessionTree | null;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Whether email verification is required */
    requiresVerification?: boolean;
  };

  /** Core Authentication Methods */
  signIn: {
    /** Email/password sign in */
    withEmail: (email: string, password: string) => Promise<SignInResponseTree>;
    /** Google OAuth sign in */
    withGoogle: () => Promise<void>;
    /** Microsoft OAuth sign in */
    withMicrosoft: () => Promise<void>;
  };

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

  showSignIn: (targetNode: HTMLDivElement, config?: SignInUIConfig) => void;
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
