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
  SignInRedirectOptions,
  SignUpRedirectOptions 
} from '@tern-secure/types'
import type { SignInCtx } from '../../types'
import { useTernSecure } from '@tern-secure/shared/react'

// Simplified context interface focusing only on auth lifecycle and navigation
interface SignInContextType extends Omit<SignInCtx, 'forceRedirectUrl' | 'signInForceRedirectUrl' | 'signUpForceRedirectUrl'> {
  // State management
  isError: boolean
  isLoading: boolean
  error: AuthErrorTree | null
  
  // Core auth lifecycle
  clearError: () => void
  handleSignInStart: () => void
  handleSignInSuccess: (user?: TernSecureUser | null) => void
  handleSignInError: (error: AuthErrorTree) => void
  
  // Redirect management (source of truth for navigation)
  redirectToSignUp: (options?: SignUpRedirectOptions) => Promise<void>
  //redirectAfterSignIn: () => void
  shouldRedirect: (currentPath: string) => boolean | string
  constructSignInUrl: (baseUrl?: string) => string
  constructSignUpUrl: (baseUrl?: string) => string
  
  // Check for redirect results (OAuth flows)
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
  redirectToSignUp: async () => {},
  //redirectAfterSignIn: () => {},
  shouldRedirect: () => false,
  constructSignInUrl: () => '',
  constructSignUpUrl: () => '',
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthErrorTree | null>(null)

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

  // Redirect management - source of truth for navigation (delegates to main instance)
  const redirectToSignUp = useCallback(async (options?: SignUpRedirectOptions): Promise<void> => {
    try {
      await ternSecure.redirectToSignUp(options)
    } catch (error) {
      console.error('[SignInProvider] Error redirecting to sign up:', error)
    }
  }, [ternSecure])


  const shouldRedirect = useCallback((currentPath: string): boolean | string => {
    try {
      return ternSecure.shouldRedirect(currentPath)
    } catch (error) {
      console.error('[SignInProvider] Error checking redirect:', error)
      return false
    }
  }, [ternSecure])

  const constructSignInUrl = useCallback((baseUrl?: string): string => {
    try {
      const signInPath = baseUrl || '/sign-in'
      const redirectPath = forceRedirectUrl || signInForceRedirectUrl
      
      if (redirectPath) {
        return ternSecure.constructUrlWithRedirect(signInPath) + `?redirect=${encodeURIComponent(redirectPath)}`
      }
      
      return ternSecure.constructUrlWithRedirect(signInPath)
    } catch (error) {
      console.error('[SignInProvider] Error constructing sign in URL:', error)
      return baseUrl || '/sign-in'
    }
  }, [ternSecure, signInForceRedirectUrl, forceRedirectUrl])

  const constructSignUpUrl = useCallback((baseUrl?: string): string => {
    try {
      const signUpPath = baseUrl || '/sign-up'
      const redirectPath = signUpForceRedirectUrl
      
      if (redirectPath) {
        return ternSecure.constructUrlWithRedirect(signUpPath) + `?redirect=${encodeURIComponent(redirectPath)}`
      }
      
      return ternSecure.constructUrlWithRedirect(signUpPath)
    } catch (error) {
      console.error('[SignInProvider] Error constructing sign up URL:', error)
      return baseUrl || '/sign-up'
    }
  }, [ternSecure, signUpForceRedirectUrl])

  // Core authentication lifecycle handlers
  const handleSignInStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const handleSignInSuccess = useCallback((user?: TernSecureUser | null) => {
    setIsLoading(false)
    setError(null)
    
    // Trigger success callback first
    onSuccess?.(user || null)
    
    // Then handle redirect via main instance
    //redirectAfterSignIn()
  }, [onSuccess])

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


  const contextValue: SignInContextType = useMemo(() => ({
    // State management
    isError: !!error,
    isLoading,
    error,
    
    // Core lifecycle
    clearError,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    
    // Redirect management
    redirectToSignUp,
    shouldRedirect,
    constructSignInUrl,
    constructSignUpUrl,
    checkRedirectResult,
    
    // SignInCtx properties (inherited)
    onError,
    onSuccess,
  }), [
    error,
    isLoading,
    clearError,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    redirectToSignUp,
    //redirectAfterSignIn,
    shouldRedirect,
    constructSignInUrl,
    constructSignUpUrl,
    checkRedirectResult,
    onError,
    onSuccess,
  ])

  return (
    <SignInContext.Provider value={contextValue}>
      {children}
    </SignInContext.Provider>
  )
}