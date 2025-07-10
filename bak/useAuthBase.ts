'use client'

import { 
    useAuth as useBaseAuth,
} from '../packages/react'
import type { SignOutOptions } from '../packages/types'
import { clearSessionCookieServer } from '../packages/nextjs/src/app-router/client/actions'

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

export const useAuth = useAuthBase