import {
    SignInResource,
    SignInStatus,
    SignInFormValuesTree,
    SignInResponseTree,
    ResendEmailVerification,
    handleFirebaseAuthError,
    TernSecureUser,
    TernSecureConfig,
    TernSecureState,
    DEFAULT_TERN_SECURE_STATE,
} from '@tern-secure/types';
import { TernSecureBase } from './internal';
import {
  Auth,
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
  signInWithPopup,
  getRedirectResult, 
  GoogleAuthProvider, 
  OAuthProvider, 
  sendEmailVerification, 
  UserCredential,
} from 'firebase/auth'

import { 
  initializeApp, 
  getApps,
} from 'firebase/app';

interface ProviderConfig {
  provider: GoogleAuthProvider | OAuthProvider;
  customParameters: Record<string, string>;
}

type FirebaseAuthResult = UserCredential | void;

type AuthMethodFunction = (
  auth: Auth, 
  provider: GoogleAuthProvider | OAuthProvider
) => Promise<FirebaseAuthResult>;


export class SignIn extends TernSecureBase implements SignInResource {
    status?: SignInStatus | undefined;
    private _currentUser: TernSecureUser | null = null;
    private firebaseApp;
    private _authState: TernSecureState = {...DEFAULT_TERN_SECURE_STATE}
    private auth: Auth;
    public ternSecureConfig?: TernSecureConfig;
    private authStateUnsubscribe: (() => void) | null = null;
    private _resolveInitialAuthState!: () => void;

    private constructor(config: TernSecureConfig) {
        super();
     const appName = config.appName || '[DEFAULT]';
     
     this.firebaseApp = getApps().length === 0 
       ? initializeApp(config, appName) 
       : getApps()[0];
     
     this.ternSecureConfig = config;
     
     this.auth = getAuth(this.firebaseApp);

    }

    async withEmailAndPassword(params: SignInFormValuesTree): Promise<SignInResponseTree> {
        try {
          const { email, password } = params;
          const userCredential = await signInWithEmailAndPassword(this.auth,email, password);
          const user = userCredential.user
          
          return {
            success: true,
            message: 'Authentication successful',
            user: userCredential.user,
            error: !user.emailVerified ? 'REQUIRES_VERIFICATION' : 'AUTHENTICATED'
          };
        } catch (error) {
          const authError = handleFirebaseAuthError(error)
          return {
            success: false,
            message: authError.message,
            error: authError.code,
            user: null
          };
        }
      }
      
    async withSocialProvider(
    provider: string, 
    options?: { 
      mode?: 'popup' | 'redirect' 
    }
  ): Promise<SignInResponseTree | void> {
    try {
      if (options?.mode === 'redirect') {
        const redirectResult = await this.authRedirectResult();
        
        if (redirectResult) {
          if (redirectResult.success) {
            TernSecureBase.ternsecure.redirectAfterSignIn();
          }
          return redirectResult;
        }

        await this._signInWithRedirect(provider);
        return;
      } else {
        await this._signInWithPopUp(provider);
        return {
          success: true,
          message: 'Sign in successful',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || `Sign in with ${provider} failed`,
        error,
        user: null
      };
    }
  }
    
    async completeMfaSignIn(): Promise<SignInResponseTree> {
        // Implement MFA completion logic
        throw new Error('Method not implemented.');
      }
    
    async sendPasswordResetEmail(email: string): Promise<void> {
        console.log(`Sending password reset email to ${email}`);
      }
    
    async resendEmailVerification(): Promise<ResendEmailVerification> {
        const user = this._currentUser;
        if (!user) {
          throw new Error("No user is currently signed in");
        }
    
        await user.reload();
    
        if (user.emailVerified) {
          return {
            success: true,
            message: 'Email is already verified. You can sign in.',
            isVerified: true,
          };
        };
    
        const actionCodeSettings = {
          url: TernSecureBase.ternsecure.constructSignUpUrl(),
          handleCodeInApp: true,
        };
    
        await sendEmailVerification(user, actionCodeSettings)
        return {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
          isVerified: false,
        };
    
    }
    
  private getProviderConfig(providerName: string): ProviderConfig {
    switch (providerName.toLowerCase()) {
      case 'google':
        const googleProvider = new GoogleAuthProvider();
        return {
          provider: googleProvider,
          customParameters: {
            login_hint: 'user@example.com',
            prompt: 'select_account'
          }
        };
        case 'microsoft':
          const microsoftProvider = new OAuthProvider('microsoft.com');
          return {
            provider: microsoftProvider,
            customParameters: {
              prompt: 'consent'
            }
          };
          default:
            throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

    private async authRedirectResult(): Promise<SignInResponseTree | null> {
    try {
      const result = await getRedirectResult(this.auth);

      if (result) {
        const user = result.user;
        return {
          success: true,
          user,
        }
      }
      return null;
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
        user: null
      };
    }
  }

    private async executeAuthMethod(
      authMethod: AuthMethodFunction,
      providerName: string
    ): Promise<SignInResponseTree> {
      const config = this.getProviderConfig(providerName);
      config.provider.setCustomParameters(config.customParameters);
      
      try {
        await authMethod(this.auth, config.provider);
        return { success: true, message: 'Authentication initiated' };
      } catch (error) {
        const authError = handleFirebaseAuthError(error);
        return {
          success: false,
          message: authError.message,
          error: authError.code,
          user: null
        };
      }
    }

    private async _signInWithRedirect(providerName: string): Promise<SignInResponseTree> {
      return this.executeAuthMethod(signInWithRedirect, providerName);
    }
    
    private async _signInWithPopUp(providerName: string): Promise<SignInResponseTree> {
      return this.executeAuthMethod(signInWithPopup, providerName);
    }

  public async checkRedirectResult(): Promise<SignInResponseTree | null> {
    return this.authRedirectResult();
  }

}