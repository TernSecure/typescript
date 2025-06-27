import { 
    assertContextExists,
    TernSecureAuthContext,
    useTernSecureAuthContext
 } from "@tern-secure/shared/react"

import type {
    SignInResource,
    TernSecureUser,
    SignUpResource,
    TernSecureState,
} from "@tern-secure/types"

export function useAuthSignIn(): SignInResource {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    if (!ctx.authProvider) {
        throw new Error("TernSecureAuthContext value is not available. Ensure that the context is properly initialized.");
    }

    if (!ctx.authProvider.signIn) {
        throw new Error("TernSecureAuthContext signIn resource is not available. Ensure that the context is properly initialized.");
    }
    
    return ctx.authProvider.signIn
}

export function useAuthSignUp(): SignUpResource {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    if (!ctx.authProvider) {
        throw new Error("TernSecureAuthContext value is not available. Ensure that the context is properly initialized.");
    }

    if (!ctx.authProvider.signUp) {
        throw new Error("TernSecureAuthContext signUp resource is not available. Ensure that the context is properly initialized.");
    }
    
    return ctx.authProvider.signUp
}

export function useAuthUser(): TernSecureUser | null {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    return ctx.authState.user || null;
}


export function useAuthState(): TernSecureState {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    return ctx.authState;
}