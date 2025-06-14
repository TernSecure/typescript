import React, { useState } from 'react'
import { FormErrors, FormButton } from '../../utils/form'
import { useAppForm } from '../../components/elements'
import { useTernSecure } from '@tern-secure/shared/react'
import type { SignInResponseTree } from '@tern-secure/types'


interface SignInFormValues {
  email: string
  password: string
}

interface EmailSignInProps {
  onError?: (error: Error) => void
  onSuccess?: () => void
  isDisabled?: boolean
  signInWithEmail?: (email: string, password: string) => Promise<SignInResponseTree>
}

export function EmailSignIn({
  onError,
  onSuccess,
  isDisabled,
  signInWithEmail,
}: EmailSignInProps) {
  const ternSecure = useTernSecure();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInFormValues,
    validators: {
      onSubmitAsync: async ({ value }) => {
      try {
        if (signInWithEmail) {
          const res = await signInWithEmail(value.email, value.password)
          if (!res.success) {
            const error: SignInResponseTree = {
              success: false,
              error: res.error,
              message: res.message,
              user: null,
            }
            setAuthError(error.message || 'Sign in failed')
            return 
          }

          if (res.user) {
            ternSecure.redirectAfterSignIn()
          }

          onSuccess?.()
        }
      } catch (error) {
        onError?.(error as Error)
        throw error
      }
    },
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <FormErrors errors={authError} />
      <form.AppField
        name="email"
        children={(field) =>
          <field.EmailField
            label='Email'
            placeholder='Enter your email'
            disabled={form.state.isSubmitting || isDisabled}
            required
          />
        }
      />

      <form.AppField
        name="password"
        children={(field) =>
          <field.PasswordField
            label='Password'
            placeholder='Enter your password'
            disabled={form.state.isSubmitting || isDisabled}
            required
          />
        }
      />

      <FormButton
        canSubmit={form.state.canSubmit}
        isSubmitting={form.state.isSubmitting}
        submitText="Sign in"
        submittingText="Signing in..."
      />
    </form>
  )
}
