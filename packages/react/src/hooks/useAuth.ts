"use client"
import { 
  useUserContext
} from '@tern-secure/shared/react'
import type { 
  TernSecureState,
  TernSecureUser,
} from '@tern-secure/types'

import { useAssertWrappedByTernSecureProvider } from './useAssertWrappedTernSecureProvider'
import { useAuthProviderCtx } from '../ctx/AuthProvider'

interface AuthState extends TernSecureState {
  user: TernSecureUser | null
  //signOut: () => Promise<void>
}

/**
 * Hook to access authentication state and methods
 * @returns Authentication state and methods
 */
export function useAuth(): AuthState {
  const ternSecureAuthCtx = useAuthProviderCtx()
  const userContext = useUserContext()
  useAssertWrappedByTernSecureProvider('useAuth')
  const instance = ternSecureAuthCtx

  return {
    userId: instance.userId,
    isLoaded: instance.isLoaded,
    error: instance.error,
    isValid: !!instance.isValid,
    isVerified: instance.isVerified,
    isAuthenticated: instance.isAuthenticated,
    token: instance.token ?? null,
    email: instance.email ?? null,
    status: instance.status,
    requiresVerification: false,
    user: userContext,
  }
}
