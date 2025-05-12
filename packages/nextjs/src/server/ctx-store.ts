import type { User } from "./types"

interface RequestContext {
  user: UserVerificationRequirement
  sessionId: string
}

// Use Node.js global for server-side persistence
declare global {
  var __ternSecure: {
    context: RequestContext | null
    sessions: Map<string, User>
  }
}

// Initialize global state if not exists
if (typeof global.__ternSecure === 'undefined') {
    global.__ternSecure = {
      context: null,
      sessions: new Map(),
    }
  console.log("ContextStore: Initialized global state")
}

export class ContextStore {
  static setContext(context: RequestContext) {
    console.log("ContextStore: Setting context:", context)
    global.__ternSecure.context = context
    console.log("ContextStore: Context set successfully")
  }

  static getContext(): RequestContext | null {
    const context = global.__ternSecure.context
    console.log("ContextStore: Getting context:", context)
    return context
  }

  static setSession(sessionId: string, user: User) {
    console.log("ContextStore: Setting session:", { sessionId, user })
    global.__ternSecure.sessions.set(sessionId, user)
    console.log("ContextStore: Session set successfully")
  }

  static getSession(sessionId: string): User | null {
    const user = global.__ternSecure.sessions.get(sessionId) || null
    console.log("ContextStore: Getting session:", { sessionId, user })
    return user
  }

  static debug() {
    return {
      sessionsCount: global.__ternSecure.sessions.size,
      currentSessionId: global.__ternSecure.context?.sessionId || null,
      sessions: Array.from(global.__ternSecure.sessions.entries()),
    }
  }
}

