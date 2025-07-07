'use server'

import { cookies } from 'next/headers';
import { adminTernSecureAuth as adminAuth } from '../utils/admin-init';
import { handleFirebaseAuthError, type AuthErrorResponse, type SessionParams, type SessionResult } from '@tern-secure/types';

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


// DRY Constants
const SESSION_CONSTANTS = {
  COOKIE_NAME: '_session_cookie',
  DEFAULT_EXPIRES_IN_MS: 60 * 60 * 24 * 5 * 1000, // 5 days
  DEFAULT_EXPIRES_IN_SECONDS: 60 * 60 * 24 * 5,
} as const;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as const;



export async function createSessionCookie(params: SessionParams | string): Promise<SessionResult> {
  try {
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

    // Verify the ID token first
    let decodedToken;
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

    // Create session cookie
    let sessionCookie;
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
      const cookieStore = await cookies();
      cookieStore.set(SESSION_CONSTANTS.COOKIE_NAME, sessionCookie, {
        maxAge: SESSION_CONSTANTS.DEFAULT_EXPIRES_IN_SECONDS,
        ...COOKIE_OPTIONS,
      });

      // Verify the cookie was actually set
      const verifySetCookie = cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);
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



export async function getServerSessionCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('_session_cookie')?.value;

  if (!sessionCookie) {
    throw new Error('No session cookie found')
  }
    
  try {
    const decondeClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return {
      token: sessionCookie,
      userId: decondeClaims.uid
    }
  } catch (error) {
    console.error('Error verifying session:', error)
    throw new Error('Invalid Session')
  }
}


export async function getIdToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('_session_token')?.value;

  if (!token) {
    throw new Error('No session cookie found')
  }
    
  try {
    const decodedClaims = await adminAuth.verifyIdToken(token)
    return {
      token: token,
      userId: decodedClaims.uid
    }
  } catch (error) {
    console.error('Error verifying session:', error)
    throw new Error('Invalid Session')
  }
}

export async function setServerSession(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    return { success: true, message: 'Session created' };
  } catch {
    return { success: false, message: 'Failed to create session' };
  }
}

  export async function verifyTernIdToken(token: string): Promise<TernVerificationResult> {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return {
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        authTime: decodedToken.auth_time
      };
    } catch (error) {
      const errorResponse = handleFirebaseAuthError(error)
      return {
        valid: false,
        uid: null,
        email: null,
        error: errorResponse
      };
    }
  }
  

  export async function verifyTernSessionCookie(session: string): Promise<TernVerificationResult>{
    try {
      const res = await adminAuth.verifySessionCookie(session);
      return { 
          valid: true, 
          uid: res.uid,
          email: res.email || null,
          authTime: res.auth_time
        };
    } catch (error) {
      const errorResponse = handleFirebaseAuthError(error)
      return {
        valid: false, 
        uid: null,
        email: null,
        error: errorResponse
      };
    }
  }


  export async function clearSessionCookie() {
    const cookieStore = await cookies()
    
    cookieStore.delete('_session_cookie')
    cookieStore.delete('_session_token')
    cookieStore.delete('_session')
  
    try {
      // Verify if there's an active session before revoking
      const sessionCookie = cookieStore.get('_session_cookie')?.value
      if (sessionCookie) {
        // Get the decoded claims to get the user's ID
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie)
        
        // Revoke all sessions for the user
        await adminAuth.revokeRefreshTokens(decodedClaims.uid)
      }
      
      return { success: true, message: 'Session cleared successfully' }
    } catch (error) {
      console.error('Error clearing session:', error)
      // Still return success even if revoking fails, as cookies are cleared
      return { success: true, message: 'Session cookies cleared' }
    }
  }



/*
  export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value
  
    if (!sessionCookie) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 })
    }
  
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
      return NextResponse.json({ isAuthenticated: true, user: decodedClaims }, { status: 200 })
    } catch (error) {
      console.error('Error verifying session cookie:', error)
      return NextResponse.json({ isAuthenticated: false }, { status: 401 })
    }
  }

*/