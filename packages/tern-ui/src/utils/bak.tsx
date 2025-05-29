import React, { Suspense, useEffect, useState , useLayoutEffect} from 'react';
import type {
    TernSecureInstanceTree,
    SignInPropsTree,
    SignUpPropsTree,
    TernSecureInstanceTreeOptions,
} from '@tern-secure/types';
import {
    TernSecureComponents
} from '../lazyLoading/components';
import {
    TernSecureComponentName,
    preloadComponent
} from '../lazyLoading/components';
import { 
    TernSecureInstanceContext,
} from '@tern-secure/shared/react';
import ReactDOM from 'react-dom';

const ROOT_ELEMENT_ID = 'data-ternsecure-component';



const debugLog = (component: string, action: string, data?: any) => {
  console.log(`[tern-ui: TernSecureHostRenderer:${component}] ${action}`, data || '');
};

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
  options?: TernSecureInstanceTreeOptions;
  onComponentsMounted: () => void;
}

interface ComponentsState {
    options: TernSecureInstanceTreeOptions | undefined;
    nodes: Map<HTMLDivElement, HtmlNodeOptions>;
}

let componentsControlsResolver2: (controls: TernComponentControls) => void;
    let componentsControlsRejecter2: (error: Error) => void;
    const componentsControlsPromise2 = new Promise((resolve, reject) => {
        componentsControlsResolver2 = resolve;
        componentsControlsRejecter2 = reject;
    });