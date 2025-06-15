export type ErrorCode = keyof typeof ERRORS

export interface AuthErrorResponse {
  success: false
  message: string
  code: ErrorCode
}

export interface AuthErrorTree extends Error {
  code?: any | string;
  message: string;
  response?: any | string;
}

export interface SignInResponseTree {
  success: boolean;
  message?: string;
  error?: any | undefined;
  user?: any;
}

export const ERRORS = {
  SERVER_SIDE_INITIALIZATION: "TernSecure must be initialized on the client side",
  REQUIRES_VERIFICATION: "AUTH_REQUIRES_VERIFICATION",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNVERIFIED: "UNVERIFIED",
  NOT_INITIALIZED: "TernSecure services are not initialized. Call initializeTernSecure() first",
  HOOK_CONTEXT: "Hook must be used within TernSecureProvider",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_DISABLED: "USER_DISABLED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  POPUP_BLOCKED: "POPUP_BLOCKED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "An unknown error occurred.",
  INVALID_ARGUMENT: "Invalid argument provided.",
  USER_NOT_FOUND: "auth/user-not-found",
  WRONG_PASSWORD: "auth/wrong-password",
  EMAIL_ALREADY_IN_USE: "auth/email-already-in-use",
  REQUIRES_RECENT_LOGIN: "auth/requires-recent-login",
  NO_SESSION_COOKIE: "No session cookie found.",
  INVALID_SESSION_COOKIE: "Invalid session cookie.",
  NO_ID_TOKEN: "No ID token found.",
  INVALID_ID_TOKEN: "Invalid ID token.",
  REDIRECT_LOOP: "Redirect loop detected.",
} as const

export type AuthErrorCode = keyof typeof ERRORS

// Firebase Auth Error Code patterns
const ERROR_PATTERNS = {
  INVALID_EMAIL: /auth.*invalid.*email|invalid.*email.*auth|Firebase:.*Error.*auth\/invalid-email/i,
  INVALID_CREDENTIALS:
    /auth.*invalid.*credential|invalid.*password|wrong.*password|Firebase:.*Error.*auth\/(invalid-credential|wrong-password|user-not-found)/i,
  USER_DISABLED: /user.*disabled|disabled.*user|Firebase:.*Error.*auth\/user-disabled/i,
  TOO_MANY_ATTEMPTS: /too.*many.*attempts|too.*many.*requests|Firebase:.*Error.*auth\/too-many-requests/i,
  NETWORK_ERROR: /network.*request.*failed|failed.*network|Firebase:.*Error.*auth\/network-request-failed/i,
  OPERATION_NOT_ALLOWED: /operation.*not.*allowed|method.*not.*allowed|Firebase:.*Error.*auth\/operation-not-allowed/i,
  POPUP_BLOCKED: /popup.*blocked|blocked.*popup|Firebase:.*Error.*auth\/popup-blocked/i,
  EMAIL_EXISTS: /email.*exists|email.*already.*use|Firebase:.*Error.*auth\/email-already-in-use/i,
  EXPIRED_TOKEN: /token.*expired|expired.*token|Firebase:.*Error.*auth\/expired-token/i,
  INVALID_TOKEN: /invalid.*token|token.*invalid|Firebase:.*Error.*auth\/invalid-token/i,
  SESSION_EXPIRED: /session.*expired|expired.*session|Firebase:.*Error.*auth\/session-expired/i,
  WEAK_PASSWORD: /weak.*password|password.*weak|Firebase:.*Error.*auth\/weak-password/i,
} as const

export class TernSecureError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message || code)
    this.name = "TernSecureError"
    this.code = code
  }
}

interface SerializedFirebaseError {
  name?: string
  code?: string
  message?: string
  stack?: string
}

/**
 * Determines if an object matches the shape of a Firebase Error
 */
function isFirebaseErrorLike(error: unknown): error is SerializedFirebaseError {
  if (!error || typeof error !== "object") return false

  const err = error as SerializedFirebaseError

  // Check for bundled Firebase error format: "Firebase: Error (auth/error-code)"
  if (typeof err.message === "string") {
    const bundledErrorMatch = err.message.match(/Firebase:\s*Error\s*$$auth\/([^)]+)$$/)
    if (bundledErrorMatch) {
      // Add the extracted code to the error object
      err.code = `auth/${bundledErrorMatch[1]}`
      return true
    }
  }

  return (
    (typeof err.code === "string" && err.code.startsWith("auth/")) ||
    (typeof err.name === "string" && err.name.includes("FirebaseError"))
  )
}

/**
 * Extracts the error code from a Firebase-like error object
 */
function extractFirebaseErrorCode(error: SerializedFirebaseError): string {
  // First try to extract from bundled error message format
  if (typeof error.message === "string") {
    const bundledErrorMatch = error.message.match(/Firebase:\s*Error\s*$$auth\/([^)]+)$$/)
    if (bundledErrorMatch) {
      return bundledErrorMatch[1]
    }
  }

  // Then try the standard code property
  if (error.code) {
    return error.code.replace("auth/", "")
  }

  // Finally try to extract from error message if it contains an error code
  if (typeof error.message === "string") {
    const messageCodeMatch = error.message.match(/auth\/([a-z-]+)/)
    if (messageCodeMatch) {
      return messageCodeMatch[1]
    }
  }

  return ""
}

/**
 * Maps a Firebase error code to our internal error code
 */
function mapFirebaseErrorCode(code: string): ErrorCode {
  // Direct mapping for known error codes
  const directMappings: Record<string, ErrorCode> = {
    "invalid-email": "INVALID_EMAIL",
    "user-disabled": "USER_DISABLED",
    "too-many-requests": "TOO_MANY_ATTEMPTS",
    "network-request-failed": "NETWORK_ERROR",
    "operation-not-allowed": "OPERATION_NOT_ALLOWED",
    "popup-blocked": "POPUP_BLOCKED",
    "email-already-in-use": "EMAIL_EXISTS",
    "weak-password": "WEAK_PASSWORD",
    "invalid-credential": "INVALID_CREDENTIALS",
    "wrong-password": "INVALID_CREDENTIALS",
    "user-not-found": "INVALID_CREDENTIALS",
    "invalid-password": "INVALID_CREDENTIALS",
    "user-token-expired": "EXPIRED_TOKEN",
    "invalid-id-token": "INVALID_TOKEN",
  }

  return directMappings[code] || "INTERNAL_ERROR"
}

/**
 * Determines error type based on error message pattern matching
 */
function determineErrorTypeFromMessage(message: string): ErrorCode {
  // First check for bundled Firebase error format
  const bundledErrorMatch = message.match(/Firebase:\s*Error\s*$$auth\/([^)]+)$$/)
  if (bundledErrorMatch) {
    const errorCode = bundledErrorMatch[1]
    const mappedCode = mapFirebaseErrorCode(errorCode)
    if (mappedCode) {
      return mappedCode
    }
  }

  // Then check standard patterns
  for (const [errorType, pattern] of Object.entries(ERROR_PATTERNS)) {
    if (pattern.test(message)) {
      return errorType as ErrorCode
    }
  }

  return "INTERNAL_ERROR"
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(code: ErrorCode, message: string): AuthErrorResponse {
  const defaultMessages: Record<ErrorCode, string> = {
    INVALID_EMAIL: "Invalid email format",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_DISABLED: "This account has been disabled",
    TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later",
    NETWORK_ERROR: "Network error. Please check your connection",
    OPERATION_NOT_ALLOWED: "This login method is not enabled",
    POPUP_BLOCKED: "Login popup was blocked. Please enable popups",
    EMAIL_EXISTS: "This email is already in use",
    EXPIRED_TOKEN: "Your session has expired. Please login again",
    INVALID_TOKEN: "Invalid authentication token",
    SESSION_EXPIRED: "Your session has expired",
    WEAK_PASSWORD: "Password is too weak",
    EMAIL_NOT_VERIFIED: "Email verification required",
    INTERNAL_ERROR: "An internal error occurred. Please try again",
    SERVER_SIDE_INITIALIZATION: "TernSecure must be initialized on the client side",
    REQUIRES_VERIFICATION: "Email verification required",
    AUTHENTICATED: "Already authenticated",
    UNAUTHENTICATED: "Authentication required",
    UNVERIFIED: "Email verification required",
    NOT_INITIALIZED: "TernSecure services are not initialized",
    HOOK_CONTEXT: "Hook must be used within TernSecureProvider",
    UNKNOWN_ERROR: "An unknown error occurred.",
    INVALID_ARGUMENT: "Invalid argument provided.",
    USER_NOT_FOUND: "User not found.",
    WRONG_PASSWORD: "Wrong password.",
    EMAIL_ALREADY_IN_USE: "Email already in use.",
    REQUIRES_RECENT_LOGIN: "Requires recent login.",
    NO_SESSION_COOKIE: "No session cookie found.",
    INVALID_SESSION_COOKIE: "Invalid session cookie.",
    NO_ID_TOKEN: "No ID token found.",
    INVALID_ID_TOKEN: "Invalid ID token.",
    REDIRECT_LOOP: "Redirect loop detected.",
  }

  return {
    success: false,
    message: message || defaultMessages[code],
    code,
  }
}

/**
 * Handles Firebase authentication errors with multiple fallback mechanisms
 */
export function handleFirebaseAuthError(error: unknown): AuthErrorResponse {
  // Helper to extract clean error code from bundled format
  function extractErrorInfo(input: unknown): { code: string; message: string } | null {
    // Case 1: String input (direct Firebase error message)
    if (typeof input === 'string') {
      const match = input.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
      if (match) {
        return { code: match[1], message: input };
      }
    }

    // Case 2: Error object
    if (input && typeof input === 'object') {
      const err = input as { code?: string; message?: string };
      
      // Check for bundled message format first
      if (err.message) {
        const match = err.message.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
        if (match) {
          return { code: match[1], message: err.message };
        }
      }

      // Check for direct code
      if (err.code) {
        return {
          code: err.code.replace('auth/', ''),
          message: err.message || ''
        };
      }
    }

    return null;
  }

  // Map error codes to user-friendly messages
  const ERROR_MESSAGES: Record<string, { message: string; code: ErrorCode }> = {
    'invalid-email': { message: 'Invalid email format', code: 'INVALID_EMAIL' },
    'invalid-credential': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'invalid-login-credentials': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'wrong-password': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'user-not-found': { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    'user-disabled': { message: 'This account has been disabled', code: 'USER_DISABLED' },
    'too-many-requests': { message: 'Too many attempts. Please try again later', code: 'TOO_MANY_ATTEMPTS' },
    'network-request-failed': { message: 'Network error. Please check your connection', code: 'NETWORK_ERROR' },
    'email-already-in-use': { message: 'This email is already in use', code: 'EMAIL_EXISTS' },
    'weak-password': { message: 'Password is too weak', code: 'WEAK_PASSWORD' },
    'operation-not-allowed': { message: 'This login method is not enabled', code: 'OPERATION_NOT_ALLOWED' },
    'popup-blocked': { message: 'Login popup was blocked. Please enable popups', code: 'POPUP_BLOCKED' },
    'expired-action-code': { message: 'Your session has expired. Please login again', code: 'EXPIRED_TOKEN' },
    'user-token-expired': { message: 'Your session has expired. Please login again', code: 'EXPIRED_TOKEN' }
  };

  try {
    // Extract error information
    const errorInfo = extractErrorInfo(error);
    
    if (errorInfo) {
      const mappedError = ERROR_MESSAGES[errorInfo.code];
      if (mappedError) {
        return {
          success: false,
          message: mappedError.message,
          code: mappedError.code
        };
      }
    }

    // If we couldn't extract or map the error, try one last time with string conversion
    const errorString = String(error);
    const lastMatch = errorString.match(/Firebase:\s*Error\s*\(auth\/([^)]+)\)/);
    if (lastMatch && ERROR_MESSAGES[lastMatch[1]]) {
      return {
        success: false,
        ...ERROR_MESSAGES[lastMatch[1]]
      };
    }

  } catch (e) {
    // Silent catch - we'll return the default error
  }

  // Default fallback
  return {
    success: false,
    message: 'An unexpected error occurred. Please try again later',
    code: 'INTERNAL_ERROR'
  };
}

/**
 * Type guard to check if a response is an AuthErrorResponse
 */
export function isAuthErrorResponse(response: unknown): response is AuthErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as { success: boolean }).success === false &&
    "code" in response &&
    "message" in response
  )
}

export function getErrorAlertVariant(error: any | undefined) {
 if (!error) return "destructive"

  switch (error.error) {
    case "AUTHENTICATED":
      return "default"
    case "EMAIL_EXISTS":
    case "UNAUTHENTICATED":
    case "UNVERIFIED":
    case "REQUIRES_VERIFICATION":
    case "INVALID_EMAIL":
    case "INVALID_TOKEN":
    case "INTERNAL_ERROR":
    case "USER_DISABLED":
    case "TOO_MANY_ATTEMPTS":
    case "NETWORK_ERROR":
    case "SESSION_EXPIRED":
    case "EXPIRED_TOKEN":
    case "INVALID_CREDENTIALS":
    default:
      return "destructive"
  }
}