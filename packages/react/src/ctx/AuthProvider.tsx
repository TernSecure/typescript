import { 
    assertContextExists,
    TernSecureAuthContext,
    useTernSecureAuthContext
 } from "@tern-secure/shared/react"

import type {
    TernSecureState,
    TernSecureUser,
} from "@tern-secure/types"


export function useAuthProviderCtx(): TernSecureState {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    return ctx.authState;
}











{/*import { createContextAndHook } from "@tern-secure/shared/react";
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

export const [AuthProviderCtx, useAuthProviderCtx] = createContextAndHook<AuthProviderCtxValue>('AuthProviderCtx');*/}