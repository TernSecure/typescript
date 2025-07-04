import React, { useState } from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Button,
  Label,
  Input,
  useCardState,
  CardStateProvider,
} from '../../components/elements';
import { useAuthSignIn } from '../../ctx';
import type { AuthErrorTree } from '@tern-secure/types';
import { useRouter } from '../../components/router';
import { cn } from '../../lib/utils';

export function PasswordResetInternal({ className }: { className?: string }) {
  const signIn = useAuthSignIn();
  const cardState = useCardState();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { navigate } = useRouter();



  const handleBackToSignIn = () => navigate('../');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      cardState.setError({
        message: 'Please enter your email address',
        code: 'EMPTY_EMAIL',
        name: 'ValidationError',
      } as AuthErrorTree);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      cardState.setError({
        message: 'Please enter a valid email address',
        code: 'INVALID_EMAIL',
        name: 'ValidationError',
      } as AuthErrorTree);
      return;
    }
    cardState.setLoading();
    setIsSubmitting(true);

    try {
      await signIn.sendPasswordResetEmail?.(trimmedEmail);
      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      const authError: AuthErrorTree = {
        name: 'PasswordResetError',
        message: errorMessage,
        code: 'PASSWORD_RESET_FAILED',
        response: error,
      }
      cardState.setError(authError);
    } finally {
      setIsSubmitting(false);
      cardState.setIdle();
    }
  };

  if (isSuccess) {
    navigate('../password-reset-success')
  }

  return (
    <div className="relative flex items-center justify-center">
      <Card className={cn('w-full max-w-md mx-auto mt-8', className)}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-bold">Reset password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cardState.error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertDescription>
                {cardState.error.message}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToSignIn}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function PasswordReset() {
  return (
    <CardStateProvider>
      <PasswordResetInternal />
    </CardStateProvider>
  )
}
