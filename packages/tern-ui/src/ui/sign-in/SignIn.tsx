'use client'

import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useCallback 
} from 'react'
import type { 
  SignInResponseTree, 
  AuthErrorTree, 
  TernSecureUser 
} from '@tern-secure/types'

interface SignInContextType {
  isError: boolean
  isLoading: boolean
  error: AuthErrorTree | null
  handleSignInStart: () => void
  handleSignInSuccess: (user?: TernSecureUser | null) => void
  handleSignInError: (error: AuthErrorTree) => void
  clearError: () => void
  checkRedirectResult: () => Promise<void>
}

const SignInContext = createContext<SignInContextType>({
  isError: false,
  isLoading: false,
  error: null,
  handleSignInStart: () => {},
  handleSignInSuccess: () => {},
  handleSignInError: () => {},
  clearError: () => {},
  checkRedirectResult: async () => {}
})

export const useSignInContext = () => useContext(SignInContext)

interface SignInProviderProps {
  children: ReactNode
  onSuccess?: (user: TernSecureUser | null) => void
  onError?: (error: AuthErrorTree) => void
}

export function SignInProvider({ 
  children, 
  onSuccess,
  onError 
}: SignInProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthErrorTree | null>(null)

  const handleSignInStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const handleSignInSuccess = useCallback((user?: TernSecureUser | null) => {
    setIsLoading(false)
    setError(null)
    onSuccess?.(user || null)
  }, [onSuccess])

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    setIsLoading(false)
    setError(authError)
    onError?.(authError)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const checkRedirectResult = useCallback(async () => {}, [])

  const contextValue: SignInContextType = {
    isError: !!error,
    isLoading,
    error,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    clearError,
    checkRedirectResult
  }

  return (
    <SignInContext.Provider value={contextValue}>
      {children}
    </SignInContext.Provider>
  )
}