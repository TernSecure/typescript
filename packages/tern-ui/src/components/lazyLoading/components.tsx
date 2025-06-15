import { lazy } from "react";

const componentImportPaths = {
    SignIn: () => import(/* webpackChunkName: "signin" */ '../../ui/sign-in'),
    SignUp: () => import(/* webpackChunkName: "signup" */ '../../ui/sign-up'),
    UserButton: () => import(/* webpackChunkName: "userButton" */ '../../ui/user-button'),
} as const;

export const SignIn = lazy(() => componentImportPaths.SignIn().then(module => ({ default: module.SignIn })));
export const SignUp = lazy(() => componentImportPaths.SignUp().then(module => ({ default: module.SignUp })));
export const UserButton = lazy(() => componentImportPaths.UserButton().then(module => ({ default: module.UserButton })));

export const preloadComponent = async (component: unknown) => {
  return componentImportPaths[component as keyof typeof componentImportPaths]?.();
};


export const TernSecureComponents = {
    SignIn,
    SignUp,
    UserButton
};

export type TernSecureComponentName = keyof typeof TernSecureComponents;