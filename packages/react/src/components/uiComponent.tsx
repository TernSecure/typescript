'use client'

import React, { useCallback, useMemo, useEffect } from 'react';
import type {
  SignInPropsTree, 
  TernSecureInstanceTree, 
  SignInUIConfig, 
  SignUpUIConfig
} from '@tern-secure/types';
import { TernSecureHostRenderer } from './TernSecureHostRenderer';
import { withTernSecure, FallbackProp } from './withTernSecure';
import { useWaitForComponentMount } from '../hooks/useWaitForComponentMount';

const debugLog = (component: string, action: string, data?: any) => {
  console.log(`[TernSecure:${component}] ${action}`, data || '');
};

//export interface SignInProps {
//  config?: SignInUIConfig;
//  redirectUrl?: string;
//}

type SignInComponentProps = SignInPropsTree & FallbackProp & { 
  component: string;
  instance: TernSecureInstanceTree;
};

export const SignIn = withTernSecure(
  ({ instance, component, fallback, ui }: SignInComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.ui?.controls;
    const controls = instance.ui?.controls;

    useEffect(() => {
      debugLog('SignIn', 'Instance Status', {
        hasControls: !!controls,
        mountingStatus,
        hasConfig: !!ui,
      });
    }, [controls, mountingStatus]);

    const mount = useCallback((el: HTMLDivElement) => {
      debugLog('SignIn', 'Mounting', { ui });
      controls?.showSignIn?.(el, ui);
    }, [controls, ui]);

    const unmount = useCallback((el: HTMLDivElement) => {
      debugLog('SignIn', 'Unmounting');
      controls?.hideSignIn?.(el);
    }, [controls]);

    const updateProps = useCallback((params: { node: HTMLDivElement; props: SignInUIConfig }) => {
      debugLog('SignIn', 'Updating Props', params.props);
      controls?.showSignIn?.(params.node, params.props);
    }, [controls]);

    const rendererProps = useMemo(() => ({
      ...ui,
      signIn: instance.signIn,
    } as SignInUIConfig), [ui, instance.signIn ]);

    const rendererRootProps = useMemo(() => ({
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }), [shouldShowFallback, fallback]);

    return (
      <>
        {shouldShowFallback && fallback}
        {controls && (
          <TernSecureHostRenderer
            component={component}
            mount={mount}
            unmount={unmount}
            updateProps={updateProps}
            props={rendererProps}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignIn', renderWhileLoading: true }
);

export interface SignUpProps {
  config?: SignUpUIConfig;
  redirectUrl?: string;
}

type SignUpComponentProps = SignUpProps & FallbackProp & {
  component: string;
  instance: TernSecureInstanceTree;
};

export const SignUp = withTernSecure(
  ({ instance, component, fallback, config, redirectUrl = '/' }: SignUpComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.ui?.controls;
    const controls = instance.ui?.controls;

    useEffect(() => {
      debugLog('SignUp', 'Instance Status', {
        hasControls: !!controls,
        mountingStatus,
        hasConfig: !!config,
      });
    }, [controls, mountingStatus, config]);

    const mount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Mounting', { config });
      controls?.showSignUp?.(el, config);
    }, [controls, config]);

    const unmount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Unmounting');
      controls?.hideSignUp?.(el);
    }, [controls]);

    const updateProps = useCallback((params: { node: HTMLDivElement; props: SignUpUIConfig }) => {
      debugLog('SignUp', 'Updating Props', params.props);
      controls?.showSignUp?.(params.node, params.props);
    }, [controls]);

    const rendererProps = useMemo(() => ({
      ...config,
      redirectUrl,
      signIn: instance.signIn,
    } as SignUpUIConfig), [config, instance.signIn, redirectUrl]);

    const rendererRootProps = useMemo(() => ({
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }), [shouldShowFallback, fallback]);

    return (
      <>
        {shouldShowFallback && fallback}
        {controls && (
          <TernSecureHostRenderer
            component={component}
            mount={mount}
            unmount={unmount}
            updateProps={updateProps}
            props={rendererProps}
            rootProps={rendererRootProps}
          />
        )}
      </>
    );
  },
  { component: 'SignUp', renderWhileLoading: true }
);

