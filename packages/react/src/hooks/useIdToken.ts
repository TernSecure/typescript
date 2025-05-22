'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTernSecure } from '@tern-secure/shared/react'
import type { TernSecureUser } from '@tern-secure/types'

interface IdTokenResult {
  token: string | null
  claims: { [key: string]: any } | null
  issuedAtTime: string | null
  expirationTime: string | null
  authTime: string | null
  signInProvider: string | null
}

interface IdTokenState {
  tokenResult: IdTokenResult | null
  loading: boolean
  error: Error | null
}

export function useIdTokenInternal() {
    const instance = useTernSecure()
    const { auth: { user, isAuthenticated }, ui: { state: { isReady: isLoaded } } } = instance

  const [tokenState, setTokenState] = useState<IdTokenState>({
    tokenResult: null,
    loading: true,
    error: null
  })

  const getFormattedTokenResult = useCallback(
    async (user: TernSecureUser): Promise<IdTokenResult> => {
    const result = await user.getIdTokenResult()
    return {
      token: result.token,
      claims: result.claims,
      issuedAtTime: result.issuedAtTime,
      expirationTime: result.expirationTime,
      authTime: result.authTime,
      signInProvider: result.signInProvider
    }
  }, [])

  const refreshToken = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTokenState({
        tokenResult: null,
        loading: false,
        error: null
      })
      return
    }

    try {
      setTokenState(prev => ({ ...prev, loading: true }))
      const tokenResult = await getFormattedTokenResult(user)
      setTokenState({
        tokenResult,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Failed to refresh token:', error)
      setTokenState({
        tokenResult: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh token')
      })
    }
  }, [getFormattedTokenResult, isAuthenticated, user])

  useEffect(() => {
    if (isLoaded) {
      refreshToken()
    }
  }, [isLoaded, refreshToken])

  return {
    ...tokenState,
    refreshToken
  }
}

export const useIdToken = useIdTokenInternal