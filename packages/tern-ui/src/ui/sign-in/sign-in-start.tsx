import { SocialSignIn } from './social-sign-in';
import { EmailSignIn } from './email-sign-in';
import { useAuthSignIn } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import { useTernSecure } from '@tern-secure/shared/react';
import { 
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from '../../components/elements';
import { cn } from '../../lib/utils';
import type { 
    AuthErrorTree, 
    TernSecureUser, 
    SignInUIConfig,
    SignInPropsTree
} from '@tern-secure/types';
import { useRouter } from '../../components/router';

interface SignInStartProps {
  socialButtonsConfig?: SignInUIConfig['socialButtons'];
  ui?: SignInPropsTree['ui'];
  className?: string;
}

export function SignInStart({ socialButtonsConfig, ui, className }: SignInStartProps) {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const { navigate } = useRouter();
  const {
    isLoading,
    handleSignInStart,
    handleSignInSuccess,
    handleSignInError,
  } = useSignInContext();

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!signIn.withSocialProvider;

  const handleSignInWithEmail = async (email: string, password: string) => {
    handleSignInStart();
    try {
      const response = await signIn.withEmailAndPassword({ email, password });
      if (response.success) {
        const user = response.user;
        const requiresVerification = ternSecure.requiresVerification

        if (requiresVerification && !user.emailVerified) {
          const queryParams = new URLSearchParams();
          navigate(`verify?${queryParams.toString()}`);
          return response;
        }

        const authCookieManager = ternSecure.ternAuth.authCookieManager()
        if (authCookieManager) {
          const idToken = await user.getIdToken();
          authCookieManager.createSessionCookie(idToken);
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
    const queryParams = new URLSearchParams();
    navigate(`password-reset?${queryParams.toString()}`);
  };

  const handleError = (error: AuthErrorTree) => {
    handleSignInError(error);
  };
  
  const handleSuccess = (user: TernSecureUser | null) => {
    handleSignInSuccess(user);
  };

  const { appName, logo } = ui || {};

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
          {isSocialSignInGloballyEnabled && (
            <SocialSignIn
              onError={handleError}
              onSuccess={handleSuccess}
              config={socialButtonsConfig}
              mode={'popup'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
