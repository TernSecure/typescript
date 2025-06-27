'use client'

import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useCallback,
  useMemo,
  useEffect
} from 'react'
import type { 
  AuthErrorTree, 
  TernSecureUser,
} from '@tern-secure/types'
import type { SignInCtx } from '../../types'
import { useTernSecure } from '@tern-secure/shared/react'
import { buildURL } from '../../utils/construct'
import { useTernSecureOptions } from '../TernSecureOptions'


interface SignInContextType extends Omit<SignInCtx, 'forceRedirectUrl' | 'signInForceRedirectUrl'> {
  isError: boolean
  isLoading: boolean
  error: AuthErrorTree | null
  clearError: () => void
  handleSignInStart: () => void
  handleSignInSuccess: (user?: TernSecureUser | null) => void
  handleSignInError: (error: AuthErrorTree) => void
  redirectAfterSignIn: () => void
  SignInUrl: string
  SignUpUrl: string
  checkRedirectResult: () => Promise<void>
}

const SignInContext = createContext<SignInContextType>({
  isError: false,
  isLoading: false,
  error: null,
  clearError: () => {},
  handleSignInStart: () => {},
  handleSignInSuccess: () => {},
  handleSignInError: () => {},
  redirectAfterSignIn: () => {},
  SignInUrl: '',
  SignUpUrl: '',
  checkRedirectResult: async () => {},
})



export const useSignInContext = () => useContext(SignInContext)


interface SignInProviderProps extends Partial<SignInCtx> {
  children: ReactNode
}

export function SignInProvider({ 
  children, 
  onSuccess,
  onError,
  forceRedirectUrl,
  signInForceRedirectUrl,
  signUpForceRedirectUrl,
  ...ctxProps
}: SignInProviderProps) {
  const ternSecure = useTernSecure()
  const ternSecureOptions = useTernSecureOptions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthErrorTree | null>(null)
  const currentParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  }, [])

  const createAuthError = useCallback((
    message: string, 
    code: string, 
    name: string = 'AuthError',
    response?: any
  ): AuthErrorTree => {
    const authError = new Error(message) as AuthErrorTree
    authError.name = name
    authError.code = code
    authError.response = response
    return authError
  }, [])

  const redirectAfterSignIn = useCallback(() => {
    try {
      ternSecure.redirectAfterSignIn()
    } catch (error) {
      console.error('[SignInProvider] Error redirecting after sign in:', error)
    }
  }, [ternSecure])



  // Core authentication lifecycle handlers
  const handleSignInStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const handleSignInSuccess = useCallback((user?: TernSecureUser | null) => {
    setIsLoading(false)
    setError(null)

    onSuccess?.(user || null)
    
    redirectAfterSignIn()
  }, [onSuccess, redirectAfterSignIn])

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    setIsLoading(false)
    setError(authError)
    onError?.(authError)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const checkRedirectResult = useCallback(async (): Promise<void> => {
    try {
      const result = await ternSecure.getRedirectResult()
      if (result && result.success) {
        handleSignInSuccess(result.user)
      } else if (result && !result.success) {
        const authError = createAuthError(
          result.message || 'Redirect sign-in failed',
          result.error || 'REDIRECT_FAILED',
          'RedirectError',
          result
        )
        handleSignInError(authError)
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check redirect result',
        'REDIRECT_CHECK_FAILED',
        'RedirectError',
        error
      )
      handleSignInError(authError)
    }
  }, [ternSecure, handleSignInSuccess, handleSignInError, createAuthError])
  
  const baseSignInUrl = ctxProps.path || ternSecureOptions.signInUrl;
  const baseSignUpUrl = ternSecureOptions.signUpUrl;

  const SignInUrl = buildURL({
    base: baseSignInUrl,
    searchParams: currentParams
  }, { stringify: true, skipOrigin: false }) as string;

  const SignUpUrl = buildURL({
    base: baseSignUpUrl,
    searchParams: currentParams
  }, { stringify: true, skipOrigin: false }) as string;

  const contextValue: SignInContextType = useMemo(() => ({
    isError: !!error,
    isLoading,
    error,
    clearError,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    redirectAfterSignIn,
    checkRedirectResult,
    SignInUrl,
    SignUpUrl,
    onError,
    onSuccess,
  }), [
    error,
    isLoading,
    clearError,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    redirectAfterSignIn,
    checkRedirectResult,
    SignInUrl,
    SignUpUrl,
    onError,
    onSuccess,
  ])

  return (
    <SignInContext.Provider value={contextValue}>
      {children}
    </SignInContext.Provider>
  )
}