"use client"

import { useTernSecure } from '../ctx/TernSecureCtx'

export function useSignUp() {
  const {
    email,
    setEmail
  } = useTernSecure('useSignUp')

  return {
    email, 
    setEmail
  }
}
