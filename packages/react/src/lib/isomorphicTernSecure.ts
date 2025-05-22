import type { 
  TernSecureInstanceTree, 
  TernSecureUser, 
  SignInResponseTree, 
  SignInUIConfig,
  SignUpUIConfig,
  AuthErrorTree,
  TernSecureSessionTree,
  IsomorphicTernSecureOptions
} from '@tern-secure/types';

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

interface Browser extends TernSecureInstanceTree {
  onComponentsReady: Promise<void>;
  components: any;
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
  private readonly mode:  IsomorphicTernSecureOptions['mode'];
  private readonly options: IsomorphicTernSecureOptions;
  private instance: TernSecureInstanceTree | null = null;
  private premountState: PreMountState = {
    signInNodes: new Map(),
    signUpNodes: new Map(),
    verifyNodes: new Set(),
    methodCalls: new Map(),
    authStateListeners: new Set(),
    errorListeners: new Set(),
  };

  constructor(options: IsomorphicTernSecureOptions = {}) {
    this.mode = options.mode || (typeof window === 'undefined' ? 'server' : 'browser');
    this.options = options;
  }

  static #instance: IsomorphicTernSecure | null | undefined;

  static getOrCreateInstance(options: IsomorphicTernSecureOptions = {}): IsomorphicTernSecure {
    if (!inBrowser() || !this.#instance || (options.Instance && this.#instance.instance !== options.Instance)) {
      this.#instance = new IsomorphicTernSecure(options);
    }
    return this.#instance;
  }
  static clearInstance() {
    this.#instance = null;
  }

  async loadTernUI(): Promise<Browser | undefined> {
    if (this.mode !== 'browser') {
      return;
    }
    try {
      let resolveMounted: () => void;
      const componentsReady = new Promise<void>((resolve) => {
        resolveMounted = resolve;
      });

    const TERNSECURE_UI_READY = 'TERNSECURE_UI_READY';
    const handleUIReady = () => {
      console.log('[IsomorphicTernSecure] UI components mounted');
      resolveMounted();
    };

    window.addEventListener(TERNSECURE_UI_READY, handleUIReady);

    // Dispatch event to notify UI package
    window.dispatchEvent(new CustomEvent('TERNSECURE_INIT', {
      detail: {
        mode: this.mode,
        timestamp: new Date().toISOString()
      }
    }));

    const browserInstance: Browser = {
      ...this,
      onComponentsReady: componentsReady,
      components: {}
    };

    return browserInstance;

    } catch (error) {
    console.error('[IsomorphicTernSecure] Error loading UI:', error);
    throw new Error('Failed to load TernSecure UI components');
    }
  }

  // Auth State Implementation
  public auth = {
    user: null as TernSecureUser | null,
    session: null as TernSecureSessionTree | null,
    isAuthenticated: false,
    requiresVerification: false,
  };

  // Core Auth Methods
  public signIn = {
    withEmail: async (email: string, password: string): Promise<SignInResponseTree> => {
      if (this.instance) {
        return this.instance.signIn.withEmail(email, password);
      }
      const promise = () => this.instance?.signIn.withEmail(email, password);
      this.queueMethodCall('signIn', promise);
      throw new Error('TernSecure not initialized');
    },
    withGoogle: async (): Promise<void> => {
      if (this.instance) {
        return this.instance.signIn.withGoogle();
      }
      const promise = () => this.instance?.signIn.withGoogle();
      this.queueMethodCall('signIn', promise);
      throw new Error('TernSecure not initialized');
    },
    withMicrosoft: async (): Promise<void> => {
      if (this.instance) {
        return this.instance.signIn.withMicrosoft();
      }
      const promise = () => this.instance?.signIn.withMicrosoft();
      this.queueMethodCall('signIn', promise);
      throw new Error('TernSecure not initialized');
    },
  };

  // User Management Methods
  public user = {
    signOut: async (): Promise<void> => {
      if (this.instance) {
        return this.instance.user.signOut();
      }
      const promise = () => this.instance?.user.signOut();
      this.queueMethodCall('user', promise);
      throw new Error('TernSecure not initialized');
    },
    getIdToken: async (): Promise<string | null> => {
      if (this.instance) {
        return this.instance.user.getIdToken();
      }
      return null;
    },
    sendVerificationEmail: async (): Promise<void> => {
      if (this.instance) {
        return this.instance.user.sendVerificationEmail();
      }
      const promise = () => this.instance?.user.sendVerificationEmail();
      this.queueMethodCall('user', promise);
      throw new Error('TernSecure not initialized');
    },
    create: async (email: string, password: string): Promise<SignInResponseTree> => {
      if (this.instance) {
        return this.instance.user.create(email, password);
      }
      const promise = () => this.instance?.user.create(email, password);
      this.queueMethodCall('user', promise);
      throw new Error('TernSecure not initialized');
    },
  };

  // UI State Management
  public ui = {
    state: {
      isReady: true,
      isVisible: false,
      currentView: null as 'signIn' | 'signUp' | 'verify' | null,
      isLoading: false,
      error: null as Error | null,
    },
    controls: {
      showSignIn: (targetNode: HTMLDivElement, config?: SignInUIConfig): void => {
        if (this.instance) {
          this.instance.ui.controls.showSignIn(targetNode, config);
        } else {
          this.premountState.signInNodes.set(targetNode, config);
        }
      },
      hideSignIn: (targetNode: HTMLDivElement): void => {
        if (this.instance) {
          this.instance.ui.controls.hideSignIn(targetNode);
        } else {
          this.premountState.signInNodes.delete(targetNode);
        }
      },
      showSignUp: (targetNode: HTMLDivElement, config?: SignUpUIConfig): void => {
        if (this.instance) {
          this.instance.ui.controls.showSignUp(targetNode, config);
        } else {
          this.premountState.signUpNodes.set(targetNode, config);
        }
      },
      hideSignUp: (targetNode: HTMLDivElement): void => {
        if (this.instance) {
          this.instance.ui.controls.hideSignUp(targetNode);
        } else {
          this.premountState.signUpNodes.delete(targetNode);
        }
      },
      //showVerify: (targetNode: HTMLDivElement): void => {
      //  if (this.instance) {
      //    this.instance.ui.controls.showVerify(targetNode);
      //  } else {
      ///    this.premountState.verifyNodes.add(targetNode);
      //  }
      //},
      //hideVerify: (targetNode: HTMLDivElement): void => {
      //  if (this.instance) {
      //    this.instance.ui.controls.hideVerify(targetNode);
      //  } else {
      //    this.premountState.verifyNodes.delete(targetNode);
      //  }
      //},
      clearError: (): void => {
        if (this.instance) {
          this.instance.ui.controls.clearError();
        }
        this.ui.state.error = null;
      },
      setLoading: (isLoading: boolean): void => {
        if (this.instance) {
          this.instance.ui.controls.setLoading(isLoading);
        }
        this.ui.state.isLoading = isLoading;
      },
    },
  };

  // Platform Integration
  public platform = {
    getRedirectResult: async (): Promise<any> => {
      if (this.instance) {
        return this.instance.platform.getRedirectResult();
      }
      const promise = () => this.instance?.platform.getRedirectResult();
      this.queueMethodCall('platform', promise);
      throw new Error('TernSecure not initialized');
    },
    shouldRedirect: (currentPath: string): boolean | string => {
      if (this.instance) {
        return this.instance.platform.shouldRedirect(currentPath);
      }
      return false;
    },
    constructUrlWithRedirect: (baseUrl: string): string => {
      if (this.instance) {
        return this.instance.platform.constructUrlWithRedirect(baseUrl);
      }
      return baseUrl;
    },
    redirectToLogin: (redirectUrl?: string): void => {
      if (this.instance) {
        this.instance.platform.redirectToLogin(redirectUrl);
      }
    },
  };

  // Event Handling
  public events = {
    onAuthStateChanged: (callback: (user: TernSecureUser | null) => void) => {
      if (this.instance) {
        return this.instance.events.onAuthStateChanged(callback);
      }
      this.premountState.authStateListeners.add(callback);
      return () => {
        this.premountState.authStateListeners.delete(callback);
      };
    },
    onError: (callback: (error: AuthErrorTree) => void) => {
      if (this.instance) {
        return this.instance.events.onError(callback);
      }
      this.premountState.errorListeners.add(callback);
      return () => {
        this.premountState.errorListeners.delete(callback);
      };
    },
  };

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
  public __internal_updateInstance(instance: TernSecureInstanceTree) {
    this.instance = instance;
    this.ui.state.isReady = true;

    // Process pre-mounted nodes
    this.premountState.signInNodes.forEach((config, node) => {
      this.ui.controls.showSignIn(node, config);
    });
    this.premountState.signUpNodes.forEach((config, node) => {
      this.ui.controls.showSignUp(node, config);
    });
    //this.premountState.verifyNodes.forEach(node => {
    //  this.ui.controls.showVerify(node);
    //});

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
      if (this.instance) this.instance.events.onAuthStateChanged(callback);
    });
    this.premountState.errorListeners.forEach(callback => {
      if (this.instance) this.instance.events.onError(callback);
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
