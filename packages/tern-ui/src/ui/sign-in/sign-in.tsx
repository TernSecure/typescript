import React, { useEffect } from 'react';
import type { SignInProps } from '../../types';
import { useTernSecure } from '@tern-secure/shared/react';
import { SignInProvider } from '../../ctx/components/SignIn';
import { Route, Switch } from '../../components/router';
import { SignInStart } from './sign-in-start';
import { PasswordReset } from './password-reset';
import { PasswordResetSuccess } from './password-reset-success';
import { VerificationStep } from '../verify';
import { Card, CardContent } from '../../components/elements';

function RedirectToSignIn() {
  const ternSecure = useTernSecure();
  useEffect(() => {
    void ternSecure.redirectToSignIn();
  }, []);
  return null;
}

const VerifyCompleteComponent = () => (
  <div className="relative flex items-center justify-center">
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="text-center py-8">
        <h3 className="text-lg font-semibold text-green-600 mb-4">Email Verified!</h3>
        <p className="text-muted-foreground">Redirecting you now...</p>
      </CardContent>
    </Card>
  </div>
);

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
      <Route path='verify-complete'>
        <VerifyCompleteComponent />
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