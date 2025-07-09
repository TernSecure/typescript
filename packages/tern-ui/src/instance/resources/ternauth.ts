import { 
  TernSecureAuthProvider as TernSecureAuthProviderInterface, 
  SignInFormValuesTree, 
  SignInResponseTree,
  TernSecureUser,
  SignedInSession,
  TernSecureConfig,
  TernSecureState,
  DEFAULT_TERN_SECURE_STATE,
  SignInResource,
  SignUpResource,
  ResendEmailVerification,
  handleFirebaseAuthError
} from '@tern-secure/types';

import { 
  initializeApp, 
  getApps,
} from 'firebase/app';
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
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth'

import { TernSecureBase, SignUp } from './internal';
import { AuthCookieManager } from './Auth';


interface ProviderConfig {
  provider: GoogleAuthProvider | OAuthProvider;
  customParameters: Record<string, string>;
}

type FirebaseAuthResult = UserCredential | void;

type AuthMethodFunction = (
  auth: Auth, 
  provider: GoogleAuthProvider | OAuthProvider
) => Promise<FirebaseAuthResult>;

/**
 * Firebase implementation of the TernSecureAuthProvider interface
 */
export class TernAuth implements TernSecureAuthProviderInterface {
    private static instance: TernAuth | null;
    private _currentUser: TernSecureUser | null = null;
    private signedInSession: SignedInSession | null = null;
    private firebaseApp;
    private _authState: TernSecureState = {...DEFAULT_TERN_SECURE_STATE}
    private auth: Auth;
    public ternSecureConfig?: TernSecureConfig;
    private authStateUnsubscribe: (() => void) | null = null;
    private _initAuthStateResolvedPromise: Promise<void>;
    private _resolveInitialAuthState!: () => void;
    #authCookieManager: AuthCookieManager

    signIn: SignInResource;
    signUp: SignUpResource = new SignUp();

    private constructor(config: TernSecureConfig) {
      const appName = config.appName || '[DEFAULT]';
      
      this._initAuthStateResolvedPromise = new Promise<void>((resolve) => {
        this._resolveInitialAuthState = resolve;
      });
      
      this.firebaseApp = getApps().length === 0 
      ? initializeApp(config, appName) 
      : getApps()[0];

      this.ternSecureConfig = config;

      this.auth = getAuth(this.firebaseApp);
  

      this.#authCookieManager = new AuthCookieManager();
      console.log("TernAuth: AuthCookieManager initialized");

      setPersistence(this.auth, browserLocalPersistence)
       .catch(error => console.error("TernAuth: Error setting auth persistence:", error));
       
      this.signIn = {
        withEmailAndPassword: this.withEmailAndPassword.bind(this),
        withSocialProvider: this.withSocialProvider.bind(this),
        completeMfaSignIn: this.completeMfaSignIn.bind(this),
        sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this),
        resendEmailVerification: this.resendEmailVerification.bind(this),
        checkRedirectResult: this.authRedirectResult.bind(this),
      };

      //this.initializeAuthState();

      this.authStateUnsubscribe = this.initAuthStateListenerOld();
    }

  public static async getOrCreateInstance(config: TernSecureConfig): Promise<TernAuth> {
    if (!TernAuth.instance) {
      console.log('[TernAuth] Creating new instance...');
      TernAuth.instance = new TernAuth(config);

      console.log('[TernAuth] Awaiting initial auth state resolution...');
      await TernAuth.instance._initAuthStateResolvedPromise;
      console.log('[TernAuth] Initial auth state resolved.');
    } else {
      console.log('[TernAuth] Returning existing instance, ensuring initial auth state was resolved...');
      await TernAuth.instance._initAuthStateResolvedPromise;
    }
    return TernAuth.instance;
  }

  static clearInstance() {
    if (TernAuth.instance) {
      if (TernAuth.instance.authStateUnsubscribe) {
        TernAuth.instance.authStateUnsubscribe();
        TernAuth.instance.authStateUnsubscribe = null;
      }
      TernAuth.instance = null;
    }
  }
  
  private static readonly AUTH_MESSAGES = {
    REDIRECT_INITIATED: 'Redirect initiated',
    POPUP_SUCCESS: 'Sign in successful',
    REDIRECT_SUCCESS: 'Sign in completed via redirect',
    REDIRECT_PENDING: 'No redirect operation in progress'
  } as const;
  

  private async withEmailAndPassword(params: SignInFormValuesTree): Promise<SignInResponseTree> {
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

  private async withSocialProvider(
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

  private async completeMfaSignIn(): Promise<SignInResponseTree> {
    // Implement MFA completion logic
    throw new Error('Method not implemented.');
  }

  private async sendPasswordResetEmail(email: string): Promise<void> {
    console.log(`Sending password reset email to ${email}`);
  }

  private async resendEmailVerification(): Promise<ResendEmailVerification> {
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
      url: TernSecureBase.ternsecure.constructSignInUrl(),
      handleCodeInApp: true,
    };

    await sendEmailVerification(user, actionCodeSettings)
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      isVerified: false,
    };

  }


  signOut = async(): Promise<void> => {
    await Promise.all([
      this.auth.signOut(),
      this.updateInternalAuthState(null)
    ]);
  }

  currentSession = async(): Promise<SignedInSession | null> => {
    if (!this._currentUser) {
      return null;
    }

    const res = await this._currentUser.getIdTokenResult();
    const s = this.signedInSession = {
      status: 'active',
      token: res.token,
      claims: res.claims,
      issuedAtTime: res.issuedAtTime,
      expirationTime: res.expirationTime,
      authTime: res.authTime,
      signInProvider: res.signInProvider || 'unknown'
    };
    return s;
  }
  
  private getProviderForName(provider: string) {
    const config = this.getProviderConfig(provider);
    return config.provider;
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

  private  async initializeAuthState(): Promise<void> {
    try {
      await this.auth.authStateReady();

      this.authStateUnsubscribe = this.initAuthStateListener();

      await this.updateInternalAuthState(this.auth.currentUser as TernSecureUser);

      this._resolveInitialAuthState();
    } catch (error) {
      console.error("TernAuth: Error initializing auth state:", error);
      this._authState = {
        ...DEFAULT_TERN_SECURE_STATE,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated",
        user: null
      };
      this._resolveInitialAuthState();
    }
  }

  /**
   * @deprecated This method is deprecated and will be removed in future versions.
   */
  private initAuthStateListenerOld() : () => void {
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
        this._currentUser = user;
        await this.updateInternalAuthState(user);

        if (typeof this._resolveInitialAuthState === 'function') {
          this._resolveInitialAuthState();
          // Prevent further calls by effectively making it a no-op or removing it
          // @ts-ignore 
          this._resolveInitialAuthState = null; 
        }
      });
  }

  private initAuthStateListener(): () => void {
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
     this._currentUser = user;
      await this.updateInternalAuthState(user);
    });
  }
  
  private setupTokenRefreshListener(): void {
    this.auth.onIdTokenChanged(async (user) => {
      if (user) {
        await this.updateInternalAuthState(user as TernSecureUser);
      }
    });
  }

  private async updateInternalAuthState(user: TernSecureUser | null): Promise<void> {
    const previousState = { ...this._authState };
    try {
      if (user) {
        const isValid = !!user.uid;
        const isVerified = user.emailVerified;
        const requiresVerification = TernSecureBase.ternsecure?.requiresVerification;
        const isAuthenticated = isValid && (!requiresVerification || isVerified);

        this._authState = {
          userId: user.uid,
          isLoaded: true,
          error: null,
          isValid,
          isVerified,
          isAuthenticated,
          token: user.getIdToken() || null,
          email: user.email || null,
          status: this.determineAuthStatus(user, requiresVerification),
          user
        };
      } else {
        this._authState = {
          ...DEFAULT_TERN_SECURE_STATE,
          isLoaded: true,
          status: "unauthenticated",
          user: null
        };
      }

      if (this.hasAuthStateChanged(previousState, this._authState)) {
        TernSecureBase.ternsecure.emitAuthStateChange(this._authState);
      }
    } catch (error) {
      console.error("TernAuth: Error updating internal auth state:", error);
      this._authState = {
        ...DEFAULT_TERN_SECURE_STATE,
        isLoaded: true,
        error: error as Error,
        status: "unauthenticated",
        user: null
      };
      this.signOut();
      TernSecureBase.ternsecure.emitAuthStateChange(this._authState);
    }
  }

  /**
  * Maps user data to TernSecureUser format
  * @returns Currently authenticated TernSecureUser or null
  */
 
  public ternSecureUser(): TernSecureUser | null {
    return this._currentUser;
  }
  
  public get internalAuthState(): TernSecureState {
    return this._authState;
  }


  private hasAuthStateChanged(previous: TernSecureState, current: TernSecureState): boolean {
    return (
        previous.userId !== current.userId ||
        previous.isAuthenticated !== current.isAuthenticated ||
        previous.status !== current.status ||
        previous.isLoaded !== current.isLoaded ||
        previous.user?.uid !== current.user?.uid
      );
    }

  private determineAuthStatus(
    user: TernSecureUser, 
    requiresVerification: boolean
  ): "authenticated" | "unauthenticated" | "unverified" {
    if (!user.uid) return "unauthenticated";
    if (requiresVerification && !user.emailVerified) {
      return "unverified";
    }
    return "authenticated";
  }

  #redirectToSignIn() {
    TernSecureBase.ternsecure.redirectToSignIn();
  }

  private async _signInWithRedirect(providerName: string): Promise<SignInResponseTree> {
    return this.executeAuthMethod(signInWithRedirect, providerName);
  }
  
  private async _signInWithPopUp(providerName: string): Promise<SignInResponseTree> {
    return this.executeAuthMethod(signInWithPopup, providerName);
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
  
  private async executePopupAuthMethod(providerName: string): Promise<SignInResponseTree> {
    const config = this.getProviderConfig(providerName);
    config.provider.setCustomParameters(config.customParameters);
    
    try {
      const result = await signInWithPopup(this.auth, config.provider);
      return {
        success: true,
        message: TernAuth.AUTH_MESSAGES.POPUP_SUCCESS,
        user: result.user,
        error: null
      };
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
  
  
  private async executeRedirectAuthMethod(providerName: string): Promise<void> {
    const config = this.getProviderConfig(providerName);
    config.provider.setCustomParameters(config.customParameters);
    
    try {
      await signInWithRedirect(this.auth, config.provider);
    } catch (error) {
      const authError = handleFirebaseAuthError(error);
      console.error("TernAuth: Redirect sign-in error:", authError);
      throw error;
      }
    }
    
  private async __signInWithRedirect(providerName: string): Promise<void> {
    await this.executeRedirectAuthMethod(providerName);
  }
  
  private async __signInWithPopUp(providerName: string): Promise<SignInResponseTree> {
    return this.executePopupAuthMethod(providerName);
  }

  public async checkRedirectResult(): Promise<SignInResponseTree | null> {
    return this.authRedirectResult();
  }

  public authCookieManager(): AuthCookieManager {
    return this.#authCookieManager;
  }
}