import { FormErrors, FormButton } from '../../utils/form'
import { useAppForm } from '../../components/elements'

interface SignInFormValues {
  email: string
  password: string
}

interface EmailSignInProps {
  onError?: (error: Error) => void
  onSuccess?: () => void
  isDisabled?: boolean
  signInWithEmail?: (email: string, password: string) => Promise<void>
}

export function EmailSignIn({
  onError,
  onSuccess,
  isDisabled,
  signInWithEmail,
}: EmailSignInProps) {
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInFormValues,
    onSubmit: async ({ value }) => {
      try {
        if (signInWithEmail) {
          await signInWithEmail(value.email, value.password)
          onSuccess?.()
        }
      } catch (error) {
        onError?.(error as Error)
        throw error
      }
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

      <FormErrors errors={form.state.errors} />

      <FormButton
        canSubmit={form.state.canSubmit}
        isSubmitting={form.state.isSubmitting}
        submitText="Sign in"
        submittingText="Signing in..."
      />
    </form>
  )
}
