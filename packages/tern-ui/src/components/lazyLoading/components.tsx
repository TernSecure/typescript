import { lazy } from "react";

const componentImportPaths = {
    SignIn: () => import(/* webpackChunkName: "signin" */ '../../ui/sign-in'),
    SignUp: () => import(/* webpackChunkName: "signup" */ '../../ui/sign-up'),
} as const;

export const SignIn = lazy(() => componentImportPaths.SignIn().then(module => ({ default: module.SignIn })));
export const SignUp = lazy(() => componentImportPaths.SignUp().then(module => ({ default: module.SignUp })));

export const preloadComponent = async (component: unknown) => {
  return componentImportPaths[component as keyof typeof componentImportPaths]?.();
};


export const TernSecureComponents = {
    SignIn,
    SignUp,
};

export type TernSecureComponentName = keyof typeof TernSecureComponents;