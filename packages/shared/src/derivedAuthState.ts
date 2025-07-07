import { 
    TernSecureState,
    TernSecureUser
    //DEFAULT_TERN_SECURE_STATE
} from "@tern-secure/types";


/**
 * Default state for derived auth state
 */
//export const DEFAULT_DERIVED_AUTH_STATE = DEFAULT_TERN_SECURE_STATE

export const DEFAULT_TERN_SECURE_STATE: TernSecureState = {
  userId: null,
  isLoaded: false,
  error: null,
  isValid: false,
  isVerified: false,
  isAuthenticated: false,
  token: null,
  email: null,
  status: "loading",
  user: null
};


export const deriveAuthState = (internalState: TernSecureState | undefined ): TernSecureState => {
  
  if (!internalState) {
    console.warn('[deriveAuthState] internalState is undefined or null. Returning default state.');
    return DEFAULT_TERN_SECURE_STATE
  }

  const userId = internalState.userId || null;
  const isLoaded = internalState.isLoaded || false;
  const isValid = internalState.isValid || false;
  const isVerified = internalState.isVerified || false;
  const isAuthenticated = internalState.isAuthenticated || false;
  const token = internalState.token || null;
  const email = internalState.email || null;
  const error = internalState.error || null;
  const status = internalState.status || "loading";
  const user = internalState.user || null;

  return {
    userId,
    isLoaded,
    isValid,
    isVerified,
    isAuthenticated,
    token,
    email,
    error,
    status,
    user
  }
};