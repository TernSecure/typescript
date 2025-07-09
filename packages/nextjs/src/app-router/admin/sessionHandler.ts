import { NextRequest, NextResponse } from "next/server"
import { createSessionCookie } from "@tern-secure/react"
import { NextCookieStore } from "../../utils/NextCookieAdapter"

export async function createSessionHandler(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json()
        const { idToken, csrfToken } = body
        const cookieStore = new NextCookieStore()

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