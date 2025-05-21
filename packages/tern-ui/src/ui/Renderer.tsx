import React, { Suspense, useEffect, useState } from 'react';
import type {
    TernSecureInstanceTree,
    SignInUIConfig,
    SignUpUIConfig,
    SignInPropsTree,
    SignUpPropsTree,
} from '@tern-secure/types';
import {
    SignIn,
    SignUp,
    TernSecureComponents
} from '../lazyLoading/components';
import type {
    TernSecureComponentName
} from '../lazyLoading/components';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { 
    TernSecureInstanceContext,
} from '@tern-secure/shared';

const ROOT_ELEMENT_ID = 'data-tern-secure-component';

export type AvailableComponentProps = 
    | SignInPropsTree
    | SignUpPropsTree;

interface HtmlNodeOptions {
    /** Unique key for React rendering */
    key: string;
    /** The type of component to render */
    name: TernSecureComponentName;
    /** The appearance key for styling */
    appearanceKey: string;
    /** Component-specific props */
    props?: AvailableComponentProps;
}

export type TernComponentControls = {
    mountComponent: (params: {
        appearanceKey: string;
        name: TernSecureComponentName;
        node: HTMLDivElement;
        props?: AvailableComponentProps;
    }) => void;
    unmountComponent: (params: { node: HTMLDivElement }) => void;
    updateProps: (params: {
        appearanceKey?: string;
        node: HTMLDivElement;
        props?: Partial<AvailableComponentProps>;
    }) => void;
}

interface ComponentsProps {
  instance?: TernSecureInstanceTree;
  onComponentsMounted: () => void;
}

interface ComponentsState {
    nodes: Map<HTMLDivElement, HtmlNodeOptions>;
}

function assertDOMElement(element: HTMLElement): asserts element {
  if (!element) {
    throw new Error('Element is not a valid DOM element');
  }
}

export const mountComponentRenderer = (instance: TernSecureInstanceTree) => {
    let instanceRoot = document.getElementById(ROOT_ELEMENT_ID);

    if (!instanceRoot) {
        instanceRoot = document.createElement('div');
        instanceRoot.setAttribute('id', ROOT_ELEMENT_ID);
        document.body.appendChild(instanceRoot);
    }

    let componentsControlsResolver: (controls: TernComponentControls) => void;
    const componentsControlsPromise = new Promise<TernComponentControls>((resolve) => {
        componentsControlsResolver = resolve;
    });

    const root = createRoot(instanceRoot);
    
    return {
        ensureMounted: async () => {
            root.render(
                <Components
                    instance={instance}
                    onComponentsMounted={() => {
                        if (componentsControlsResolver) {
                            componentsControlsResolver(componentsControls);
                        }
                    }}
                />
            );
            return componentsControlsPromise;
        },
    }
}

export type MountComponentRenderer = typeof mountComponentRenderer;
const componentsControls = {} as TernComponentControls;

const PortalRenderer: React.FC<{ node: HTMLDivElement; children: React.ReactNode }> = ({ node, children }) => {
  return createPortal(children, node);
};

/**
 * LazyProviders handles UI-specific context for lazily loaded components.
 * This separates the UI rendering context from the instance context,
 * making it easier to manage UI-specific concerns.
 */
type LazyProvidersProps = React.PropsWithChildren<{
    instance: any;
    children: any;
}>;
const LazyProviders = (props: LazyProvidersProps) => {
    return (
        <TernSecureInstanceContext.Provider value={props.instance}>
                {props.children}
        </TernSecureInstanceContext.Provider>
    );
};

type LazyComponentRendererProps = {
    node: HTMLDivElement;
    name: TernSecureComponentName;
    props?: AvailableComponentProps;
    componentKey: string;
}

/**
 * LazyComponentRenderer handles rendering a single component through a portal
 * with proper Suspense and error boundaries.
 */
const LazyComponentRenderer = ({ node, name, props, componentKey }: LazyComponentRendererProps) => {
    const ComponentToRender = TernSecureComponents[name];
    if (!ComponentToRender) {
        console.warn(`TernSecure component "${name}" not found.`);
        return null;
    }

    return (
        <PortalRenderer node={node} key={componentKey}>
            <Suspense fallback={<div>Loading {name}...</div>}>
                <ComponentToRender {...props as any} />
            </Suspense>
        </PortalRenderer>
    );
};

const Components = (props: ComponentsProps) => {
    const { instance, onComponentsMounted } = props;
    const [state, setState] = useState<ComponentsState>({
        nodes: new Map(),
    });

    const { nodes } = state;
    
    useEffect(() => {
        componentsControls.mountComponent = params => {
            const { name, node, props: componentProps, appearanceKey } = params;
            assertDOMElement(node);
            setState(s => {
                const newNodes = new Map(s.nodes);
                newNodes.set(node, {
                    key: node.id || `tern-secure-component-${Math.random().toString(36).substring(2, 15)}`,
                    name,
                    props: componentProps,
                    appearanceKey,
                });
                return { ...s, nodes: newNodes };
            });
        };

        componentsControls.unmountComponent = params => {
            const { node } = params;
            setState(s => {
                const newNodes = new Map(s.nodes);
                newNodes.delete(node);
                return { ...s, nodes: newNodes };
            });
        };

        componentsControls.updateProps = ({ node, props: newPartialProps, appearanceKey: newAppearanceKey }) => {
            if (!node) return;
            
            setState(s => {
                const existingNodeOptions = s.nodes.get(node);
                if (!existingNodeOptions) {
                    console.warn('Attempted to update props for a non-mounted component node.');
                    return s;
                }
                const newNodes = new Map(s.nodes);
                const mergedProps = newPartialProps 
                    ? { ...existingNodeOptions.props, ...newPartialProps } 
                    : existingNodeOptions.props;

                newNodes.set(node, {
                    ...existingNodeOptions,
                    props: mergedProps as AvailableComponentProps,
                    appearanceKey: newAppearanceKey !== undefined ? newAppearanceKey : existingNodeOptions.appearanceKey,
                });
                return { ...s, nodes: newNodes };
            });
        };

        onComponentsMounted();
    }, [onComponentsMounted]);

    // Each node maps to its own LazyComponentRenderer
    return (
        <LazyProviders instance={instance}>
            {Array.from(nodes.entries()).map(([node, options]) => (
                <LazyComponentRenderer
                    key={options.key}
                    node={node}
                    name={options.name}
                    props={options.props}
                    componentKey={options.key}
                />
            ))}
        </LazyProviders>
    );
};