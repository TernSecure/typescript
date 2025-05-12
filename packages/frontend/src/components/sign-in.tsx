'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname} from 'next/navigation'
import { signInWithEmail, signInWithRedirectGoogle, signInWithMicrosoft } from '../client/actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"
import { Separator } from "./ui/separator"
import { cn } from "../lib/utils"
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { getRedirectResult, User } from 'firebase/auth'
import { ternSecureAuth } from '../utils/client-init'
import { createSessionCookie } from '../client/session'
import { AuthBackground } from './background'
import { getValidRedirectUrl } from '../utils/construct'
import { handleInternalRoute } from '../route-handler/internal-route'
import type { 
  SignInResponse
} from '@tern-secure/types'
import { 
  getErrorAlertVariant
} from '@tern-secure/types'
import { useAuth } from '../hooks/useAuth'



const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const appName = process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || 'TernSecure';


export interface SignInProps {
  redirectUrl?: string
  onError?: (error: Error) => void
  onSuccess?: () => void
  className?: string
  customStyles?: {
    card?: string
    input?: string
    button?: string
    label?: string
    separator?: string
    title?: string
    description?: string
    socialButton?: string
  }
}

const prefix = (classes: string) => {
  return classes.split(' ').map(cls => `tern-${cls}`).join(' ')
}


export function SignIn({
  redirectUrl,
  onError,
  onSuccess,
  className,
  customStyles = {}
}: SignInProps) {
  const [loading, setLoading] = useState(false)
  const [checkingRedirect, setCheckingRedirect] = useState(true)
  const [formError, setFormError] = useState<SignInResponse | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [authResponse, setAuthResponse] = useState<SignInResponse | null>(null)
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isRedirectSignIn = searchParams.get('signInRedirect') === 'true'
  const router = useRouter()
  const pathname = usePathname()
  const InternalComponent = handleInternalRoute(pathname || "")
  const { requiresVerification, error: authError, status } = useAuth()
  const validRedirectUrl = getValidRedirectUrl(searchParams, redirectUrl)


  if (InternalComponent) {
    return <InternalComponent />
  }

  useEffect(() => {
    if (authError && status !== "loading" && status !== "unauthenticated") {

      const message = authError.message || "Authentication failed"
      setAuthErrorMessage(message)

      if(!authResponse || authResponse.message !== message) {
        setAuthResponse(authError as SignInResponse)
      }
    } else {
      setAuthErrorMessage(null)
    }
  }, [authError, status, authResponse])

  const handleSuccessfulAuth = useCallback(
    async (user: User) => {
      try {
        const idToken = await user.getIdToken()
        const sessionResult = await createSessionCookie(idToken)

        if (!sessionResult.success) {
          setFormError({
            success: false, 
            message: sessionResult.message || "Failed to create session", 
            error: 'INTERNAL_ERROR', 
            user: null
          })
        }

        onSuccess?.()

        // Use the finalRedirectUrl for navigation
        if (process.env.NODE_ENV === "production") {
          // Use window.location.href in production for a full page reload
          window.location.href = validRedirectUrl
        } else {
          // Use router.push in development
          router.push(validRedirectUrl)
        }
      } catch (err) {
        setFormError({
          success: false, 
          message: "Failed to complete authentication", 
          error: 'INTERNAL_ERROR', 
          user: null
        })
      }
    },
    [validRedirectUrl, router, onSuccess],
  )


  const handleRedirectResult = useCallback(async () => {
    if (!isRedirectSignIn) return false
    setCheckingRedirect(true)
    try {
      console.log('Checking redirect result...');
      console.log('Current hostname:', window.location.hostname);
      console.log('Auth domain hostname:', authDomain);

    const isOnAuth = authDomain && 
    window.location.hostname === authDomain.replace(/https?:\/\//, '');
    console.log('Is on  AuthDomain:', isOnAuth);


      const result = await getRedirectResult(ternSecureAuth)
      console.log('Redirect result:', result);
      if (result) {
        const idToken = await result.user.getIdToken()
        const sessionResult = await createSessionCookie(idToken)
        if (!sessionResult.success) {
          throw new Error('Failed to create session')
        }
        const storedRedirectUrl = sessionStorage.getItem('auth_return_url')
        sessionStorage.removeItem('auth_redirect_url') 
        onSuccess?.()
        window.location.href = storedRedirectUrl || getValidRedirectUrl(searchParams, redirectUrl)
        return true
      }
      setCheckingRedirect(false)
    } catch (err) { 
      const errorMessage = err as SignInResponse
      setFormError(errorMessage)
      if (onError && err instanceof Error) {
        onError(err)
      }
      sessionStorage.removeItem('auth_redirect_url')
      return false
    }
  }, [isRedirectSignIn, redirectUrl, searchParams, onSuccess, onError])

 //const REDIRECT_TIMEOUT = 5000;

  useEffect(() => {
    if (isRedirectSignIn) {
      handleRedirectResult()
    }
  }, [handleRedirectResult, isRedirectSignIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    setAuthResponse(null)

    try {
      const response= await signInWithEmail(email, password)
      setAuthResponse(response)

      if (!response.success) {
        setFormError({
          success: false, 
          message: response.message, 
          error: response.error, 
          user: null
        })
        return
      }

      if (response.user) {
        if(requiresVerification && !response.user.emailVerified) {
          setFormError({
            success: false, 
            message: 'Email verification required', 
            error: 'REQUIRES_VERIFICATION', 
            user: response.user
          })
          return
      }

      await handleSuccessfulAuth(response.user)
    }
    } catch (err) {
      const errorMessage = err as SignInResponse
      setFormError(errorMessage)
      if (onError && err instanceof Error) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    try {

      const validRedirectUrl = getValidRedirectUrl(searchParams, redirectUrl)
      sessionStorage.setItem('auth_redirect_url', validRedirectUrl)

      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('signInRedirect', 'true')
      window.history.replaceState({}, '', currentUrl.toString())

      const result = provider === 'google' ? await signInWithRedirectGoogle() : await signInWithMicrosoft()
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMessage = err as SignInResponse
      setFormError(errorMessage)
      if (onError && err instanceof Error) {
        onError(err)
      }
      setLoading(false)
      sessionStorage.removeItem('auth_redirect_url')
    }
  }

  const handleVerificationRedirect = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/sign-in/verify")
  }


  if (checkingRedirect && isRedirectSignIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          
        </div>
      </div>
    )
  }


const activeError = formError || authResponse
const showEmailVerificationButton =
  activeError?.error === "EMAIL_NOT_VERIFIED" || activeError?.error === "REQUIRES_VERIFICATION"

  return (
    <div className="relative flex items-center justify-center">
      <AuthBackground />
    <Card className={cn("w-full max-w-md mx-auto mt-8", className, customStyles.card)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className={cn("font-bold", customStyles.title)}>Sign in to {`${appName}`} </CardTitle>
        <CardDescription className={cn("text-muted-foreground", customStyles.description)}>
          Please sign in to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeError && (
            <Alert variant={getErrorAlertVariant(activeError)} className="animate-in fade-in-50">
              <AlertDescription>
              <span>{activeError.message}</span>
              {showEmailVerificationButton && (
                    <Button
                      type='button'
                      variant="link"
                      className="p-0 h-auto font-normal text-sm hover:underline"
                      onClick={handleVerificationRedirect}
                    >
                      Request new verification email →
                    </Button>
                  )}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className={cn(customStyles.label)}>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={cn(customStyles.input)}
              required
              aria-invalid={activeError?.error === "INVALID_EMAIL"}
              aria-describedby={activeError ? "error-message" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className={cn(customStyles.label)}>Password</Label>
            <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={loading}
              className={cn(customStyles.input)}
              required
              aria-invalid={activeError?.error === "INVALID_CREDENTIALS"}
              aria-describedby={activeError ? "error-message" : undefined}
            />
          <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className={cn("w-full", customStyles.button)}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        <div className="relative">
          <Separator className={cn(customStyles.separator)} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background px-2 text-muted-foreground text-sm">Or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            disabled={loading} 
            onClick={() => handleSocialSignIn('google')} 
            className={cn("flex items-center justify-center", customStyles.socialButton)}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          <Button 
            variant="outline" 
            disabled={loading} 
            onClick={() => handleSocialSignIn('microsoft')} 
            className={cn("flex items-center justify-center", customStyles.socialButton)}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Microsoft
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
          <a href="/sign-up" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </CardFooter>
    </Card>
    </div>
  )
}

