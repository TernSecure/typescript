import type { 
  Appearance,
  BaseAuthUIConfig,
  SignInUIConfig,
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
  AuthErrorTree,
  SignInPropsTree,
  SignInResponseTree,
} from './signin'

import type { 
  TernSecureSessionTree, 
  SignedInSession 
} from './session';


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
  ternSecureConfig?: TernSecureConfig
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
  ternAuth: TernSecureAuthProvider | undefined;
  
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
    onAuthStateChanged: (callback: (authState: TernSecureState) => void) => () => void;
    /** Subscribe to error events */
    onError: (callback: (error: AuthErrorTree) => void) => () => void;
    /** Status */
    onStatusChanged: (callback: (status: TernSecureInstanceTreeStatus) => void) => () => void;
  };
}
