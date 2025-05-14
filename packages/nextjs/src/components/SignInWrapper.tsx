'use client'

import { SignIn } from '@tern-secure/next-frontend'
import type { SignInProps as BaseSignInProps } from '@tern-secure/next-frontend'
import { createAuthActions } from '@tern-secure/shared'

type SignInWrapperProps = Omit<BaseSignInProps, 'authActions'>

export function SignInWrapper(props: SignInWrapperProps) {
  const authActions = createAuthActions()
  return <SignIn {...props} authActions={authActions} />
}

// Re-export as SignIn
export { SignInWrapper as SignIn }
