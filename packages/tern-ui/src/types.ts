import type {
    SignInPropsTree,
    SignUpPropsTree,
    SignInRedirectUrl,
    SignUpRedirectUrl
} from '@tern-secure/types';


export interface SignInProps extends Omit<SignInPropsTree, 'signIn'> {
  className?: string;
}

export type SignInCtx = SignInPropsTree & SignInRedirectUrl & SignUpRedirectUrl


export type ComponentsProps = 
    | SignInPropsTree
    | SignUpPropsTree;



export type AvailableComponentProps = 
    | SignInPropsTree
    | SignUpPropsTree;
