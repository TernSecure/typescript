"use client"
import { 
  useTernSecureAuthContext,
  assertContextExists,
  TernSecureAuthContext
} from '@tern-secure/shared/react'
import { deriveAuthState, DEFAULT_TERN_SECURE_STATE } from '@tern-secure/shared/derivedAuthState'
import { useAssertWrappedByTernSecureProvider } from './useAssertWrappedTernSecureProvider'
import { TernSecureState } from '@tern-secure/types'
import { useAuthProviderCtx } from '../ctx/AuthProvider'


export const useAuth = (): TernSecureState => {
  useAssertWrappedByTernSecureProvider('useAuth')
  
  const ctx  = useAuthProviderCtx()

  if (!ctx.isLoaded) {
    console.warn('[useAuth] TernSecure is not loaded yet. Returning default state.')
  }
  
  return {
    userId: ctx.userId,
    isLoaded: ctx.isLoaded,
    error: ctx.error,
    isValid: ctx.isValid,
    isVerified: ctx.isVerified,
    isAuthenticated: ctx.isAuthenticated,
    token: ctx.token,
    email: ctx.email,
    status: ctx.status,
    requiresVerification: ctx.requiresVerification,
    user: ctx.user
  }
}
