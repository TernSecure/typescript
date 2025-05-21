import type {
    TernSecureInstanceTree,
    TernSecureUser,
    TernSecureSessionTree,
    SignInResponseTree,
    SignInUIConfig,
    SignUpUIConfig,
    AuthErrorTree,
} from '@tern-secure/types';
import { createComponentRenderer, TernComponentControls } from '../ui/Renderer';

/**
 * This is a placeholder for the functional part of the TernSecure instance.
 * In a real scenario, this would be provided by a core package (like @tern-secure/core or @tern-secure/client)
 * and would handle the actual logic for sign-in, sign-out, API calls, etc.
 */
export interface FunctionalTernSecureInstance extends Omit<TernSecureInstanceTree, 'ui'> {
    // It might have additional methods or properties specific to its internal workings
}

export class TernSecure implements TernSecureInstanceTree {
    private functionalInstance: FunctionalTernSecureInstance;
    private rendererControls: TernComponentControls;

    // UI State - managed by this class, reflecting what the renderer might need or what is controlled.
    public ui: TernSecureInstanceTree['ui'] = {
        state: {
            isReady: true, // UI part is ready to be shown by tern-ui
            isVisible: false, // This might be controlled per component instance
            currentView: null,
            isLoading: false,
            error: null,
        },
        controls: {
            showSignIn: (targetNode: HTMLDivElement, config?: SignInUIConfig) => {
                this.rendererControls.mountComponent({
                    name: 'SignIn',
                    node: targetNode,
                    props: config,
                    instance: this, // Pass self if SignIn component needs access to the full instance
                });
                this.ui.state.currentView = 'signIn';
                this.ui.state.isVisible = true;
            },
            hideSignIn: (targetNode: HTMLDivElement) => {
                this.rendererControls.unmountComponent({ node: targetNode });
                if (this.ui.state.currentView === 'signIn') {
                    this.ui.state.isVisible = false;
                    this.ui.state.currentView = null;
                }
            },
            showSignUp: (targetNode: HTMLDivElement, config?: SignUpUIConfig) => {
                this.rendererControls.mountComponent({
                    name: 'SignUp',
                    node: targetNode,
                    props: config,
                    instance: this,
                });
                this.ui.state.currentView = 'signUp';
                this.ui.state.isVisible = true;
            },
            hideSignUp: (targetNode: HTMLDivElement) => {
                this.rendererControls.unmountComponent({ node: targetNode });
                if (this.ui.state.currentView === 'signUp') {
                    this.ui.state.isVisible = false;
                    this.ui.state.currentView = null;
                }
            },
            clearError: () => {
                this.ui.state.error = null;
                // Potentially notify functionalInstance or re-render components if error is displayed within them
            },
            setLoading: (isLoading: boolean) => {
                this.ui.state.isLoading = isLoading;
                // Potentially re-render components if loading state is displayed within them
            },
        },
    };

    constructor(functionalInstance: FunctionalTernSecureInstance) {
        this.functionalInstance = functionalInstance;
        this.rendererControls = createComponentRenderer(); // Pass this if renderer needs access to full instance
    }

    // Delegate auth, user, platform, and events to the functionalInstance
    public get auth(): TernSecureInstanceTree['auth'] {
        return this.functionalInstance.auth;
    }

    public get signIn() {
        return this.functionalInstance.signIn;
    }

    public get user() {
        return this.functionalInstance.user;
    }

    public get platform() {
        return this.functionalInstance.platform;
    }

    public get events() {
        return this.functionalInstance.events;
    }
}