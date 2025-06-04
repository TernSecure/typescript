import { 
    assertContextExists,
    TernSecureAuthContext,
    useTernSecureAuthContext
 } from "@tern-secure/shared/react"

import type {
    TernSecureAuthProvider
} from "@tern-secure/types"

export function useAuthSignIn(): TernSecureAuthProvider {
    const ctx = useTernSecureAuthContext();
    assertContextExists(ctx, TernSecureAuthContext)
    return ctx
}