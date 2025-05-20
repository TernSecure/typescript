'use client'

import { useEffect, useRef, useState } from 'react';
import type { 
  TernSecureInstanceTree, 
  TernSecureUser, 
  SignInResponseTree, 
  SignInUIConfig,
  SignUpUIConfig,
  AuthErrorTree,
  TernSecureSessionTree
} from '@tern-secure/types';

type Mode = 'browser' | 'server';

interface IsomorphicTernSecureOptions {
  mode?: Mode;
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
  private readonly mode: Mode;
  private readonly options: IsomorphicTernSecureOptions;
  public instance: TernSecureInstanceTree | null = null; // Made public for the check in useEffect
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
      showVerify: (targetNode: HTMLDivElement): void => {
        if (this.instance) {
          this.instance.ui.controls.showVerify(targetNode);
        } else {
          this.premountState.verifyNodes.add(targetNode);
        }
      },
      hideVerify: (targetNode: HTMLDivElement): void => {
        if (this.instance) {
          this.instance.ui.controls.hideVerify(targetNode);
        } else {
          this.premountState.verifyNodes.delete(targetNode);
        }
      },
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
    this.premountState.verifyNodes.forEach(node => {
      this.ui.controls.showVerify(node);
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

/**
 * React hook for managing TernSecure instance in isomorphic context
 */
export const useIsomorphicTernSecure = (options: IsomorphicTernSecureOptions = {}): IsomorphicTernSecure | null => {
  const isomorphicInstanceRef = useRef<IsomorphicTernSecure | null>(null);
  // This state is used to ensure a re-render occurs once the instance is created and ready.
  const [activeInstance, setActiveInstance] = useState<IsomorphicTernSecure | null>(null);

  useEffect(() => {
    if (!isomorphicInstanceRef.current) {
      isomorphicInstanceRef.current = new IsomorphicTernSecure(options);
      // At this point, the IsomorphicTernSecure wrapper is created.
      // We set it to state to trigger a re-render, so consumers get the wrapper.
      setActiveInstance(isomorphicInstanceRef.current);
    }

    // IMPORTANT: The actual initialization of the underlying TernSecure service
    // (e.g., Firebase, your custom backend SDK) should happen here or be triggered from here.
    // Once that actual service is initialized, you would call:
    // isomorphicInstanceRef.current.__internal_updateInstance(actualServiceInstance);
    // This might also require another setActiveInstance call if the readiness of the
    // IsomorphicTernSecure instance changes in a way that consumers need to react to.
    // For example, if actualServiceInstance is loaded asynchronously:
    /*
    const initializeActualService = async () => {
      if (isomorphicInstanceRef.current && !isomorphicInstanceRef.current.instance) {
        try {
          // const actualService = await yourAsyncInitFunction(options); // Replace with your actual init
          // isomorphicInstanceRef.current.__internal_updateInstance(actualService);
          // setActiveInstance(isomorphicInstanceRef.current); // Re-trigger if state of wrapper changes
        } catch (error) {
          console.error('Failed to initialize actual TernSecure service:', error);
        }
      }
    };
    initializeActualService();
    */
    
    // Using JSON.stringify for options in dependency array is a common way to handle object dependencies,
    // but be cautious if options contain functions or complex objects.
    // A more robust solution might involve memoizing options or using a stable key.
  }, [JSON.stringify(options)]);

  return activeInstance;
};
