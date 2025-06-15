//import { User as FirebaseUser } from 'firebase/auth'



/**
 * TernSecure User
 */
//export type TernSecureUser = FirebaseUser
export interface IdTokenResult {
  authTime: string;
  expirationTime: string;
  issuedAtTime: string;
  signInProvider: string | null;
  signInSecondFactor: string | null;
  token: string;
  claims: Record<string, any>;
}

export interface UserInfo {
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  providerId: string; 
  uid: string;
}

export interface TernSecureUser extends UserInfo {
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: UserInfo[];
  refreshToken: string;
  tenantId: string | null;
  delete(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string>;
  getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult>;
  reload(): Promise<void>;
  toJSON(): object;
}

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
export interface TernSecureConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
  appName?: string
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