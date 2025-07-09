export type SignInRedirectUrl = {
    signInForceRedirectUrl?: string | null;
}

export type SignUpRedirectUrl = {
    signUpForceRedirectUrl?: string | null;
}

export type AfterSignOutUrl = {
    afterSignOutUrl?: string | null;
};

export type RedirectOptions = SignInRedirectUrl | SignUpRedirectUrl;