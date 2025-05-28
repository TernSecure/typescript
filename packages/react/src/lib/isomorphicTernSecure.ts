import type { 
  TernSecureInstanceTree, 
  TernSecureUser, 
  SignInResponseTree, 
  SignInUIConfig,
  SignUpUIConfig,
  AuthErrorTree,
  TernSecureSessionTree,
  TernSecureInstanceTreeStatus,
  TernSecureInstanceTreeOptions
} from '@tern-secure/types';
import type { 
  Browser, 
  BrowserConstructor, 
  IsomorphicTernSecureOptions 
} from '../types'
import { EventEmitter } from '@tern-secure/shared/eventBus'
import { loadTernUIScript } from '@tern-secure/shared/loadTernUIScript';

const ENVIRONMENT = process.env.NODE_ENV;

export interface Global {
  TernSecure: Browser | null;
}

declare const global: Global;

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

export type TernSecureProps = | Browser | BrowserConstructor | null | undefined


interface PreMountState {
  signInNodes: Map<HTMLDivElement, SignInUIConfig | undefined>;
  signUpNodes: Map<HTMLDivElement, SignUpUIConfig | undefined>;
  verifyNodes: Set<HTMLDivElement>;
  methodCalls: Map<keyof TernSecureInstanceTree, Array<() => Promise<unknown>>>;
  authStateListeners: Set<(user: TernSecureUser | null) => void>;
  errorListeners: Set<(error: AuthErrorTree) => void>;
}


/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments
 */
export class IsomorphicTernSecure implements TernSecureInstanceTree {
  private readonly _mode:  'browser' | 'server';
  private readonly options: IsomorphicTernSecureOptions;
  private readonly TernSecure: TernSecureProps;
  private ternui: Browser | null = null;
  #status: TernSecureInstanceTreeStatus = 'loading';
  #customDomain?: string;
  private premountState: PreMountState = {
    signInNodes: new Map(),
    signUpNodes: new Map(),
    verifyNodes: new Set(),
    methodCalls: new Map(),
    authStateListeners: new Set(),
    errorListeners: new Set(),
  };

  static #instance: IsomorphicTernSecure | null | undefined;
  #eventBus = new EventEmitter();

  get isReady(): boolean {
    return this.ternui?.isReady || false;
  }

  get status(): TernSecureInstanceTreeStatus {
    if (!this.ternui) {
      return this.#status;
    }
    return (
      this.ternui.status || 
      (this.ternui.isReady ? 'ready' : 'loading')
    )
  }

  get isLoading(): boolean {
    return this.ternui?.isLoading || false;
  }

  get error(): Error | null {
    return this.ternui?.error || null;
  }

  static getOrCreateInstance(options: IsomorphicTernSecureOptions) {
    if (
      !inBrowser() || 
      !this.#instance || 
      (options.TernSecure && this.#instance.TernSecure !== options.TernSecure)) {
      this.#instance = new IsomorphicTernSecure(options);
    }

    return this.#instance;
  }
  
  static clearInstance() {
    this.#instance = null;
  }

  // Configuration properties delegated to core instance
  get customDomain(): string  {
    if (typeof this.#customDomain === 'function') {
      throw new Error('Unsported customDomain type: function');
    }
    return this.#customDomain || '';
  }

  get proxyUrl(): string | undefined {
    return this.ternui?.proxyUrl || this.options.proxyUrl;
  }

  get apiKey(): string | undefined {
    return this.ternui?.apiKey || this.options.apiKey;
  }

  get projectId(): string | undefined {
    return this.ternui?.projectId;
  }

  get environment() {
    return this.ternui?.environment || this.options.environment || undefined;
  }

  get mode(): 'browser' | 'server' | undefined {
    return this._mode;
  }

  constructor(options: IsomorphicTernSecureOptions) {
    const { TernSecure = null, customDomain } = options || {};
    this.#customDomain = customDomain;
    this.options = options;
    this.TernSecure = TernSecure;
    this._mode = inBrowser() ? 'browser' : 'server';
    this.#eventBus.emit('statusChange', this.status);

    if(!this.options.environment) {
      this.options.environment = ENVIRONMENT;
    }

    if (this.#customDomain) {
      void this.loadTernUI();
    }

    console.log('[IsomorphicTernSecure] Constructor called:', {
      mode: this._mode,
      TernSecure: this.TernSecure,
      isReady: this.isReady,
      status: this.status,
      ternui: this.ternui,
      loadTernUI: this.loadTernUI(),
      timestamp: new Date().toISOString(),
    });
  }

  // Core auth state - delegate to core instance
  get auth(): TernSecureInstanceTree['auth'] {
    return this.ternui?.auth || {
      user: null,
      session: null,
      isAuthenticated: false,
      requiresVerification: false,
    };
  }

  // UI state properties - delegate to core instance
  get isVisible(): boolean {
    return this.ternui?.isVisible || false;
  }

  get currentView(): 'signIn' | 'signUp' | 'verify' | null {
    return this.ternui?.currentView || null;
  }

  // Core authentication methods - delegate to core instance
  get signIn(): TernSecureInstanceTree['signIn'] {
    return this.ternui?.signIn || {
      withEmail: async () => { throw new Error('TernSecure instance not initialized'); },
      withGoogle: async () => { throw new Error('TernSecure instance not initialized'); },
      withMicrosoft: async () => { throw new Error('TernSecure instance not initialized'); },
    };
  }

  // User management methods - delegate to core instance
  get user(): TernSecureInstanceTree['user'] {
    return this.ternui?.user || {
      signOut: async () => { throw new Error('TernSecure instance not initialized'); },
      getIdToken: async () => { throw new Error('TernSecure instance not initialized'); },
      sendVerificationEmail: async () => { throw new Error('TernSecure instance not initialized'); },
      create: async () => { throw new Error('TernSecure instance not initialized'); },
    };
  }

  // UI control methods
  showSignIn = (targetNode: HTMLDivElement, config?: SignInUIConfig): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignIn(targetNode, config);
    } else {
      this.premountState.signInNodes.set(targetNode, config);
    }
  };

  hideSignIn = (targetNode: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignIn(targetNode);
    } else {
      this.premountState.signInNodes.delete(targetNode);
    }
  };

  showSignUp = (targetNode: HTMLDivElement, config?: SignUpUIConfig): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignUp(targetNode, config);
    } else {
      this.premountState.signUpNodes.set(targetNode, config);
    }
  };

  hideSignUp = (targetNode: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignUp(targetNode);
    } else {
      this.premountState.signUpNodes.delete(targetNode);
    }
  };

  clearError = (): void => {
    if (this.ternui?.clearError) {
      this.ternui.clearError();
    }
  };

  setLoading = (isLoading: boolean): void => {
    if (this.ternui?.setLoading) {
      this.ternui.setLoading(isLoading);
    }
  };

  // Platform methods - delegate to core instance
  getRedirectResult = async (): Promise<any> => {
    if (!this.ternui?.getRedirectResult) {
      throw new Error('TernSecure instance not initialized');
    }
    return this.ternui.getRedirectResult();
  };

  shouldRedirect = (currentPath: string): boolean | string => {
    if (!this.ternui?.shouldRedirect) {
      return false;
    }
    return this.ternui.shouldRedirect(currentPath);
  };

  constructUrlWithRedirect = (baseUrl: string): string => {
    if (!this.ternui?.constructUrlWithRedirect) {
      return baseUrl;
    }
    return this.ternui.constructUrlWithRedirect(baseUrl);
  };

  redirectToLogin = (redirectUrl?: string): void => {
    if (this.ternui?.redirectToLogin) {
      this.ternui.redirectToLogin(redirectUrl);
    }
  };

  // Event handling - delegate to core instance with fallback to premount state
  get events(): TernSecureInstanceTree['events'] {
    return {
      onAuthStateChanged: (callback: (user: TernSecureUser | null) => void) => {
        if (this.ternui?.events) {
          return this.ternui.events.onAuthStateChanged(callback);
        }
        this.premountState.authStateListeners.add(callback);
        return () => {
          this.premountState.authStateListeners.delete(callback);
        };
      },
      onError: (callback: (error: AuthErrorTree) => void) => {
        if (this.ternui?.events) {
          return this.ternui.events.onError(callback);
        }
        this.premountState.errorListeners.add(callback);
        return () => {
          this.premountState.errorListeners.delete(callback);
        };
      },
      onStatusChanged: (callback: (status: TernSecureInstanceTreeStatus) => void) => {
        return this.#eventBus.on('statusChange', callback);
      }
    };
  }

  async loadTernUI(): Promise<Browser | undefined> {
    console.log('[IsomorphicTernSecure] loadTernUI called:', {
      mode: this._mode,
      isReady: this.isReady,
      status: this.status,
      timestamp: new Date().toISOString(),
    });

    if (this._mode !== 'browser' || this.isReady) {
      console.warn('[IsomorphicTernSecure] loadTernUI called in non-browser mode');
      return;
    }

    try {
      if(this.TernSecure) {
        let c: TernSecureProps;
        console.log('[IsomorphicTernSecure] this.TernSecure: defined, checking readiness...');
        //const TernSecureHasLoadMethod = typeof this.TernSecure.load === 'function';
        if (isConstructor<BrowserConstructor>(this.TernSecure)) {
          c = new this.TernSecure();
          this.beforeLoad(c);
          await c.load(this.options);
        } else {
          console.log('[IsomorphicTernSecure] this.TernSecure: does not have load method.');
          c = this.TernSecure;
          if (!c.isReady) {
            this.beforeLoad(c);
            await c.load(this.options);
          }
        }
        global.TernSecure = c;
      } else {
        if(!global.TernSecure) {
          await loadTernUIScript({
            ...this.options,
            customDomain: this.#customDomain,
          })
        }

        if(!global.TernSecure) {
          throw new Error('TernSecure instance is not available globally');
        }

        this.beforeLoad(global.TernSecure);
        await global.TernSecure.load(this.options);
      }

      if(global.TernSecure?.isReady) {
        console.log('[IsomorphicTernSecure] global.TernSecure.ready: Injecting TernUI...');
        return this.injectTernUI(global.TernSecure);
      }
      return;
    } catch (err) {
      const error = err as Error;
      this.#eventBus.emit('error');
      console.error(error.stack || error.message || error);
      return;
    }
  }

  private queueMethodCall<T>(
    section: keyof TernSecureInstanceTree,
    promise: () => Promise<T> | undefined
  ) {
    const wrappedPromise = async () => {
      const result = await promise();
      return result as unknown;
    };
    const calls = this.premountState.methodCalls.get(section) || [];
    calls.push(wrappedPromise);
    this.premountState.methodCalls.set(section, calls);
  }

  private beforeLoad = (ternui: Browser | undefined) => {
    if (!ternui) {
      throw new Error('Failed to inject TernUI');
    }
  };

  private injectTernUI = (ternui: Browser | undefined) => {
    if (!ternui) {
      throw new Error('TernUI instance is not initialized');
    }

    this.ternui = ternui;

    this.premountState.signInNodes.forEach((config, node) => {
      ternui.showSignIn(node, config);
    });

    this.premountState.signUpNodes.forEach((config, node) => {
      ternui.showSignUp(node, config);
    });

    if (typeof this.ternui.status === 'undefined') {
      this.#eventBus.emit('statusChange', 'ready');
    }

    return this.ternui;
    
  };

  /**
   * Update the instance and process any queued operations
   */
  public __internal_updateInstance(instance: TernSecureInstanceTree) {
    // Sync the core instance if needed
    //Object.assign(this.TernSecure, instance);

    // Process pre-mounted nodes
    this.premountState.signInNodes.forEach((config, node) => {
      this.showSignIn(node, config);
    });
    this.premountState.signUpNodes.forEach((config, node) => {
      this.showSignUp(node, config);
    });

    // Process queued method calls
    this.premountState.methodCalls.forEach((calls, section) => {
      calls.forEach(async promise => {
        try {
          await promise();
        } catch (error) {
          console.error(`Error processing queued ${String(section)} operation:`, error);
        }
      });
    });

    // Process event listeners
    this.premountState.authStateListeners.forEach(callback => {
      if (this.ternui?.events) this.ternui.events.onAuthStateChanged(callback);
    });
    this.premountState.errorListeners.forEach(callback => {
      if (this.ternui?.events) this.ternui.events.onError(callback);
    });

    // Clear premount state
    this.premountState = {
      signInNodes: new Map(),
      signUpNodes: new Map(),
      verifyNodes: new Set(),
      methodCalls: new Map(),
      authStateListeners: new Set(),
      errorListeners: new Set(),
    };
  }
}


export function isConstructor<T>(f: any): f is T {
  return typeof f === 'function';
}

