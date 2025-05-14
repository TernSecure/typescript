import { FirebaseOptions } from 'firebase/app'
import { User as FirebaseUser } from 'firebase/auth'



/**
 * TernSecure User
 */
export type TernSecureUser = FirebaseUser

export type TernSecureUserData = {
  uid: string
  email: string | null
  emailVerified?: boolean
  displayName?: string | null
}


/**
 * TernSecure Firebase configuration interface
 * Extends Firebase's base configuration options
 */
export interface TernSecureConfig extends FirebaseOptions {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string // Optional for analytics
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  config: TernSecureConfig
}


/**
 * TernSecure initialization options
 */
export interface TernSecureOptions {
  /** Environment setting for different configurations */
  environment?: 'development' | 'production'
  /** Geographic region for data storage */
  region?: string
  /** Custom error handler */
  onError?: (error: Error) => void
  /** Debug mode flag */
  debug?: boolean
}

/**
 * Firebase initialization state
 */
export interface FirebaseState {
  /** Whether Firebase has been initialized */
  initialized: boolean
  /** Any initialization errors */
  error: Error | null
  /** Timestamp of last initialization attempt */
  lastInitAttempt?: number
}


/**
 * Firebase Admin configuration interface
 */
export interface TernSecureAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

/**
 * Firebase Admin configuration validation result
 */
export interface AdminConfigValidationResult {
  isValid: boolean
  errors: string[]
  config: TernSecureAdminConfig
}


export interface SignInResponse {
  success: boolean;
  message?: string;
  error?: any | undefined; // Use AuthErrorCode here
  user?: any; // Consider a more specific user type if possible, e.g., TernSecureUserData | null
}

export interface AuthError extends Error {
  code?: any | string // Allow string for other potential errors, or be stricter with just AuthErrorCode
  message: string
  response?: SignInResponse
}

export function isSignInResponse(value: any): value is SignInResponse {
  return typeof value === "object" && "success" in value && typeof value.success === "boolean"
}


export interface TernSecureState {
  userId: string | null
  isLoaded: boolean
  error: Error | null
  isValid: boolean
  isVerified: boolean
  isAuthenticated: boolean
  token: any | null
  email: string | null
  status: "loading" | "authenticated" | "unauthenticated" | "unverified"
  requiresVerification: boolean
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
  onError?: (error: Error) => void
  onSuccess?: () => void
  className?: string
  customStyles?: {
    card?: string
    input?: string
    button?: string
    label?: string
    separator?: string
    title?: string
    description?: string
    socialButton?: string
  }
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


