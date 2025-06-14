import type {
    TernSecureInstanceTree as TernSecureInterface,
    TernSecureInstanceTreeOptions,
    SignUpUIConfig,
    SignInPropsTree,
    TernSecureInstanceTreeStatus,
    TernSecureAuthProvider
} from '@tern-secure/types';
import { EventEmitter } from '@tern-secure/shared/eventBus'
import type { MountComponentRenderer } from '../ui/Renderer'
import { 
    TernSecureBase,
    TernAuth
} from './resources/internal';
import {
    constructFullUrl,
    hasRedirectLoop,
    storePreviousPath,
    urlWithRedirect
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
    public static mountComponentRenderer?: MountComponentRenderer;
    public static authProviderFactory?: () => TernSecureAuthProvider;
    #componentControls?: ReturnType<MountComponentRenderer>| null;
    #options: TernSecureInstanceTreeOptions = {};
    #status: TernSecureInterface['status'] = 'loading';
    #eventBus = new EventEmitter();
    //#customDomain: DomainOrProxyUrl['domain'];
    #proxyUrl: DomainOrProxyUrl['proxyUrl'];
    //#authProvider?: TernSecureAuthProvider;

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

        console.log('[TernSecure constructor] Initializing... Received domain:', domain);
        this.customDomain = domain;
        console.log('[TernSecure constructor] Custom domain set:', this.customDomain);

        this.#eventBus.emit('statusChange', this.#status); // Initial status is 'loading'
        //this.#setStatus('ready');
        console.log('[TernSecure constructor] Initialization complete. isReady:', this.isReady, 'Status:', this.#status);

        TernSecureBase.ternsecure = this
    }

    get isReady(): boolean {
        return this.#status === 'ready';
    }

    get status(): TernSecureInterface['status'] {
        return this.#status;
    }

    public load = async (options?: TernSecureInstanceTreeOptions): Promise<void> => {
        if (this.isReady) {
            return;
        };

        this.#options = this.#initOptions(options);

        if (this.#options.environment) {
            TernSecure.environment = this.#options.environment;
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
    public showSignUp(node: HTMLDivElement, config?: SignUpUIConfig): void {
        if (!node) {
            throw new Error('showSignUp requires a valid HTMLDivElement as the first parameter');
        }

        this.assertComponentControlsReady(this.#componentControls);
        const componentProps: SignInPropsTree = {
            ui: config,
            //signIn: this.signIn,
        }
        this.#componentControls.ensureMounted().then(controls =>
            controls.mountComponent({
                name: 'SignUp',
                node,
                props: componentProps,
                appearanceKey: config?.appearance?.colors?.primary || 'default',
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
        console.log('[TernSecure] TernAuth provider set:', ternAuth);
        console.log('[TernSecure] TernAuth internal state:', ternAuth.internalAuthState);
        this.#eventBus.emit('TernAuthReady', ternAuth);
    }

    public emitAuthStateChange(authState: any): void {
        this.#eventBus.emit('authStateChange', authState);
        console.warn('[TernSecure] AuthState changed:', authState);
    }

    public get events(): TernSecureInterface['events'] {
        return {
            onAuthStateChanged: (callback) => {
                this.#eventBus.on('authStateChange', callback);
                console.log('[TernSecure] onAuthStateChanged listener added');
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
    
    
    public constructUrlWithRedirect = (): string => {
        const signInUrl = this.#options.signInUrl || '/sign-in';
        const signInPathParam = '/sign-in';
        const signUpUrl = this.#options.signUpUrl || '/sign-up';
        const signUpPathParam = '/sign-up';
        const currentPath = window.location.pathname;
        const baseUrl = window.location.origin
        
        if (typeof window === "undefined" || !window.location) {
            return signInUrl
        }
        
        const url = new URL(signInUrl, baseUrl)
        
        if (!currentPath.includes(signInPathParam) && !currentPath.includes(signUpPathParam)) {
            url.searchParams.set("redirect", currentPath)
        }
        return url.toString()
    };
    
    public redirectToSignIn = (): void => {
        if (inBrowser()){
            const redirectUrl = this.constructUrlWithRedirect()
            window.location.href = redirectUrl;
        }
    };

    redirectAfterSignIn = (): void => {
        if (inBrowser()) {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectPath = urlParams.get('redirect') || '/';
            const currentPath = window.location.pathname;

            if (hasRedirectLoop(currentPath, redirectPath)) {
                console.warn('[TernSecure] Redirect loop detected. Redirecting to default path.');
                window.location.href = '/';
            } else {
                storePreviousPath(currentPath);
                window.location.href = constructFullUrl(redirectPath);
            }
        }
    }

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
                console.log('[TernSecure] Auth provider initialized via factory')
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
            console.log('[TernSecure] onAuthStateChanged:', authState.status);
            if (authState.error) {
                this.error = authState.error;
            }
            
            if (authState.isAuthenticated && this.error) {
                this.error = null;
            }
        });
    }
}