'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { Button, type ButtonProps } from './ui/button'
import { ternSecureAuth } from '../utils/client-init'
import { clearSessionCookie } from '../client/session'
import { cn } from '../lib/utils'
import { constructUrlWithRedirect } from '../utils/construct'


type SignOutCustomProps = {
  children?: React.ReactNode
  onError?: (error: Error) => void
  onSignOutSuccess?: () => void
  redirectPath?: string
  className?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

type SignOutProps = Omit<ButtonProps, 'onClick'> & SignOutCustomProps

export function SignOutButton({ 
  children = 'Sign out', 
  onError,
  onSignOutSuccess,
  redirectPath,
  className,
  variant = 'outline',
  size = 'default',
  ...buttonProps 
}: SignOutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const loginPath = process.env.NEXT_PUBLIC_LOGIN_PATH || '/sign-in'

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Sign out from Firebase
      await signOut(ternSecureAuth)
    
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
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={cn("", className)}
      {...buttonProps}
    >
      {isLoading ? 'Signing out...' : children}
    </Button>
  )
}

