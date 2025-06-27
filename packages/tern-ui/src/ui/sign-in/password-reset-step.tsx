import React, { useState } from 'react';
import { Input } from '../../components/elements/input';
import { Label } from '../../components/elements/label';
import { Button } from '../../components/elements/button';
import { useAuthSignIn } from '../../ctx';
import { useSignInContext } from '../../ctx/components/SignIn';
import type { AuthErrorTree } from '@tern-secure/types';
import { useRouter } from '../../components/router';

export function PasswordResetStep() {
  const signIn = useAuthSignIn();
  const { 
    isLoading, 
    handleSignInError,
  } = useSignInContext();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { navigate } = useRouter();

  const createAuthError = (
    message: string, 
    code: string, 
    name: string = 'PasswordResetError',
    response?: any
  ): AuthErrorTree => {
    const error = new Error(message) as AuthErrorTree;
    error.name = name;
    error.code = code;
    error.response = response;
    return error;
  };

  const handleBackToSignIn = () => {
    return navigate('../');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn.sendPasswordResetEmail?.(trimmedEmail);
      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
      
      const authError = createAuthError(
        errorMessage,
        'PASSWORD_RESET_FAILED',
        'PasswordResetError',
        error
      );
      handleSignInError(authError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isLoading || isSubmitting;

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center py-4">
        <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
          ✓
        </div>
        
        <p className="text-gray-500 text-sm leading-relaxed m-0">
          Password reset link sent! Check your email for instructions.
        </p>

        {email && (
          <div className="bg-gray-50 px-4 py-3 rounded-md font-mono text-sm text-gray-700 break-all">
            {email}
          </div>
        )}

        <Button
          onClick={handleBackToSignIn}
          className="w-full"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-email">Email address</Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={isDisabled}
          required
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm m-0">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <Button
          type="submit"
          disabled={isDisabled || !email.trim()}
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleBackToSignIn}
          disabled={isDisabled}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
