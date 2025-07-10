import { jwtVerify, createRemoteJWKSet } from "jose"
import { cache } from "react"

interface FirebaseIdTokenPayload {
  iss: string
  aud: string
  auth_time: number
  user_id: string
  sub: string
  iat: number
  exp: number
  email?: string
  email_verified?: boolean
  firebase: {
    identities: {
      [key: string]: any
    }
    sign_in_provider: string
    tenant?: string;
  }
}

interface FirebaseTokenResult {
  valid: boolean;
  tenant?: string;
  uid?: string;
  email?: string | null;
  emailVerified?: boolean;
  authTime?: number;
  issuedAt?: number;
  expiresAt?: number;
  error?: string;
}

// Firebase public key endpoints
const FIREBASE_ID_TOKEN_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
const FIREBASE_SESSION_CERT_URL = "https://identitytoolkit.googleapis.com/v1/sessionCookiePublicKeys"

// Cache the JWKS using React cache
const getIdTokenJWKS = cache(() => {
  return createRemoteJWKSet(new URL(FIREBASE_ID_TOKEN_URL), {
    cacheMaxAge: 3600000, // 1 hour
    timeoutDuration: 5000, // 5 seconds
    cooldownDuration: 30000, // 30 seconds between retries
  })
})

const getSessionJWKS = cache(() => {
  return createRemoteJWKSet(new URL(FIREBASE_SESSION_CERT_URL), {
    cacheMaxAge: 3600000, // 1 hour
    timeoutDuration: 5000, // 5 seconds
    cooldownDuration: 30000, // 30 seconds between retries
  })
})

// Helper to decode JWT without verification
function decodeJwt(token: string) {
  try {
    const [headerB64, payloadB64] = token.split(".")
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString())
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString())
    return { header, payload }
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

export async function verifyFirebaseToken(token: string, isSessionCookie = false): Promise<FirebaseTokenResult> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId) {
      throw new Error("Firebase Project ID is not configured")
    }

    // Decode token for debugging and type checking
    const decoded = decodeJwt(token)
    if (!decoded) {
      throw new Error("Invalid token format")
    }

    //console.log("Token details:", {
     // header: decoded.header,
     // type: isSessionCookie ? "session_cookie" : "id_token",
    //})

    let retries = 3
    let lastError: Error | null = null

    while (retries > 0) {
      try {
        // Use different JWKS based on token type
        const JWKS = isSessionCookie ? await getSessionJWKS() : await getIdTokenJWKS()

        const { payload } = await jwtVerify(token, JWKS, {
          issuer: isSessionCookie
            ? "https://session.firebase.google.com/" + projectId
            : "https://securetoken.google.com/" + projectId,
          audience: projectId,
          algorithms: ["RS256"],
        })

        const firebasePayload = payload as unknown as FirebaseIdTokenPayload
        const now = Math.floor(Date.now() / 1000)

        // Verify token claims
        if (firebasePayload.exp <= now) {
          throw new Error("Token has expired")
        }

        if (firebasePayload.iat > now) {
          throw new Error("Token issued time is in the future")
        }

        if (!firebasePayload.sub) {
          throw new Error("Token subject is empty")
        }

        if (firebasePayload.auth_time > now) {
          throw new Error("Token auth time is in the future")
        }

        return {
          valid: true,
          uid: firebasePayload.sub,
          email: firebasePayload.email,
          emailVerified: firebasePayload.email_verified,
          tenant: firebasePayload.firebase.tenant,
          authTime: firebasePayload.auth_time,
          issuedAt: firebasePayload.iat,
          expiresAt: firebasePayload.exp,
        }
      } catch (error) {
        lastError = error as Error
        if (error instanceof Error && error.name === "JWKSNoMatchingKey") {
          console.warn(`JWKS retry attempt ${4 - retries}:`, error.message)
          retries--
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }
        }
        throw error
      }
    }

    throw lastError || new Error("Failed to verify token after retries")
  } catch (error) {
    console.error("Token verification details:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      decoded: decodeJwt(token),
      //projectId,
      isSessionCookie,
    })

    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    }
  }
}
