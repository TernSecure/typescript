"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
//import { ternSecureAuth } from '../utils/client-init'
//import { onAuthStateChanged, User } from "firebase/auth"
import { TernSecureCtx, TernSecureCtxValue } from './TernSecureCtx'
import type { TernSecureState, AuthError, SignInResponse } from "../types"
//import type { ERRORS } from '../errors'
import { useRouter, usePathname } from 'next/navigation'
import { isBaseAuthRoute, isInternalRoute, isAuthRoute} from '../app-router/route-handler/internal-route'
import { hasRedirectLoop } from '../utils/construct'



/**
 * @internal
 * Internal provider props - not meant for direct usage
 */
interface TernSecureClientProviderProps {
  children: React.ReactNode
  /** Callback when user state changes */
  //onUserChanged?: (user: User | null) => Promise<void>
  /** Login page path */
  loginPath?: string
  /** Signup page path */
  signUpPath?: string
  /** Custom loading component */
  loadingComponent?: React.ReactNode
  /** Whether email verification is required */
  requiresVerification: boolean
}

/**
 * @internal
 * Internal provider component that handles authentication state
 * This is wrapped by the public TernSecureProvider
 */

export function TernSecureClientProvider({ 
  children, 
  loginPath = process.env.NEXT_PUBLIC_SIGN_IN_PATH || '/sign-in',
  signUpPath = process.env.NEXT_PUBLIC_SIGN_UP_PATH || '/sign-up',
  loadingComponent,
  requiresVerification,
}: TernSecureClientProviderProps) {
  //const auth = useMemo(() => ternSecureAuth, []);
  const router = useRouter();
  const pathname = usePathname() // Get current pathname
  const [isRedirecting, setIsRedirecting] = useState(false)

  const [authState, setAuthState] = useState<TernSecureState>(() => ({
    userId: null,
    isLoaded: false,
    error: null,
    isValid: false,
    isVerified: false,
    isAuthenticated: false,
    token: null,
    email: null,
    status: "loading",
    requiresVerification,
  }));

  const constructUrlWithRedirect = useCallback(
    (loginPath: string, currentPath: string, loginPathParam: string, signUpPathParam: string): string => {
      const baseUrl = window.location.origin
      const signInUrl = new URL(loginPath, baseUrl)

      // Only add redirect if not already on login or signup page
      if (!currentPath.includes(loginPathParam) && !currentPath.includes(signUpPathParam)) {
        signInUrl.searchParams.set("redirect", currentPath)
      }
      return signInUrl.toString()
    },
    [],
  )


  const shouldRedirect = useCallback(
    (pathname: string, isVerified: boolean) => {
      // Get current search params
      const searchParams = new URLSearchParams(window.location.search)

      // Don't redirect if we're on the base sign-in page with no redirect param
      if (isBaseAuthRoute(pathname) && !searchParams.has("redirect")) {
        return false
      }

      // Don't redirect if we're on an internal route
      if (isInternalRoute(pathname)) {
        return false
      }

      // Don't redirect if we're in auth routes (except when handling verification)
      if (isAuthRoute(pathname) && (!requiresVerification || isVerified)) {
        return false
      }

      return true
    },
    [requiresVerification],
  )

  const redirectToLogin = useCallback(
    (currentPath?: string) => {
      const path = currentPath || pathname || "/"


      if (isInternalRoute(path)) {  // Don't redirect if we're already on an internal route
        return
      }

       // Check for redirect loops
      if (hasRedirectLoop(path, loginPath)) {
        return
      }

      setIsRedirecting(true)

      const loginUrl = constructUrlWithRedirect(loginPath, path, loginPath, signUpPath)

      if (process.env.NODE_ENV === "production") {
        window.location.href = loginUrl
      } else {
        // Use router.push for development
        router.push(loginUrl)
      }
  }, 
  [router, loginPath, signUpPath, pathname, constructUrlWithRedirect]
)

{/*  const handleSignOut = useCallback(async (error?: Error) => {
    const currentPath = window.location.pathname
    await auth.signOut();
    setAuthState({
      isLoaded: true,
      userId: null,
      error: error || null,
      isValid: false,
      token: null,
      email: null,
      isVerified: false,
      isAuthenticated: false,
      status: "unauthenticated",
      requiresVerification,
    })
    redirectToLogin(currentPath)
  }, [auth, redirectToLogin, requiresVerification])}

  const setEmail = useCallback((email: string) => {
    setAuthState((prev) => ({
      ...prev,
      email,
    }))
  }, [])

  const getAuthError = useCallback((): SignInResponse => {
    if (authState.error) {
      const error = authState.error as AuthError;
      return {
        success: false,
        message: error.message,
        error: error.code as keyof typeof ERRORS,
        user: null,
      }
    }

    if (authState.requiresVerification && authState.isValid && !authState.isVerified) {
      return {
        success: false,
        message: 'Email verification required',
        error: 'EMAIL_NOT_VERIFIED',
        user: null,
      }
    }

    if (!authState.isAuthenticated && authState.status !== "loading") {
      return {
        success: false,
        message: 'User is not authenticated',
        error: 'AUTHENTICATED',
        user: null,
      }
    }

    return {
      success: true,
      user: ternSecureAuth.currentUser,
    }
  }, [
    authState.error,
    authState.isValid,
    authState.isVerified,
    authState.isAuthenticated,
    authState.status,
    authState.requiresVerification,
  ])

{/*useEffect(() => {
  let mounted = true
  let initialLoad = true

  const unsubscribe = onAuthStateChanged(
    auth,
      async (user: User | null) => {
       if (!mounted) return
       try {
        if (user) {
        const isValid = !!user.uid;
        const isVerified = user.emailVerified;
        const isAuthenticated = isValid && (!requiresVerification || isVerified) // Consider user authenticated if verification is not required or if email is verified

        setAuthState({
          isLoaded: true,
          userId: user.uid,
          isValid,
          isVerified,
          isAuthenticated: isValid && isVerified,
          token: user.getIdToken(),
          error: null,
          email: user.email,
          status: isAuthenticated ? "authenticated" : "unverified",
          requiresVerification,
        })
       
        if (requiresVerification && !isVerified && shouldRedirect(pathname || "", isVerified)) {
          if(initialLoad || !isRedirecting) {
            redirectToLogin(pathname)
        }
      }
      } else {
        setAuthState({
          isLoaded: true,
          userId: null,
          isValid: false,
          isVerified: false,
          isAuthenticated: false,
          token: null,
          error: null,
          email: null,
          status: "unauthenticated",
          requiresVerification,
        })
        
        if (shouldRedirect(pathname || "", false) && initialLoad) {
          redirectToLogin()
        }
      }
    } catch (error){
      console.error("Auth state change error:", error)
      if (mounted) {
        handleSignOut(error instanceof Error ? error : new Error("Authentication error occurred"))
      }
    } finally {
      initialLoad = false
    }
  })
    
  return () => {
    mounted = false
    unsubscribe()
  }
  }, [
    auth, 
    handleSignOut, 
    redirectToLogin, 
    requiresVerification, 
    pathname, 
    isRedirecting, 
    shouldRedirect
  ])*/}

  const contextValue: TernSecureCtxValue = useMemo(() => ({
    ...authState,
    //signOut: handleSignOut,
    //setEmail,
    //getAuthError,
    redirectToLogin,
  }), [authState, redirectToLogin]);

  if (!authState.isLoaded) {
    return (
      <TernSecureCtx.Provider value={contextValue}>
        {loadingComponent || (
          <div aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading authentication state...</span>
          </div>
        )}
      </TernSecureCtx.Provider>
    );
  }

  return (
      <TernSecureCtx.Provider value={contextValue}>
       {children}
      </TernSecureCtx.Provider>
  )
}