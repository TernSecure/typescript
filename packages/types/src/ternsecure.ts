import { 
    TernSecureUser 
} from './all';
import { Appearance } from './theme';

export interface TernSecureSession {
  token: string | null;
  expiresAt?: number;
}

type SignInFormValues = {
  email: string;
  password: string;
  phoneNumber?: string;
}

export type SignInInitialValue = Partial<SignInFormValues>;


type SignUpFormValues = {
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
};


export type SignUpInitialValue = Partial<SignUpFormValues>;

export interface SignInResponse {
  success: boolean;
  message?: string;
  error?: any | undefined;
  user?: any;
}

export interface AuthError extends Error {
  code?: any | string 
  message: string
  response?: SignInResponse
}

export function isSignInResponse(value: any): value is SignInResponse {
  return typeof value === "object" && "success" in value && typeof value.success === "boolean"
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<SignInResponse>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  getRedirectResult: () => Promise<any>;
  getIdToken: () => Promise<string | null>;
  createUserWithEmailAndPassword?: (email: string, password: string) => Promise<SignInResponse>;
  sendEmailVerification?: (user: TernSecureUser) => Promise<void>;
}

export interface RedirectConfig {
  // URL to redirect to after successful authentication
  redirectUrl?: string
  // Whether this is a return visit (e.g. after sign out)
  isReturn?: boolean
  // Priority of the redirect (higher number = higher priority)
  priority?: number
}


export interface SignInProps extends RedirectConfig {
  initialValue?: SignInInitialValue;
  logo?: string
  appName?: string
  appearance?: Appearance;
  onError?: (error: AuthError) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
}


/**
 * SignUpProps interface defines the properties for the sign-up component.
 * It extends RedirectConfig to include redirect-related properties.
 */
export interface SignUpProps extends RedirectConfig {
  initialValue?: SignUpInitialValue;
  logo?: string
  appName?: string
  appearance?: Appearance;
  onError?: (error: AuthError) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
}

/**
 * Defines the contract for a TernSecure instance.
 * This instance provides authentication state, user information, and methods
 * for managing the authentication lifecycle. It is designed to be used by
 * UI packages like tern-ui, which act as "dumb" renderers.
 */
export interface TernSecureInstance {
  /** Indicates if the user is currently signed in. */
  isSignedIn: () => boolean;

  /** The current authenticated user object, or null if not signed in. */
  user: TernSecureUser | null;

  /** The current user session information, or null if not signed in. */
  session: TernSecureSession | null;

  /** Initiates the sign-out process for the current user. */
  signOut: () => Promise<void>;

  /**
   * Prepares or signals to mount the sign-in interface.
   * @param options Optional configuration or initial state for the sign-in UI, conforming to SignInProps.
   */
  mountSignIn: (options?: SignInProps) => void;

  /** Cleans up or signals to unmount the sign-in interface. */
  unmountSignIn: () => void;

  /**
   * Prepares or signals to mount the sign-up interface.
   * @param options Optional configuration or initial state for the sign-up UI, conforming to SignUpProps.
   */
  mountSignUp: (options?: SignUpProps) => void;

  /** Cleans up or signals to unmount the sign-up interface. */
  unmountSignUp: () => void;

  /**
   * Determines if a redirect is necessary based on the current authentication
   * state and the given path.
   * @param currentPath The current URL path.
   * @returns True if a redirect is needed, false otherwise, or a string path to redirect to.
   */
  shouldRedirect: (currentPath: string) => boolean | string;

  /**
   * Constructs a URL, appending necessary redirect parameters.
   * Useful for redirecting back to the original page after authentication.
   * @param baseUrl The base URL to which redirect parameters should be added.
   * @returns The new URL string with redirect parameters.
   */
  constructUrlWithRedirect: (baseUrl: string) => string;

  /**
   * Redirects the user to the configured login page.
   * @param redirectUrl Optional URL to redirect to after successful login.
   */
  redirectToLogin: (redirectUrl?: string) => void;

  /** Indicates if an authentication operation is currently in progress. */
  isLoading: boolean;

  /** Holds any error that occurred during an authentication operation, or null otherwise. */
  error: Error | null;
    
  /** Indicates if the user has verified their email address. */
  sendVerificationEmail: () => Promise<void>;
}