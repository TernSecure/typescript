import { createContextAndHook } from '@tern-secure/shared/react'
import React, { useCallback, type ReactNode } from 'react'
import type { AuthErrorTree, SignInResponseTree } from '@tern-secure/types'

type CardStatus = 'idle' | 'loading' | 'error' | 'success'

type CardState = {
    status: CardStatus
    error: SignInResponseTree | AuthErrorTree | null
}

interface CardStateCtxValue extends CardState {
    setCardState: (state: Partial<CardState>) => void
    setStatus: (status: CardStatus) => void
    setLoading: () => void
    setError: (error: SignInResponseTree) => void
    setIdle: () => void
    clearError: () => void
    isLoading: boolean
    isError: boolean
    isSuccess: boolean
    isIdle: boolean
}

const [CardStateCtx, useCardState] = createContextAndHook<CardStateCtxValue>('CardState')

type CardStateProviderProps = {
    children: ReactNode
}

const DEFAULT_STATE: CardState = {
    status: 'idle',
    error: null
}

function CardStateProvider({ children }: CardStateProviderProps) {
    const [cardState, setCardStateInternal] = React.useState<CardState>(DEFAULT_STATE)
    
    const setCardState = useCallback((state: Partial<CardState>) => {
        setCardStateInternal(prev => ({ ...prev, ...state }));
    }, []);
    
    const setStatus = useCallback((status: CardStatus) => {
        setCardStateInternal(prev => ({ 
            ...prev, 
            status,
            error: status === 'error' ? prev.error : null
        }))
    }, [])

    const setLoading = useCallback(() => {
        setCardStateInternal(prev => ({ ...prev, status: 'loading', error: null }))
    }, [])

    const setError = useCallback((error: SignInResponseTree) => {
        setCardStateInternal(prev => ({ ...prev, status: 'error', error }))
    }, [])

    const setSuccess = useCallback(() => {
        setCardStateInternal(prev => ({ ...prev, status: 'success', error: null }))
    }, [])

    const setIdle = useCallback(() => {
        setCardStateInternal(prev => ({ ...prev, status: 'idle', error: null }))
    }, [])

    const clearError = useCallback(() => {
        setCardStateInternal(prev => ({ ...prev, error: null, status: 'idle' }))
    }, [])

    const value = React.useMemo(() => ({
        value: {
            ...cardState, 
            setCardState,
            setStatus,
            setLoading,
            setError,
            setIdle,
            clearError,
            isLoading: cardState.status === 'loading',
            isError: cardState.status === 'error',
            isSuccess: cardState.status === 'success',
            isIdle: cardState.status === 'idle'
        }
    }), [
        cardState,
        setCardState,
        setStatus,
        setLoading,
        setError,
        setIdle,
        clearError
    ]);

    return <CardStateCtx.Provider value={value}>{children}</CardStateCtx.Provider>
}

export { CardStateProvider, useCardState }