import { cache } from "react"
import type { User } from "./types"

/**
 * Simple in-memory session store
 * In a real app, this would be backed by Redis/etc
 */
class SessionStore {
  private static instance: SessionStore
  private sessions: Map<string, User>
  private currentSessionId: string | null = null

  private constructor() {
    this.sessions = new Map()
  }

  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore()
    }
    return SessionStore.instance
  }

  setUser(sessionId: string, user: User) {
    console.log("SessionStore: Setting user:", { sessionId, user })
    this.sessions.set(sessionId, user)
    this.currentSessionId = sessionId
  }

  getUser(sessionId: string): User | null {
    return this.sessions.get(sessionId) || null
  }

  getCurrentUser(): User | null {
    if (!this.currentSessionId) return null
    return this.sessions.get(this.currentSessionId) || null
  }

  removeUser(sessionId: string) {
    this.sessions.delete(sessionId)
  }

  clear() {
    this.sessions.clear()
  }

  debug() {
    return {
      sessionsCount: this.sessions.size,
      currentSessionId: this.currentSessionId,
      sessions: Array.from(this.sessions.entries())
    }
}
}

// Export singleton instance
export const sessionStore = SessionStore.getInstance()

/**
 * Cached function to get user from session store
 * Uses React cache for SSR optimization
 */
export const getVerifiedUser = cache((sessionId: string): User | null => {
  return sessionStore.getUser(sessionId)
})

