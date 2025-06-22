'use server'

import { createSessionCookie as createSession, clearSessionCookie as clearSession } from '@tern-secure/backend'

export async function createSessionCookie(idToken: string) {
  return createSession(idToken)
}

export async function clearSessionCookie() {
  return clearSession()
}
