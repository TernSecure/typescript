import { useState, useCallback } from 'react';
import type { IsomorphicTernSecure } from '../lib/isomorphicTernSecure';
import type { TernSecureState, DEFAULT_TERN_SECURE_STATE } from '@tern-secure/types';
import type React from 'react';

/**
 * Custom hook that manages auth state and provides subscription callback.
 * @param instance The IsomorphicTernSecure instance
 * @returns Tuple containing [authState, setAuthState, subscribeToAuthState]
 */
export function useAuthState(
  instance: IsomorphicTernSecure | null
): [
  TernSecureState | null, 
  React.Dispatch<React.SetStateAction<TernSecureState | null>>,
  () => () => void
] {
  const [authState, setAuthState] = useState<TernSecureState | null>(
    instance?.ternAuth?.internalAuthState || null
  );

  const subscribeToAuthState = useCallback(() => {
    if (!instance?.ternAuth || !instance.events) {
      return () => {}; // Return no-op cleanup function
    }

    // Set initial state
    const currentInternalState = instance.ternAuth.internalAuthState;
    setAuthState(currentInternalState);

    // Subscribe to changes
    const unsubscribe = instance.events.onAuthStateChanged((newAuthState) => {
      console.log('[useAuthState] Auth state changed:', newAuthState);
      setAuthState(newAuthState);
    });

    return () => {
      unsubscribe?.();
    };
  }, [instance]);

  return [authState, setAuthState, subscribeToAuthState];
}