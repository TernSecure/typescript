import React, { useEffect } from 'react';
import type { SignInProps } from '../../types';
import { useTernSecure } from '@tern-secure/shared/react';
import { SignInProvider } from '../../ctx/components/SignIn';
import { Route, Switch } from '../../components/router';
import { SignInStart } from './sign-in-start';
import { PasswordReset } from './password-reset';
import { PasswordResetSuccess } from './password-reset-success';
import { VerificationStep } from '../verify';

function RedirectToSignIn() {
  const ternSecure = useTernSecure();
  useEffect(() => {
    void ternSecure.redirectToSignIn();
  }, []);
  return null;
}


function SignInRouter() {
  return (
    <Switch>
      <Route path='password-reset'>
        <PasswordReset />
      </Route>
      <Route path='password-reset-success'>
        <PasswordResetSuccess />
      </Route>
      <Route path='verify'>
        <VerificationStep />
      </Route>
      <Route index>
        <SignInStart />
      </Route>
      <Route>
        <RedirectToSignIn />
      </Route>
    </Switch>
  );
}

export function SignIn(props: SignInProps) {
  const { onSuccess, onError } = props;

  return (
    <Route path='sign-in'>
      <SignInProvider
        onSuccess={onSuccess}
        onError={onError}
      >
        <SignInRouter />
      </SignInProvider>
    </Route>
  );
}