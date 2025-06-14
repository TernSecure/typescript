import { 
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '../../components/elements';
import { Button } from '../../components/elements/button'
import { useUser } from '../../ctx'
import { useTernSecure } from '@tern-secure/shared/react'

export function UserButton() {
    const user = useUser();
    const ternSecure = useTernSecure();

    const handleSignOut = () => {
        ternSecure.ternAuth.signOut();
    }

    const handleSignIn = () => {
        ternSecure.redirectAfterSignIn();
    }
    
    let avatarFallbackContent: string;
    let avatarAltText = 'User Avatar';

    if (!user) {
        avatarFallbackContent = '?'; 
        avatarAltText = 'Guest Avatar';
    } else {
        avatarFallbackContent = user.displayName?.charAt(0).toUpperCase() || 'U';
        if (user.displayName) {
            avatarAltText = `${user.displayName}'s Avatar`;
        }
    }
    
    return (
        <>
        {user ? (
            <Button 
               onClick={handleSignOut} 
               variant="outline" 
               style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} alt={avatarAltText}/>
                    <AvatarFallback>{avatarFallbackContent}</AvatarFallback>
                </Avatar>
                Sign Out
            </Button>
        ) : (
            <Button 
               onClick={handleSignIn} 
               variant="outline" 
               style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <Avatar>
                    <AvatarImage src={undefined} alt={avatarAltText}/>
                    <AvatarFallback>{avatarFallbackContent}</AvatarFallback>
                </Avatar>
                Sign In
            </Button>
        )}
        </>
    );
}