import type { User } from "./types"

interface RequestContext {
  user: User
  sessionId: string
}

// Use process.env in Node.js and globalThis in Edge
const getGlobalObject = () => {
  if (typeof process !== 'undefined') {
    return process
  }
  return globalThis
}

const STORE_KEY = '__TERN_AUTH_STORE__'

export class Store {
  private static getStore() {
    const global = getGlobalObject() as any
    
    if (!global[STORE_KEY]) {
      global[STORE_KEY] = {
        contexts: new Map<string, RequestContext>(),
        sessions: new Map<string, User>(),
        currentSession: null as RequestContext | null
      }
    }
    
    return global[STORE_KEY]
  }

  static setContext(context: RequestContext) {
    const store = this.getStore()
    const { user, sessionId } = context
    
    console.log("Store: Setting context:", { sessionId, user })
    
    // Store in both maps
    store.contexts.set(sessionId, context)
    store.sessions.set(sessionId, user)
    
    // Set as current session
    store.currentSession = context
    
    console.log("Store: Updated state:", {
      contextsSize: store.contexts.size,
      sessionsSize: store.sessions.size,
      currentSession: store.currentSession
    })
  }

  static getContext(): RequestContext | null {
    const store = this.getStore()
    
    // First try current session
    if (store.currentSession) {
      const session = this.getSession(store.currentSession.sessionId)
      if (session && session.uid === store.currentSession.user.uid) {
        return store.currentSession
      }
    }
    
    // Then try to find any valid context
    for (const [sessionId, user] of store.sessions.entries()) {
      const context = store.contexts.get(sessionId)
      if (context && context.user.uid === user.uid) {
        // Update current session
        store.currentSession = context
        return context
      }
    }
    
    return null
  }

  static setSession(sessionId: string, user: User) {
    const store = this.getStore()
    store.sessions.set(sessionId, user)
  }

  static getSession(sessionId: string): User | null {
    const store = this.getStore()
    return store.sessions.get(sessionId) || null
  }

  static debug() {
    const store = this.getStore()
    return {
      contextsSize: store.contexts.size,
      sessionsSize: store.sessions.size,
      currentSession: store.currentSession,
      contexts: Array.from(store.contexts.entries()),
      sessions: Array.from(store.sessions.entries())
    }
  }

  static cleanup() {
    const store = this.getStore()
    const MAX_ENTRIES = 1000
    
    if (store.contexts.size > MAX_ENTRIES) {
      const keys = Array.from(store.contexts.keys())
      const toDelete = keys.slice(0, keys.length - MAX_ENTRIES)
      
      toDelete.forEach(key => {
        store.contexts.delete(key)
        store.sessions.delete(key)
      })
    }
  }
}