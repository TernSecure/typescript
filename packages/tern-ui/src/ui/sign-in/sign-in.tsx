import type { SignInResponse } from '@tern-secure/types'
import { SocialSignIn } from './social-sign-in'
import { EmailSignIn } from './email-sign-in'
import { cn } from '../../lib/utils'


interface SignInProps {
  redirectUrl?: string
  logo?: React.ReactNode | string
  appName?: string
  onError?: (error: Error, response?: SignInResponse | null) => void
  onSuccess?: () => void
  className?: string
  authActions?: {
    signInWithEmail?: (email: string, password: string) => Promise<void>
    signInWithGoogle?: () => Promise<void>
    signInWithMicrosoft?: () => Promise<void>
  }
}

export function SignIn({
  authActions,
  redirectUrl = '/',
  appName,
  onError,
  onSuccess,
  className,
}: SignInProps) {
  const isEmailSignInEnabled = !!authActions?.signInWithEmail
  const isSocialSignInEnabled = !!(authActions?.signInWithGoogle || authActions?.signInWithMicrosoft)

  return (
    <div className={cn('bg-white p-8 rounded-lg shadow-md w-full max-w-md', className)}>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sign in to {appName}
      </h2>

      {isEmailSignInEnabled && (
        <EmailSignIn
          onError={onError}
          onSuccess={onSuccess}
          signInWithEmail={authActions.signInWithEmail}
        />
      )}

      {isSocialSignInEnabled && (
        <SocialSignIn
          authActions={authActions}
          onError={onError}
          onSuccess={onSuccess}
          redirectUrl={redirectUrl}
          isDisabled={false}
        />
      )}
    </div>
  )
}

