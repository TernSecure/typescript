import { 
  TernSecureAuthProvider as TernSecureAuthProviderInterface, 
  SignInFormValuesTree, 
  SignInResponseTree,
  TernSecureUser,
  SignedInSession,
  TernSecureConfig,
  TernSecureState,
  DEFAULT_TERN_SECURE_STATE,
  SignInResource
} from '@tern-secure/types';

import { 
  initializeApp, 
  getApps,
  FirebaseApp 
} from 'firebase/app';
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

import { TernSecureBase } from './internal';




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

    public readonly signIn: SignInResource;

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

      setPersistence(this.auth, browserLocalPersistence)
       .catch(error => console.error("TernAuth: Error setting auth persistence:", error));
       
      this.signIn = {
        withEmailAndPassword: this.withEmailAndPassword.bind(this),
        withSocialProvider: this.withSocialProvider.bind(this),
        completeMfaSignIn: this.completeMfaSignIn.bind(this),
        sendPasswordResetEmail: this.sendPasswordResetEmail.bind(this),
      };

      this.authStateUnsubscribe = this.initAuthStateListener();
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
  

  private async withEmailAndPassword(params: SignInFormValuesTree): Promise<SignInResponseTree> {
    try {
      const { email, password } = params;
      const userCredential = await signInWithEmailAndPassword(this.auth,email, password);
      
      return {
        success: true,
        message: 'Sign in successful',
        user: userCredential.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Authentication failed',
        error,
        user: null
      };
    }
  }

  private async withSocialProvider(provider: string, options?: { mode?: 'popup' | 'redirect' }): Promise<SignInResponseTree | void> {
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

  private async completeMfaSignIn(): Promise<SignInResponseTree> {
    // Implement MFA completion logic
    throw new Error('Method not implemented.');
  }

  private async sendPasswordResetEmail(email: string): Promise<void> {
    console.log(`Sending password reset email to ${email}`);
  }

  async signOut(): Promise<void> {
    console.log('Signing out user');
  }

  currentSession =  async(): Promise<SignedInSession | null> => {
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
    switch (provider.toLowerCase()) {
      case 'google':
        //return new GoogleAuthProvider();
      case 'microsoft':
        //return new OAuthProvider('microsoft.com');
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private initAuthStateListener() : () => void {
    console.log('[TernAuth] Initializing auth state listener.');
    return onAuthStateChanged(this.auth, async (user: TernSecureUser | null) => {
      console.log('[TernAuth] Firebase onAuthStateChanged triggered. User:', user ? user.uid : 'null');
        this._currentUser = user;
        await this.updateInternalAuthState(user);

        if (typeof this._resolveInitialAuthState === 'function') {
          console.log('[TernAuth] Resolving initial auth state promise via onAuthStateChanged.');
          this._resolveInitialAuthState();
          // Prevent further calls by effectively making it a no-op or removing it
          // @ts-ignore 
          this._resolveInitialAuthState = null; 
        }
      });
  }

  private async updateInternalAuthState(user: TernSecureUser | null, requiresVerification = false): Promise<void> {
    const previousState = { ...this._authState };
    try {
      if (user) {
        this._authState = {
          userId: user.uid,
          isLoaded: true,
          error: null,
          isValid: !!user.uid,
          isVerified: user.emailVerified,
          isAuthenticated: !!user.uid && (!requiresVerification || user.emailVerified),
          token: user.getIdToken() || null,
          email: user.email || null,
          status: this.determineAuthStatus(user, requiresVerification),
          requiresVerification,
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
}