import type { 
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
}

export function SignIn({
  ui, 
  onError, 
  onSuccess, 
  className, 
}: SignInProps) {

  const signIn  = useAuthSignIn();
  const appName = ui?.appName;
  const logo = ui?.logo;
  const socialButtonsConfig = ui?.socialButtons; 

  const isEmailSignInEnabled = !!signIn.withEmailAndPassword;
  const isSocialSignInGloballyEnabled = !!(signIn.withSocialProvider);
  const isSocialSignInVisible = isSocialSignInGloballyEnabled && (
    socialButtonsConfig?.google !== false || 
    socialButtonsConfig?.microsoft !== false
  );

  const handleSignInWithEmail = async (email: string, password: string) => {
    const response = await signIn.withEmailAndPassword({ email, password });
    return response;
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

