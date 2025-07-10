import { type NextRequest, NextResponse } from 'next/server';
import { verifySession } from './node-session'
import type { BaseUser } from "./types"


interface Auth {
  user: BaseUser | null
  token: string | null
  protect: () => Promise<void>
}

type MiddlewareCallback = (
  auth: Auth,
  request: NextRequest
) => Promise<void>


/**
 * Create a route matcher function for public paths
 */
export function createRouteMatcher(patterns: string[]) {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl
    return patterns.some((pattern) => {
      // Convert glob pattern to regex safely without dynamic evaluation
      const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\*/g, ".*")
      
      return new RegExp(`^${regexPattern}$`).test(pathname)
    })
  }
}


/**
 * Edge-compatible auth check
 */
async function nodeAuth(request: NextRequest): Promise<Auth> {
  async function protect() {
    throw new Error("Unauthorized access")
  }

  try {
    const sessionResult = await verifySession(request)

    if (sessionResult.isAuthenticated && sessionResult.user) {
      return {
        user: sessionResult.user,
        token: request.cookies.get("_session_cookie")?.value || request.cookies.get("_session_token")?.value || null,
        protect: async () => {},
      }
    }

    return {
      user: null,
      token: null,
      protect,
    }
  } catch (error) {
    console.error("Auth check error:", error instanceof Error ? error
    .message : "Unknown error")
    return {
      user: null,
      token: null,
      protect,
    }
  }
}



/**
 * Middleware factory that handles authentication and custom logic
 * @param customHandler Optional function for additional custom logic
 */

export function ternSecureMiddleware(callback: MiddlewareCallback) {
  return async function middleware(request: NextRequest) {
    try {
      const auth = await nodeAuth(request)

      try {
        
        await callback(auth, request)

        const response = NextResponse.next()


        return response
      } catch (error) {
        // Handle unauthorized access
        if (error instanceof Error && error.message === 'Unauthorized access') {
          const redirectUrl = new URL("/sign-in", request.url)
          redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
        throw error
      }
    } catch (error) {
      console.error("Middleware error:", error instanceof Error ? error.message : "Unknown error")
      const redirectUrl = new URL("/sign-in", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
}