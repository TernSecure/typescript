import { cookieHandler } from '@tern-secure/shared/cookie';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

interface AuthUser {
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

const AUTH_COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'strict' as const,
  httpOnly: false, // Since this is client-side
  expires: 7 // 7 days
};

/**
 * AuthService class for managing authentication state and cookies
 * Integrates with Firebase Admin via api.ternsecure.com endpoint
 */
export class AuthService {
  private readonly baseUrl = 'https://api.ternsecure.com';
  private readonly accessTokenHandler = cookieHandler('auth_access_token');
  private readonly refreshTokenHandler = cookieHandler('auth_refresh_token');
  private readonly idTokenHandler = cookieHandler('auth_id_token');
  private readonly userHandler = cookieHandler('auth_user');

  /**
   * Set authentication tokens in cookies
   */
  setAuthTokens(tokens: AuthTokens): void {
    try {
      this.accessTokenHandler.set(tokens.accessToken, AUTH_COOKIE_OPTIONS);
      this.refreshTokenHandler.set(tokens.refreshToken, AUTH_COOKIE_OPTIONS);
      
      if (tokens.idToken) {
        this.idTokenHandler.set(tokens.idToken, AUTH_COOKIE_OPTIONS);
      }
    } catch (error) {
      console.error('Failed to set auth tokens:', error);
      throw new Error('Unable to store authentication tokens');
    }
  }

  /**
   * Get authentication tokens from cookies
   */
  getAuthTokens(): AuthTokens | null {
    try {
      const accessToken = this.accessTokenHandler.get();
      const refreshToken = this.refreshTokenHandler.get();
      const idToken = this.idTokenHandler.get();

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        ...(idToken && { idToken })
      };
    } catch (error) {
      console.error('Failed to get auth tokens:', error);
      return null;
    }
  }

  /**
   * Set user information in cookies
   */
  setUser(user: AuthUser): void {
    try {
      this.userHandler.set(JSON.stringify(user), AUTH_COOKIE_OPTIONS);
    } catch (error) {
      console.error('Failed to set user data:', error);
      throw new Error('Unable to store user information');
    }
  }

  /**
   * Get user information from cookies
   */
  getUser(): AuthUser | null {
    try {
      const userData = this.userHandler.get();
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated by verifying tokens
   */
  isAuthenticated(): boolean {
    const tokens = this.getAuthTokens();
    return tokens !== null && !!tokens.accessToken && !!tokens.refreshToken;
  }

  /**
   * Clear all authentication cookies
   */
  clearAuth(): void {
    try {
      this.accessTokenHandler.remove();
      this.refreshTokenHandler.remove();
      this.idTokenHandler.remove();
      this.userHandler.remove();
    } catch (error) {
      console.error('Failed to clear auth cookies:', error);
    }
  }

  /**
   * Verify token with Firebase Admin via API
   */
  async verifyToken(token?: string): Promise<ApiResponse<AuthUser>> {
    try {
      const tokenToVerify = token || this.accessTokenHandler.get();
      
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
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<ApiResponse<AuthTokens>> {
    try {
      const refreshToken = this.refreshTokenHandler.get();
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Token refresh failed'
        };
      }

      // Update cookies with new tokens
      this.setAuthTokens(data.tokens);

      return {
        success: true,
        data: data.tokens
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        error: 'Network error during token refresh'
      };
    }
  }

  /**
   * Sign out user by clearing cookies and calling API
   */
  async signOut(): Promise<ApiResponse> {
    try {
      const accessToken = this.accessTokenHandler.get();
      
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

  /**
   * Get current access token
   */
  getAccessToken(): string | undefined {
    return this.accessTokenHandler.get();
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | undefined {
    return this.refreshTokenHandler.get();
  }
}

// Create and export a singleton instance
export const authService = new AuthService();