'use client'
import React, { useEffect, useState, useCallback, useMemo } from "react"
import { IsomorphicTernSecureCtx } from "./IsomorphicTernSecureCtx"
import { onAuthStateChanged } from "firebase/auth"
import { ternSecureAuth } from '../utils/client-init'
import { IsomorphicTernSecure } from "../lib/isomorphicTernSecure"
import type { 
  initialState,
  IsomorphicTernSecureOptions,
} from '../types'
import type {
  TernSecureInstanceTreeStatus,
  TernSecureState,
  TernSecureUser,
} from '@tern-secure/types'


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsomorphicTernSecureOptions
  initialState?: initialState | undefined
  requiresVerification?: boolean
  onUserChanged?: (user: TernSecureUser | null) => Promise<void>
}

const defaultAuthState: TernSecureState = {
  userId: null,
  isLoaded: false,
  error: null,
  isValid: false,
  isVerified: false,
  isAuthenticated: false,
  token: null,
  email: null,
  status: "loading",
  requiresVerification: false
}

export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { 
    children, 
    instanceOptions,
    requiresVerification = false,
    onUserChanged
  } = props
  const { isomorphicTernSecure: instance, status} = useLoadIsomorphicTernSecure(instanceOptions)
  const auth = useMemo(() => ternSecureAuth, []);

  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    ...defaultAuthState,
    requiresVerification
  }))

  const updateAuthState = useCallback(async (user: TernSecureUser | null) => {
    try {
      if (user) {
        const token = await user.getIdToken()
        const isValid = !!user.uid
        const isVerified = user.emailVerified
        const isAuthenticated = isValid && (!requiresVerification || isVerified)

        setAuthState({
          userId: user.uid,
          isLoaded: true,
          error: null,
          isValid,
          isVerified,
          isAuthenticated,
          token,
          email: user.email,
          status: isAuthenticated ? "authenticated" : isVerified ? "unverified" : "unauthenticated",
          requiresVerification
        })

        // Update instance state
        instance.auth.session = { token }
        instance.auth.user = user
        instance.auth.isAuthenticated = isAuthenticated
      } else {
        setAuthState({
          ...defaultAuthState,
          isLoaded: true,
          status: "unauthenticated",
          requiresVerification
        })

        // Update instance state
        instance.auth.session = null
        instance.auth.user = null
        instance.auth.isAuthenticated = false
      }

      instance.auth.requiresVerification = requiresVerification
      instance.clearError()
      instance.setLoading(false)
      // currentView is now a getter property, no need to set it directly
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated"
      }))
      console.error("Error updating auth state:", error)
    }
  }, [instance, requiresVerification])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (onUserChanged) {
        // Since TernSecureUser is a type alias for Firebase User, this is type-safe
        await onUserChanged(firebaseUser)
      }
      await updateAuthState(firebaseUser)
    })

    return () => unsubscribe()
  }, [onUserChanged, updateAuthState])

  const contextValue = {
    value: instance,
    status,
    authState
  }

  return (
    <IsomorphicTernSecureCtx.Provider value={contextValue}>
      {children}
    </IsomorphicTernSecureCtx.Provider>
  )
}

const useLoadIsomorphicTernSecure = (options: IsomorphicTernSecureOptions) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isomorphicTernSecure = useMemo(() => {
    return IsomorphicTernSecure.getOrCreateInstance(options);
  }, [options]);

  const [instanceStatus, setInstanceStatus] = useState(isomorphicTernSecure.status)
  
  useEffect(() => {
    const unsubscribeStatus = isomorphicTernSecure.events.onStatusChanged((newStatus) => {
      console.log('[TernSecure Provider] Status changed:', {
        oldStatus: instanceStatus,
        newStatus,
        isReady: isomorphicTernSecure.isReady,
        timestamp: new Date().toISOString()
      });
      
      setInstanceStatus(newStatus);
      setIsLoading(newStatus === 'loading');
      
      if (newStatus === 'ready' && error) {
        setError(null);
      }
    });
    
    const unsubscribeError = isomorphicTernSecure.events.onError((errorEvent) => {
      console.error('[TernSecure Provider] Error event:', errorEvent);
      setError(errorEvent instanceof Error ? errorEvent : new Error('Unknown error'));
      setIsLoading(false);
    });

    return () => {
      unsubscribeStatus?.();
      unsubscribeError?.();
    };
  }, [instanceStatus, error]);

  // Handle async loadTernUI
  useEffect(() => {
    void isomorphicTernSecure.initialize({ //check awai
      appearance: options.defaultAppearance
    })
  }, [options.mode, options.defaultAppearance]);

  // Debug log when instance is created and cleanup
  useEffect(() => {
    console.log('[TernSecure Provider] Instance created:', {
      hasInstance: !!isomorphicTernSecure,
      isReady: isomorphicTernSecure.isReady,
      status: isomorphicTernSecure.status,
      isLoading: isomorphicTernSecure.isLoading,
      hasShowSignIn: !!isomorphicTernSecure.showSignIn,
      loadingState: isLoading,
      hasError: !!error,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('[TernSecure Provider] Cleaning up instance:', {
        timestamp: new Date().toISOString()
      });
      IsomorphicTernSecure.clearInstance();
    };
  }, []);

  return {
    isomorphicTernSecure,
    isLoading,
    error,
    status: instanceStatus
  };
};