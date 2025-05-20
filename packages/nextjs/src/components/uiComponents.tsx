'use client'
import  { 
    SignIn as BaseSignIn,
    SignUp as BaseSignUp,
} from '@tern-secure/next-frontend'
import type { ComponentProps } from 'react';


// You might create Next.js specific hooks here or in a separate file
// import { useTernSecureNextJsSpecificProps } from '../hooks/useTernSecureNextJsSpecificProps';

export const SignIn = (props: ComponentProps<typeof BaseSignIn>) => {
  // const enhancedProps = useTernSecureNextJsSpecificProps('SignIn', props);
  // return <BaseSignIn {...enhancedProps} />;
  return <BaseSignIn {...props} />; // Basic wrapper for now
};

export const SignUp = (props: ComponentProps<typeof BaseSignUp>) => {
  // const enhancedProps = useTernSecureNextJsSpecificProps('SignUp', props);
  // return <BaseSignUp {...enhancedProps} />;
  return <BaseSignUp {...props} />; // Basic wrapper for now
};