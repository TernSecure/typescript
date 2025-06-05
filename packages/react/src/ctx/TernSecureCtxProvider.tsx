'use client'

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { IsomorphicTernSecureCtx } from "./IsomorphicTernSecureCtx"
import { IsomorphicTernSecure } from "../lib/isomorphicTernSecure"
import { TernSecureAuthProvider as AuthProvider } from "../lib/authProviderReg"
import type { 
  initialState,
  IsomorphicTernSecureOptions,
} from '../types'
import type {
  SignedInSession,
  TernSecureUser,
} from '@tern-secure/types'
import { 
  TernSecureAuthContext,
  SessionContext,
  UserContext
} from '@tern-secure/shared/react'
import { useAuthState } from "../hooks/useAuthState"
import { AuthProviderCtx, AuthProviderCtxValue } from "./AuthProvider"


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsomorphicTernSecureOptions
  initialState?: initialState | undefined
  requiresVerification?: boolean
  onUserChanged?: (user: TernSecureUser | null) => Promise<void>
}

export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { 
    children, 
    instanceOptions,
    requiresVerification = false,
    onUserChanged
  } = props

  const { isomorphicTernSecure: instance, status} = useLoadIsomorphicTernSecure(instanceOptions)

  const { authState, currentUser, setupAuthListener } = useAuthState(
    requiresVerification,
    onUserChanged,
  )


    const authProvider = useMemo(() => {
    console.log('[TernSecureCtxProvider] Creating TernSecureAuthProvider instance...')
    const provider = AuthProvider.getOrCreateInstance();
    console.log('[TernSecureCtxProvider] TernSecureAuthProvider instance created:', provider);
    return provider;
  }, []);


  useEffect(() => {
    if (instance && authProvider) {
      instance.setAuthProvider(authProvider);
    }
  }, [instance, authProvider]);

  useEffect(() => {
    const unsubscribe = setupAuthListener()
    return () => unsubscribe()
  }, [setupAuthListener])

  const authCtx: AuthProviderCtxValue = useMemo(() => {
    return {
      ...authState,
    }
  }, [authState]);

  const sessionData = useMemo<SignedInSession | null>(() => 
    instance.auth.session || (authState.isAuthenticated ? {
      status: authState.isValid ? 'active' : 'expired',
      token: authState.token || '',
      expirationTime: '',
      issuedAtTime: '',
      authTime: '',
      claims: {},
      signInProvider: '',
    } : null)
  , [authState, instance.auth.session])


  const ternsecureCtx = useMemo(() => ({
    value: instance,
    status
  }), [instance, status])

  const userCtx = useMemo(() => ({
    value: currentUser
  }), [currentUser])

  const sessionCtx = useMemo(() => ({
    value: sessionData,
  }), [sessionData])

  const ternAuthCtx = useMemo(() => ({
    value: authProvider
  }), [authProvider]);

  const loadingComponent = useMemo(() => (
    <IsomorphicTernSecureCtx.Provider value={ternsecureCtx}>
      <TernSecureAuthContext.Provider value={ternAuthCtx}>
        <div className="tern-secure-loading">Loading authentication...</div>
      </TernSecureAuthContext.Provider>
    </IsomorphicTernSecureCtx.Provider>
  ), [ternsecureCtx, ternAuthCtx])

  if (!authCtx.isLoaded) {
    return loadingComponent;
  }

  return (
    <IsomorphicTernSecureCtx.Provider value={ternsecureCtx}>
      <TernSecureAuthContext.Provider value={ternAuthCtx}>
        <SessionContext.Provider value={sessionCtx}>
          <AuthProviderCtx.Provider value={{ value: authCtx}}>
            <UserContext.Provider value={userCtx}>
              {children}
            </UserContext.Provider>
          </AuthProviderCtx.Provider>
        </SessionContext.Provider>
      </TernSecureAuthContext.Provider>
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
      setInstanceStatus(newStatus);
      setIsLoading(newStatus === 'loading');
      
      if (newStatus === 'ready' && error) {
        setError(null);
      }
    });
    
    const unsubscribeError = isomorphicTernSecure.events.onError((errorEvent) => {
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
    return () => {
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