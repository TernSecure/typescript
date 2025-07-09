'use server'

import { createSessionCookie as createSession, clearSessionCookie as clearSession } from '@tern-secure/backend'
import { CookieStore, SessionResult } from '@tern-secure/types'

export async function createSessionCookie(idToken: string, cookieStore: CookieStore): Promise<SessionResult> {
  return createSession(idToken, cookieStore)
}

export async function clearSessionCookie(cookieStore: CookieStore): Promise<SessionResult> {
  return clearSession(cookieStore)
}
