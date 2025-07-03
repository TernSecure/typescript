import { 
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
} from '../../components/elements';
import { cn } from '../../lib/utils';

interface PasswordResetSuccessProps {
  email: string;
  onBackToSignIn: () => void;
  className?: string;
}

export function PasswordResetSuccess({ 
  email, 
  onBackToSignIn,
  className 
}: PasswordResetSuccessProps) {
  return (
    <div className="relative flex items-center justify-center">
      <Card className={cn('w-full max-w-md mx-auto mt-8', className)}>
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
            ✓
          </div>
          <CardTitle className="font-bold">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">
            Password reset instructions sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-muted px-4 py-3 rounded-md font-mono text-sm text-muted-foreground break-all">
              {email}
            </div>
          )}
          <Button
            onClick={onBackToSignIn}
            className="w-full"
          >
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}