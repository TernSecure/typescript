'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/react-form'
import type { 
  AuthActions, 
  SignInResponse, 
  TernSecureUser 
} from '@tern-secure/types'
import { createAuthActions as defaultCreateAuthActions } from '@tern-secure/shared'
import { useRouter } from 'next/navigation'

const appName = process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || 'TernSecure'

interface SignInFormValues {
  email: string;
  password: string;
}

function FieldInfo({ field }: { field: AnyFieldApi }) { 
  const meta = field.state.meta as any; 
  const errors = meta.errors;
  const isValidating = meta.isValidating;

  return (
    <>
      {errors && Array.isArray(errors) && errors.length > 0 ? (
        <em className="text-red-500 text-xs">{errors.join(', ')}</em>
      ) : null}
      {isValidating ? <em className="text-xs">Validating...</em> : null}
    </>
  )
}

const prefix = (classes: string) => {
  return classes.split(' ').map(cls => `tern-${cls}`).join(' ')
}

interface SignInDisplayProps {
  authActions: Pick<AuthActions, 'signInWithEmail' | 'signInWithGoogle' | 'signInWithMicrosoft'>;
  redirectUrl?: string;
  onError?: (error: Error, response?: SignInResponse | null) => void;
  onSuccess?: (user: TernSecureUser | null) => void;
  className?: string;
  customStyles?: {
    card?: string;
    input?: string;
    button?: string;
    label?: string;
    separator?: string;
    title?: string;
    socialButton?: string;
  };
}

function SignInDisplay({
  authActions,
  redirectUrl = '/',
  onError,
  onSuccess,
  className,
  customStyles = {},
}: SignInDisplayProps) {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInFormValues,
    onSubmit: async ({ value }: { value: SignInFormValues }) => {
      try {
        const result = await authActions.signInWithEmail(value.email, value.password)
        if (result.success && result.user) {
          onSuccess?.(result.user)
        } else {
          onError?.(new Error(result.error || 'Sign-in failed'), result)
        }
      } catch (err) {
        onError?.(err as Error, null)
      }
    },
  })

  const handleSocialSignIn = useCallback(async (provider: 'google' | 'microsoft') => {
    try {
      sessionStorage.setItem('auth_redirect_url', redirectUrl)
      if (provider === 'google') {
        await authActions.signInWithGoogle()
      } else {
        await authActions.signInWithMicrosoft()
      }
    } catch (err) {
      onError?.(err as Error, null)
    }
  }, [authActions, onError, redirectUrl])

  const isFormSubmitting = (form.state as any).isSubmitting;
  const formGlobalErrors = (form.state as any).errors;

  return (
    <div className={prefix(`flex items-center justify-center min-h-screen bg-gray-100 ${className || ''}`)}>
      <div className={prefix(`bg-white p-8 rounded-lg shadow-md w-full max-w-md ${customStyles.card || ''}`)}>
        <h2 className={prefix(`text-2xl font-bold mb-6 text-center text-gray-800 ${customStyles.title || ''}`)}>
          Sign in to {appName}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }: { value: string }) => 
                !value ? 'Email is required' : !/.+@.+\..+/.test(value) ? 'Invalid email format' : undefined,
            }}
          >
            {(field: AnyFieldApi) => { 
              const fieldState = field.state as any; 
              return (
                <div>
                  <label htmlFor={field.name} className={prefix(`block text-sm font-medium text-gray-700 ${customStyles.label || ''}`)}>
                    Email
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={fieldState.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="email"
                    className={prefix(`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${customStyles.input || ''}`)}
                    required
                    disabled={isFormSubmitting}
                  />
                  <FieldInfo field={field} />
                </div>
              );
            }}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }: { value: string }) => 
                !value ? 'Password is required' : value.length < 6 ? 'Password must be at least 6 characters' : undefined,
            }}
          >
            {(field: AnyFieldApi) => { 
              const fieldState = field.state as any; 
              return (
                <div>
                  <label htmlFor={field.name} className={prefix(`block text-sm font-medium text-gray-700 ${customStyles.label || ''}`)}>
                    Password
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={fieldState.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="password"
                    className={prefix(`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary ${customStyles.input || ''}`)}
                    required
                    disabled={isFormSubmitting}
                  />
                  <FieldInfo field={field} />
                </div>
              );
            }}
          </form.Field>
          
          {formGlobalErrors && formGlobalErrors.length > 0 && (
            <div className="text-red-500 text-sm mt-2">
              {formGlobalErrors.map((err: any, i: number) => <div key={i}>{String(err)}</div>)}
            </div>
          )}

          <form.Subscribe
            selector={(state: any) => [!!state.canSubmit, !!state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={prefix(`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 ${customStyles.button || ''}`)}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            )}
          </form.Subscribe>
        </form>

        <div className={prefix(`mt-6 ${customStyles.separator || ''}`)}>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            className={prefix(`w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 ${customStyles.socialButton || ''}`)}
            disabled={isFormSubmitting}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialSignIn('microsoft')}
            className={prefix(`w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 ${customStyles.socialButton || ''}`)}
            disabled={isFormSubmitting}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}

export type SignInProps = Omit<SignInDisplayProps, 'authActions'> & {
    authActions?: Pick<AuthActions, 'signInWithEmail' | 'signInWithGoogle' | 'signInWithMicrosoft' | 'getRedirectResult'>;
};

export function SignIn(props: SignInProps) {
  const { authActions: propsAuthActions, redirectUrl = '/', onSuccess, onError, ...restDisplayProps } = props;
  const router = useRouter();
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [initialError, setInitialError] = useState<Error | null>(null);

  const authActions = useMemo(() => {
    const selectedActions = propsAuthActions || defaultCreateAuthActions();
    return selectedActions as Pick<AuthActions, 'signInWithEmail' | 'signInWithGoogle' | 'signInWithMicrosoft' | 'getRedirectResult'>;
  }, [propsAuthActions]);

  useEffect(() => {
    let isMounted = true;
    const handleRedirect = async () => {
      try {
        const result = await authActions.getRedirectResult();
        if (result && result.user && isMounted) {
          onSuccess?.(result.user);
          const storedRedirectUrl = sessionStorage.getItem('auth_redirect_url');
          sessionStorage.removeItem('auth_redirect_url');
          router.push(storedRedirectUrl || redirectUrl);
        } else if (result && !result.success && result.error && isMounted) {
            onError?.(new Error(result.message || 'Redirect sign-in failed'), result as SignInResponse);
        }
      } catch (err) {
        if (isMounted) {
            onError?.(err as Error, null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingRedirect(false);
        }
      }
    };

    handleRedirect();
    return () => { isMounted = false; };
  }, [authActions, onSuccess, onError, router, redirectUrl]);

  if (isCheckingRedirect) {
    return (
      <div className={prefix('flex items-center justify-center min-h-screen bg-gray-100')}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (initialError) {
    return (
        <div className={prefix('flex items-center justify-center min-h-screen bg-gray-100')}>
            <div className="text-red-500 p-4 border border-red-500 rounded">
                Error during authentication: {initialError.message}
            </div>
        </div>
    );
  }

  return <SignInDisplay {...restDisplayProps} authActions={authActions} redirectUrl={redirectUrl} onSuccess={onSuccess} onError={onError} />;
}

