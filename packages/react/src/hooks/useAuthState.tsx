import { useState, useCallback, useMemo } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { ternSecureAuth } from '../utils/client-init'
import type { 
  TernSecureState, 
  TernSecureUser 
} from '@tern-secure/types'

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

export function useAuthState(
  requiresVerification = false,
  onUserChanged?: (user: TernSecureUser | null) => Promise<void>
) {
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
      } else {
        setAuthState({
          ...defaultAuthState,
          isLoaded: true,
          status: "unauthenticated",
          requiresVerification
        })
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated"
      }))
      console.error("Error updating auth state:", error)
    }
  }, [requiresVerification])

  const setupAuthListener = useCallback(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (onUserChanged) {
        await onUserChanged(firebaseUser)
      }
      await updateAuthState(firebaseUser)
    })

    return unsubscribe
  }, [auth, onUserChanged, updateAuthState])

  return {
    authState,
    setupAuthListener
  }
}