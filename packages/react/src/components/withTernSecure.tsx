import React from 'react';
import type { TernSecureInstanceTree } from '@tern-secure/types';
import { useIsomorphicTernSecureCtx } from '../ctx/IsomorphicTernSecureCtx';
import { useAssertWrappedByTernSecureProvider } from '../ctx/useAssertWrappedTernSecureProvider';

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
      `[TernSecure] ${displayName} - Instance: ${instance ? 'found' : 'not found'}`,
      instance,
    );

    if (!instance) {
      return options?.renderWhileLoading ? props.fallback || null : null;
    }

    if (!instance.ui.state.isReady && options?.renderWhileLoading) {
      return props.fallback || null;
    }

    if (!instance.ui.state.isReady && !options?.renderWhileLoading) {
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
