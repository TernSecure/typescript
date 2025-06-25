import React, { useState } from 'react';
import { Input } from '../../components/elements/input';
import { Label } from '../../components/elements/label';
import { Button } from '../../components/elements/button';

interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<boolean | void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PasswordResetForm({
  onSubmit,
  onCancel,
  isLoading = false
}: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(email.trim());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isLoading || isSubmitting;

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
          onClick={onCancel}
          disabled={isDisabled}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}