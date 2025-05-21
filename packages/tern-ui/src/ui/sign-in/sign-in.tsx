import { useTernSecure } from '@tern-secure/shared/react'
import type { 
  SignInResponseTree,
  SignInPropsTree,
  AuthErrorTree,
  TernSecureInstanceTree // Keep this for TernSecureInstanceTree['signIn'] type
} from '@tern-secure/types';
import { SocialSignIn } from './social-sign-in';
import { EmailSignIn } from './email-sign-in';
import { cn } from '../../lib/utils';

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
  const { signIn } = instance;
  const appName = ui?.appName;
  const logo = ui?.logo; // Get logo from ui config
  const socialButtonsConfig = ui?.socialButtons; // Get social buttons config

  const isEmailSignInEnabled = !!signIn?.withEmail;
  // Enable social sign-in if any provider is configured in `signIn` methods AND socialButtons config is present or explicitly enabled
  const isSocialSignInGloballyEnabled = !!(signIn?.withGoogle || signIn?.withMicrosoft);
  const isSocialSignInVisible = isSocialSignInGloballyEnabled && (socialButtonsConfig?.google !== false || socialButtonsConfig?.microsoft !== false);

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
    <div className={cn('bg-white p-8 rounded-lg shadow-md w-full max-w-md', className)}>
      {logo && (
        <div className="flex justify-center mb-6">
          {/* Assuming logo is a URL. If it can be an SVG string, more complex rendering is needed */}
          <img src={logo} alt={appName ? `${appName} Logo` : 'Application Logo'} className="h-16 w-auto" />
        </div>
      )}
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Sign in to {appName || 'your account'}
      </h2>

      {isEmailSignInEnabled && signIn?.withEmail && (
        <EmailSignIn
          onError={handleError}
          onSuccess={handleEmailSuccess}
          signInWithEmail={async (email, password) => {
            // Directly use the method from the 'signIn' prop
            await signIn.withEmail(email, password);
          }}
        />
      )}

      {isSocialSignInVisible && signIn && (
        <SocialSignIn
          authActions={{
            signInWithGoogle: socialButtonsConfig?.google !== false ? signIn.withGoogle : undefined,
            signInWithMicrosoft: socialButtonsConfig?.microsoft !== false ? signIn.withMicrosoft : undefined,
          }}
          onError={handleError}
          onSuccess={handleSocialSuccess}
          redirectUrl={redirectUrl}
          isDisabled={false}
          // Pass down the social button configuration
          config={socialButtonsConfig} 
        />
      )}
    </div>
  );
}

