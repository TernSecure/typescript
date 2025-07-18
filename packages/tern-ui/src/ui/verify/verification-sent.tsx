import React, { useState, useEffect } from 'react';
import { Button } from '../../components/elements/button';
import { cn } from '../../lib/utils';
import { useAuthSignIn } from '../../ctx';
import { useTernSecure } from '@tern-secure/shared/react';
import type { AuthErrorTree, TernSecureUser } from '@tern-secure/types';

interface VerificationSentProps {
  email?: string;
  user?: TernSecureUser | null;
  onNavigateToSuccess: () => void;
  onBackToSignIn: () => void;
  onError?: (error: AuthErrorTree) => void;
  isLoading?: boolean;
}

export function VerificationSent({
  email,
  user,
  onNavigateToSuccess,
  onBackToSignIn,
  onError,
  isLoading = false
}: VerificationSentProps) {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
    return undefined;
  }, [countdown]);

  const createAuthError = (
    message: string, 
    code: string, 
    name: string = 'VerificationError',
    response?: any
  ): AuthErrorTree => {
    const error = new Error(message) as AuthErrorTree;
    error.name = name;
    error.code = code;
    error.response = response;
    return error;
  };

  const handleResend = async () => {
    if (isProcessing || isLoading || !canResend) return;
    
    setIsProcessing(true);
    try {
      const result = await signIn.resendEmailVerification?.();
      if (result?.success) {
        setCountdown(60);
        setCanResend(false);
      } else {
        const error = createAuthError(
          result?.message || 'Failed to resend verification email',
          'VERIFICATION_RESEND_FAILED',
          'VerificationError',
          result
        );
        onError?.(error);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to resend verification email',
        'VERIFICATION_RESEND_FAILED',
        'VerificationError',
        error
      );
      onError?.(authError);
      console.error('Failed to resend verification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheck = async () => {
    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    try {
      // Get current user from auth or use passed user
      const currentUser = user || ternSecure.auth?.user;
      if (!currentUser) {
        const error = createAuthError(
          'No user found for verification check',
          'NO_USER_FOUND',
          'VerificationError'
        );
        onError?.(error);
        return;
      }

      await currentUser.reload();
      if (currentUser.emailVerified) {
        onNavigateToSuccess();
      } else {
        const error = createAuthError(
          'Email not yet verified. Please check your email and try again.',
          'EMAIL_NOT_VERIFIED',
          'VerificationError'
        );
        onError?.(error);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check verification status',
        'VERIFICATION_CHECK_FAILED',
        'VerificationError',
        error
      );
      onError?.(authError);
      console.error('Failed to check verification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isLoading || isProcessing;

  return (
    <div className="flex flex-col gap-6 text-center py-4">
      <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
        ✓
      </div>

      <p className="text-gray-500 text-sm leading-relaxed m-0">
        Verification email sent! Check your inbox and click the verification link.
      </p>

      {email && (
        <div className="bg-gray-50 px-4 py-3 rounded-md font-mono text-sm text-gray-700 break-all">
          {email}
        </div>
      )}

      <p className="text-gray-500 text-sm leading-relaxed m-0">
        Don&apos;t see the email? Check your spam folder or request a new one.
      </p>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCheck}
          disabled={isDisabled}
          className="w-full"
        >
          {isProcessing ? 'Checking...' : 'I&apos;ve verified my email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isDisabled || !canResend}
          className={cn(
            "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
            "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {canResend ? 
            (isProcessing ? 'Sending...' : 'Resend verification email') : 
            <>Resend in <span className="text-gray-400 text-xs">{countdown}s</span></>
          }
        </button>

        <button
          type="button"
          onClick={onBackToSignIn}
          disabled={isDisabled}
          className={cn(
            "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
            "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}