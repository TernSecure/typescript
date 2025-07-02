import type { 
  TernSecureInstanceTree, 
  AuthErrorTree,
  TernSecureInstanceTreeStatus,
  TernSecureAuthProvider,
  SignInPropsTree,
  TernSecureState,
  SignUpPropsTree,
  SignInRedirectOptions,
  SignUpRedirectOptions,
  RedirectOptions,
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
  signInNodes: Map<HTMLDivElement, SignInPropsTree | undefined>;
  signUpNodes: Map<HTMLDivElement, SignUpPropsTree| undefined>;
  userButttonNodes: Map<HTMLDivElement, SignInPropsTree | undefined>;
  verifyNodes: Set<HTMLDivElement>;
  methodCalls: Map<keyof TernSecureInstanceTree, Array<() => Promise<unknown>>>;
  authStateListeners: Set<(authState: TernSecureState) => void>;
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
  private _authProvider?: TernSecureAuthProvider;
  #status: TernSecureInstanceTreeStatus = 'loading';
  #customDomain?: string;
  private premountState: PreMountState = {
    signInNodes: new Map(),
    signUpNodes: new Map(),
    userButttonNodes: new Map(),
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

  get requiresVerification(): boolean {
    return this.ternui?.requiresVerification || true;
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
  }

  // Core auth state - delegate to core instance
  get auth(): TernSecureInstanceTree['auth'] {
    return this.ternui?.auth || {
      user: null,
      session: null
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
  get ternAuth(): TernSecureAuthProvider | undefined {
    if (this.ternui) {
      return this.ternui.ternAuth;
    }
    return undefined;
  }

  async loadTernUI(): Promise<HeadlessUIBrowser | Browser | undefined> {
    if (this._mode !== 'browser' || this.isReady) {
      console.warn('[IsomorphicTernSecure] loadTernUI called in non-browser mode');
      return;
    }

    if (typeof window !== 'undefined') {
      window.customDomain = this.#customDomain;
    }

    try {
      if(this.TernSecure) {
        let coreInstance: TernSecureProps;
        //console.log('[IsomorphicTernSecure] this.TernSecure: defined, checking readiness...');
        //const TernSecureHasLoadMethod = typeof this.TernSecure.load === 'function';
        if (isConstructor<BrowserConstructor | HeadlessUIBrowserConstructor>(this.TernSecure)) {
          coreInstance = new this.TernSecure(this.#customDomain);
          this.beforeLoad(coreInstance);
          await coreInstance.load(this.options);
        } else {
          //console.log('[IsomorphicTernSecure] this.TernSecure: does not have load method.');
          coreInstance = this.TernSecure;
          if (!coreInstance.isReady) {
            this.beforeLoad(coreInstance);
            await coreInstance.load(this.options);
          }
        }
        global.TernSecure = coreInstance;
      } else {
        //console.log('[IsomorphicTernSecure] Loading TernSecure from script is called...');
        if(!global.TernSecure) {
          //console.log('[IsomorphicTernSecure] Loading TernSecure from script...');
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
    if (!ternui) {
      throw new Error('Failed to inject TernUI');
    }
  };

  private injectTernUI = (ternui: Browser | HeadlessUIBrowser |  undefined) => {
    if (!ternui) {
      throw new Error('TernUI instance is not initialized');
    }

    this.ternui = ternui;

    this.subscribeToTernUIEvents();

    //ternui.setTernAuth(this._authProvider);

    this.premountState.signInNodes.forEach((config, node) => {
      console.log('[IsomorphicTernSecure] Processing premounted SignIn node', { node, config });
      ternui.showSignIn(node, config);
    });

    this.premountState.signUpNodes.forEach((config, node) => {
      console.log('[IsomorphicTernSecure] Processing premounted SignUp node', { node, config });
      ternui.showSignUp(node, config);
    });

      //this.#status = 'ready';
      this.#eventBus.emit('statusChange', 'ready');

    if (typeof this.ternui.status === 'undefined') {
      this.#status = 'ready';
      this.#eventBus.emit('statusChange', 'ready');
      console.log('[IsomorphicTernSecure] Set internal status to ready (ternui has no status)');
    }

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

    const { events } = this.ternui;

    // Subscribe to status changes from the core TernSecure instance
    events.onStatusChanged((newStatus: TernSecureInstanceTreeStatus) => {
      console.log('[IsomorphicTernSecure] Received status change from ternui:', {
        newStatus,
        previousInternalStatus: this.#status,
        ternuiStatus: this.ternui?.status
      });

      this.#status = newStatus;
      this.#eventBus.emit('statusChange', newStatus);
    });

    events.onAuthStateChanged((authState: TernSecureState) => {
      console.log('[IsomorphicTernSecure] Received auth state from ternui:', authState);
      this.premountState.authStateListeners.forEach(callback => {
        try {
          callback(authState);
        } catch (error) {
          console.error('[IsomorphicTernSecure] Error in premounted auth state listener:', error);
        }
      });

      this.#eventBus.emit('authStateChange', authState);
    });

    events.onError?.((error) => {
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
  showSignIn = (node: HTMLDivElement, config?: SignInPropsTree): void => {
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

  showSignUp = (node: HTMLDivElement, config?: SignUpPropsTree): void => {
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

  showUserButton = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.showUserButton(node);
    } else {
      this.premountState.userButttonNodes.set(node, undefined);
    }
  }

  hideUserButton = (node: HTMLDivElement): void => {
    if (this.ternui && this.isReady) {
      this.ternui.hideUserButton(node);
    } else {
      this.premountState.userButttonNodes.delete(node);
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

  constructUrlWithAuthRedirect = (baseUrl: string): string => {
    if (!this.ternui?.constructUrlWithAuthRedirect) {
      return baseUrl;
    }
    return this.ternui.constructUrlWithAuthRedirect(baseUrl);
  };

  redirectToSignIn = async (options?: SignInRedirectOptions) => {
    if (this.ternui?.redirectToSignIn) {
      this.ternui.redirectToSignIn();
    }
  };

  redirectToSignUp = async (options?: SignUpRedirectOptions) => {
    if (this.ternui?.redirectToSignUp) {
      this.ternui.redirectToSignUp();
    }
  };

  redirectAfterSignIn = (redirectUrl?: string): void => {
    if (this.ternui?.redirectAfterSignIn) {
      this.ternui.redirectAfterSignIn();
    }
  }

  redirectAfterSignUp = (redirectUrl?: string): void => {
    if (this.ternui?.redirectAfterSignUp) {
      this.ternui.redirectAfterSignUp();
    }
  };

  // Event handling - delegate to core instance with fallback to premount state
  get events(): TernSecureInstanceTree['events'] {
    return {
      onAuthStateChanged: (callback: (authState: TernSecureState) => void) => {
        console.log('[IsomorphicTernSecure] Setting up onAuthStateChanged listener');
        if (this.ternui?.events) {
          console.log('[IsomorphicTernSecure] Delegating onAuthStateChanged to ternui.events');
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

  public setAuthProvider(ternAuth: TernSecureAuthProvider): void {
    if (!ternAuth) {
      throw new Error('TernSecureAuthProvider instance is required');
    }
    this._authProvider = ternAuth;
    if (this.ternui && typeof this.ternui.setTernAuth === 'function') {
      this.ternui.setTernAuth(ternAuth);
      console.log('[IsomorphicTernSecure] Auth provider set on core instance');
    } 
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
    this.premountState.userButttonNodes.forEach((config, node) => {
      this.showUserButton(node);
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
      userButttonNodes: new Map(),
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

