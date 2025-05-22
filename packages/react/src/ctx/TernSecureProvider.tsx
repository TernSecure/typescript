import React from 'react'
import { TernSecureCtxProvider } from './TernSecureCtxProvider'
import type { initialState, TernSecureUser } from '../types'

interface TernSecureProviderProps {
    children: React.ReactNode
    initialState?: initialState
    requiresVerification?: boolean
    loadingComponent?: React.ReactNode
    onUserChanged?: (user: TernSecureUser | null) => Promise<void>
}

function TernSecureProviderBase({ 
    children, 
    initialState, 
    requiresVerification,
    loadingComponent,
    onUserChanged 
}: TernSecureProviderProps) {
    return (
        <TernSecureCtxProvider
          initialState={initialState}
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