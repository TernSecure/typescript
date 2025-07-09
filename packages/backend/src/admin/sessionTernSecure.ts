'use server'

import { adminTernSecureAuth as adminAuth } from '../utils/admin-init';
import {
  handleFirebaseAuthError, 
  type AuthErrorResponse, 
  type SessionParams, 
  type SessionResult,
  type CookieStore,
} from '@tern-secure/types';

interface FirebaseAuthError extends Error {
  code?: string;
}

export interface User {
    uid: string | null;
    email: string | null;
  }

export interface Session {
    user: User | null;
    token: string | null;
    error: Error | null;
}

interface TernVerificationResult extends User {
  valid: boolean
  authTime?: number
  error?: AuthErrorResponse
}

const SESSION_CONSTANTS = {
  COOKIE_NAME: '_session_cookie',
  DEFAULT_EXPIRES_IN_MS: 60 * 60 * 24 * 5 * 1000, // 5 days
  DEFAULT_EXPIRES_IN_SECONDS: 60 * 60 * 24 * 5,
  REVOKE_REFRESH_TOKENS_ON_SIGNOUT: false,
} as const;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as const;



export async function createSessionCookie(params: SessionParams | string, cookieStore: CookieStore): Promise<SessionResult> {
  try {
    let decodedToken;
    let sessionCookie;

    // Handle both old string format and new object format for backward compatibility
    const idToken = typeof params === 'string' ? params : params.idToken;
    
    if (!idToken) {
      const error = new Error('ID token is required for session creation');
      console.error('[createSessionCookie] Missing ID token:', error);
      return {
        success: false,
        message: 'ID token is required',
        error: 'INVALID_TOKEN',
        cookieSet: false
      };
    }

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      console.error('[createSessionCookie] ID token verification failed:', verifyError);
      const authError = handleFirebaseAuthError(verifyError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false
      };
    }
    
    if (!decodedToken) {
      const error = new Error('Invalid ID token - verification returned null');
      console.error('[createSessionCookie] Token verification returned null:', error);
      return {
        success: false,
        message: 'Invalid ID token',
        error: 'INVALID_TOKEN',
        cookieSet: false
      };
    }

    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { 
        expiresIn: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_MS 
      });
    } catch (sessionError) {
      console.error('[createSessionCookie] Firebase session cookie creation failed:', sessionError);
      const authError = handleFirebaseAuthError(sessionError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        cookieSet: false
      };
    }

    // Set the cookie and verify it was set
    let cookieSetSuccessfully = false;
    try {
      //const cookieStore = await cookies();
      cookieStore.set(SESSION_CONSTANTS.COOKIE_NAME, sessionCookie, {
        maxAge: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_SECONDS,
        ...COOKIE_OPTIONS,
      });

      // Verify the cookie was actually set
      const verifySetCookie = await cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);
      cookieSetSuccessfully = !!verifySetCookie?.value;
      
      if (!cookieSetSuccessfully) {
        const error = new Error('Session cookie was not set successfully');
        console.error('[createSessionCookie] Cookie verification failed:', error);
        throw error;
      }

    } catch (cookieError) {
      console.error('[createSessionCookie] Failed to set session cookie:', cookieError);
      return {
        success: false,
        message: 'Failed to set session cookie',
        error: 'COOKIE_SET_FAILED',
        cookieSet: false
      };
    }

    console.log(`[createSessionCookie] Session cookie created successfully for user: ${decodedToken.uid}`);
    return {
      success: true,
      message: 'Session created successfully',
      expiresIn: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_SECONDS,
      cookieSet: cookieSetSuccessfully
    };

  } catch (error) {
    console.error('[createSessionCookie] Unexpected error:', error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to create session',
      error: authError.code || 'INTERNAL_ERROR',
      cookieSet: false
    };
  }
}


export async function clearSessionCookie(cookieStore: CookieStore): Promise<SessionResult> {
  try {
    const sessionCookie = await cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);

    // Delete all session-related cookies
    await cookieStore.delete(SESSION_CONSTANTS.COOKIE_NAME);
    await cookieStore.delete('_session_token');
    await cookieStore.delete('_session');

    // Try to revoke refresh tokens if we have a valid session
    if (SESSION_CONSTANTS.REVOKE_REFRESH_TOKENS_ON_SIGNOUT && sessionCookie?.value) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value);
        await adminAuth.revokeRefreshTokens(decodedClaims.uid);
        console.log(`[clearSessionCookie] Successfully revoked tokens for user: ${decodedClaims.uid}`);
      } catch (revokeError) {
        console.error('[clearSessionCookie] Failed to revoke refresh tokens:', revokeError);
      }
    }

    console.log('[clearSessionCookie] Session cookies cleared successfully');
    return {
      success: true,
      message: 'Session cleared successfully',
      cookieSet: false
    };

  } catch (error) {
    console.error('[clearSessionCookie] Unexpected error:', error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to clear session',
      error: authError.code || 'INTERNAL_ERROR',
      cookieSet: false
    };
  }
}



