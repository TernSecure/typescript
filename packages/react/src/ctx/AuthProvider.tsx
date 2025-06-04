import { createContextAndHook } from "@tern-secure/shared/react";
import type { 
    TernSecureState, 
    SignInResponse, 
    TernSecureUser 
} from '@tern-secure/types';
import { ternSecureAuth } from '../utils/client-init';


export const getCurrentUser = (): TernSecureUser | null => {
  return ternSecureAuth.currentUser;
}

export interface AuthProviderCtxValue extends TernSecureState {
 //signOut?: () => Promise<void>
 setEmail?: (email: string) => void
 getAuthError?: () => SignInResponse
 redirectToLogin?: () => void
}

export const [AuthProviderCtx, useAuthProviderCtx] = createContextAndHook<AuthProviderCtxValue>('AuthProviderCtx');