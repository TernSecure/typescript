export interface User {
    uid: string
    email: string | null
    emailVerified?: boolean
    authTime?: number
    disabled?: boolean
}
  


  export interface UserInfo {
    uid: string
    email: string | null
    emailVerified?: boolean
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
    user: UserInfo | null
    error?: string
  }