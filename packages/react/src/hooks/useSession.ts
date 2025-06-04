'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTernSecure } from '@tern-secure/shared/react'

interface SessionData {
  accessToken: string | null
  expirationTime: string | null // Use string to handle potential null values
  error: Error | null
  isLoading: boolean
}

type SessionStatus = 'active' | 'expired' | 'refreshing' | 'inactive'

export function useSession() {
  const instance = useTernSecure()
  const { user, session } = instance.auth

  const [sessionData, setSessionData] = useState<SessionData>({
    accessToken: session?.token || null,
    expirationTime: session?.expirationTime || null, // Default to a future time for initial state
    error: null,
    isLoading: true
  })

  const status = useMemo((): SessionStatus => {
    if (sessionData.isLoading) return 'refreshing'
    if (!sessionData.accessToken) return 'inactive'
    if (sessionData.error) return 'expired'
    if (sessionData.expirationTime) return 'expired'
    return 'active'
  }, [sessionData])

  const refreshSession = useCallback(async () => {


    try {
      setSessionData(prev => ({ ...prev, isLoading: true }))
      if (!user) throw new Error('No authenticated user')

      const token = await instance.user.getIdToken()
      if (!token) throw new Error('Failed to get ID token')

      // Set expiration to 1 hour from now (Firebase default)
      const expirationTime = Date.now() + (60 * 60 * 1000)

      setSessionData({
        accessToken: token,
        expirationTime: expirationTime.toString(), // Store as string for consistency
        error: null,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSessionData(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('An unknown error occurred'),
        isLoading: false
      }))
    }
  }, [ user, instance.user])

  useEffect(() => {
    refreshSession()

    // Set up a timer to refresh the token before it expires
    const timer = setInterval(() => {
      if (sessionData.expirationTime) {
        const timeUntilExpiry =  Date.now()
        if (timeUntilExpiry < 5 * 60 * 1000) { // Refresh 5 minutes before expiry
          refreshSession()
        }
      }
    }, 60 * 1000) // Check every minute

    return () => clearInterval(timer)
  }, [refreshSession])

  return {
    accessToken: sessionData.accessToken,
    expirationTime: sessionData.expirationTime,
    error: sessionData.error,
    isLoading: sessionData.isLoading,
    status,
    user,
    refresh: refreshSession
  }
}