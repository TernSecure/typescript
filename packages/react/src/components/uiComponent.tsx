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

// Base props without instance since withTernSecure will provide it
export interface SignInProps {
  ui?: SignInUIConfig;
  redirectUrl?: string;
}

// Internal component props including instance from withTernSecure
type SignInComponentProps = SignInProps & FallbackProp & {
  component?: string;
  instance: TernSecureInstanceTree;
};

export const SignIn = withTernSecure(
  ({ instance, component, fallback, ui }: SignInComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.isReady;

    useEffect(() => {
      debugLog('SignIn', 'Instance Status', {
        isReady: instance.isReady,
        mountingStatus,
        hasSignInMethod: !!instance.showSignIn,
        hasConfig: !!ui,
      });
    }, [instance.isReady, mountingStatus, instance.showSignIn, ui]);

    const mount = useCallback((el: HTMLDivElement) => {
      debugLog('SignIn', 'Mounting', { ui });
      instance.showSignIn(el, ui);
    }, [instance, ui]);

    const unmount = useCallback((el: HTMLDivElement) => {
      debugLog('SignIn', 'Unmounting');
      instance.hideSignIn(el);
    }, [instance]);

    const updateProps = useCallback((params: { node: HTMLDivElement; props: SignInUIConfig }) => {
      debugLog('SignIn', 'Updating Props', params.props);
      instance.showSignIn(params.node, params.props);
    }, [instance]);

    const rendererProps = useMemo(() => ({
      ...ui,
      signIn: instance.signIn,
    } as SignInUIConfig), [ui, instance.signIn]);

    const rendererRootProps = useMemo(() => ({
      ...(shouldShowFallback && fallback && { style: { display: 'none' } }),
    }), [shouldShowFallback, fallback]);

    return (
      <>
        {shouldShowFallback && fallback}
        {instance.isReady && (
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
  component?: string;
  instance: TernSecureInstanceTree;
};

export const SignUp = withTernSecure(
  ({ instance, component, fallback, config, redirectUrl = '/' }: SignUpComponentProps) => {
    const mountingStatus = useWaitForComponentMount(component);
    const shouldShowFallback = mountingStatus === 'rendering' || !instance.isReady;

    useEffect(() => {
      debugLog('SignUp', 'Instance Status', {
        isReady: instance.isReady,
        mountingStatus,
        hasSignUpMethod: !!instance.showSignUp,
        hasConfig: !!config,
      });
    }, [instance.isReady, mountingStatus, instance.showSignUp, config]);

    const mount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Mounting', { config });
      instance.showSignUp(el, config);
    }, [instance, config]);

    const unmount = useCallback((el: HTMLDivElement) => {
      debugLog('SignUp', 'Unmounting');
      instance.hideSignUp(el);
    }, [instance]);

    const updateProps = useCallback((params: { node: HTMLDivElement; props: SignUpUIConfig }) => {
      debugLog('SignUp', 'Updating Props', params.props);
      instance.showSignUp(params.node, params.props);
    }, [instance]);

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
        {instance.isReady && (
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

