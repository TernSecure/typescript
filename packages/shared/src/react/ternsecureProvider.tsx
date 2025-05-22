'use client'

import { useContext } from 'react';
import type { 
    TernSecureInstanceTree
} from '@tern-secure/types';
import { createContextAndHook } from './ternsecureCtx';

// Create instance context
const [TernSecureInstanceContext, useTernSecureInstanceContext] = 
  createContextAndHook<TernSecureInstanceTree>('TernSecureInstanceContext');

// Assert helper
function useAssertWrappedByTernSecureProvider(displayNameOrFn: string | (() => void)): void {
  //const ctx = useTernSecureInstanceContext();
  const ctx = useContext(TernSecureInstanceContext);
  
  if (!ctx) {
    if (typeof displayNameOrFn === 'function') {
      displayNameOrFn();
      return;
    }

    throw new Error(
      `${displayNameOrFn} can only be used within the <TernSecureProvider /> component.
      
Possible fixes:
1. Ensure that the <TernSecureProvider /> is correctly wrapping your application
2. Check for multiple versions of @tern-secure packages in your project`
    );
  }
}


export {
  TernSecureInstanceContext,
  useTernSecureInstanceContext,
  useAssertWrappedByTernSecureProvider
};