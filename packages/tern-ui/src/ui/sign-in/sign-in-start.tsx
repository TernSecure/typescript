import { SocialSignIn } from './social-sign-in';
import { EmailSignIn } from './email-sign-in';
import { useAuthSignIn } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import { useTernSecure } from '@tern-secure/shared/react';
import type { 
    AuthErrorTree, 
    TernSecureUser, 
    SignInUIConfig 
} from '@tern-secure/types';

interface SignInStartProps {
  socialButtonsConfig?: SignInUIConfig['socialButtons'];
}

export function SignInStart({ socialButtonsConfig }: SignInStartProps) {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const {
    isLoading,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
  } = useSignInContext();

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!signIn.withSocialProvider;
  const isSocialSignInVisible = isSocialSignInGloballyEnabled && (
    socialButtonsConfig?.google !== false || 
    socialButtonsConfig?.microsoft !== false
  );

  const handleSignInWithEmail = async (email: string, password: string) => {
    handleSignInStart();
    try {
      const response = await signIn.withEmailAndPassword({ email, password });
      if (response.success) {
        const user = response.user;
        const requiresVerification = ternSecure.requiresVerification

        if (requiresVerification && !user.emailVerified) {
          // Navigate to verification route and dispatch event with user data
          const currentParams = new URLSearchParams(window.location.search);
          const newUrl = `/sign-in/verification${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
          window.history.pushState(null, '', newUrl);
          window.dispatchEvent(new CustomEvent('navigate-to-verification', {
            detail: { user, email: user.email || email }
          }));
          return response;
        }
        
        //handleSignInSuccess(user);
        if (user?.emailVerified) {
          handleSignInSuccess(user);
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
  };

  const handleForgotPassword = () => {
    // Navigate to password reset route
    const currentParams = new URLSearchParams(window.location.search);
    const newUrl = `/sign-in/password-reset${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new CustomEvent('navigate-to-password-reset'));
  };

  const handleError = (error: AuthErrorTree) => {
    handleSignInError(error);
  };
  
  const handleSuccess = (user: TernSecureUser | null) => {
    handleSignInSuccess(user);
  };

  return (
    <>
      {isEmailSignInEnabled ? (
        <EmailSignIn
          onError={handleError}
          onSuccess={handleSuccess}
          signInWithEmail={handleSignInWithEmail}
          onForgotPassword={handleForgotPassword}
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
          mode={'popup'}
        />
      )}
    </>
  );
}
