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
  getRedirectResult, 
  GoogleAuthProvider, 
  OAuthProvider, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'firebase/auth'

import { 
  initializeApp, 
  getApps,
  FirebaseApp 
} from 'firebase/app';

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
    
    async withSocialProvider(provider: string, options?: { mode?: 'popup' | 'redirect' }): Promise<SignInResponseTree | void> {
        try {
          const authProvider = this.getProviderForName(provider);
          
          if (options?.mode === 'redirect') {
            //await signInWithRedirect(auth, authProvider);
            return; // This will redirect, so no response here
          } else {
            //const userCredential = await signInWithPopup(auth, authProvider);
            return {
              success: true,
              message: 'Sign in successful',
              //user: this.mapFirebaseUserToTernUser(userCredential.user)
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
    
    private getProviderForName(provider: string) {
        switch (provider.toLowerCase()) {
            case 'google':
                //return new GoogleAuthProvider();
            case 'microsoft':
                //return new OAuthProvider('microsoft.com');
            default:
                throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}