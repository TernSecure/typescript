import { verifyFirebaseToken } from "./jwt"
import type { NextRequest } from "next/server"
import type { SessionResult, BaseUser } from "../types"


export async function verifySession(request: NextRequest): Promise<SessionResult> {
  try {
    //const cookieStore = await cookies()

    // First try session cookie
    const sessionCookie = request.cookies.get("_session_cookie")?.value
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie, true)
      if (result.valid) {
        return {
          isAuthenticated: true,
          user: {
            uid: result.uid ?? '',
            email: result.email || null,
            tenantId: result.tenant || 'default',
            emailVerified: result.emailVerified ?? false,
            disabled: false,
          },
        }
      }
      console.log("Session cookie verification failed:", result.error)
    }

    // Then try ID token
    const idToken = request.cookies.get("_session_token")?.value
    if (idToken) {
      const result = await verifyFirebaseToken(idToken, false)
      if (result.valid) {
        return {
          isAuthenticated: true,
          user: {
            uid: result.uid ?? '',
            email: result.email || null,
            tenantId: result.tenant || 'default',
            emailVerified: result.emailVerified ?? false,
            disabled: false,
          },
        }
      }
      console.log("ID token verification failed:", result.error)
    }

    return {
      isAuthenticated: false,
      user: null,
      error: "No valid session found",
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return {
      isAuthenticated: false,
      user: null,
      error: error instanceof Error ? error.message : "Session verification failed",
    }
  }
}


/**
 * Edge-compatible token verification using Firebase Auth REST API
 */
export async function verifyTokenEdge(idToken: string): Promise<BaseUser | null> {
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }
      )
  
  
      const data = await response.json()
      console.log('data Token', data)
  
      
      if (!response.ok || !data.users?.[0]) {
        return null
      }
  
      const user = data.users[0]
      return {
        uid: user.localId,
        email: user.email || null,
        tenantId: user.tenantId || 'default',
        disabled: user.disabled || false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }
  
  
  /**
   * Edge-compatible session cookie verification
   */
  export async function verifySessionEdge(sessionCookie: string): Promise<BaseUser | null> {
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionCookie}`
          }
        }
      )
  
  
      const data = await response.json()
      console.log('data Session', data)
  
      if (!response.ok || !data.users?.[0]) {
        return null
      }
  
      const user = data.users[0]
      return {
        uid: user.localId,
        email: user.email || null,
        tenantId: user.tenant || 'default',
        disabled: user.disabled || false
      }
    } catch (error) {
      console.error('Session verification error:', error)
      return null
    }
  }




/**
 * Edge-compatible session verification using Firebase Auth REST API
 */
export async function VerifySessionWithRestApi(request: NextRequest): Promise<SessionResult> {
  try {
    // First try session cookie
    const sessionCookie = request.cookies.get("_session_cookie")?.value
    if (sessionCookie) {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.GOOGLE_CLIENT_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionCookie}`
          }
        }
      )

      const data = await response.json()
      console.log('[edge-session] data with session cookie', data)
      
      if (response.ok && data.users?.[0]) {
        const user = data.users[0]
        return {
          isAuthenticated: true,
          user: {
            uid: user.localId,
            email: user.email || null,
            tenantId: user.tenantId || 'default',
            emailVerified: user.emailVerified ?? false,
            disabled: user.disabled || false,
          },
        }
      }
      console.log("Session cookie verification failed:", data.error?.message || "Invalid session")
    }

    // Then try ID token
    const idToken = request.cookies.get("_session_token")?.value
    if (idToken) {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.GOOGLE_CLIENT_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }
      )

      const data = await response.json()
      console.log('[edge-session] data with id token', data)
      
      if (response.ok && data.users?.[0]) {
        const user = data.users[0]
        return {
          isAuthenticated: true,
          user: {
            uid: user.localId,
            email: user.email || null,
            tenantId: user.tenantId || 'default',
            emailVerified: user.emailVerified ?? false,
            disabled: user.disabled || false,
          },
        }
      }
      console.log("ID token verification failed:", data.error?.message || "Invalid token")
    }

    return {
      isAuthenticated: false,
      user: null,
      error: "No valid session found",
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return {
      isAuthenticated: false,
      user: null,
      error: error instanceof Error ? error.message : "Session verification failed",
    }
  }
}
