'use client'

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { 
  SignInUIConfig, 
  SignUpUIConfig, 
  SignInPropsTree,
  SignUpPropsTree,
  TernSecureInstanceTree,
  AuthErrorTree
} from '@tern-secure/types';
import { SignIn } from '../ui/sign-in/sign-in';
import { SignUp } from '../ui/sign-up/sign-up';

interface TernUIRendererProps {
  instance: TernSecureInstanceTree;
}

// State might not be needed anymore if configs are passed directly
interface TernUIRendererState {}

/**
 * TernUIRenderer serves as the bridge between the instance and actual UI components.
 * It initializes the instance's UI controls to mount/unmount components into provided DOM elements.
 */
export class TernUIRenderer extends React.PureComponent<TernUIRendererProps, TernUIRendererState> {
  private mountedRoots = new Map<HTMLDivElement, Root>();

  constructor(props: TernUIRendererProps) {
    super(props);
    this.state = {}; // Initialize state if needed, or remove if not
    this.initializeUIControls();
  }
  
  private initializeUIControls(): void {
    const { instance } = this.props;
    
    // Ensure instance.ui and instance.ui.state are initialized if they don't exist
    if (!instance.ui) {
      Object.defineProperty(instance, 'ui', {
        value: {},
        writable: true, // Make it writable to set state and controls
        configurable: true
      });
    }
    if (!instance.ui!.state) {
      instance.ui!.state = {
        isReady: false,
        isVisible: false,
        currentView: null,
        isLoading: false,
        error: null
      };
    }

    instance.ui!.controls = {
      showSignIn: (targetNode: HTMLDivElement, config?: SignInUIConfig) => {
        if (this.mountedRoots.has(targetNode)) {
          // Unmount existing before mounting new, or warn/error
          this.mountedRoots.get(targetNode)?.unmount();
          this.mountedRoots.delete(targetNode);
        }
        const root = createRoot(targetNode);
        this.mountedRoots.set(targetNode, root);
        
        const signInProps: SignInPropsTree & { signIn: TernSecureInstanceTree['signIn'] } = {
          ui: config,
          signIn: instance.signIn,
          onSuccess: this.handleSignInSuccess,
          onError: this.handleSignInError
        };
        root.render(<SignIn {...signInProps} />);
        instance.ui!.state.isVisible = true;
        instance.ui!.state.currentView = 'signIn';
      },
      hideSignIn: (targetNode: HTMLDivElement) => {
        const root = this.mountedRoots.get(targetNode);
        if (root) {
          root.unmount();
          this.mountedRoots.delete(targetNode);
          if (instance.ui!.state.currentView === 'signIn') {
            instance.ui!.state.isVisible = false;
            instance.ui!.state.currentView = null;
          }
        }
      },
      showSignUp: (targetNode: HTMLDivElement, config?: SignUpUIConfig) => {
        if (this.mountedRoots.has(targetNode)) {
          this.mountedRoots.get(targetNode)?.unmount();
          this.mountedRoots.delete(targetNode);
        }
        const root = createRoot(targetNode);
        this.mountedRoots.set(targetNode, root);

        // Assuming SignUpPropsTree needs to be adapted or SignUp component handles this
        const signUpProps: SignUpPropsTree & { signIn: TernSecureInstanceTree['signIn'] /* Adjust if SignUp needs different auth methods */ } = {
          ui: config,
          signIn: instance.signIn, // This might need to be instance.user.create or similar for sign-up
          onSuccess: this.handleSignUpSuccess,
          onError: this.handleSignUpError
        };
        root.render(<SignUp {...signUpProps} />);
        instance.ui!.state.isVisible = true;
        instance.ui!.state.currentView = 'signUp';
      },
      hideSignUp: (targetNode: HTMLDivElement) => {
        const root = this.mountedRoots.get(targetNode);
        if (root) {
          root.unmount();
          this.mountedRoots.delete(targetNode);
          if (instance.ui!.state.currentView === 'signUp') {
            instance.ui!.state.isVisible = false;
            instance.ui!.state.currentView = null;
          }
        }
      },
      showVerify: (targetNode: HTMLDivElement) => { // Added targetNode
        // Similar mounting logic for Verify component would go here
        console.warn('showVerify not fully implemented in TernUIRenderer');
        instance.ui!.state.isVisible = true;
        instance.ui!.state.currentView = 'verify';
      },
      hideVerify: (targetNode: HTMLDivElement) => { // Added targetNode
        // Similar unmounting logic for Verify component
        console.warn('hideVerify not fully implemented in TernUIRenderer');
        if (instance.ui!.state.currentView === 'verify') {
            instance.ui!.state.isVisible = false;
            instance.ui!.state.currentView = null;
        }
      },
      clearError: () => {
        instance.ui!.state.error = null;
        // Potentially trigger re-render of mounted components if they display this error
      },
      setLoading: (isLoading: boolean) => {
        instance.ui!.state.isLoading = isLoading;
        // Potentially trigger re-render of mounted components
      }
    };
  }
  
  private handleSignInSuccess = (): void => {
    const { instance } = this.props;
    if (instance.ui) {
        instance.ui.state.isVisible = false;
        instance.ui.state.currentView = null;
    }
  };
  
  private handleSignInError = (error: AuthErrorTree): void => {
    const { instance } = this.props;
    if (instance.ui) {
      instance.ui.state.error = error;
      instance.ui.state.isLoading = false;
    }
  };
  
  private handleSignUpSuccess = (): void => {
    const { instance } = this.props;
    if (instance.ui) {
        instance.ui.state.isVisible = false;
        instance.ui.state.currentView = null;
    }
  };
  
  private handleSignUpError = (error: AuthErrorTree): void => {
    const { instance } = this.props;
    if (instance.ui) {
      instance.ui.state.error = error;
      instance.ui.state.isLoading = false;
    }
  };
  
  render(): React.ReactNode {
    return null; // Or <></>
  }
}