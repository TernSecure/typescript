import { NextRequest, NextResponse } from "next/server"
import { createSessionCookie, clearSessionCookie } from "@tern-secure/react"
import { NextCookieStore } from "../../utils/NextCookieAdapter"

export async function createSessionHandler(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json()
        const { idToken, csrfToken, action } = body
        const cookieStore = new NextCookieStore()
        const csrfCookieValue = request.cookies.get('_session_terncf')?.value;

        if (!csrfToken) {
            return NextResponse.json(
                {
                    success: false, 
                    message: 'CSRF token is required', 
                    error: 'INVALID_CSRF_TOKEN'
                },
                { status: 400 }
            );
        }

        if (!csrfCookieValue) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'CSRF token cookie not found',
                    error: 'CSRF_COOKIE_MISSING'
                },
                { status: 403 }
            );
        }
        
        if (csrfToken !== csrfCookieValue) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'CSRF token mismatch',
                    error: 'CSRF_TOKEN_MISMATCH'
                },
                { status: 403 }
            );
        }

        if (action === 'clear') {
            const res = await clearSessionCookie(cookieStore)

            if (!res.success) {
                console.error('[createSessionHandler] Error clearing session cookie:', {
                    error: res.error,
                    message: res.message
                });
            }
            const statusCode = res.success ? 200 : 500; 
            return NextResponse.json(res, { status: statusCode });
        }
        if (!idToken) {
            return NextResponse.json(
                {
                    success: false, 
                    message: 'ID token is required', 
                    error: 'INVALID_TOKEN'
                },
                { status: 400 }
            );
        }
        const res = await createSessionCookie(idToken, cookieStore);

        if (!res.success) {
            console.error('[createSessionHandler] Error creating session cookie:', {
                error: res.error,
                message: res.message,
                cookieSet: res.cookieSet
            });
        }

        const statusCode = res.success ? 200 : 
                           res.error === 'INVALID_TOKEN' ? 400 :
                            res.error === 'EXPIRED_TOKEN' ? 401 : 500;

        return NextResponse.json(res, { status: statusCode })

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Invalid request format'
            },
            { status: 400 }
        )
    }
}