import React, { useState, useEffect } from 'react';
import { Button } from '../../components/elements/button';
import { cn } from '../../lib/utils';
import { useAuthSignIn } from '../../ctx';
import { useTernSecure } from '@tern-secure/shared/react';
import { useSignInContext } from '../../ctx/components/SignIn';
import type { AuthErrorTree } from '@tern-secure/types';

type VerificationFlowStep = 'prompt' | 'sent';

export function VerificationStep() {
  const signIn = useAuthSignIn();
  const ternSecure = useTernSecure();
  const { 
    isLoading, 
    handleSignInError,
    handleSignInSuccess,
  } = useSignInContext();
  
  const [currentStep, setCurrentStep] = useState<VerificationFlowStep>('prompt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Get current user and email from auth state
  const currentUser = ternSecure.auth?.user;
  const email = currentUser?.email;

  // Countdown timer for resend button
  useEffect(() => {
    if (currentStep === 'sent' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown <= 0) {
      setCanResend(true);
    }
    return undefined;
  }, [currentStep, countdown]);

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

  const handleVerificationSuccess = () => {
    if (currentUser) {
      handleSignInSuccess(currentUser);
      ternSecure.redirectAfterSignIn();
    }
  };

  const handleBackToSignIn = () => {
    // This will be handled by the parent component through URL or other means
    // For now, we can trigger a custom event or use a callback
    window.dispatchEvent(new CustomEvent('navigate-to-signin'));
  };

  const handleResend = async () => {
    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    try {
      const result = await signIn.resendEmailVerification?.();
      if (result?.success) {
        setCurrentStep('sent');
        setCountdown(60);
        setCanResend(false);
      } else {
        const error = createAuthError(
          result?.message || 'Failed to resend verification email',
          'VERIFICATION_RESEND_FAILED',
          'VerificationError',
          result
        );
        handleSignInError(error);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to resend verification email',
        'VERIFICATION_RESEND_FAILED',
        'VerificationError',
        error
      );
      handleSignInError(authError);
      console.error('Failed to resend verification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheck = async () => {
    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    try {
      if (!currentUser) {
        const error = createAuthError(
          'No user found for verification check',
          'NO_USER_FOUND',
          'VerificationError'
        );
        handleSignInError(error);
        return;
      }

      await currentUser.reload();
      if (currentUser.emailVerified) {
        handleVerificationSuccess();
      } else {
        const error = createAuthError(
          'Email not yet verified. Please check your email and try again.',
          'EMAIL_NOT_VERIFIED',
          'VerificationError'
        );
        handleSignInError(error);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check verification status',
        'VERIFICATION_CHECK_FAILED',
        'VerificationError',
        error
      );
      handleSignInError(authError);
      console.error('Failed to check verification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isLoading || isProcessing;

  const renderPromptStep = () => (
    <div className="flex flex-col gap-6 text-center py-4">
      <p className="text-gray-500 text-sm leading-relaxed m-0">
        We need to verify your email address before you can continue.
      </p>

      {email && (
        <div className="bg-gray-50 px-4 py-3 rounded-md font-mono text-sm text-gray-700 break-all">
          {email}
        </div>
      )}

      <p className="text-gray-500 text-sm leading-relaxed m-0">
        Please check your email and click the verification link. 
        Once verified, click the button below to continue.
      </p>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCheck}
          disabled={isDisabled}
          className="w-full"
        >
          {isProcessing ? 'Checking...' : 'I\'ve verified my email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isDisabled}
          className={cn(
            "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
            "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? 'Sending...' : 'Resend verification email'}
        </button>

        <button
          type="button"
          onClick={handleBackToSignIn}
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

  const renderSentStep = () => (
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
          onClick={handleBackToSignIn}
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

  return currentStep === 'sent' ? renderSentStep() : renderPromptStep();
}
