import React, { lazy, Suspense} from "react";
import {
    TernSecureComponents
} from './components';
import type {
    TernSecureComponentName,
} from './components';

import type {
    AvailableComponentProps
} from '../../types';


export type LazyComponentRendererProps = {
    node: HTMLDivElement;
    name: TernSecureComponentName;
    props?: AvailableComponentProps;
    componentKey: string;
}


const TernSecureContextWrapper = lazy(() => import('../../ctx').then(module => ({ default: module.TernSecureContextWrapper })));
const PortalRenderer = lazy(() => import('../portal').then(module => ({ default: module.PortalRenderer })));
/**
 * LazyProviders handles UI-specific context for lazily loaded components.
 * This separates the UI rendering context from the instance context,
 * making it easier to manage UI-specific concerns.
 */
type LazyProvidersProps = React.PropsWithChildren<{
    instance: any;
    children: any;
}>;
export const LazyProviders = (props: LazyProvidersProps) => {
    return (
        <TernSecureContextWrapper instance={props.instance}>
            {props.children}
        </TernSecureContextWrapper>
    );
};


/**
 * LazyComponentRenderer handles rendering a single component through a portal
 * with proper Suspense and error boundaries.
 */
export const LazyComponentRenderer = ({ node, name, props, componentKey }: LazyComponentRendererProps) => {
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