'use client'

import { useCallback } from 'react'
import type { SignInResponseTree, SignInUIConfig } from '@tern-secure/types'
import { cn } from './../../lib/utils'

interface SocialSignInProps {
  onError?: (error: Error, response?: SignInResponseTree | null) => void
  onSuccess?: () => void
  redirectUrl?: string
  isDisabled?: boolean
  authActions?: {
    signInWithGoogle?: () => Promise<void>
    signInWithMicrosoft?: () => Promise<void>
  }
  config?: SignInUIConfig['socialButtons']
}

export function SocialSignIn({
  onError,
  onSuccess,
  redirectUrl = '/',
  isDisabled,
  authActions,
  config,
}: SocialSignInProps) {
  const handleSocialSignIn = useCallback(async (provider: 'google' | 'microsoft') => {
    try {
      if (provider === 'google' && authActions?.signInWithGoogle) {
        await authActions.signInWithGoogle()
      } else if (provider === 'microsoft' && authActions?.signInWithMicrosoft) {
        await authActions.signInWithMicrosoft()
      }
      onSuccess?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }, [authActions, onError, onSuccess])

  const showGoogle = authActions?.signInWithGoogle && config?.google !== false
  const showMicrosoft = authActions?.signInWithMicrosoft && config?.microsoft !== false

  const layout = config?.layout || 'horizontal'
  const buttonSizeClass = config?.size === 'small' ? 'py-1 px-3 text-xs' : config?.size === 'large' ? 'py-3 px-5 text-lg' : 'py-2 px-4 text-sm'

  if (!showGoogle && !showMicrosoft) {
    return null
  }

  return (
    <div>
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className={cn(
        "mt-6 grid gap-4",
        (layout === 'vertical' || (!showGoogle || !showMicrosoft)) ? "grid-cols-1" : "sm:grid-cols-2"
      )}>
        {showGoogle && (
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            className={cn(
              'w-full inline-flex justify-center items-center border border-gray-300 rounded-md shadow-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50',
              buttonSizeClass
            )}
            disabled={isDisabled}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Google
          </button>
        )}

        {showMicrosoft && (
          <button
            type="button"
            onClick={() => handleSocialSignIn('microsoft')}
            className={cn(
              'w-full inline-flex justify-center items-center border border-gray-300 rounded-md shadow-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50',
              buttonSizeClass
            )}
            disabled={isDisabled}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Microsoft
          </button>
        )}
      </div>
    </div>
  )
}
