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
  CardStateProvider,
  useCardState,
  Alert, 
  AlertDescription
} from '../../components/elements';
import { cn } from '../../lib/utils';
import type { 
    AuthErrorTree, 
    TernSecureUser, 
    SignInUIConfig,
    SignInPropsTree,
    SignInResponseTree
} from '@tern-secure/types';
import { useRouter } from '../../components/router';

interface SignInStartProps {
  socialButtonsConfig?: SignInUIConfig['socialButtons'];
  ui?: SignInPropsTree['ui'];
  className?: string;
}


const createAuthError = (
  source: SignInResponseTree | Error | unknown,
  fallbackCode: 'SIGN_IN_FAILED' | 'PASSWORD_RESET_FAILED'
): AuthErrorTree => {
  let message: string;
  let code: string;
  let response: unknown;
  
  if (source && typeof source === 'object' && 'success' in source && !source.success) {
    // Handle SignInResponseTree (failed response)
    const signInResponse = source as SignInResponseTree;
    message = signInResponse.message || 'Operation failed';
    code = signInResponse.error || fallbackCode;
    response = signInResponse;
  } else if (source instanceof Error) {
    // Handle Error objects
    message = source.message;
    code = fallbackCode;
    response = source;
  } else {
    // Handle unknown errors
    message = 'Operation failed';
    code = fallbackCode;
    response = source;
  }

  const authError = new Error(message) as AuthErrorTree;
  authError.name = code === 'PASSWORD_RESET_FAILED' ? 'PasswordResetError' : 'SignInError';
  authError.code = code;
  authError.response = response;

  return authError;
}

function SignInStartInternal({ socialButtonsConfig, ui, className }: SignInStartProps) {
  const signIn = useAuthSignIn();
  const cardState = useCardState();
  const ternSecure = useTernSecure();
  const { navigate } = useRouter();
  const {
    handleSignInSuccess,
    handleSignInError,
  } = useSignInContext();

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!signIn.withSocialProvider;

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const response = await signIn.withEmailAndPassword({ email, password });

      if (!response.success) {
        const authError = createAuthError(response, 'SIGN_IN_FAILED');
        handleSignInError(authError);
        return response;
      }

      const postAuthResult  =  await handlePostAuthentication(response.user);
      return postAuthResult;

    } catch (error) {
      const authError = createAuthError(error, 'SIGN_IN_FAILED');
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
  
  const handlePostAuthentication = async (user: TernSecureUser) => {
    const requiresVerification = ternSecure.requiresVerification;
    
    if (requiresVerification && !user.emailVerified) {
      const queryParams = new URLSearchParams();
      navigate(`verify?${queryParams.toString()}`);
      return { success: true, user, requiresVerification: true };
    }
    
    await createUserSession(user);
    
    if (user?.emailVerified) {
      handleSignInSuccess(user);
    }
    return { success: true, user, requiresVerification: false };
  };

  const createUserSession = async (user: TernSecureUser) => {
    const authCookieManager = ternSecure.ternAuth.authCookieManager();
    if (authCookieManager) {
      const idToken = await user.getIdToken();
      await authCookieManager.createSessionCookie(idToken);
    }
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
          {cardState.error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertDescription>
                {cardState.error.message}
              </AlertDescription>
            </Alert>
          )}
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

export const SignInStart = () => {
  return (
    <CardStateProvider>
      <SignInStartInternal />
    </CardStateProvider>
  );
}
