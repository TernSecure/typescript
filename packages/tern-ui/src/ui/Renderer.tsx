import React, { Suspense, useState, useLayoutEffect } from 'react';
import type {
    TernSecureInstanceTree,
    TernSecureInstanceTreeOptions,
} from '@tern-secure/types';
import {
    preloadComponent
} from '../components/lazyLoading/components';
import type {
    TernSecureComponentName
} from '../components/lazyLoading/components';

import {
    LazyComponentRenderer,
    LazyProviders
} from '../components/lazyLoading/providersCtx'

import type {
    AvailableComponentProps
} from '../components/types';

const ROOT_ELEMENT_ID = 'data-ternsecure-component';


const debugLog = (component: string, action: string, data?: any) => {
  console.log(`[tern-ui: TernSecureHostRenderer:${component}] ${action}`, data || '');
};


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
  options?: TernSecureInstanceTreeOptions;
  onComponentsMounted: () => void;
}

interface ComponentsState {
    options: TernSecureInstanceTreeOptions | undefined;
    nodes: Map<HTMLDivElement, HtmlNodeOptions>;
}

function assertDOMElement(element: HTMLElement): asserts element {
  if (!element) {
    throw new Error('Element is not a valid DOM element');
  }
}

export const mountComponentRenderer = (instance: TernSecureInstanceTree, options: TernSecureInstanceTreeOptions) => {
    debugLog('Renderer', 'Initializing Renderer', instance);
    
    const getOrCreateRoot = () => {
        let instanceRoot = document.getElementById(ROOT_ELEMENT_ID);
        console.log('[Renderer] Looking for existing root:', { 
            elementId: ROOT_ELEMENT_ID, 
            found: !!instanceRoot 
        });

        if (!instanceRoot) {
            instanceRoot = document.createElement('div');
            instanceRoot.setAttribute('id', ROOT_ELEMENT_ID);
            // Hide the root container since it's just for React
            //instanceRoot.style.display = 'none';
            //instanceRoot.style.position = 'absolute';
            document.body.appendChild(instanceRoot);
            
            console.log('[Renderer] Created React root container:', {
                element: instanceRoot,
                id: instanceRoot.id,
                parentNode: instanceRoot.parentNode,
                bodyChildren: document.body.children.length,
                allTernSecureElements: document.querySelectorAll('[data-ternsecure-component]').length
            });

            debugLog('Renderer', 'Created React root container');
        } else {
            console.log('[Renderer] Using existing root container:', {
                element: instanceRoot,
                parentNode: instanceRoot.parentNode
            });
        }
        return instanceRoot;
    };


    let componentsControlsResolver: Promise<TernComponentControls> | undefined;

    const createDeferredPromise = () => {
        let resolve: (value?: any) => void = () => {};
        let reject: (value?: any) => void = () => {};
        const promise =  new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    }
    

    //const root = createRoot(instanceRoot);
    
    return {
        ensureMounted: async (props?: {preloadHint: TernSecureComponentName}) => {
            const { preloadHint } = props || {};

            if (!componentsControlsResolver) {
                const instanceRoot = getOrCreateRoot();
                const deferred = createDeferredPromise();

                if (preloadHint) {
                    void preloadComponent(preloadHint)
                }

               componentsControlsResolver = import ('../components/lazyLoading/common').then(({ createRoot }) => {
                createRoot(instanceRoot).render(
                  <Components
                    instance={instance}
                    options={options}
                    onComponentsMounted={deferred.resolve}
                   />,
            );
            return deferred.promise.then(() => componentsControls);
        });
    }
        return componentsControlsResolver.then(controls => controls);
    },
}
}

export type MountComponentRenderer = typeof mountComponentRenderer;
const componentsControls = {} as TernComponentControls;


const Components = (props: ComponentsProps) => {
    const { instance } = props;
    const [state, setState] = useState<ComponentsState>({
        options: props.options,
        nodes: new Map(),
    });

    const { nodes } = state;
    
    useLayoutEffect(() => {
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

        props.onComponentsMounted();
    }, []);

    debugLog('Components', 'Rendering', { 
        nodeCount: nodes.size,
        activeNodes: Array.from(nodes.keys()).map(n => n.id)
    });
    return (
    <Suspense fallback={''}>
        <LazyProviders
          instance={props.instance}
        >
            {[...nodes].map(([node, options]) => (
                <LazyComponentRenderer
                    key={options.key}
                    node={node}
                    name={options.name}
                    props={options.props}
                    componentKey={options.key}
                />
            ))}
        </LazyProviders>
        </Suspense>
    );
};