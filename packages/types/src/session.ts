export type SessionStatus = 'active' | 'expired' | 'revoked' | 'pending';


/**
 * parsed can be replaced with
 */
//claims: { [key: string]: any } | null

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
  /** signInProvider */
  signInProvider: string;
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
export type TernSecureSessionTree = ActiveSession | ExpiredSession;


export type SignedInSession = ActiveSession | PendingSession | ExpiredSession;


export interface SessionParams {
  idToken: string;
  csrfToken?: string;
}

export interface SessionResult {
  success: boolean;
  message: string;
  expiresIn?: number;
  error?: string;
  cookieSet?: boolean;
}