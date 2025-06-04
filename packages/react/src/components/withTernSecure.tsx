import React from 'react';
import type { TernSecureInstanceTree } from '@tern-secure/types';
import { useIsomorphicTernSecureCtx } from '../ctx/IsomorphicTernSecureCtx';
import { useAssertWrappedByTernSecureProvider } from '../hooks/useAssertWrappedTernSecureProvider';

type WithTernSecureProp<P> = P & {
  instance: TernSecureInstanceTree;
  component?: string;
};


export interface FallbackProp {
  fallback?: React.ReactNode;
}

export const withTernSecure = <P extends { instance: TernSecureInstanceTree; component?: string }>(
  Component: React.ComponentType<P>,
  options?: { component: string; renderWhileLoading?: boolean },
) => {
  const displayName = options?.component || Component.displayName || Component.name || 'Component';

  const HOC = (props: Omit<P, 'instance'> & FallbackProp) => {
    useAssertWrappedByTernSecureProvider(displayName || 'withTernSecure');

    const instance = useIsomorphicTernSecureCtx();

    console.log(
      `[TernSecure] ${displayName} - Instance Status:`,
      {
        isReady: instance.isReady,
        status: instance.status,
        hasInstance: !!instance,
        hasShowSignIn: !!(instance as any).showSignIn,
        renderWhileLoading: options?.renderWhileLoading
      }
    );

    if (!instance.isReady && !options?.renderWhileLoading) {
      return null;
    }

    return (
      <Component
        {...(props as P)}
        component={displayName}
        instance={instance}
      />
    );
  };

  HOC.displayName = `withTernSecure(${displayName})`;
  return HOC;
};
