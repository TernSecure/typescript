import React, { useCallback, useState } from 'react';
import type { 
  AuthErrorTree,
  TernSecureUser
} from '@tern-secure/types';
import { SignInStart } from './sign-in-start';
import { PasswordResetStep } from './password-reset-step'
import { VerificationStep } from '../verify'
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

// UI-specific flow state - simplified
type AuthFlowStep = 
  | 'signin' 
  | 'verification' 
  | 'verification-complete'
  | 'password-reset'
  | 'mfa-required'

interface AuthFlowState {
  step: AuthFlowStep
  email?: string
  user?: TernSecureUser | null
  requiresVerification?: boolean
}

const DEFAULT_FLOW_STATE: AuthFlowState = {
  step: 'signin'
}

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
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
  } = useSignInContext();
  
  // UI flow state managed locally in the component
  const [flowState, setFlowState] = useState<AuthFlowState>(DEFAULT_FLOW_STATE)

  const { appName, logo, socialButtons: socialButtonsConfig } = ui || {};

  // URL-based navigation helpers
  const navigateToPath = useCallback((path: string, replaceHistory = false) => {
    const currentParams = new URLSearchParams(window.location.search);
    const newUrl = `${path}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
    
    if (replaceHistory) {
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.pushState(null, '', newUrl);
    }
    
    // Trigger a re-render by updating a state
    setFlowState((prev: AuthFlowState) => ({ ...prev, step: path.split('/').pop() as AuthFlowStep }));
  }, [])

  const navigateToSignIn = useCallback(() => {
    navigateToPath('/sign-in', true);
  }, [navigateToPath])

  const navigateToVerification = useCallback((userData?: { user?: TernSecureUser, email?: string }) => {
    navigateToPath('/sign-in/verification');
    if (userData) {
      setFlowState((prev: AuthFlowState) => ({ ...prev, ...userData }));
    }
  }, [navigateToPath])

  const navigateToPasswordReset = useCallback(() => {
    navigateToPath('/sign-in/password-reset');
  }, [navigateToPath])

  
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


  React.useEffect(() => {
    checkAndHandleRedirectResult();
  }, [checkAndHandleRedirectResult]);

  // Listen for navigation events from self-contained components
  React.useEffect(() => {
    const handleNavigateToSignIn = () => {
      navigateToSignIn();
    };

    const handleNavigateToVerification = (event: CustomEvent) => {
      const { user, email } = event.detail;
      navigateToVerification({ user, email });
    };

    const handleNavigateToPasswordReset = () => {
      navigateToPasswordReset();
    };

    window.addEventListener('navigate-to-signin', handleNavigateToSignIn);
    window.addEventListener('navigate-to-verification', handleNavigateToVerification as EventListener);
    window.addEventListener('navigate-to-password-reset', handleNavigateToPasswordReset);
    
    return () => {
      window.removeEventListener('navigate-to-signin', handleNavigateToSignIn);
      window.removeEventListener('navigate-to-verification', handleNavigateToVerification as EventListener);
      window.removeEventListener('navigate-to-password-reset', handleNavigateToPasswordReset);
    };
  }, [navigateToSignIn, navigateToVerification, navigateToPasswordReset]);

  // Listen for browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      // Update component state based on current URL
      const currentPath = window.location.pathname;
      const lastSegment = currentPath.split('/').pop() || 'signin';
      setFlowState((prev: AuthFlowState) => ({ ...prev, step: lastSegment as AuthFlowStep }));
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  // Route-based content rendering
  const renderStepContent = useCallback(() => {
    // Get current path to determine which component to render
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Handle route-based rendering
    switch (lastSegment) {
      case 'password-reset':
        return <PasswordResetStep />;
        
      case 'verification':
      case 'verify':
        return <VerificationStep />;
        
      case 'verification-complete':
      case 'verify-complete':
        return (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Email Verified!</h3>
            <p style={{ color: '#6b7280' }}>Redirecting you now...</p>
          </div>
        );
        
      case 'sign-in':
      default:
        // Main sign-in flow - always show SignInStart for the root sign-in path
        return <SignInStart socialButtonsConfig={socialButtonsConfig} />;
    }
  }, [socialButtonsConfig]);

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
          <CardTitle className={cn("font-bold")}>Sign in to {appName || 'your account'}</CardTitle>
          <CardDescription className={cn("text-muted-foreground")}>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderStepContent()}
        </CardContent>
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