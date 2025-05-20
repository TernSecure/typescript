'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { ternSecureAuth } from '../utils/client-init'
import { clearSessionCookie } from '../client/session'
import { cn } from '../lib/utils'
import Link from 'next/link'
import { constructUrlWithRedirect } from '../utils/construct'


interface SignOutLinkProps {
  children?: React.ReactNode
  onError?: (error: Error) => void
  onSignOutSuccess?: () => void
  className?: string
  activeClassName?: string
  disabled?: boolean
  redirectPath?: string
}

export function SignOut({
  children = 'Sign out',
  onError,
  onSignOutSuccess,
  className,
  activeClassName,
  disabled = false,
  redirectPath,
}: SignOutLinkProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || "/sign-in"

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      // Sign out from Firebase
      await signOut(ternSecureAuth)

      // Clear the session cookie
      await clearSessionCookie()

      // Call success callback if provided
      onSignOutSuccess?.()

      // Construct login URL with redirect parameter
      const loginUrl = constructUrlWithRedirect(loginPath, pathname)

      // Use router for development and window.location for production
      if (process.env.NODE_ENV === "production") {
        window.location.href = loginUrl
      } else {
        router.push(loginUrl)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to sign out'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link
      href="#"
      onClick={handleSignOut}
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        disabled && 'pointer-events-none opacity-50',
        isLoading && 'pointer-events-none',
        className,
        isLoading && activeClassName
      )}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? 'Signing out...' : children}
    </Link>
  )
}