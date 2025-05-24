'use client'
import React, { useEffect, useState, useCallback, useMemo } from "react"
import { IsomorphicTernSecureCtx } from "./IsomorphicTernSecureCtx"
import { onAuthStateChanged } from "firebase/auth"
import { ternSecureAuth } from '../utils/client-init'
import { IsomorphicTernSecure } from "../lib/isomorphicTernSecure"
import type { 
  initialState, 
} from '../types'
import type {
  TernSecureState,
  TernSecureUser,
  IsomorphicTernSecureOptions
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
  const { isomorphicTernSecure: instance } = useLoadIsomorphicTernSecure(instanceOptions)
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
      instance.ui.controls.clearError()
      instance.ui.state.isLoading = false
      instance.ui.state.currentView = null
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
    console.log('[TernSecure Provider] Creating IsomorphicTernSecure instance:', {
      options,
      mode: options.mode || (typeof window === 'undefined' ? 'server' : 'browser'),
      timestamp: new Date().toISOString()
    });
    return IsomorphicTernSecure.getOrCreateInstance(options);
  }, [options]);

  // Handle async loadTernUI
  useEffect(() => {
    const loadUI = async () => {
      try {
        console.log('[TernSecure Provider] Starting UI load:', {
          timestamp: new Date().toISOString(),
          instance: !!isomorphicTernSecure,
          uiState: isomorphicTernSecure.ui.state
          
        });

        const browser = await isomorphicTernSecure.loadTernUI();

        if (!browser) {
          console.warn('[TernSecure Provider] Browser object is null/undefined after load');
          throw new Error('Failed to load Tern UI');
        }
        
        console.log('[TernSecure Provider] UI loaded successfully:', {
          hasBrowser: !!browser,
          timestamp: new Date().toISOString()
        });

        setIsLoading(false);
      } catch (err) {
        console.error('[TernSecure Provider] Failed to load UI:', {
          error: err,
          timestamp: new Date().toISOString()
        });
        setError(err as Error);
        setIsLoading(false);
      }
    };

    if (isomorphicTernSecure && options.mode !== 'server') {
      loadUI();
    } else {
      setIsLoading(false);
    }
  }, [isomorphicTernSecure, options.mode]);

  // Debug log when instance is created and cleanup
  useEffect(() => {
    console.log('[TernSecure Provider] Instance created:', {
      hasInstance: !!isomorphicTernSecure,
      uiState: isomorphicTernSecure.ui.state,
      hasControls: !!isomorphicTernSecure.ui.controls,
      isLoading,
      hasError: !!error,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('[TernSecure Provider] Cleaning up instance:', {
        timestamp: new Date().toISOString()
      });
      IsomorphicTernSecure.clearInstance();
    };
  }, [isomorphicTernSecure, isLoading, error]);

  return {
    isomorphicTernSecure,
    isLoading,
    error
  };
};