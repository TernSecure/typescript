import React, { useState } from 'react'
import { FormErrors, FormButton } from '../../utils/form'
import { useAppForm } from '../../components/elements'
import { useTernSecure } from '@tern-secure/shared/react'
import type { SignInResponseTree, TernSecureUser } from '@tern-secure/types'
import { useAuthState } from '../../ctx'
import { useSignInContext } from './SignIn'


interface SignInFormValues {
  email: string
  password: string
}

interface EmailSignInProps {
  onError?: (error: Error) => void
  onSuccess?: (user: TernSecureUser | null) => void
  isDisabled?: boolean
  signInWithEmail?: (email: string, password: string) => Promise<SignInResponseTree>
}

const successAuth = async(user: TernSecureUser) => {
  const idToken =  await user.getIdToken()
}


export function EmailSignIn({
  onError,
  onSuccess,
  isDisabled,
  signInWithEmail,
}: EmailSignInProps) {
  const ternSecure = useTernSecure();
  const authState = useAuthState();
  const { isLoading, clearError } = useSignInContext();
  const requiresVerification: boolean = false;

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
            setFormError({
              success: false,
              error: res.error,
              message: res.message,
              user: null,
            })

            return 
          }

          if (res.user) {
            if (requiresVerification && !res.user.isVerified) {
              setFormError({
                success: false,
                message: 'Email verification required',
                error: 'REQUIRES_VERIFICATION',
                user: res.user,
              })

            return
          }
        }
        //ternSecure.redirectAfterSignIn();
        onSuccess?.(res.user)
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

      <FormErrors errors={formError?.message || formError?.error || form.state.errors} />
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

      <FormButton
        canSubmit={form.state.canSubmit}
        isSubmitting={form.state.isSubmitting}
        submitText="Sign in"
        submittingText="Signing in..."
      />
    </form>
  )
}
