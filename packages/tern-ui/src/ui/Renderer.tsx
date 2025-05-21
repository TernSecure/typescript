import React, { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type {
    TernSecureInstanceTree,
    SignInUIConfig,
    SignUpUIConfig,
} from '@tern-secure/types'
import {
    SignIn,
    SignUp,
    TernSecureComponents
} from '../lazyLoading/components'
import type {
    TernSecureComponentName
} from '../lazyLoading/components'

// Define a more specific props type if possible, or use a generic for now
export type ComponentProps =
    | ({ name: 'SignIn'; props?: SignInUIConfig })
    | ({ name: 'SignUp'; props?: SignUpUIConfig })
    | ({ name: 'Verify'; props?: any });

const componentMap = {
    SignIn: SignIn,
    SignUp: SignUp,
};

const activeRoots = new Map<HTMLDivElement, Root>();

function getOrCreateRoot(element: HTMLDivElement): Root {
    if (activeRoots.has(element)) {
        return activeRoots.get(element)!;
    }
    const root = createRoot(element);
    activeRoots.set(element, root);
    return root;
}

export type TernComponentControls = {
    mountComponent: (params: {
        name: TernSecureComponentName;
        node: HTMLDivElement;
        props?: ComponentProps['props'];
        instance?: TernSecureInstanceTree;
    }) => void;
    unmountComponent: (params: { node: HTMLDivElement }) => void;
    updateProps: (params: {
        node: HTMLDivElement;
        props: ComponentProps['props'];
        name: TernSecureComponentName;
        instance?: TernSecureInstanceTree;
    }) => void;
}

export const createComponentRenderer = (): TernComponentControls => {
    const mountComponent = (params: {
        name: TernSecureComponentName;
        node: HTMLDivElement;
        props?: ComponentProps['props'];
        instance?: TernSecureInstanceTree;
    }) => {
        const { node, name, props, instance } = params;
        const ComponentToRender = componentMap[name];

        if (!ComponentToRender) {
            console.error(`[TernUI] Component "${name}" not found.`);
            return;
        }

        const root = getOrCreateRoot(node);
        const componentProps = { ...props, instance };

        root.render(
            <React.StrictMode>
                <Suspense fallback={<div>Loading...</div>}>
                    <ComponentToRender {...componentProps} />
                </Suspense>
            </React.StrictMode>
        );
    };

    const unmountComponent = (params: { node: HTMLDivElement }) => {
        const { node } = params;
        if (activeRoots.has(node)) {
            activeRoots.get(node)!.unmount();
            activeRoots.delete(node);
        }
    };

    const updateProps = (params: {
        node: HTMLDivElement;
        props: ComponentProps['props'];
        name: TernSecureComponentName;
        instance?: TernSecureInstanceTree;
    }) => {
        const { node, props, name, instance } = params;
        if (!activeRoots.has(node)) {
            console.warn("[TernUI] Attempted to update props on an unmounted component. Mounting instead.");
            mountComponent({ node, name, props, instance });
            return;
        }

        const ComponentToRender = componentMap[name];
        if (!ComponentToRender) {
            console.error(`[TernUI] Component "${name}" not found for update.`);
            return;
        }

        const root = activeRoots.get(node)!;
        const componentProps = { ...props, instance };

        root.render(
            <React.StrictMode>
                <Suspense fallback={<div>Loading...</div>}>
                    <ComponentToRender {...componentProps} />
                </Suspense>
            </React.StrictMode>
        );
    };

    return {
        mountComponent,
        unmountComponent,
        updateProps,
    };
}