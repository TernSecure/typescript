"use client"

import { useState, useCallback } from 'react'
import { useTernSecure } from '@tern-secure/shared/react'
import type { SignInResponse } from '@tern-secure/types'

export interface UseSignUpReturn {
  email: string | null
  isLoading: boolean
  error: Error | null
  setEmail: (email: string) => void
  signUp: (email: string, password: string) => Promise<SignInResponse>
  resetState: () => void
}

export function useSignUp(): UseSignUpReturn {
  const instance = useTernSecure()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [email, setEmail] = useState<string | null>(instance.auth.user?.email ?? null)

  const resetState = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setEmail(null)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      return await instance.ternAuth.signInWithEmailAndPassword(email, password)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create account')
      setError(error)
      return {
        success: false,
        message: error.message,
        error: error,
        user: null
      }
    } finally {
      setIsLoading(false)
    }
  }, [instance.ternAuth])

  return {
    email,
    isLoading,
    error,
    setEmail,
    signUp,
    resetState
  }
}
