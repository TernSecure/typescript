import React from 'react';
import { Button } from '../../components/elements/button';
import { cn } from '../../lib/utils';

interface VerificationPromptProps {
  email?: string;
  onResendVerification: () => Promise<void>;
  onCheckVerification: () => Promise<void>;
  onBackToSignIn: () => void;
  isLoading?: boolean;
}

export function VerificationPrompt({
  email,
  onResendVerification,
  onCheckVerification,
  onBackToSignIn,
  isLoading = false
}: VerificationPromptProps) {
  const handleResend = async () => {
    try {
      await onResendVerification();
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
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Checking...' : 'I\'ve verified my email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading}
          className={cn(
            "bg-transparent border-none text-blue-600 text-sm underline cursor-pointer",
            "hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Resend verification email
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