import React from 'react';
import type { 
  TernSecureInstanceTree, 
  SignInUIConfig, 
  SignUpUIConfig, 
  AuthErrorTree, 
  SignUpFormValuesTree, 
  TernSecureUser, 
  SignInPropsTree, 
  SignUpPropsTree 
} from '@tern-secure/types';
import { createRoot, Root } from 'react-dom/client';
import { SignIn } from './ui/sign-in/sign-in';
import { SignUp } from './ui/sign-up/sign-up';

export * from './ui';

const mountedRoots = new Map<HTMLDivElement, Root>();

export function initializeUiOnInstance(instance: TernSecureInstanceTree): void {
  // Define the complete desired structure for ui.state including isReady
  const defaultUiState: NonNullable<TernSecureInstanceTree['ui']>['state'] = {
    isReady: false,
    isVisible: false,
    currentView: null,
    isLoading: false,
    error: null,
  };

  // Define a placeholder for controls to satisfy the type initially
  const defaultUiControls: NonNullable<TernSecureInstanceTree['ui']>['controls'] = {
    showSignIn: () => console.warn('showSignIn not fully initialized'),
    hideSignIn: () => console.warn('hideSignIn not fully initialized'),
    showSignUp: () => console.warn('showSignUp not fully initialized'),
    hideSignUp: () => console.warn('hideSignUp not fully initialized'),
    showVerify: () => console.warn('showVerify not fully initialized'),
    hideVerify: () => console.warn('hideVerify not fully initialized'),
    clearError: () => console.warn('clearError not fully initialized'),
    setLoading: () => console.warn('setLoading not fully initialized'),
  };

  if (!instance.ui) {
    instance.ui = {
      state: { ...defaultUiState },
      controls: { ...defaultUiControls }, // Initialize with full structure
    };
  } else {
    instance.ui.state = {
      ...defaultUiState,
      ...(instance.ui.state || {}), // Spread existing state if it exists
      isReady: false, // Explicitly set/reset
    };
    if (!instance.ui.controls) {
      instance.ui.controls = { ...defaultUiControls };
    }
  }

  // These should now correctly infer their types.
  const uiState = instance.ui.state; // No `!` needed if structured correctly above
  const uiControls = instance.ui.controls;

  const makeOnError = (error: AuthErrorTree) => {
    uiState.error = error;
  };
  const makeOnSuccess = (user: TernSecureUser | null) => {
    uiState.isVisible = false;
  };

  uiControls.showSignIn = (targetNode: HTMLDivElement, config?: SignInUIConfig) => {
    if (mountedRoots.has(targetNode)) {
      mountedRoots.get(targetNode)?.unmount();
      mountedRoots.delete(targetNode);
    }
    const root = createRoot(targetNode);
    mountedRoots.set(targetNode, root);

    const signInComponentProps: SignInPropsTree = {
      ui: config,
      signIn: instance.signIn,
      onSuccess: makeOnSuccess,
      onError: makeOnError,
    };
    root.render(React.createElement(SignIn, signInComponentProps));
    uiState.isVisible = true;
    uiState.currentView = 'signIn';
  };

  uiControls.hideSignIn = (targetNode: HTMLDivElement) => {
    const root = mountedRoots.get(targetNode);
    if (root) {
      root.unmount();
      mountedRoots.delete(targetNode);
      if (uiState.currentView === 'signIn') {
        uiState.isVisible = false;
        uiState.currentView = null;
      }
    }
  };

  uiControls.showSignUp = (targetNode: HTMLDivElement, config?: SignUpUIConfig) => {
    if (mountedRoots.has(targetNode)) {
      mountedRoots.get(targetNode)?.unmount();
      mountedRoots.delete(targetNode);
    }
    const root = createRoot(targetNode);
    mountedRoots.set(targetNode, root);

    const signUpComponentProps: SignUpPropsTree = {
      ui: config,
      signIn: instance.signIn, 
      onSubmit: async (values: SignUpFormValuesTree) => {
        if (instance.user?.create) {
          try {
            const response = await instance.user.create(values.email, values.password);
            if (response.success) {
              makeOnSuccess(response.user || null);
            } else {
              makeOnError({ name: 'SignUpError', message: response.message || 'Sign up failed', ...response.error });
            }
          } catch (e: any) {
            makeOnError({ name: 'SignUpCatchError', message: e.message, ...e });
          }
        } else {
          console.error("SignUp method (instance.user.create) not available");
          makeOnError({name: 'ConfigError', message: 'SignUp method not configured on instance'});
        }
      },
      onSuccess: makeOnSuccess,
      onError: makeOnError,
    };
    root.render(React.createElement(SignUp, signUpComponentProps));
    uiState.isVisible = true;
    uiState.currentView = 'signUp';
  };

  uiControls.hideSignUp = (targetNode: HTMLDivElement) => {
    const root = mountedRoots.get(targetNode);
    if (root) {
      root.unmount();
      mountedRoots.delete(targetNode);
      if (uiState.currentView === 'signUp') {
        uiState.isVisible = false;
        uiState.currentView = null;
      }
    }
  };

  uiControls.showVerify = (targetNode: HTMLDivElement) => {
    console.warn('showVerify not fully implemented in initializeUiOnInstance');
    uiState.isVisible = true;
    uiState.currentView = 'verify';
  };

  uiControls.hideVerify = (targetNode: HTMLDivElement) => {
    console.warn('hideVerify not fully implemented in initializeUiOnInstance');
    if (uiState.currentView === 'verify') {
      uiState.isVisible = false;
      uiState.currentView = null;
    }
  };

  uiControls.clearError = () => {
    uiState.error = null;
  };

  uiControls.setLoading = (isLoading: boolean) => {
    uiState.isLoading = isLoading;
  };

  uiState.isReady = true; // Mark UI as ready
}