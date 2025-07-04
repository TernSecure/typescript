import React, { useState } from 'react'
import { FormErrors, FormButton } from '../../utils/form'
import { useAppForm, Button, useCardState } from '../../components/elements'
import type { SignInResponseTree, TernSecureUser } from '@tern-secure/types'
import { cn } from './../../lib/utils'



interface SignInFormValues {
  email: string
  password: string
}

interface EmailSignInProps {
  onError?: (error: Error) => void
  onSuccess?: (user: TernSecureUser | null) => void
  isDisabled?: boolean
  signInWithEmail?: (email: string, password: string) => Promise<SignInResponseTree>
  onForgotPassword?: () => void
}

const successAuth = async(user: TernSecureUser) => {
  const idToken =  await user.getIdToken()
}


export function EmailSignIn({
  onError,
  onSuccess,
  isDisabled,
  signInWithEmail,
  onForgotPassword
}: EmailSignInProps) {
  const card = useCardState()

  const [formError, setFormError] = useState<SignInResponseTree | null>(null);


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
            card.setError({
              success: false,
              error: res.error,
              message: res.message,
              user: null,
            })

            return 
          }

          if (res.user && onSuccess) {
            onSuccess?.(res.user)
          }
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

      {/*<FormErrors errors={formError?.message || formError?.error || form.state.errors} />*/}
      <form.AppField name="email">
        {(field) => (
          <field.EmailField
            label="Email"
            placeholder="Enter your email"
            disabled={form.state.isSubmitting || isDisabled}
            required
          />
        )}
      </form.AppField>

      <form.AppField name="password">
        {(field) => (
          <field.PasswordField
            label="Password"
            placeholder="Enter your password"
            disabled={form.state.isSubmitting || isDisabled}
            required
          />
        )}
      </form.AppField>
      {onForgotPassword && (
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={form.state.isSubmitting || isDisabled}
          className={cn(
            "w-full text-right text-sm text-blue-600 hover:text-blue-500",
            "bg-transparent border-none cursor-pointer",
            "mt-[-0.5rem] mb-2 hover:underline",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Forgot your password?
        </button>
      )}

      <FormButton
        canSubmit={form.state.canSubmit}
        isSubmitting={form.state.isSubmitting}
        submitText="Sign in"
        submittingText="Signing in..."
      />
    </form>
  )
}
