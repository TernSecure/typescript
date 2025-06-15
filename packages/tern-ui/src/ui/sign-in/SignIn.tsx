'use client'

import { createContext, useContext, ReactNode } from 'react'

interface SignInContextType {
  isError: boolean
  isLoading: boolean
}

const SignInContext = createContext<SignInContextType>({
  isError: false,
  isLoading: false
})

export const useSignInContext = () => useContext(SignInContext)

interface SignInProviderProps {
  children: ReactNode
}

export function SignInProvider({ children }: SignInProviderProps) {
  return (
    <SignInContext.Provider
      value={{
        isError: false,
        isLoading: false
      }}
    >
      {children}
    </SignInContext.Provider>
  )
}
