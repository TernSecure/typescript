import { cookieHandler, type CookieAttributes } from '@tern-secure/shared/cookie';

const SESSION_COOKIE_NAME = '_session_cookie';
const CSRF_COOKIE_NAME = '__session_terncf';


type AuthToken = {
  idToken: string | null;
}

type CSRFToken = {
  token: string | null;
}

type AuthUser = {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

type CookieOptions = CookieAttributes


const CSRF_COOKIE_OPTIONS: CookieOptions = {
  secure: true,
  sameSite: 'strict',
  expires: 1 / 24 //1 hour
};

/**
 * AuthService class for managing authentication state and cookies
 * Integrates with Firebase Admin via api.ternsecure.com endpoint
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
  
  createSessionCookie = async(token: string): Promise<void> => {
    try {
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

      console.log('Response status:', req.status, req.statusText);
      
      if (!req.ok) {
        throw new Error('Failed to create session cookie');
      }

      const res = await req.json();

      if (!res.success) {
        throw new Error(res.message || 'Failed to create session cookie');
      }
    } catch (error) {
      console.error('Failed to create session cookie:', error);
      throw error;
    }
  }


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

  /**
   * Verify token with Firebase Admin via API
   */
  async verifyToken(token?: string): Promise<ApiResponse<AuthUser>> {
    try {
      const tokenToVerify = token
      
      if (!tokenToVerify) {
        return {
          success: false,
          error: 'No token provided'
        };
      }

      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Token verification failed'
        };
      }

      return {
        success: true,
        data: data.user
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        success: false,
        error: 'Network error during token verification'
      };
    }
  }


  /**
   * Sign out user by clearing cookies and calling API
   */
  async signOut(): Promise<ApiResponse> {
    try {
      const accessToken = this.getSessionCookie();
      
      // Clear cookies first
      this.clearAuth();

      // Call API to invalidate tokens on server
      if (accessToken) {
        await fetch(`${this.baseUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear cookies even if API call fails
      this.clearAuth();
      return {
        success: false,
        error: 'Sign out completed locally but server notification failed'
      };
    }
  }
}