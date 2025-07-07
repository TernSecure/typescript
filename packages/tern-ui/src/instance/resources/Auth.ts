import { cookieHandler, type CookieAttributes } from '@tern-secure/shared/cookie';
import type { SessionResult } from '@tern-secure/types';

const SESSION_COOKIE_NAME = '_session_cookie';
const CSRF_COOKIE_NAME = '__session_terncf';


type AuthToken = {
  idToken: string | null;
}

type CSRFToken = {
  token: string | null;
}


type CookieOptions = CookieAttributes


const CSRF_COOKIE_OPTIONS: CookieOptions = {
  secure: true,
  sameSite: 'strict',
  expires: 1 / 24 //1 hour
};

/**
 * AuthCookieManger class for managing authentication state and cookies
 */
export class AuthCookieManager {
  private readonly baseUrl: string;
  private readonly csrfCookieHandler = cookieHandler(CSRF_COOKIE_NAME);
  private readonly sessionCookieHandler = cookieHandler(SESSION_COOKIE_NAME);

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.getApiEndpoint();
    console.log('[AuthCookieManager] Initialized with base URL:', this.baseUrl);
    this.ensureCSRFToken();
  }
  
  private getApiEndpoint(): string {
    const isLocalhost = window.location.hostname === 'localhost';
    return isLocalhost ? 'http://localhost:3000/api' : `${window.location.origin}/api`;
  }

  private async validateApiEndpoint(): Promise<void> {
    try {
      const testResponse = await fetch(`${this.baseUrl}/session`, {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!testResponse.ok && testResponse.status === 404) {
        const error = new Error(`API endpoint not found: Please create: ${this.baseUrl}/session\n\nExample:\n// app/api/session/route.ts\nimport { createSessionHandler } from '@tern-secure/nextjs/admin'\nexport const POST = createSessionHandler`);
        console.error('[AuthCookieManager] API endpoint validation failed:', error);
        throw error;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error(`Cannot connect to session API at ${this.baseUrl}/session. Please check your API configuration.`);
        console.error('[AuthCookieManager] Network error:', networkError);
        throw networkError;
      }
      throw error;
    }

  }
  
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private ensureCSRFToken(): string {
    let ctoken = this.getCSRFToken();
    if (!ctoken) {
      ctoken = this.generateCSRFToken();
      this.setCSRFToken({ token: ctoken });
    }
    return ctoken;
  }
  
  createSessionCookie = async(token: string): Promise<SessionResult> => {
    try {
      console.log('[AuthCookieManager] Starting session cookie creation');

      await this.validateApiEndpoint();
      const csrfToken = this.ensureCSRFToken();

      const req = await fetch (`${this.baseUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          idToken: token,
          csrfToken: csrfToken
        }),
        credentials: 'include'
      });

      console.log('[AuthCookieManager] Session API response:', req.status, req.statusText);
      
      if (!req.ok) {
        console.warn('[AuthCookieManager] Session cookie creation failed API request failed');
        return {
          success: false,
          message: 'Failed to create session cookie',
          error: 'API request failed',
        }
      }

      const res = await req.json();

      if (!res.success) {
        console.error('[AuthCookieManager] Session creation unsuccessful:', {
          error: res.error,
          message: res.message,
          cookieSet: res.cookieSet
        });
        return res;
      }

      if (res.cookieSet === false) {
        console.warn('[AuthCookieManager] Session created but cookie not set:', res);
        return {
          success: false,
          message: 'Session created but cookie not set properly',
          error: 'COOKIE_SET_FAILED',
          cookieSet: false,
        };
      }

      console.log('[AuthCookieManager] Session cookie created successfully');
      return {
        success: true,
        message: 'Session cookie created successfully',
        expiresIn: res.expiresIn,
        cookieSet: true,
      };

    } catch (error) {
      console.error('Failed to create session cookie:', error);
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          return {
            success: false,
            message: 'Session API endpoint not found',
            error: 'ENDPOINT_NOT_FOUND',
          }
        }
      }
      return {
        success: false,
        message: 'Failed to create session cookie',
        error: 'Unknown error',
      }
    }
  };


  /**
   * Set authentication tokens in cookies
   */
  setSessionCookie(token: AuthToken): void {
    try {
      if (token.idToken) {
        this.sessionCookieHandler.set(token.idToken, CSRF_COOKIE_OPTIONS);
      }
    } catch (error) {
      console.error('Failed to set auth tokens:', error);
      throw new Error('Unable to store authentication tokens');
    }
  }

  /**
   * Get authentication tokens from cookies
   */
  getSessionCookie(): string | undefined {
    try {
      return this.sessionCookieHandler.get();
    } catch (error) {
      console.error('Failed to get auth tokens:', error);
      return undefined
    }
  }

  /**
   * Set CSRFcookie
   */

  setCSRFToken(token: CSRFToken): void {
    try {
      if (token.token) {
        this.csrfCookieHandler.set(token.token, CSRF_COOKIE_OPTIONS);
      }
    } catch (error) {
      console.error('Failed to set CSRF token:', error);
      throw new Error('Unable to store CSRF token');
    }
  }

  /**
   * Get CSRF token from cookies
   */
  getCSRFToken(): string | undefined {
    try {
      return this.csrfCookieHandler.get();
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return undefined;
    }
  }


  /**
   * Clear all authentication cookies
   */
  clearAuth(): void {
    try {
      this.sessionCookieHandler.remove();
      this.csrfCookieHandler.remove();
    } catch (error) {
      console.error('Failed to clear auth cookies:', error);
    }
  }

  /**
   * Check if user has valid session cookie
   */
  hasValidSession(): boolean {
    const sessionToken = this.getSessionCookie();
    return !!sessionToken;
  }
}