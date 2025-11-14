import { NextRequest, NextResponse } from 'next/server'
import {
  VerifyNextTernIdToken,
  VerifyNextTernSessionCookie,
  CreateNextSessionCookie,
  ClearNextSessionCookie
} from '@tern-secure/backend'

export interface CorsOptions {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
}

export interface CookieOptions {
  httpOnly?: boolean
  name?: string
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
  maxAge?: number
  secure?: boolean
}

export interface SecurityOptions {
  requireCSRF?: boolean
  allowedReferers?: string[]
}

export interface TernSecureHandlerOptions {
  cors?: CorsOptions
  cookies?: CookieOptions
  security?: SecurityOptions
  debug?: boolean
}

interface RouteContext {
  pathname: string
  action: string
  method: string
}

export function createTernSecureNextJsHandler(options: TernSecureHandlerOptions = {}) {
  const {
    cors = {},
    cookies: cookieOpts = {},
    security = {},
    debug = false
  } = options

  function logDebug(...args: any[]) {
    if (debug) {
      console.log('[TernSecure Handler]', ...args)
    }
  }

  function handleCors(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin')
    const method = request.method

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })

      if (cors.allowedOrigins && origin) {
        if (cors.allowedOrigins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin)
        }
      }

      if (cors.allowedMethods) {
        response.headers.set('Access-Control-Allow-Methods', cors.allowedMethods.join(', '))
      }

      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
      response.headers.set('Access-Control-Max-Age', '86400')

      return response
    }

    return null
  }

  function applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const origin = request.headers.get('origin')

    if (cors.allowedOrigins && origin && cors.allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }

  function validateCSRF(request: NextRequest, body: any): { valid: boolean; error?: string } {
    if (!security.requireCSRF) return { valid: true }

    const csrfToken = body.csrfToken
    const csrfCookieValue = request.cookies.get('_session_terncf')?.value

    if (!csrfToken) {
      return { valid: false, error: 'CSRF token is required' }
    }

    if (!csrfCookieValue) {
      return { valid: false, error: 'CSRF token cookie not found' }
    }

    if (csrfToken !== csrfCookieValue) {
      return { valid: false, error: 'CSRF token mismatch' }
    }

    return { valid: true }
  }

  function validateReferer(request: NextRequest): { valid: boolean; error?: string } {
    if (!security.allowedReferers || security.allowedReferers.length === 0) {
      return { valid: true }
    }

    const referer = request.headers.get('referer')
    if (!referer) {
      return { valid: false, error: 'Referer header is required' }
    }

    const isAllowed = security.allowedReferers.some(allowed =>
      referer.startsWith(allowed)
    )

    if (!isAllowed) {
      return { valid: false, error: 'Invalid referer' }
    }

    return { valid: true }
  }

  function parseRoute(request: NextRequest): RouteContext {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    // Expected format: /api/auth/{action} or /api/auth/{resource}/{action}
    const authIndex = pathParts.findIndex(part => part === 'auth')

    if (authIndex === -1 || authIndex >= pathParts.length - 1) {
      return {
        pathname: url.pathname,
        action: '',
        method: request.method
      }
    }

    const actionParts = pathParts.slice(authIndex + 1)
    const action = actionParts.join('/')

    logDebug('Parsed route:', { pathname: url.pathname, action, method: request.method })

    return {
      pathname: url.pathname,
      action,
      method: request.method
    }
  }

  async function handleSessionCreate(_request: NextRequest, body: any): Promise<NextResponse> {
    const { idToken, action } = body

    if (action === 'clear') {
      try {
        const result = await ClearNextSessionCookie()
        return NextResponse.json(result, { status: result.success ? 200 : 500 })
      } catch (error) {
        logDebug('Error clearing session:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to clear session' },
          { status: 500 }
        )
      }
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'ID token is required', error: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    try {
      const result = await CreateNextSessionCookie(idToken)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    } catch (error) {
      logDebug('Error creating session:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create session' },
        { status: 500 }
      )
    }
  }

  async function handleSessionVerify(request: NextRequest): Promise<NextResponse> {
    try {
      const sessionCookie = request.cookies.get(cookieOpts.name || '_session_cookie')?.value

      if (!sessionCookie) {
        return NextResponse.json(
          { success: false, message: 'No session cookie found', error: 'NO_SESSION' },
          { status: 401 }
        )
      }

      const result = await VerifyNextTernSessionCookie(sessionCookie)

      if (!result.valid) {
        return NextResponse.json(
          {
            success: false,
            message: result.message || 'Invalid session',
            error: result.error || 'INVALID_SESSION'
          },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: result.uid,
          email: result.email,
          tenant: result.tenant,
          authTime: result.authTime
        }
      })
    } catch (error) {
      logDebug('Error verifying session:', error)
      return NextResponse.json(
        { success: false, message: 'Session verification failed' },
        { status: 500 }
      )
    }
  }

  async function handleSessionRefresh(_request: NextRequest, body: any): Promise<NextResponse> {
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'ID token is required for refresh', error: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    try {
      // Verify the new ID token
      const verifyResult = await VerifyNextTernIdToken(idToken)

      if (!verifyResult.valid) {
        return NextResponse.json(
          {
            success: false,
            message: verifyResult.message || 'Invalid token',
            error: verifyResult.error || 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }

      // Create new session cookie
      const result = await CreateNextSessionCookie(idToken)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    } catch (error) {
      logDebug('Error refreshing session:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to refresh session' },
        { status: 500 }
      )
    }
  }

  async function handleUsersVerify(_request: NextRequest, body: any): Promise<NextResponse> {
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'ID token is required', error: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    try {
      const result = await VerifyNextTernIdToken(idToken)

      if (!result.valid) {
        return NextResponse.json(
          {
            success: false,
            message: result.message || 'Invalid token',
            error: result.error || 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: result.uid,
          email: result.email,
          tenant: result.tenant,
          authTime: result.authTime
        }
      })
    } catch (error) {
      logDebug('Error verifying user:', error)
      return NextResponse.json(
        { success: false, message: 'User verification failed' },
        { status: 500 }
      )
    }
  }

  async function handleRequest(request: NextRequest): Promise<NextResponse> {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Validate referer if required
    const refererCheck = validateReferer(request)
    if (!refererCheck.valid) {
      return NextResponse.json(
        { success: false, message: refererCheck.error },
        { status: 403 }
      )
    }

    // Parse route
    const routeContext = parseRoute(request)

    if (!routeContext.action) {
      return NextResponse.json(
        { success: false, message: 'Invalid route' },
        { status: 404 }
      )
    }

    let body: any = {}

    // Parse body for POST requests
    if (request.method === 'POST') {
      try {
        body = await request.json()
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid JSON body' },
          { status: 400 }
        )
      }

      // Validate CSRF for POST requests
      const csrfCheck = validateCSRF(request, body)
      if (!csrfCheck.valid) {
        return NextResponse.json(
          { success: false, message: csrfCheck.error, error: 'CSRF_ERROR' },
          { status: 403 }
        )
      }
    }

    let response: NextResponse

    // Route to appropriate handler
    try {
      switch (routeContext.action) {
        case 'session/create':
          if (request.method !== 'POST') {
            response = NextResponse.json(
              { success: false, message: 'Method not allowed' },
              { status: 405 }
            )
            break
          }
          response = await handleSessionCreate(request, body)
          break

        case 'session/verify':
          response = await handleSessionVerify(request)
          break

        case 'session/refresh':
          if (request.method !== 'POST') {
            response = NextResponse.json(
              { success: false, message: 'Method not allowed' },
              { status: 405 }
            )
            break
          }
          response = await handleSessionRefresh(request, body)
          break

        case 'users/verify':
          if (request.method !== 'POST') {
            response = NextResponse.json(
              { success: false, message: 'Method not allowed' },
              { status: 405 }
            )
            break
          }
          response = await handleUsersVerify(request, body)
          break

        default:
          response = NextResponse.json(
            { success: false, message: `Unsupported action: ${routeContext.action}` },
            { status: 404 }
          )
      }
    } catch (error) {
      logDebug('Handler error:', error)
      response = NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      )
    }

    // Apply CORS headers
    return applyCorsHeaders(response, request)
  }

  return {
    GET: handleRequest,
    POST: handleRequest
  }
}