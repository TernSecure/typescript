import React from 'react'
import { TernSecureCtxProvider } from './TernSecureCtxProvider'
import type { TernSecureProviderProps } from '../types'

function TernSecureProviderBase(props: TernSecureProviderProps) {
    const { 
        children, 
        initialState, 
        requiresVerification = false,
        onUserChanged
    } = props
    return (
        <TernSecureCtxProvider
          initialState={initialState}
          instanceOptions={props}
          requiresVerification={requiresVerification}
          onUserChanged={onUserChanged}
        >
            {children}
        </TernSecureCtxProvider>
    )
}

// Memoize the provider to prevent unnecessary re-renders
const TernSecureProvider = React.memo(TernSecureProviderBase)

TernSecureProvider.displayName = 'TernSecureProvider'

export { TernSecureProvider }