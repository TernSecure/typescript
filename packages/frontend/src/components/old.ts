{/*'use client'

import { useEffect } from 'react';
import type {
  TernSecureInstanceTree,
  SignInUIConfig,
  SignUpUIConfig,
  TernSecureUser,
  AuthErrorTree
} from '@tern-secure/types';
import { withTernSecure } from './withTernSecure';

// --- SignIn Component --- 
interface SignInProps {
  appearance?: SignInUIConfig['appearance'];
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: () => void;
}

type SignInComponentProps = SignInProps & {
  instance: TernSecureInstanceTree;
  // component prop from HOC can be ignored if not used for rendering here
};

const SignInComponent = ({
  instance,
  appearance,
  onError,
  onSuccess,
}: SignInComponentProps) => {
  const uiConfig: SignInUIConfig = {
    appearance,
    renderMode: 'modal',
    layout: 'vertical',
    socialButtons: {
      google: true,
      microsoft: true,
      layout: 'horizontal'
    },
    loading: {
      message: 'Signing in...',
      spinnerVariant: 'circular'
    },
    a11y: {
      labels: {
        signIn: 'Sign in to your account',
        email: 'Email address',
        password: 'Password'
      }
    }
  };

  useEffect(() => {
    instance.ui?.controls?.showSignIn(uiConfig);
    return () => {
      instance.ui?.controls?.hideSignIn();
    };
  }, [instance, JSON.stringify(uiConfig)]); // Re-run if uiConfig changes based on props

  useEffect(() => {
    if (!instance?.events || !onSuccess) return;
    const unsubscribe = instance.events.onAuthStateChanged((user: TernSecureUser | null) => {
      // Only trigger onSuccess if the UI was for SignIn and now there's a user
      if (user && instance.ui?.state.currentView === 'signIn') {
        onSuccess();
      }
    });
    return () => unsubscribe();
  }, [instance, onSuccess]);

  useEffect(() => {
    if (!instance?.events || !onError) return;
    const unsubscribe = instance.events.onError((err: AuthErrorTree) => {
      // Only trigger onError if the UI was for SignIn
      if (instance.ui?.state.currentView === 'signIn') {
        onError(err);
      }
    });
    return () => unsubscribe();
  }, [instance, onError]);

  return null; // This component only triggers UI, doesn't render it directly
};

export const SignIn = withTernSecure(SignInComponent, {
  component: 'SignIn', // For HOC displayName and potential debugging
  renderWhileLoading: false,
});

// --- SignUp Component --- 
interface SignUpProps {
  appearance?: SignUpUIConfig['appearance'];
  onError?: (error: AuthErrorTree) => void;
  onSuccess?: () => void;
}

type SignUpComponentProps = SignUpProps & {
  instance: TernSecureInstanceTree;
};

const SignUpComponent = ({
  instance,
  appearance,
  onError,
  onSuccess,
}: SignUpComponentProps) => {
  const uiConfig: SignUpUIConfig = {
    appearance,
    renderMode: 'modal',
    layout: 'vertical',
    passwordRequirements: {
      show: true,
      rules: [
        { rule: 'minLength', description: 'At least 8 characters' },
        { rule: 'uppercase', description: 'At least one uppercase letter' },
        { rule: 'lowercase', description: 'At least one lowercase letter' },
        { rule: 'number', description: 'At least one number' },
        { rule: 'special', description: 'At least one special character' }
      ]
    },
    a11y: {
      labels: {
        signUp: 'Create your account',
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm password'
      }
    }
  };

  useEffect(() => {
    instance.ui?.controls?.showSignUp(uiConfig);
    console.log('SignUp UI Config:', uiConfig);
    return () => {
      instance.ui?.controls?.hideSignUp();
    };
  }, [instance, JSON.stringify(uiConfig)]); // Re-run if uiConfig changes

  useEffect(() => {
    if (!instance?.events || !onSuccess) return;
    const unsubscribe = instance.events.onAuthStateChanged((user: TernSecureUser | null) => {
      if (user && instance.ui?.state.currentView === 'signUp') {
        onSuccess();
      }
    });
    return () => unsubscribe();
  }, [instance, onSuccess]);

  useEffect(() => {
    if (!instance?.events || !onError) return;
    const unsubscribe = instance.events.onError((err: AuthErrorTree) => {
      if (instance.ui?.state.currentView === 'signUp') {
        onError(err);
      }
    });
    return () => unsubscribe();
  }, [instance, onError]);

  return null; // This component only triggers UI
};

export const SignUp = withTernSecure(SignUpComponent, {
  component: 'SignUp',
  renderWhileLoading: false,
});

*/}