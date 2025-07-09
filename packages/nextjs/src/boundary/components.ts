'use client'

import { 
    useAuth as useBaseAuth,
} from '@tern-secure/react'
import type { SignOutOptions } from '@tern-secure/types'
import { clearSessionCookieServer } from '../app-router/client/actions'

const useAuthBase = () => {
    const baseAuth = useBaseAuth()

    const signOut = async (options?: SignOutOptions) => {
        try {
            const combineOptions: SignOutOptions = {
                ...options,
                onBeforeSignOut: async () => {
                    await clearSessionCookieServer()
                    
                    if (options?.onBeforeSignOut) {
                        await options.onBeforeSignOut()
                    }
                }
            }
            
            await baseAuth.signOut(combineOptions)
            
        } catch (error) {
            console.error('[useAuth] Sign out failed:', error)
            throw error
        }
    }

    return {
        ...baseAuth,
        signOut
    }
}

export { 
    useIdToken,
    useSignUp,
    useSession,
    SignIn,
    //SignOut,
    //SignOutButton,
    SignUp,
} from '@tern-secure/react' 

export const useAuth = useAuthBase