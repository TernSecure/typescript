import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
  Alert,
  AlertDescription,
  CardStateProvider,
  useCardState
} from '../../components/elements';
import { cn } from '../../lib/utils';
import { useAuthSignIn } from '../../ctx';
import { useTernSecure } from '@tern-secure/shared/react';
import { useSignInContext } from '../../ctx/components/SignIn';
import { useRouter } from '../../components/router';
import type { AuthErrorTree } from '@tern-secure/types';

type VerificationStatus = 'prompt' | 'sent' | 'success';

function VerificationStepInternal({ className }: { className?: string }) {
  const signIn = useAuthSignIn();
  const cardState = useCardState();
  const ternSecure = useTernSecure();
  const { navigate } = useRouter();
  const { 
    handleSignInSuccess,
    redirectAfterSignIn
  } = useSignInContext();
  
  const [status, setStatus] = useState<VerificationStatus>('prompt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const currentUser = ternSecure.auth?.user;
  const email = currentUser?.email;

  useEffect(() => {
    if (status === 'sent' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown <= 0) {
      setCanResend(true);
    }
  }, [status, countdown]);

  const handleBackToSignIn = () => navigate('../');

  const handleCheck = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    cardState.setLoading();

    try {
      if (!currentUser) {
        throw new Error('No user found for verification check');
      }

      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        setStatus('success');
        handleSignInSuccess(currentUser);
        setTimeout(() => {
          redirectAfterSignIn();
        }, 2000);
      } else {
        throw new Error('Email not yet verified. Please check your email and try again.');
      }
    } catch (error) {
      cardState.setError({
        name: 'VerificationError',
        message: error instanceof Error ? error.message : 'Failed to check verification status',
        code: 'VERIFICATION_CHECK_FAILED',
        response: error
      } as AuthErrorTree);
    } finally {
      setIsProcessing(false);
      cardState.setIdle();
    }
  };

  const handleResend = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    cardState.setLoading();

    try {
      const result = await signIn.resendEmailVerification?.();
      if (result?.success) {
        setStatus('sent');
        setCountdown(60);
        setCanResend(false);
      } else {
        throw new Error(result?.message || 'Failed to resend verification email');
      }
    } catch (error) {
      cardState.setError({
        name: 'VerificationError',
        message: error instanceof Error ? error.message : 'Failed to send verification email',
        code: 'VERIFICATION_RESEND_FAILED',
        response: error
      } as AuthErrorTree);
    } finally {
      setIsProcessing(false);
      cardState.setIdle();
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                ✓
              </div>
              <CardTitle className="font-bold">Email Verified</CardTitle>
              <CardDescription>Redirecting you to your account...</CardDescription>
            </CardHeader>
          </>
        );

      case 'sent':
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="font-bold">Check your email</CardTitle>
              <CardDescription>We&apos;ve sent you a verification link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <div className="bg-gray-50 px-4 py-3 rounded-md font-mono text-sm text-gray-700 break-all">
                  {email}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCheck}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Checking...' : 'I\'ve verified my email'}
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isProcessing || !canResend}
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
                  disabled={isProcessing}
                  className={cn(
                    "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
                    "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </>
        );

      default: // prompt
        return (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="font-bold">Verify your email</CardTitle>
              <CardDescription>Please verify your email address to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <div className="bg-gray-50 px-4 py-3 rounded-md font-mono text-sm text-gray-700 break-all">
                  {email}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleCheck}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Checking...' : 'I\'ve verified my email'}
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isProcessing}
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
                  disabled={isProcessing}
                  className={cn(
                    "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
                    "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Back to sign in
                </button>
              </div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <Card className={cn('w-full max-w-md mx-auto mt-8', className)}>
        {cardState.error && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertDescription>
              {cardState.error.message}
            </AlertDescription>
          </Alert>
        )}
        {renderContent()}
      </Card>
    </div>
  );
}

export function VerificationStep() {
  return (
    <CardStateProvider>
      <VerificationStepInternal />
    </CardStateProvider>
  );
}
