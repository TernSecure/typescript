import { 
    assertContextExists,
    TernSecureAuthContext,
    useTernSecureAuthContext
 } from "@tern-secure/shared/react"

import type {
    SignInResource,
    TernSecureUser
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

export function useUser(): TernSecureUser | null {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    return ctx.authState.user || null;
}