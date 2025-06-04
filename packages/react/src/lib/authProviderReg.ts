import type { 
  TernSecureAuthProvider as TernSecureAuthProviderInterface, 
  SignInFormValuesTree, 
  SignInResponseTree,
  TernSecureUser
} from '@tern-secure/types';

import {
    signInWithEmail,
    resendEmailVerification
} from '../client/actions'

/**
 * Firebase implementation of the TernSecureAuthProvider interface
 */
export class TernSecureAuthProvider implements TernSecureAuthProviderInterface {
    private static instance: TernSecureAuthProvider | null;

    public static getOrCreateInstance(): TernSecureAuthProvider {
        if (!TernSecureAuthProvider.instance) {
            TernSecureAuthProvider.instance = new TernSecureAuthProvider();
        }
        return TernSecureAuthProvider.instance;
    }

    static clearInstance() {
        TernSecureAuthProvider.instance = null;
    }

  async withEmailAndPassword(params: SignInFormValuesTree): Promise<SignInResponseTree> {
    try {
      const { email, password } = params;
      const userCredential = await signInWithEmail(email, password);
      
      return {
        success: true,
        message: 'Sign in successful',
        user: this.mapFirebaseUserToTernUser(userCredential.user)
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

  async signOut(): Promise<void> {
    console.log('Signing out user');
  }

  async getIdToken(forceRefresh?: boolean): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  onAuthStateChanged(callback: (user: TernSecureUser | null) => void): () => void {
    //const auth = ternSecureAuth;
    //return firebaseOnAuthStateChanged(auth, (user) => {
    //  callback(user ? this.mapFirebaseUserToTernUser(user) : null);
    //});

    throw new Error('Method not implemented.');
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

  private mapFirebaseUserToTernUser(user: TernSecureUser) : TernSecureUser {
    return user
  }
}