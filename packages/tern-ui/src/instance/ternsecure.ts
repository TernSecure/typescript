import type {
    TernSecureInstanceTree as TernSecureInterface,
    TernSecureInstanceTreeOptions,
    SignInPropsTree,
    SignUpPropsTree,
    TernSecureInstanceTreeStatus,
    TernSecureAuthProvider,
    SignInRedirectOptions,
    SignUpRedirectOptions,
    RedirectOptions,
    TernSecureSDK,
    SignOutOptions
} from '@tern-secure/types';
import { EventEmitter } from '@tern-secure/shared/eventBus'
import type { MountComponentRenderer } from '../ui/Renderer'
import { 
    TernSecureBase,
    TernAuth
} from './resources/internal';
import {
    hasRedirectLoop,
    buildURL
} from '../utils/construct'


export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

export type DomainOrProxyUrl =
  | {
      proxyUrl?: never;
      domain?: string | ((url: URL) => string);
    }
  | {
      proxyUrl?: string | ((url: URL) => string);
      domain?: never;
    };


declare global {
  interface Window {
    TernSecure?: TernSecure;
    apiKey?: string;
    customDomain: TernSecureInterface['customDomain'];
    proxyUrl?: TernSecureInterface['proxyUrl'];
    projectId?: TernSecureInterface['projectId'];
  }
}

export class TernSecure implements TernSecureInterface {
    public static version: string = __TERN_UI_PACKAGE_VERSION__;
    public static sdkMetadata: TernSecureSDK = {
        name: __TERN_UI_PACKAGE_NAME__,
        version: __TERN_UI_PACKAGE_VERSION__,
        environment: process.env.NODE_ENV || 'production'
    };
    public static mountComponentRenderer?: MountComponentRenderer;
    public static authProviderFactory?: () => TernSecureAuthProvider;
    #componentControls?: ReturnType<MountComponentRenderer>| null;
    #options: TernSecureInstanceTreeOptions = {};
    #status: TernSecureInterface['status'] = 'loading';
    #eventBus = new EventEmitter();
    //#customDomain: DomainOrProxyUrl['domain'];
    #proxyUrl: DomainOrProxyUrl['proxyUrl'];

    public proxyUrl?: string;
    public apiKey?: string;
    public customDomain?: string | undefined;
    public projectId?: string;
    public static environment = process.env.NODE_ENV || 'production';
    public isVisible = false;
    public currentView: 'signIn' | 'signUp' | null = null;
    public error: Error | null = null;
    public isLoading = false;
    public ternAuth: TernSecureAuthProvider | undefined;

    public constructor(domain: string) {
        if (!domain) {
            throw new Error('TernSecure requires a domain or proxy URL to be initialized.');
        }

        //console.log('[TernSecure constructor] Initializing... Received domain:', domain);
        this.customDomain = domain;
        //console.log('[TernSecure constructor] Custom domain set:', this.customDomain);

        this.#eventBus.emit('statusChange', this.#status); // Initial status is 'loading'
        //this.#setStatus('ready');
        //console.log('[TernSecure constructor] Initialization complete. isReady:', this.isReady, 'Status:', this.#status);

        TernSecureBase.ternsecure = this
    }

    get isReady(): boolean {
        return this.#status === 'ready';
    }

    get status(): TernSecureInterface['status'] {
        return this.#status;
    }
    
    get version(): string {
        return TernSecure.version;
    }

    get sdkMetadata(): TernSecureSDK {
        return TernSecure.sdkMetadata;
    }


    get requiresVerification(): boolean {
        return this.#options.requiresVerification ?? true; //default always to true
    }

    public load = async (options?: TernSecureInstanceTreeOptions): Promise<void> => {
        if (this.isReady) {
            return;
        };

        this.#options = this.#initOptions(options);

        if (this.#options.sdkMetadata) {
            TernSecure.sdkMetadata = this.#options.sdkMetadata;
        }

        try {
            if (!this.#options.ternSecureConfig) {
                const errMsg = 'TernSecure: Firebase configuration is missing.';
                console.error(errMsg);
                this.error = new Error(errMsg);
                this.#setStatus('error');
                throw this.error;
            }

            const initTernAuth = async () => {
                console.log('[TernSecure] Creating TernSecureAuthProvider instance...')
                return await  TernAuth.getOrCreateInstance(this.#options.ternSecureConfig!);
            };

            const initCompponentRenderer = () => {
                if (TernSecure.mountComponentRenderer && !this.#componentControls) {
                    this.#componentControls = TernSecure.mountComponentRenderer(
                        this,
                        this.#options,
                    );
                }
            }

            const loadTernAuth =  await initTernAuth();
            if (!loadTernAuth) {
                throw new Error('Failed to initialize TernAuth provider');
            }

            this.setTernAuth(loadTernAuth);

            initCompponentRenderer();

            this.#setStatus('ready');
            this.#eventBus.emit('ready')
        } catch (error) {
            this.error = error as Error;
            this.#setStatus('error');
            throw error;
        }
    };


    assertComponentControlsReady(controls: unknown): asserts controls is ReturnType<MountComponentRenderer> {
        if (!TernSecure.mountComponentRenderer) {
            throw new Error('TernSecure instance was loaded without UI components');
        }
        if (!controls) {
            throw new Error('TernSecure UI components are not ready yet.');
        }
    }
    
    public showSignIn(node: HTMLDivElement, config?: SignInPropsTree): void {
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.mountComponent({
                name: 'SignIn',
                node,
                props: config,
                appearanceKey: config?.ui?.appearance?.colors?.primary || 'default',
            }),
        );
        this.currentView = 'signIn';
        this.isVisible = true;
    }

    public hideSignIn(node: HTMLDivElement): void {
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.unmountComponent({ 
                node,
            }),
        );
    }
    public showSignUp(node: HTMLDivElement, config?: SignUpPropsTree): void {
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.mountComponent({
                name: 'SignUp',
                node,
                props: config,
                appearanceKey: config?.ui?.appearance?.colors?.primary || 'default',
            }),
        );
        this.currentView = 'signUp';
        this.isVisible = true;
    }
    
    public hideSignUp(node: HTMLDivElement): void {
        if (!node) {
            throw new Error('hideSignUp requires a valid HTMLDivElement as the first parameter');
        }
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.unmountComponent({ 
                node,
            }),
        );
    }

    public showUserButton(node: HTMLDivElement): void {
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.mountComponent({
                name: 'UserButton',
                node,
                props: {},
                appearanceKey: 'default',
            }),
        );
    }

    public hideUserButton(node: HTMLDivElement): void {
        this.assertComponentControlsReady(this.#componentControls);
        this.#componentControls.ensureMounted().then(controls =>
            controls.unmountComponent({ 
                node,
            }),
        );
    }

    public clearError(): void {
        this.error = null;
    }
    
    public setLoading(isLoading: boolean): void {
        this.isLoading = isLoading;
    }


    public get auth(): TernSecureInterface['auth'] {
        return {
            user: this.ternAuth?.ternSecureUser() || null,
            session: this.ternAuth?.currentSession || null,
        };
    }

    public authState() {
        return this.ternAuth?.internalAuthState
    }


    public setTernAuth(ternAuth: TernSecureAuthProvider): void {
        if (!ternAuth) {
            console.warn('[TernSecure] ternAuth is not defined');
            return;
        }
        
        this.ternAuth = ternAuth;
        //console.log('[TernSecure] TernAuth provider set:', ternAuth);
        //console.log('[TernSecure] TernAuth internal state:', ternAuth.internalAuthState);
        this.#eventBus.emit('TernAuthReady', ternAuth);
    }

    public emitAuthStateChange(authState: any): void {
        this.#eventBus.emit('authStateChange', authState);
        //console.warn('[TernSecure] AuthState changed:', authState);
    }

    public get events(): TernSecureInterface['events'] {
        return {
            onAuthStateChanged: (callback) => {
                this.#eventBus.on('authStateChange', callback);
                //console.log('[TernSecure] onAuthStateChanged listener added');
                return () => {
                  this.#eventBus.off('authStateChange', callback);
                }  
            },
            onError: (callback) => {
                this.#eventBus.on('error', callback);
                return () => {
                    this.#eventBus.off('error', callback);
                };
            },
            onStatusChanged: (callback) => {
                this.#eventBus.on('statusChange', callback);
                return () => {
                    this.#eventBus.off('statusChange', callback);
                };
            }
        };
    }

    public getRedirectResult = async (): Promise<any> => {
        throw new Error('getRedirectResult not implemented');
    }
    
    public shouldRedirect = (currentPath: string): boolean | string => {
        throw new Error('shouldRedirect not implemented');
    }

    public signOut = async (opts?: SignOutOptions): Promise<void> => {
        if (!this.ternAuth) {
            return
        }
        const redirectUrl = opts?.redirectUrl || this.#constructAfterSignOutUrl();

        await this.ternAuth?.signOut();
        
        if (inBrowser()) {
            window.location.href = redirectUrl;
        }
    }

    #buildUrl = (
        key: 'signInUrl' | 'signUpUrl', 
        options: RedirectOptions // This is SignInRedirectOptions | SignUpRedirectOptions
    ): string => {
        if (!key || !this.isReady) {
            return '';
        }

        const baseUrlConfig = key === 'signInUrl' ? this.#options.signInUrl : this.#options.signUpUrl;
        const defaultPagePath = key === 'signInUrl' ? '/sign-in' : '/sign-up';
        const base = baseUrlConfig || defaultPagePath; // This is the URL of the sign-in/up page

        let effectiveRedirectUrl: string | null | undefined = undefined;

        // Priority 1: Get redirect URL from options (signInForceRedirectUrl or signUpForceRedirectUrl)
        if (key === 'signInUrl' && 'signInForceRedirectUrl' in options) {
            effectiveRedirectUrl = options.signInForceRedirectUrl;
        } else if (key === 'signUpUrl' && 'signUpForceRedirectUrl' in options) {
            effectiveRedirectUrl = options.signUpForceRedirectUrl;
        }
        
        // Priority 2: If no force redirect from options, check 'redirect' param in current URL (only in browser)
        if (!effectiveRedirectUrl && inBrowser()) {
            const currentUrlParams = new URLSearchParams(window.location.search);
            const existingRedirectParam = currentUrlParams.get('redirect');
            if (existingRedirectParam) {
                effectiveRedirectUrl = existingRedirectParam;
            }
        }

        // Priority 3: If still no redirect URL, fallback to current page's full path (only in browser)
        // This ensures that if the call originates from a page, it attempts to redirect back there by default.
        if (!effectiveRedirectUrl && inBrowser()) {
            effectiveRedirectUrl = window.location.pathname + window.location.search + window.location.hash;
        }
        
        if (effectiveRedirectUrl && inBrowser()) {
            let signInPagePath: string | undefined;
            try {
                signInPagePath = this.#options.signInUrl ? new URL(this.#options.signInUrl, window.location.origin).pathname : defaultPagePath;
            } catch {
                signInPagePath = defaultPagePath;
            }

            let signUpPagePath: string | undefined;
            try {
                signUpPagePath = this.#options.signUpUrl ? new URL(this.#options.signUpUrl, window.location.origin).pathname : (key === 'signUpUrl' ? defaultPagePath : '/sign-in'); // Corrected default for sign-up
            } catch {
                signUpPagePath = (key === 'signUpUrl' ? defaultPagePath : '/sign-in'); // Corrected default for sign-up
            }
            
            const redirectTargetObj = new URL(effectiveRedirectUrl, window.location.origin);

            if (redirectTargetObj.pathname === signInPagePath || redirectTargetObj.pathname === signUpPagePath) {
                // If the intended redirect path is the sign-in or sign-up page itself,
                // change the redirect target to the application root ('/').
                effectiveRedirectUrl = '/';
            }
        }
        

        const paramsForBuildUrl: Parameters<typeof buildURL>[0] = {
            base,
            searchParams: new URLSearchParams(),
        };
        
        if (effectiveRedirectUrl) { // Check if a redirect URL was determined
            if (inBrowser()) {
                const absoluteRedirectUrl = new URL(effectiveRedirectUrl, window.location.origin).href;
                paramsForBuildUrl.searchParams!.set('redirect', absoluteRedirectUrl);
            } else {
                // If not in browser, use the effectiveRedirectUrl as is.
                // This assumes it's either absolute or a path the server can interpret.
                paramsForBuildUrl.searchParams!.set('redirect', effectiveRedirectUrl);
            }
        }
        

        const constructedUrl = buildURL(paramsForBuildUrl, { stringify: true, skipOrigin: false });

        if (typeof constructedUrl !== 'string') {
            console.error('[TernSecure] Error: buildURL did not return a string as expected. Falling back to base URL.');
            if (inBrowser()) {
                try {
                    return new URL(base, window.location.origin).href;
                } catch {
                    return base; // Fallback if base is also invalid
                }
            }
            return base; // Non-browser fallback
        }

        return this.constructUrlWithAuthRedirect(constructedUrl);
    }
    
    public constructSignInUrl = (options?: SignInRedirectOptions): string => {
        return this.#buildUrl('signInUrl', {...options})
    };
    
    public constructSignUpUrl = (options?: SignUpRedirectOptions): string => {
        return this.#buildUrl('signUpUrl', {...options})
    };


    
    public constructUrlWithAuthRedirect = (to: string): string => {
        const baseUrl = window.location.origin
        const url = new URL(to, baseUrl)
        
        if (url.origin === window.location.origin) {
            return url.href;
        }

        return url.toString()
    };

    #constructAfterSignInUrl = (): string => {
        if (!inBrowser()) {
            return '/';
        }

        let redirectPath: string | null | undefined = undefined;
        const defaultRedirectPath = '/';

        // Priority 1: Check for signInForceRedirectUrl from instance options
        if (this.#options.signInForceRedirectUrl) {
            redirectPath = this.#options.signInForceRedirectUrl;
        }

        // Priority 2: If no force redirect, check 'redirect' param in current URL
        if (!redirectPath) {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectPathFromParams = urlParams.get('redirect');
            if (redirectPathFromParams) {
                redirectPath = redirectPathFromParams;
            }
        }

        // Priority 3: Fallback to default path
        if (!redirectPath) {
            redirectPath = defaultRedirectPath;
        }

        const currentPath = window.location.pathname;

        if (hasRedirectLoop(currentPath, redirectPath)) {
            //console.warn('[TernSecure] Redirect loop detected. Redirecting to default path.');
            return defaultRedirectPath;
        }
        
        return this.constructUrlWithAuthRedirect(redirectPath);
    }

    #constructAfterSignOutUrl = (): string => {
        if (!this.#options.afterSignOutUrl) {
            return '/';
        }
        return this.constructUrlWithAuthRedirect(this.#options.afterSignOutUrl)
    }
    
    public redirectToSignIn = async (options?: SignInRedirectOptions): Promise<unknown> => {
        if (inBrowser()) {
            const url = this.constructSignInUrl(options);
            window.location.href = url;
        }
        return
    };

    public redirectToSignUp = async (options?: SignUpRedirectOptions): Promise<unknown> => {
        if (inBrowser()) {
            const redirectUrl = this.constructSignUpUrl()
            window.location.href = redirectUrl;
        }
        return 
    }
    
    redirectAfterSignIn = async (): Promise<void> => {
        if (inBrowser()) {
            const destinationUrl = this.#constructAfterSignInUrl();
            window.location.href = destinationUrl;
        }
    }

    redirectAfterSignUp =  (): void => {
        throw new Error('redirectAfterSignUp is not implemented yet');
    };

    /**
    * @deprecated
    * This method is no longer used and will be removed in future versions.
    */
    public static setAuthProviderFactory(factory: () => TernSecureAuthProvider): void {
        TernSecure.authProviderFactory = factory;
    }

    /**
    * @deprecated
    * This method is no longer used and will be removed in future versions.
    */
    public initializeTernAuth(): void {
        if (!this.ternAuth) {
            this.#initTernAuth();
        }
    }

    /**
    * @deprecated
    * This method is no longer used and will be removed in future versions.
    */
    #ensureAuthProvider(): void {
        if (!this.ternAuth && TernSecure.authProviderFactory) {
            try {
                const authProvider= TernSecure.authProviderFactory();
                this.setTernAuth(authProvider);
                console.log('[TernSecure] Auth provider initialized via factory');
            } catch (error) {
                console.error('[TernSecure] Error initializing auth provider:', error);
                throw new Error(`Failed to initialize authentication provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            console.warn('[TernSecure] No auth provider factory defined. TernSecure will not have authentication capabilities.');
        }
    }



    /**
    * @deprecated
    * This method is no longer used and will be removed in future versions.
    */
    #initTernAuth(): void {
        if (TernSecure.authProviderFactory) {
            try {
                const authProvider = TernSecure.authProviderFactory();
                this.setTernAuth(authProvider);
                //console.log('[TernSecure] Auth provider initialized via factory')
            } catch (error) {
                console.error('[TernSecure] Error initializing auth provider:', error);
            }
        } else {
            console.warn('[TernSecure] No auth provider factory defined. TernSecure will not have authentication capabilities.');
        }
    }


    #setStatus(newStatus: TernSecureInstanceTreeStatus): void {
        if (this.#status !== newStatus) {
            this.#status = newStatus;
            this.#eventBus.emit('statusChange', this.#status);

            if (newStatus === 'ready') {
                this.#eventBus.emit('ready');
            }
        }
    }
    
    #initOptions = (options?: TernSecureInstanceTreeOptions): TernSecureInstanceTreeOptions => {
        return {
            ...options,
        }
    }

    #setupAuthStateSync(): void {
        this.events.onAuthStateChanged((authState) => {
            //console.log('[TernSecure] onAuthStateChanged:', authState.status);
            if (authState.error) {
                this.error = authState.error;
            }
            
            if (authState.isAuthenticated && this.error) {
                this.error = null;
            }
        });
    }
}