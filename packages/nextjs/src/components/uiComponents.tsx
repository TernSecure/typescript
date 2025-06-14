'use client'

import  { 
    SignIn as BaseSignIn,
    SignUp as BaseSignUp,
} from '@tern-secure/react'
import type { ComponentProps } from 'react';

export {
  UserButton
} from '@tern-secure/react';

export const SignIn = (props: ComponentProps<typeof BaseSignIn>) => {
  return <BaseSignIn {...props} />;
};

export const SignUp = (props: ComponentProps<typeof BaseSignUp>) => {
  return <BaseSignUp {...props} />; 
};