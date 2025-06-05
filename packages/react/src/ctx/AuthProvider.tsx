import { createContextAndHook } from "@tern-secure/shared/react";
import type { 
    TernSecureState, 
    SignInResponse,  
} from '@tern-secure/types';


export interface AuthProviderCtxValue extends TernSecureState {
 //signOut?: () => Promise<void>
 setEmail?: (email: string) => void
 getAuthError?: () => SignInResponse
 redirectToLogin?: () => void
}

export const [AuthProviderCtx, useAuthProviderCtx] = createContextAndHook<AuthProviderCtxValue>('AuthProviderCtx');