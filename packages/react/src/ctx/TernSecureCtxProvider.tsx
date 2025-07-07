'use client'

import React, { useEffect, useState, useMemo } from "react"
import { IsomorphicTernSecureCtx } from "./IsomorphicTernSecureCtx"
import { IsomorphicTernSecure } from "../lib/isomorphicTernSecure"
import type { 
  IsomorphicTernSecureOptions,
} from '../types'
import {
  DEFAULT_TERN_SECURE_STATE,
  type TernSecureState
} from '@tern-secure/types'
import { 
  TernSecureAuthContext,
} from '@tern-secure/shared/react'


type TernSecureCtxProviderProps = {
  children: React.ReactNode
  instanceOptions: IsomorphicTernSecureOptions
  initialState: TernSecureState | undefined
}

export type AuthStateProps = {
  authState: TernSecureState
}



export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { 
    children,
    initialState, 
    instanceOptions
  } = props

  const rv = props.instanceOptions.requiresVerification

  const { isomorphicTernSecure: instance, instanceStatus} = useLoadIsomorphicTernSecure(instanceOptions)


  const ternsecureCtx = useMemo(() => ({
    value: instance,
    instanceStatus
  }), [instance, instanceStatus]);


  const ternAuthCtx = useMemo(() => {
    const value = {
      authProvider: instance.ternAuth,
      authState: instance.ternAuth?.internalAuthState || DEFAULT_TERN_SECURE_STATE,
    }

    return { value}
  }, [instance.ternAuth, instance.ternAuth?.internalAuthState]);
  
  const loadingComponent = useMemo(() => (
    <IsomorphicTernSecureCtx.Provider value={ternsecureCtx}>
        <div className="tern-secure-loading">Loading authentication...</div>
    </IsomorphicTernSecureCtx.Provider>
  ), [ternsecureCtx, ternAuthCtx])


  //if (instanceStatus === 'loading' || !instance.ternAuth) {
  //  return loadingComponent;
  //}


  return (
    <IsomorphicTernSecureCtx.Provider value={ternsecureCtx}>
      <TernSecureAuthContext.Provider value={ternAuthCtx}>
              {children}
      </TernSecureAuthContext.Provider>
    </IsomorphicTernSecureCtx.Provider>
  )
}

const useLoadIsomorphicTernSecure = (options: IsomorphicTernSecureOptions) => {
  const [error, setError] = useState<Error | null>(null);

  const isomorphicTernSecure = useMemo(() => {
    return IsomorphicTernSecure.getOrCreateInstance(options);
  }, []);

  const [instanceStatus, setInstanceStatus] = useState(isomorphicTernSecure.status)
  
  useEffect(() => {
    const unsubscribeStatus = isomorphicTernSecure.events.onStatusChanged((newStatus) => {
      setInstanceStatus(newStatus);
      console.log('[useLoadIsomorphicTernSecure] Status changed:', newStatus);
    });
    
    const unsubscribeError = isomorphicTernSecure.events.onError((errorEvent) => {
      setError(errorEvent instanceof Error ? errorEvent : new Error('Unknown error'));
    });

    return () => {
      unsubscribeStatus?.();
      unsubscribeError?.();
    };
  }, [instanceStatus, error]);

  useEffect(() => {
    void isomorphicTernSecure.initialize({ //check awai
      appearance: options.defaultAppearance
    })
  }, [options.mode, options.defaultAppearance]);

  useEffect(() => {
    return () => {
      IsomorphicTernSecure.clearInstance();
    };
  }, []);

  return {
    isomorphicTernSecure,
    error,
    instanceStatus
  };
};