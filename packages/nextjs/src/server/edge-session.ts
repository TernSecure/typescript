import { verifyFirebaseToken } from "./jwt-edge"
import type { NextRequest } from "next/server"
import type { SessionResult, User } from "./types"



export async function verifySession(request: NextRequest): Promise<SessionResult> {
  try {
    //const cookieStore = await cookies()

    // First try session cookie

    const sessionCookie = request.cookies.get("_session_cookie")?.value
    const idToken = request.cookies.get("_session_token")?.value

    //const sessionCookie = request.cookies.get("_session_cookie")?.value
    if (sessionCookie) {
      const result = await verifyFirebaseToken(sessionCookie, true)
      if (result.valid) {
          const user: User = {
            uid: result.uid ?? '',
            email: result.email || null,
            emailVerified: result.emailVerified ?? false,
            authTime: result.authTime,
        }

        return {
          user,
          token: sessionCookie,
          sessionId: sessionCookie,
        }
      }
    }

    // Then try ID token
    //const idToken = request.cookies.get("_session_token")?.value
    if (idToken) {
      const result = await verifyFirebaseToken(idToken, false)
      if (result.valid) {
        const user: User =  {
            uid: result.uid ?? '',
            email: result.email || null,
            emailVerified: result.emailVerified ?? false,
            authTime: result.authTime,
        }


        return {
          user,
          token: idToken,
          sessionId: idToken,
        }
      }
    }

    return {
      user: null,
      token: null,
      sessionId: null,
      error: "No valid session found",
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return {
      user: null,
      token: null,
      sessionId: null,
      error: error instanceof Error ? error.message : "Session verification failed",
    }
  }
}