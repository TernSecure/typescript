export interface User {
    uid: string
    email: string | null
    emailVerified?: boolean
    authTime?: number
    disabled?: boolean
}
  
  
  export interface SessionResult {
    user: User | null
    token: string | null
    sessionId: string | null
    error?: string
  }