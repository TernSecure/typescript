import { cache } from "react"
import { cookies } from "next/headers"
import type { UserInfo } from "./types"
import { verifyFirebaseToken } from "./jwt-edge"
import { TernSecureError } from "../errors"



export interface AuthResult {
  user: UserInfo | null
  error: Error | null
}

  /**
   * Get the current authenticated user from the session or token
   */
export const auth = cache(async (): Promise<AuthResult> => {
  try {
    // Get all active sessions for debugging
   console.log("auth: Starting auth check...")
   const cookieStore = await cookies()

    // First try session cookie as it's more secure
    const sessionCookie = cookieStore.get("_session_cookie")?.value
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie, true)
      if (result.valid) {
        const user: UserInfo = {
          uid: result.uid ?? '',
          email: result.email || null,
          authTime: result.authTime
        }
        return { user, error: null }
      }
    }

    // Fallback to ID token
    const idToken = cookieStore.get("_session_token")?.value
    if (idToken) {
      const result = await verifyFirebaseToken(idToken, false)
      if (result.valid) {
        const user: UserInfo = {
          uid: result.uid ?? '',
          email: result.email || null,
          authTime: result.authTime
        }
        return { user, error: null }
      }
    }

      return {
          user: null,
          error: new TernSecureError('UNAUTHENTICATED', 'No valid session found')
      }

    } catch (error) {
      console.error("Error in Auth:", error)
      if (error instanceof TernSecureError) {
        return {
          user: null,
          error
        }
      }
      return {
        user: null,
        error: new TernSecureError('INTERNAL_ERROR', 'An unexpected error occurred')
      }
    }
  })

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = cache(async (): Promise<boolean>  => {
  const { user } = await auth()
  return user !== null
})

/**
 * Get user info from auth result
 */
export const getUser = cache(async (): Promise<UserInfo | null> => {
  const { user } = await auth()
  return user
})

/**
 * Require authentication
 * Throws error if not authenticated
 */
export const requireAuth = cache(async (): Promise<UserInfo> => {
  const { user, error } = await auth()

  if (!user) {
    throw error || new Error("Authentication required")
  }

  return user
})