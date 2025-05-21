import { TernSecureUser } from '@tern-secure/types'

const DEBUG = process.env.NODE_ENV !== 'production'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  component: string
  action: string
  data?: any
}

export const debugLog = (context: LogContext) => {
  if (!DEBUG) return

  const timestamp = new Date().toISOString()
  const prefix = `[TernSecure][${context.component}][${context.action}]`

  console.log(`${prefix} - ${timestamp}`, context.data || '')
}

export const logAuthState = (component: string, user: TernSecureUser | null, isValid: boolean, isVerified: boolean) => {
  debugLog({
    component,
    action: 'AuthState',
    data: {
      user: user ? {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      } : null,
      isValid,
      isVerified,
    },
  })
}

export const logSessionState = (component: string, token: string | null, expirationTime: number | null) => {
  debugLog({
    component,
    action: 'SessionState',
    data: {
      hasToken: !!token,
      expirationTime: expirationTime ? new Date(expirationTime).toISOString() : null,
      isExpired: expirationTime ? Date.now() > expirationTime : null,
    },
  })
}

export const logLifecycle = (component: string, lifecycle: string, props?: any) => {
  debugLog({
    component,
    action: `Lifecycle.${lifecycle}`,
    data: props,
  })
}

export const logError = (component: string, error: Error | unknown) => {
  debugLog({
    component,
    action: 'Error',
    data: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  })
}
