import type { 
  Appearance,
  SignInUIConfig,
  SignUpUIConfig
 } from './theme';
import type { 
  TernSecureConfig, 
  TernSecureUser 
} from './all';
import type { 
  TernSecureAuthProvider, 
  TernSecureState 
} from 'auth';
import type { 
  TernSecureSessionTree, 
  SignedInSession 
} from './session';
import type {
  AuthErrorTree
} from './errors';
import type {
  RedirectOptions,
  SignInRedirectUrl,
  SignUpRedirectUrl
} from './redirect';
import type { 
  SignInInitialValueTree 
} from './signIn';



type Mode = 'browser' | 'server';


export type TernSecureInstanceTreeOptions = {
  initialSession?: TernSecureSessionTree | null;
  defaultAppearance?: Appearance;
  signInUrl?: string;
  signUpUrl?: string;
  mode?: Mode;
  onAuthStateChanged?: (user: TernSecureUser | null) => void;
  onError?: (error: AuthErrorTree) => void;
  environment?: string | undefined;
  requireverification?: boolean;
  isTernSecureDev?: boolean;
  ternSecureConfig?: TernSecureConfig
} & SignInRedirectUrl & SignUpRedirectUrl;

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
  ternAuth: TernSecureAuthProvider | undefined;
  
  showSignIn: (targetNode: HTMLDivElement, config?: SignInPropsTree) => void;
  hideSignIn: (targetNode: HTMLDivElement) => void;
  showSignUp: (targetNode: HTMLDivElement, config?: SignUpPropsTree) => void;
  hideSignUp: (targetNode: HTMLDivElement) => void;
  showUserButton: (targetNode: HTMLDivElement) => void;
  hideUserButton: (targetNode: HTMLDivElement) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;

  /** Get redirect result from OAuth flows */
  getRedirectResult: () => Promise<any>;
  /** Check if redirect is needed */
  shouldRedirect: (currentPath: string) => boolean | string;
  /** Construct URL with redirect parameters */
  constructUrlWithRedirect: (to: string) => string;
  /** Navigate to SignIn page */
  redirectToSignIn(options?: SignInRedirectOptions): Promise<unknown>;
  /** Navigate to SignUp page */
  redirectToSignUp(options?: SignUpRedirectOptions): Promise<unknown>;

  redirectAfterSignIn: () => void;
  
  redirectAfterSignUp: () => void;

  /** Error and Event Handling */
  events: {
    /** Subscribe to auth state changes */
    onAuthStateChanged: (callback: (authState: TernSecureState) => void) => () => void;
    /** Subscribe to error events */
    onError: (callback: (error: AuthErrorTree) => void) => () => void;
    /** Status */
    onStatusChanged: (callback: (status: TernSecureInstanceTreeStatus) => void) => () => void;
  };
}

export type SignUpFormValuesTree = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};

export type SignUpInitialValueTree = Partial<SignUpFormValuesTree>;

/**
 * Props for SignIn component focusing on UI concerns
 */
export type SignInPropsTree = {
  /** URL to navigate to after successfully sign-in */
  forceRedirectUrl?: string | null;
  /** Initial form values */
  initialValue?: SignInInitialValueTree;
  /** UI configuration */
  ui?: SignInUIConfig;
  /** Callbacks */
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
} & SignUpRedirectUrl


/**
 * Props for SignUp component focusing on UI concerns
 */
export type SignUpPropsTree = {
  /** URL to navigate to after successfully sign-up */
  forceRedirectUrl?: string | null;
  /** Initial form values */
  initialValue?: SignUpInitialValueTree;
  /** UI configuration */
  ui?: SignUpUIConfig;
  /** Callbacks */
  onSubmit?: (values: SignUpFormValuesTree) => Promise<void>;
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
} & SignInRedirectUrl

export type SignInRedirectOptions = RedirectOptions
export type SignUpRedirectOptions = RedirectOptions;
