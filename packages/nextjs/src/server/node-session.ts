import { verifyFirebaseToken } from "./SessionTernSecure"
import type { NextRequest } from "next/server"
import type { SessionResult } from "./types"


export async function verifySession(request: NextRequest): Promise<SessionResult> {
  try {
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