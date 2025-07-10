export interface User {
    uid: string
    email: string | null
    emailVerified?: boolean
    authTime?: number
    disabled?: boolean
}

export interface BaseUser {
  uid: string
  email: string | null
  emailVerified?: boolean
  tenantId: string | null
  authTime?: number
  disabled?: boolean
}
  
  export interface SessionUser {
    uid: string
    email: string | null
    emailVerified: boolean
    disabled?: boolean
  }
  
  export interface SessionResult {
    isAuthenticated: boolean
    user: BaseUser | null
    error?: string
  }