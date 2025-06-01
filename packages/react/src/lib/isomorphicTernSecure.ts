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
  TernSecureProps, 
  IsomorphicTernSecureOptions, 
  HeadlessUIBrowser,
  HeadlessUIBrowserConstructor
} from '../types'
import { EventEmitter } from '@tern-secure/shared/eventBus'
import { loadTernUIScript } from '@tern-secure/shared/loadTernUIScript';

const ENVIRONMENT = process.env.NODE_ENV;


export interface Global {
  TernSecure?: HeadlessUIBrowser | Browser;
}

declare const global: Global;

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}


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
  private ternui: Browser | HeadlessUIBrowser | null = null;
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
      this.ternui?.status || 
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
      this.loadTernUI();
    }

    console.log('[IsomorphicTernSecure] Constructor called:', {
      mode: this._mode,
      ternSecure: this.TernSecure,
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

  async loadTernUI(): Promise<HeadlessUIBrowser | Browser | undefined> {
    if (this._mode !== 'browser' || this.isReady) {
      console.warn('[IsomorphicTernSecure] loadTernUI called in non-browser mode');
      return;
    }

    if (typeof window !== 'undefined') {
      window.customDomain = this.#customDomain;
    }

    console.log('[IsomorphicTernSecure] loadTernUI called:', {
      mode: this._mode,
      ternSecure: this.TernSecure,
      isReady: this.isReady,
      status: this.status,
      customDomain: this.#customDomain,
      timestamp: new Date().toISOString(),
    });

    try {
      if(this.TernSecure) {
        let coreInstance: TernSecureProps;
        console.log('[IsomorphicTernSecure] this.TernSecure: defined, checking readiness...');
        //const TernSecureHasLoadMethod = typeof this.TernSecure.load === 'function';
        if (isConstructor<BrowserConstructor | HeadlessUIBrowserConstructor>(this.TernSecure)) {
          coreInstance = new this.TernSecure(this.#customDomain);
          this.beforeLoad(coreInstance);
          await coreInstance.load(this.options);
        } else {
          console.log('[IsomorphicTernSecure] this.TernSecure: does not have load method.');
          coreInstance = this.TernSecure;
          if (!coreInstance.isReady) {
            this.beforeLoad(coreInstance);
            await coreInstance.load(this.options);
          }
        }
        global.TernSecure = coreInstance;
      } else {
        console.log('[IsomorphicTernSecure] Loading TernSecure from script is called...');
        if(!global.TernSecure) {
          console.log('[IsomorphicTernSecure] Loading TernSecure from script...');
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
      this.#eventBus.emit('error', error);
      console.error(error.stack || error.message || error);
      return;
    }
  }

  private beforeLoad = (ternui: Browser | HeadlessUIBrowser | undefined) => {
    console.log('[IsomorphicTernSecure] beforeLoad called with TernUI:', {
      ternui,
      isReady: ternui?.isReady,
      status: ternui?.status,
      premountedSignInNodes: this.premountState.signInNodes.size,
      premountedSignUpNodes: this.premountState.signUpNodes.size
    });

    if (!ternui) {
      throw new Error('Failed to inject TernUI');
    }
    console.log('[IsomorphicTernSecure] beforeLoad called', {
      hasStaticRenderer: !!(ternui.constructor as any).mountComponentRenderer,
      isReady: ternui.isReady,
      status: ternui.status,
    });
  };

  private injectTernUI = (ternui: Browser | HeadlessUIBrowser |  undefined) => {
    if (!ternui) {
      throw new Error('TernUI instance is not initialized');
    }

    console.log('[IsomorphicTernSecure] injectTernUI called', {
      hasStaticRenderer: !!(ternui.constructor as any).mountComponentRenderer,
      isReady: ternui.isReady,
      TernSecure: this.TernSecure,
      premountedSignInNodes: this.premountState.signInNodes.size,
      premountedSignUpNodes: this.premountState.signUpNodes.size
    });

    this.ternui = ternui;

    this.subscribeToTernUIEvents();

    this.premountState.signInNodes.forEach((config, node) => {
      console.log('[IsomorphicTernSecure] Processing premounted SignIn node', { node, config });
      ternui.showSignIn(node, config);
    });

    this.premountState.signUpNodes.forEach((config, node) => {
      console.log('[IsomorphicTernSecure] Processing premounted SignUp node', { node, config });
      ternui.showSignUp(node, config);
    });

      this.#status = 'ready';
      this.#eventBus.emit('statusChange', 'ready');

    if (typeof this.ternui.status === 'undefined') {
      this.#status = 'ready';
      this.#eventBus.emit('statusChange', 'ready');
      console.log('[IsomorphicTernSecure] Set internal status to ready (ternui has no status)');
    }

    console.log('[IsomorphicTernSecure] injectTernUI completed', {
      isReady: this.isReady,
      status: this.status
    });

    return this.ternui;
    
  };
  
  /**
   * Subscribe to TernUI events and delegate status changes
   */
  private subscribeToTernUIEvents = () => {
    if (!this.ternui?.events) {
      console.warn('[IsomorphicTernSecure] TernUI instance has no events system');
      return;
    }

    // Subscribe to status changes from the core TernSecure instance
    this.ternui.events.onStatusChanged((newStatus: TernSecureInstanceTreeStatus) => {
      console.log('[IsomorphicTernSecure] Received status change from ternui:', {
        newStatus,
        previousInternalStatus: this.#status,
        ternuiStatus: this.ternui?.status
      });

      this.#status = newStatus;
      this.#eventBus.emit('statusChange', newStatus);
    });

    this.ternui.events.onError?.((error) => {
      console.log('[IsomorphicTernSecure] Received error from ternui:', error);
      this.#eventBus.emit('error', error);
    });

    console.log('[IsomorphicTernSecure] Subscribed to TernUI events');
  };

  #awaitForTernUI(): Promise<HeadlessUIBrowser | Browser>{
    return new Promise<HeadlessUIBrowser | Browser>(resolve => {
      console.log('[IsomorphicTernSecure] Awaiting TernUI initialization...');
      resolve(this.ternui!);
    });
  }

  initialize = async (props: any): Promise<void> => {
    console.log('[IsomorphicTernSecure] Initialize is called with options:', props);
    try {
      console.log('[IsomorphicTernSecure] Initializing TernUI...');
      await this.#awaitForTernUI();
      console.log('[IsomorphicTernSecure] TernUI initialized successfully');
    } catch (error) {
      console.error('[IsomorphicTernSecure] Failed to initialize TernUI:', error);
      throw error;
    }
  }


  // UI control methods
  showSignIn = (node: HTMLDivElement, config?: SignInUIConfig): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignIn(node, config);
    } else {
      this.premountState.signInNodes.set(node, config);
    }
  };

  hideSignIn = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignIn(node);
    } else {
      this.premountState.signInNodes.delete(node);
    }
  };

  showSignUp = (node: HTMLDivElement, config?: SignUpUIConfig): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showSignUp(node, config);
    } else {
      this.premountState.signUpNodes.set(node, config);
    }
  };

  hideSignUp = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideSignUp(node);
    } else {
      this.premountState.signUpNodes.delete(node);
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
        if (this.ternui?.events?.onStatusChanged) {
          return this.ternui.events.onStatusChanged(callback);
        }
        this.#eventBus.on('statusChange', callback);
        return () => {
          this.#eventBus.off('statusChange', callback);
        };
      }
    };
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




  /**
   * Update the instance and process any queued operations
   */
  __internal_updateInstance(instance: TernSecureInstanceTree) {
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

