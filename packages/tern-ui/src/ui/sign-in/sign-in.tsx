import React, { useCallback } from 'react';
import type { 
  SignInPropsTree,
  AuthErrorTree,
  TernSecureUser
} from '@tern-secure/types';
import { SocialSignIn } from './social-sign-in';
import { EmailSignIn } from './email-sign-in';
import { cn } from '../../lib/utils';
import { 
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter 
} from '../../components/elements'
import { useAuthSignIn } from '../../ctx';
import { useTernSecure } from '@tern-secure/shared/react'
import { SignInProvider, useSignInContext } from './SignIn'


interface SignInProps extends Omit<SignInPropsTree, 'signIn'> {
  className?: string;
}

function SignInContent({
  ui, 
  onError, 
  onSuccess, 
  className, 
}: SignInProps) {

  const signIn  = useAuthSignIn();
  const ternSecure = useTernSecure();
  const {
    isLoading,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
  } = useSignInContext();
  const appName = ui?.appName;
  const logo = ui?.logo;
  const socialButtonsConfig = ui?.socialButtons; 

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!(signIn.withSocialProvider);
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
  


  const handleSignInWithEmail = async (email: string, password: string) => {
    handleSignInStart();
    try {
      const response = await signIn.withEmailAndPassword({ email, password });
      if (response.success) {
        handleSignInSuccess();
        ternSecure.redirectAfterSignIn();
        onSuccess?.(response.user);
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
  };

  const handleError = (error: AuthErrorTree) => {
    handleSignInError(error);
    if (onError) {
      onError(error);
    }
  };
  
  const handleSuccess = (user: TernSecureUser | null) => {
    handleSignInSuccess();
    onSuccess?.(user);
  };

  React.useEffect(() => {
    checkAndHandleRedirectResult();
  }, [checkAndHandleRedirectResult]);
  

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
      <CardTitle className={cn("font-bold")}> 
        Sign in to {appName || 'your account'} 
        </CardTitle>
        <CardDescription className={cn("text-muted-foreground")}>
          Please sign in to continue
        </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
      {isEmailSignInEnabled ? (
        <EmailSignIn
          onError={handleError}
          onSuccess={handleSuccess}
          signInWithEmail={handleSignInWithEmail}
        />
      ):(
        <p className="text-sm text-muted-foreground">
          Email sign-in is not enabled.
        </p>
      )}
      { isSocialSignInVisible && (
        <SocialSignIn
          onError={handleError}
          onSuccess={handleSuccess}
          config={socialButtonsConfig}
          mode={'redirect'}
        />
      )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="/sign-up" className="text-primary hover:underline">
          Sign up
          </a>
        </p>
      </CardFooter>
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

