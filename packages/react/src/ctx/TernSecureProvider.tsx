import React from 'react'
import { TernSecureCtxProvider } from './TernSecureCtxProvider'
import type { TernSecureProviderProps } from '../types'

function TernSecureProviderBase(props: TernSecureProviderProps) {
    const { 
        children, 
        initialState, 
        bypassApiKey,
        ...restProps
    } = props

    const { customDomain = '', TernSecure: userInitialised } = restProps

    if (!userInitialised) {
        if(!customDomain) {
        console.warn('TernSecureProvider: Instance is not initialized. Please ensure you have provided the correct instance options.')
        }
    }

    return (
        <TernSecureCtxProvider
          initialState={initialState}
          instanceOptions={restProps}
        >
            {children}
        </TernSecureCtxProvider>
    )
}

// Memoize the provider to prevent unnecessary re-renders
const TernSecureProvider = React.memo(TernSecureProviderBase)

TernSecureProvider.displayName = 'TernSecureProvider'

export { TernSecureProvider }