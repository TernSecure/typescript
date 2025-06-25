'use client'

import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useCallback,
  useMemo
} from 'react'
import type { 
  AuthErrorTree, 
  TernSecureUser 
} from '@tern-secure/types'
import type { SignInCtx } from '../../types'

type AuthFlowStep = 
  | 'signin' 
  | 'password-reset' 
  | 'verification-required' 
  | 'verification-sent' 
  | 'verification-complete'
  | 'mfa-required'


interface AuthFlowState {
  step: AuthFlowStep
  email?: string
  user?: TernSecureUser | null
  requiresVerification?: boolean
}

interface SignInContextType {
  isError: boolean
  isLoading: boolean
  error: AuthErrorTree | null
  flowState: AuthFlowState
  handleSignInStart: () => void
  handleSignInSuccess: (user?: TernSecureUser | null) => void
  handleSignInError: (error: AuthErrorTree) => void
  clearError: () => void
  navigateToStep: (step: AuthFlowStep, data?: Partial<AuthFlowState>) => void
  resetFlow: () => void
  handlePasswordReset: (email: string) => Promise<void>
  handleVerificationRequest: (email?: string) => Promise<void>
  handleVerificationCheck: () => Promise<void>
  checkRedirectResult: () => Promise<void>
}

const DEFAULT_FLOW_STATE: AuthFlowState = {
  step: 'signin'
}

const SignInContext = createContext<SignInContextType>({
  isError: false,
  isLoading: false,
  error: null,
  flowState: DEFAULT_FLOW_STATE,
  handleSignInStart: () => {},
  handleSignInSuccess: () => {},
  handleSignInError: () => {},
  clearError: () => {},
  navigateToStep: () => {},
  resetFlow: () => {},
  handlePasswordReset: async () => {},
  handleVerificationRequest: async () => {},
  handleVerificationCheck: async () => {},
  checkRedirectResult: async () => {}
})

export const useSignInContext = () => useContext(SignInContext)

interface SignInProviderProps {
  children: ReactNode
  onSuccess?: (user: TernSecureUser | null) => void
  onError?: (error: AuthErrorTree) => void
  onFlowChange?: (step: AuthFlowStep) => void
}

export function SignInProvider({ 
  children, 
  onSuccess,
  onError,
  onFlowChange 
}: SignInProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthErrorTree | null>(null)
  const [flowState, setFlowState] = useState<AuthFlowState>(DEFAULT_FLOW_STATE)

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

  


  const handleSignInStart = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const handleSignInSuccess = useCallback((user?: TernSecureUser | null) => {
    setIsLoading(false)
    setError(null)
    
    // Check if user requires email verification
    if (user && !user.emailVerified) {
      setFlowState(prev => ({
        ...prev,
        step: 'verification-required',
        user,
        email: user.email || prev.email
      }))
      onFlowChange?.(  'verification-required')
      return
    }
    
    // Complete successful sign in
    setFlowState(prev => ({
      ...prev,
      step: 'signin',
      user
    }))
    onSuccess?.(user || null)
  }, [onSuccess, onFlowChange])

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    setIsLoading(false)
    setError(authError)
    onError?.(authError)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const navigateToStep = useCallback((step: AuthFlowStep, data?: Partial<AuthFlowState>) => {
    setFlowState(prev => ({
      ...prev,
      step,
      ...data
    }))
    onFlowChange?.(step)
    clearError()
  }, [onFlowChange, clearError])


  const resetFlow = useCallback(() => {
    setFlowState(DEFAULT_FLOW_STATE)
    setIsLoading(false)
    clearError()
    onFlowChange?.('signin')
  }, [clearError, onFlowChange])

  const handlePasswordReset = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Implement actual password reset logic
      // await signIn.sendPasswordResetEmail(email)
      
      navigateToStep('verification-sent', { email })
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to send password reset email',
        'PASSWORD_RESET_FAILED',
        'PasswordResetError',
        error
      )
      handleSignInError(authError)
    } finally {
      setIsLoading(false)
    }
  }, [navigateToStep, createAuthError, handleSignInError])

  const handleVerificationRequest = useCallback(async (email?: string) => {
    const targetEmail = email || flowState.email || flowState.user?.email
    
    if (!targetEmail) {
      const authError = createAuthError(
        'No email address available for verification',
        'MISSING_EMAIL',
        'VerificationError'
      )
      handleSignInError(authError)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Implement actual verification resend logic
      // await signIn.resendEmailVerification()
      
      navigateToStep('verification-sent', { email: targetEmail })
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to send verification email',
        'VERIFICATION_REQUEST_FAILED',
        'VerificationError',
        error
      )
      handleSignInError(authError)
    } finally {
      setIsLoading(false)
    }
  }, [flowState.email, flowState.user?.email, navigateToStep, createAuthError, handleSignInError])

  const handleVerificationCheck = useCallback(async () => {
    if (!flowState.user) {
      const authError = createAuthError(
        'No user available for verification check',
        'MISSING_USER',
        'VerificationError'
      )
      handleSignInError(authError)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // TODO: Implement actual verification check logic
      // await flowState.user.reload()
      
      if (flowState.user?.emailVerified) {
        navigateToStep('verification-complete')
        setTimeout(() => {
          handleSignInSuccess(flowState.user)
        }, 1500) // Brief success message before redirect
      } else {
        throw new Error('Email is still not verified')
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check verification status',
        'VERIFICATION_CHECK_FAILED',
        'VerificationError',
        error
      )
      handleSignInError(authError)
    } finally {
      setIsLoading(false)
    }
  }, [flowState.user, navigateToStep, createAuthError, handleSignInError, handleSignInSuccess])



  const checkRedirectResult = useCallback(async () => {}, [])

  const contextValue: SignInContextType = useMemo(() => ({
    isError: !!error,
    isLoading,
    error,
    flowState,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    clearError,
    navigateToStep,
    resetFlow,
    handlePasswordReset,
    handleVerificationRequest,
    handleVerificationCheck,
    checkRedirectResult
  }), [
    error,
    isLoading,
    flowState,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    clearError,
    navigateToStep,
    resetFlow,
    handlePasswordReset,
    handleVerificationRequest,
    handleVerificationCheck,
    checkRedirectResult
  ])

  return (
    <SignInContext.Provider value={contextValue}>
      {children}
    </SignInContext.Provider>
  )
}