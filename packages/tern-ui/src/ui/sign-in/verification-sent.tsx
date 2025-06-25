import React, { useState, useEffect } from 'react';
import { Button } from '../../components/elements/button';
import { cn } from '../../lib/utils';

interface VerificationSentProps {
  email?: string;
  onCheckVerification: () => Promise<void>;
  onResendVerification: () => Promise<void>;
  onBackToSignIn: () => void;
  isLoading?: boolean;
}

export function VerificationSent({
  email,
  onCheckVerification,
  onResendVerification,
  onBackToSignIn,
  isLoading = false
}: VerificationSentProps) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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

  const handleResend = async () => {
    try {
      await onResendVerification();
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      console.error('Failed to resend verification:', error);
    }
  };

  const handleCheck = async () => {
    try {
      await onCheckVerification();
    } catch (error) {
      console.error('Failed to check verification:', error);
    }
  };

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
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Checking...' : 'I&apos;ve verified my email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading || !canResend}
          className={cn(
            "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
            "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {canResend ? 
            'Resend verification email' : 
            <>Resend in <span className="text-gray-400 text-xs">{countdown}s</span></>
          }
        </button>

        <button
          type="button"
          onClick={onBackToSignIn}
          disabled={isLoading}
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