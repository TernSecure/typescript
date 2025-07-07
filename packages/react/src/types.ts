//import { FirebaseOptions } from 'firebase/app'
//import { User as FirebaseUser } from 'firebase/auth'
import type { 
  TernSecureInstanceTree,
  TernSecureInstanceTreeOptions,
  TernSecureConfig,
  TernSecureState,
 } from '@tern-secure/types'

declare global {
  interface Window {
    apiKey?: string;
    customDomain?: TernSecureInstanceTree['customDomain'];
    proxyUrl?: TernSecureInstanceTree['proxyUrl'];
    projectId?: TernSecureInstanceTree['projectId'];
  }
}

/**
 * TernSecure User
 */
//export type TernSecureUser = FirebaseUser

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
{/*export interface TernSecureConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}*/}

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

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  //config: TernSecureConfig
}

/**
 * TernSecureAuthState
 */

export type TernSecureAuthState =  {
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

/**
 * TernSecureInitialState
 */

export type initialState = {
  userId: string | null
  sessionId: string | undefined
}

export interface BrowserConstructor {
  new (customDomain?: string): Browser;
}


export interface HeadlessUIBrowserConstructor {
  new (customDomain?: string): HeadlessUIBrowser;
}
/**
 * TernSecureProviderProps
 * @param interface
 */

export type TernSecureProviderProps = IsomorphicTernSecureOptions & {
    children: React.ReactNode
    initialState?: TernSecureState
    loadingComponent?: React.ReactNode
    bypassApiKey?: boolean
}

export interface HeadlessUIBrowser extends TernSecureInstanceTree {
  load: (options?: TernSecureInstanceTreeOptions) => Promise<void>;
  setTernAuth: (provider: any) => void;
}

export interface Browser extends HeadlessUIBrowser {
  onComponentsReady: Promise<void>;
  components: any;
}

export type TernSecureProps = 
  | HeadlessUIBrowserConstructor
  | HeadlessUIBrowser 
  | Browser 
  | BrowserConstructor 
  | null 
  | undefined

export type IsomorphicTernSecureOptions = TernSecureInstanceTreeOptions & {
  TernSecure?: TernSecureProps;
  apiKey?: string;
  customDomain?: string;
  proxyUrl?: string;
  projectId?: string;
  ternSecureConfig?: TernSecureConfig;
}