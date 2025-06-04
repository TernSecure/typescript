import { useTernSecure } from '@tern-secure/shared/react'
import type {
  TernSecureInstanceTree, 
  SignInPropsTree,
  AuthErrorTree,
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

// SignInProps now directly extends SignInPropsTree.
// It will inherit ui, onError, onSuccess, and the new 'signIn' methods prop.
interface SignInProps extends Omit<SignInPropsTree, 'signIn'> {
  className?: string;
  redirectUrl?: string;
}

export function SignIn({
  ui, 
  onError, 
  onSuccess, 
  initialValue, 
  className, 
  redirectUrl = '/',
}: SignInProps) {
  const instance = useTernSecure();
  const signIn  = useAuthSignIn();
  const appName = ui?.appName;
  const logo = ui?.logo; // Get logo from ui config
  const socialButtonsConfig = ui?.socialButtons; // Get social buttons config

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  // Enable social sign-in if any provider is configured in `signIn` methods AND socialButtons config is present or explicitly enabled
 // const isSocialSignInGloballyEnabled = !!(signIn.withSocialProvider);
  //const isSocialSignInVisible = isSocialSignInGloballyEnabled && (socialButtonsConfig?.google !== false || socialButtonsConfig?.microsoft !== false);

  console.log('[tern-ui SignIn]', signIn)

  const handleEmailSuccess = () => {
    if (onSuccess) {
      onSuccess(null); 
    }
  };

  const handleSocialSuccess = () => {
    if (onSuccess) {
      onSuccess(null); 
    }
  };

  const handleError = (error: AuthErrorTree) => {
    if (onError) {
      onError(error);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
    <Card className={cn('w-full max-w-md mx-auto mt-8', className)}>
      <CardHeader className="space-y-1 text-center">
      {logo && (
        <div className="flex justify-center mb-6">
          {/* Assuming logo is a URL. If it can be an SVG string, more complex rendering is needed */}
          <img src={logo} alt={appName ? `${appName} Logo` : 'Application Logo'} className="h-16 w-auto" />
        </div>
      )}
      <CardTitle className={cn("font-bold")}> Sign in to {appName || 'your account'} </CardTitle>
        <CardDescription className={cn("text-muted-foreground")}>
          Please sign in to continue
        </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
      {isEmailSignInEnabled ? (
        <EmailSignIn
          onError={handleError}
          onSuccess={handleEmailSuccess}
          signInWithEmail={async (email, password) => {
            await signIn.withEmailAndPassword({ email, password});
          }}
        />
      ):(
        <p className="text-sm text-muted-foreground">
          Email sign-in is not enabled.
        </p>
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

