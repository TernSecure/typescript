"use client"

import { useAssertWrappedByTernSecureProvider } from './useAssertWrappedTernSecureProvider'
import { DEFAULT_TERN_SECURE_STATE, TernSecureState } from '@tern-secure/types'
import { useAuthProviderCtx } from '../ctx/AuthProvider'


export const useAuth = (): TernSecureState => {
  useAssertWrappedByTernSecureProvider('useAuth')
  
  const ctx  = useAuthProviderCtx()

  if (!ctx.isLoaded) {
    console.warn('[useAuth] TernSecure is not loaded yet. Returning default state.')
    return {
      ...DEFAULT_TERN_SECURE_STATE,
      isLoaded: false,
    }
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
    user: ctx.user
  }
}
