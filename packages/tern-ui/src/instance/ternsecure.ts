import type {
    TernSecureInstanceTree,
    TernSecureUser,
    TernSecureSessionTree,
    SignInResponseTree,
    SignInUIConfig,
    SignUpUIConfig,
    SignInPropsTree,
    SignUpPropsTree,
} from '@tern-secure/types';
import type { MountComponentRenderer } from '../ui/Renderer';

export class TernSecure implements TernSecureInstanceTree {
    public static mountComponentRenderer?: MountComponentRenderer;

    #componentControls?: ReturnType<MountComponentRenderer>| null;
    #functionalInstance: Omit<TernSecureInstanceTree, 'ui'>;

    constructor(functionalInstance: Omit<TernSecureInstanceTree, 'ui'>) {
        this.#functionalInstance = functionalInstance;
    };

    assertComponentControlsReady(controls: unknown): asserts controls is ReturnType<MountComponentRenderer> {
        if (!TernSecure.mountComponentRenderer) {
            throw new Error('TernSecure instance was loaded without UI components');
        }
        if (!controls) {
            throw new Error('TernSecure UI components are not ready yet.');
        }
    }

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
            showSignIn: (node: HTMLDivElement, config?: SignInUIConfig) => {
                this.assertComponentControlsReady(this.#componentControls);
                const componentProps: SignInPropsTree = {
                    ui: config,
                    signIn: this.#functionalInstance.signIn,
                }
                this.#componentControls.ensureMounted().then(controls =>
                    controls.mountComponent({
                        name: 'SignIn',
                        node,
                        props: componentProps,
                        appearanceKey: config?.appearance?.colors?.primary || 'default',
                    }),
                );
                this.ui.state.currentView = 'signIn';
                this.ui.state.isVisible = true;
            },
            hideSignIn: (node: HTMLDivElement) => {
                this.assertComponentControlsReady(this.#componentControls);
                this.#componentControls.ensureMounted().then(controls =>
                    controls.unmountComponent({ 
                        node,
                    }),
                );
            },
            showSignUp: (node: HTMLDivElement, config?: SignUpUIConfig) => {
                this.assertComponentControlsReady(this.#componentControls);
                const componentProps: SignInPropsTree = {
                    ui: config,
                    signIn: this.#functionalInstance.signIn,
                }
                this.#componentControls.ensureMounted().then(controls =>
                    controls.mountComponent({
                        name: 'SignUp',
                        node,
                        props: componentProps,
                        appearanceKey: config?.appearance?.colors?.primary || 'default',
                    }),
                );
                this.ui.state.currentView = 'signUp';
                this.ui.state.isVisible = true;
            },
            hideSignUp: (node: HTMLDivElement) => {
                this.assertComponentControlsReady(this.#componentControls);
                this.#componentControls.ensureMounted().then(controls =>
                    controls.unmountComponent({ 
                        node,
                    }),
                );
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


    // Delegate auth, user, platform, and events to the functionalInstance
    public get auth(): TernSecureInstanceTree['auth'] {
        return this.#functionalInstance.auth;
    }

    public get signIn(): TernSecureInstanceTree['signIn'] {
        return this.#functionalInstance.signIn;
    }

    public get user(): TernSecureInstanceTree['user'] {
        return this.#functionalInstance.user;
    }

    public get platform(): TernSecureInstanceTree['platform'] {
        return this.#functionalInstance.platform;
    }

    public get events(): TernSecureInstanceTree['events'] {
        return this.#functionalInstance.events;
    }
}