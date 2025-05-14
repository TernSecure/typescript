import type { 
    SignInResponse, 
    AuthActions 
} from '@tern-secure/types';
import { handleFirebaseAuthError } from '@tern-secure/types'
import { ternSecureAuth } from '../../utils/client-init'
import { 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  OAuthProvider, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut as firebaseSignOut, 
} from 'firebase/auth'

export const createAuthActions = (): AuthActions => {
  return {
    signInWithEmail: async (email: string, password: string) => {
      try {
        const userCred = await signInWithEmailAndPassword(ternSecureAuth, email, password)
        return {
          success: true,
          user: userCred.user
        }
      } catch (error) {
        const authError = handleFirebaseAuthError(error)
        return {
          success: false,
          message: authError.message,
          error: authError.code,
          user: null
        }
      }
    },

    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider()
      return signInWithRedirect(ternSecureAuth, provider)
    },

    signInWithMicrosoft: async () => {
      const provider = new OAuthProvider('microsoft.com')
      return signInWithRedirect(ternSecureAuth, provider)
    },

    signOut: async () => {
      await firebaseSignOut(ternSecureAuth)
    },

    getRedirectResult: () => getRedirectResult(ternSecureAuth),

    getIdToken: async () => {
      const user = ternSecureAuth.currentUser
      if (!user) return null
      return user.getIdToken()
    }
  }
}