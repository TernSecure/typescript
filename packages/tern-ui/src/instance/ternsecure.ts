import type {
    TernSecureInstanceTree as TernSecureInterface,
    TernSecureInstanceTreeOptions,
    SignInUIConfig,
    SignUpUIConfig,
    SignInPropsTree,
    TernSecureInstanceTreeStatus,
} from '@tern-secure/types';
import { EventEmitter } from '@tern-secure/shared/eventBus'
import type { MountComponentRenderer } from '../ui/Renderer'
import { TernSecureBase } from './resources/base';

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
            console.warn('TernSecure instance is already loaded.');
            return;
        };

        this.#options = this.#initOptions(options);

        if (this.#options.environment) {
            TernSecure.environment = this.#options.environment;
        }

        try {
            if (TernSecure.mountComponentRenderer && !this.#componentControls) {
                this.#componentControls = TernSecure.mountComponentRenderer(
                    this,
                    this.#options,
                );
            }
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
    
    public showSignIn(node: HTMLDivElement, config?: SignInUIConfig): void {
        if (!node) {
            throw new Error('showSignIn requires a valid HTMLDivElement as the first parameter');
        }

        this.assertComponentControlsReady(this.#componentControls);
        const componentProps: SignInPropsTree = {
            ui: config,
            signIn: this.signIn,
        }
        this.#componentControls.ensureMounted().then(controls =>
            controls.mountComponent({
                name: 'SignIn',
                node,
                props: componentProps,
                appearanceKey: config?.appearance?.colors?.primary || 'default',
            }),
        );
        this.currentView = 'signIn';
        this.isVisible = true;
    }

    public hideSignIn(node: HTMLDivElement): void {
        if (!node) {
            throw new Error('hideSignIn requires a valid HTMLDivElement as the first parameter');
        }
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
            signIn: this.signIn,
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
    public clearError(): void {
        this.error = null;
    }
    
    public setLoading(isLoading: boolean): void {
        this.isLoading = isLoading;
    }


    public signIn: TernSecureInterface['signIn'] = {
        withEmail: async (email: string, password: string) => {
            // Implementation for email/password sign in
            throw new Error('Method not implemented.');
        },
        withGoogle: async () => {
            // Implementation for Google OAuth sign in
            throw new Error('Method not implemented.');
        },
        withMicrosoft: async () => {
            // Implementation for Microsoft OAuth sign in
            throw new Error('Method not implemented.');
        },
    }

    public get auth(): TernSecureInterface['auth'] {
        return {
            user: null,
            session: null,
            isAuthenticated: false,
            requiresVerification: false,
        };
    }

    public get user(): TernSecureInterface['user'] {
        return {
            signOut: async () => {
                throw new Error('Method not implemented.');
            },
            getIdToken: async () => {
                throw new Error('Method not implemented.');
            },
            sendVerificationEmail: async () => {
                throw new Error('Method not implemented.');
            },
            create: async (email: string, password: string) => {
                throw new Error('Method not implemented.');
            },
        };
    }

    public get events(): TernSecureInterface['events'] {
        return {
            onAuthStateChanged: (callback) => {
                throw new Error('Method not implemented.');
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

    public async getRedirectResult(): Promise<any> {
        throw new Error('getRedirectResult not implemented');
    }
    
    public shouldRedirect(currentPath: string): boolean | string {
        throw new Error('shouldRedirect not implemented');
    }
    
    public constructUrlWithRedirect(baseUrl: string): string {
        throw new Error('constructUrlWithRedirect not implemented');
    }
    
    public redirectToLogin(redirectUrl?: string): void {
        throw new Error('redirectToLogin not implemented');
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
}