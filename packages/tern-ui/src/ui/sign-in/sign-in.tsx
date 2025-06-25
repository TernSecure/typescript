import React, { useCallback } from 'react';
import type { 
  AuthErrorTree,
  TernSecureUser
} from '@tern-secure/types';
import { SocialSignIn } from './social-sign-in';
import { EmailSignIn } from './email-sign-in';
import { PasswordResetForm } from './password-reset-form'
import { VerificationPrompt } from './verification-prompt'
import { VerificationSent } from './verification-sent'
import { 
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter 
} from '../../components/elements'
import { useAuthSignIn } from '../../ctx';
import { cn } from './../../lib/utils'
import { useTernSecure } from '@tern-secure/shared/react'
import { SignInProvider, useSignInContext } from '../../ctx/components/SignIn'
import type { SignInProps } from '../../types'



function SignInContent({
  ui, 
  onError, 
  onSuccess, 
  className, 
}: SignInProps) {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const {
    isLoading,
    flowState,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
    navigateToStep,
    handlePasswordReset,
    handleVerificationRequest,
    handleVerificationCheck
  } = useSignInContext();
  
  const { appName, logo, socialButtons: socialButtonsConfig } = ui || {};

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!signIn.withSocialProvider;
  const isSocialSignInVisible = isSocialSignInGloballyEnabled && (
    socialButtonsConfig?.google !== false || 
    socialButtonsConfig?.microsoft !== false
  );
  
  const checkAndHandleRedirectResult = useCallback(async () => {
    try {
      if (signIn.checkRedirectResult && typeof signIn.checkRedirectResult === 'function') {
        handleSignInStart();
        const redirectResult = await signIn.checkRedirectResult();
        
        if (redirectResult) {
          if (redirectResult.success && redirectResult.user) {
            handleSignInSuccess(redirectResult.user);
            ternSecure.redirectAfterSignIn();
            onSuccess?.(redirectResult.user);
          } else if (!redirectResult.success) {
            const authError = new Error(redirectResult.message || 'Social sign-in failed') as AuthErrorTree;
            authError.name = 'SocialSignInError';
            authError.code = redirectResult.error;
            authError.response = redirectResult;
            handleSignInError(authError);
          }
        }
      }
    } catch (error) {
      const authError = new Error(
        error instanceof Error ? error.message : 'Failed to check redirect result'
      ) as AuthErrorTree;
      authError.name = 'RedirectResultError';
      authError.code = 'REDIRECT_CHECK_FAILED';
      authError.response = error;
      handleSignInError(authError);
    }
  }, [signIn, handleSignInStart, handleSignInSuccess, handleSignInError, ternSecure, onSuccess]);

  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    handleSignInStart();
    try {
      const response = await signIn.withEmailAndPassword({ email, password });
      if (response.success) {
        handleSignInSuccess(response.user);
        if (response.user?.emailVerified) {
          ternSecure.redirectAfterSignIn();
          onSuccess?.(response.user);
        }
      } else {
        const authError = new Error(response.message || 'Sign in failed') as AuthErrorTree;
        authError.name = 'SignInError';
        authError.code = response.error;
        authError.response = response;
        handleSignInError(authError);
      }
      return response;
    } catch (error) {
      const authError = new Error(
        error instanceof Error ? error.message : 'Sign in failed'
      ) as AuthErrorTree;
      authError.name = 'SignInError';
      authError.code = 'SIGN_IN_FAILED';
      authError.response = error;
      handleSignInError(authError);
      throw error;
    }
  }, [signIn, handleSignInStart, handleSignInSuccess, handleSignInError, ternSecure, onSuccess]);

  const handleError = useCallback((error: AuthErrorTree) => {
    handleSignInError(error);
    onError?.(error);
  }, [handleSignInError, onError]);
  
  const handleSuccess = useCallback((user: TernSecureUser | null) => {
    handleSignInSuccess(user);
  }, [handleSignInSuccess]);

  React.useEffect(() => {
    checkAndHandleRedirectResult();
  }, [checkAndHandleRedirectResult]);

  const renderStepContent = () => {
    switch (flowState.step) {
      case 'password-reset':
        return (
          <PasswordResetForm
            onSubmit={handlePasswordReset}
            onCancel={() => navigateToStep('signin')}
            isLoading={isLoading}
          />
        );
        
      case 'verification-required':
        return (
          <VerificationPrompt
            email={flowState.email}
            onResendVerification={handleVerificationRequest}
            onCheckVerification={handleVerificationCheck}
            onBackToSignIn={() => navigateToStep('signin')}
            isLoading={isLoading}
          />
        );
        
      case 'verification-sent':
        return (
          <VerificationSent
            email={flowState.email}
            onCheckVerification={handleVerificationCheck}
            onResendVerification={handleVerificationRequest}
            onBackToSignIn={() => navigateToStep('signin')}
            isLoading={isLoading}
          />
        );
        
      case 'verification-complete':
        return (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Email Verified!</h3>
            <p style={{ color: '#6b7280' }}>Redirecting you now...</p>
          </div>
        );
        
      default:
        return (
          <>
            {isEmailSignInEnabled ? (
              <EmailSignIn
                onError={handleError}
                onSuccess={handleSuccess}
                signInWithEmail={handleSignInWithEmail}
                onForgotPassword={() => navigateToStep('password-reset')}
              />
            ) : (
            <p className="text-sm text-muted-foreground">
              Email sign-in is not enabled.
              </p>
            )}
            {isSocialSignInVisible && (
              <SocialSignIn
                onError={handleError}
                onSuccess={handleSuccess}
                config={socialButtonsConfig}
                mode={'redirect'}
              />
            )}
          </>
        );
    }
  };

  const renderFooter = () => {
    switch (flowState.step) {
      case 'password-reset':
        return (
          <CardFooter>
            Remember your password?{' '}
            <a onClick={() => navigateToStep('signin')}>
              Back to sign in
            </a>
          </CardFooter>
        );
        
      case 'verification-required':
      case 'verification-sent':
        return null;
        
      default:
        return (
          <CardFooter>
            Don&apos;t have an account?{' '}
            <a href="/sign-up">
              Sign up
            </a>
          </CardFooter>
        );
    }
  };

  const getStepTitle = () => {
    switch (flowState.step) {
      case 'password-reset':
        return 'Reset your password';
      case 'verification-required':
        return 'Verify your email';
      case 'verification-sent':
        return 'Check your email';
      case 'verification-complete':
        return 'Email verified!';
      default:
        return `Sign in to ${appName || 'your account'}`;
    }
  };

  const getStepDescription = () => {
    switch (flowState.step) {
      case 'password-reset':
        return 'Enter your email to receive a password reset link';
      case 'verification-required':
        return 'Please verify your email address to continue';
      case 'verification-sent':
        return 'We sent a verification link to your email';
      case 'verification-complete':
        return 'Your email has been successfully verified';
      default:
        return 'Please sign in to continue';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <Card className={cn('w-full max-w-md mx-auto mt-8', className)}>
         <CardHeader className="space-y-1 text-center">
          {logo && (
            <div className="flex justify-center mb-6">
              <img
              src={logo} 
              alt={appName ? `${appName} Logo` : 'Application Logo'} 
              className="h-16 w-auto" 
              />
              </div>
            )}
          <CardTitle className={cn("font-bold")}>{getStepTitle()}</CardTitle>
          <CardDescription className={cn("text-muted-foreground")}>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderStepContent()}
        </CardContent>
        {renderFooter() && (
          <CardFooter className="flex justify-center">
            {renderFooter()}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export function SignIn(props: SignInProps) {
  return (
    <SignInProvider
      onSuccess={props.onSuccess}
      onError={props.onError}
    >
      <SignInContent {...props} />
    </SignInProvider>
  )
}