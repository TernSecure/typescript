'use server'

import { createSessionCookie as createSession, clearSessionCookie as clearSession } from '@tern-secure/backend'
import { SessionResult } from '@tern-secure/types'

export async function createSessionCookie(idToken: string): Promise<SessionResult> {
  return createSession(idToken)
}

export async function clearSessionCookie() {
  return clearSession()
}
