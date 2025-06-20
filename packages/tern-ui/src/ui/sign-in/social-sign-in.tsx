'use client'

import { useCallback } from 'react'
import type { 
  SignInResponseTree, 
  SignInUIConfig 
} from '@tern-secure/types'
import { Separator, Button } from '../../components/elements'
import { cn } from './../../lib/utils'
import { useAuthSignIn } from '../../ctx';

interface SocialSignInProps {
  onError?: (error: Error, response?: SignInResponseTree | null) => void
  onSuccess?: () => void
  isDisabled?: boolean
  config?: SignInUIConfig['socialButtons']
  mode?: 'popup' | 'redirect'
}

const BUTTON_SIZE_CLASSES = {
  small: 'py-1 px-3 text-xs',
  large: 'py-3 px-5 text-lg',
  default: 'py-2 px-4 text-sm'
} as const;

const BASE_BUTTON_CLASSES = 'w-full inline-flex justify-center items-center border border-gray-300 rounded-md shadow-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50';

export function SocialSignIn({
  onError,
  onSuccess,
  isDisabled,
  config,
  mode = 'popup'
}: SocialSignInProps) {
  const signIn  = useAuthSignIn();

  const handleSocialSignIn = useCallback(async (provider: 'google' | 'microsoft') => {
    try {

      const result = await signIn.withSocialProvider(provider, { mode });
      if (mode === 'popup' && result) {
        if (!result.success) {
          onError?.(new Error(result.message), result)
        } else {
          onSuccess?.()
        }
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }, [signIn, onError, onSuccess, mode])

  const showGoogle = config?.google !== false
  const showMicrosoft = config?.microsoft !== false

  const buttonSizeClass = config?.size === 'small' ? 'py-1 px-3 text-xs' : config?.size === 'large' ? 'py-3 px-5 text-lg' : 'py-2 px-4 text-sm'
  const layout = config?.layout || 'horizontal';
  //const buttonSizeClass = config?.size ? BUTTON_SIZE_CLASSES[config.size] || BUTTON_SIZE_CLASSES.default : BUTTON_SIZE_CLASSES.default;

  if (!showGoogle && !showMicrosoft) {
    return null
  }

  const gridColumns = (layout === 'vertical' || (!showGoogle || !showMicrosoft)) ? "grid-cols-1" : "sm:grid-cols-2";

  return (
    <div>
      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-muted-foreground text-sm">Or continue with</span>
        </div>
      </div>

      <div className={cn("mt-6 grid gap-4", gridColumns)}>
        {showGoogle && (
          <Button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            className={cn(
              'w-full inline-flex justify-center items-center border border-gray-300 rounded-md shadow-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50',
              buttonSizeClass
            )}
            disabled={isDisabled}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        )}

        {showMicrosoft && (
          <Button
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
          </Button>
        )}
      </div>
    </div>
  )
}
