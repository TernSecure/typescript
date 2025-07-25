import { 
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button,
} from '../../components/elements';
import { useRouter } from '../../components/router';
import { cn } from '../../lib/utils';


export function PasswordResetSuccess() {
  const { navigate } = useRouter();
  const onBackToSignIn = () => navigate('../');

  return (
    <div className="relative flex items-center justify-center">
      <Card className={cn('w-full max-w-md mx-auto mt-8')}>
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