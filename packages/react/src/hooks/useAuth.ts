"use client"
import { useTernSecure } from '@tern-secure/shared/react'
import type { 
  TernSecureState,
  TernSecureUser,
} from '@tern-secure/types'

interface AuthState extends TernSecureState {
  user: TernSecureUser | null
  signOut: () => Promise<void>
}

/**
 * Hook to access authentication state and methods
 * @returns Authentication state and methods
 */
export function useAuth(): AuthState {
  const instance = useTernSecure()

  return {
    userId: instance.auth.user?.uid ?? null,
    isLoaded: instance.ui.state.isReady,
    error: instance.ui.state.error,
    isValid: !!instance.auth.user,
    isVerified: instance.auth.user?.emailVerified ?? false,
    isAuthenticated: instance.auth.isAuthenticated,
    token: instance.auth.session?.token ?? null,
    email: instance.auth.user?.email ?? null,
    status: instance.auth.isAuthenticated ? "authenticated" 
            : instance.auth.user?.emailVerified ? "unverified" 
            : "unauthenticated",
    requiresVerification: instance.auth.requiresVerification ?? false,
    user: instance.auth.user,
    signOut: instance.user.signOut
  }
}
