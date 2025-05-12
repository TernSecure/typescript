import { NextResponse, type NextMiddleware, type NextRequest } from 'next/server';
import type { User } from './types'

export const runtime = "edge"

interface Auth {
  user: User | null
  sessionId: string | null
  protect: () => Promise<void | Response>
}

type MiddlewareCallback = (
  auth: Auth,
  request: NextRequest
) => Promise<void | Response>


/**
 * Create a route matcher function for public paths
 */
export function createRouteMatcher(patterns: string[]) {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl
    return patterns.some((pattern) => {
      // Convert route pattern to regex
      const regexPattern = new RegExp(`^${pattern.replace(/\*/g, ".*").replace(/$$(.*)$$/, "(?:$1)?")}$`)
      return regexPattern.test(pathname)
    })
  }
}


/**
 * Middleware factory that handles authentication and custom logic
 * @param customHandler Optional function for additional custom logic
 */

export function ternSecureMiddleware(callback?: MiddlewareCallback): NextMiddleware {
  return async function middleware(request: NextRequest) {
    try {

      const sessionCookie = request.cookies.get("_session_cookie")
      const idToken = request.cookies.get("_session_token")
      const hasCookies = !!sessionCookie || !!idToken

      const auth: Auth = {
        user: null,
        sessionId: null,
        protect: async () => {
          if (!hasCookies) {
            const currentPath = request.nextUrl.pathname
            if (currentPath !== '/sign-in') {
              const redirectUrl = new URL('/sign-in', request.url)
              redirectUrl.searchParams.set('redirect', currentPath)
              return NextResponse.redirect(redirectUrl)
            }
          }
        },
      }

    if (callback) {
        const result = await callback(auth, request)
        if (result instanceof Response) {
          return result
        }
    }


      // Continue to the next middleware or route handler
      return  NextResponse.next()
    } catch (error) {
      console.error("Middleware error:", error)
      const redirectUrl = new URL("/sign-in", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
}