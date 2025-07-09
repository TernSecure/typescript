"use client"
import { useCallback } from 'react'
import { useAssertWrappedByTernSecureProvider } from './useAssertWrappedTernSecureProvider'
import { 
  DEFAULT_TERN_SECURE_STATE, 
  TernSecureState,
  SignOutOptions
} from '@tern-secure/types'
import { useAuthProviderCtx } from '../ctx/AuthProvider'
import { useIsomorphicTernSecureCtx } from '../ctx/IsomorphicTernSecureCtx'
import { IsomorphicTernSecure } from '../lib/isomorphicTernSecure'

type AuthState = TernSecureState & {
  signOut: (options?: SignOutOptions) => Promise<void>
}

const handleSignOut = (instance: IsomorphicTernSecure) => {
  return async (options?: SignOutOptions) => {
    try {
      if (options?.onBeforeSignOut) {
        await options.onBeforeSignOut();
      }

      await instance.signOut(options);

      if (options?.onAfterSignOut) {
        await options.onAfterSignOut();
      }
    } catch (error) {
      console.error('[useAuth] Sign out failed:', error)
      throw error
    }
  }
}

export const useAuth = (): AuthState => {
  useAssertWrappedByTernSecureProvider('useAuth')
  
  const ctx  = useAuthProviderCtx()
  const instance = useIsomorphicTernSecureCtx()

  const signOut = useCallback(handleSignOut(instance), [instance])

  if (!ctx.isLoaded) {
    console.warn('[useAuth] TernSecure is not loaded yet. Returning default state.')
    return {
      ...DEFAULT_TERN_SECURE_STATE,
      isLoaded: false,
      signOut,
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
    user: ctx.user,
    signOut
  }
}
