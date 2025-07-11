'use client'

import React, { PropsWithChildren } from 'react';
import type { SignInUIConfig, SignUpUIConfig } from '@tern-secure/types';

// Debug logging utility
//const debugLog = (component?: string, action?: string, data?: any) => {
//  console.log(`[TernSecureHostRenderer:${component}] ${action}`, data || '');
//};

type TernUIProps = SignInUIConfig | SignUpUIConfig;

interface MountProps {
  mount: (node: HTMLDivElement, props: any) => void;
  unmount: (node: HTMLDivElement) => void;
  updateProps?: (params: { node: HTMLDivElement; props: any }) => void;
  props: any;
}

type HostRendererProps = PropsWithChildren<
  MountProps & {
    component?: string;
    hideRootHtmlElement?: boolean;
    rootProps?: React.JSX.IntrinsicElements['div'];
  }
>;

/**
 * TernSecureHostRenderer is responsible for the actual mounting/unmounting of UI components
 * from the @tern-secure/ui package. It handles the lifecycle of the mounted component
 * and ensures proper cleanup.
 */
export class TernSecureHostRenderer extends React.PureComponent<HostRendererProps> {
  private rootRef = React.createRef<HTMLDivElement>();

  componentDidUpdate(prevProps: Readonly<HostRendererProps>) {
    if (this.rootRef.current && this.props.updateProps) {
      const hasPropsChanged = JSON.stringify(prevProps.props) !== JSON.stringify(this.props.props);

      //debugLog(this.props.component, 'Props Update Check', {
      //  hasChanged: hasPropsChanged,
      //  prevProps: prevProps.props,
      //  newProps: this.props.props,
      //});

      if (hasPropsChanged) {
        //debugLog(this.props.component, 'Updating Props');
        this.props.updateProps({
          node: this.rootRef.current,
          props: this.props.props,
        });
      }
    }
  }

  componentDidMount() {
    //debugLog(this.props.component, 'Mounting');
    if (this.rootRef.current) {
      this.props.mount(this.rootRef.current, this.props.props);
    }
  }

  componentWillUnmount() {
    //debugLog(this.props.component, 'Unmounting');
    if (this.rootRef.current) {
      this.props.unmount(this.rootRef.current);
    }
  }

  render() {
    const { hideRootHtmlElement = false, rootProps = {}, children, component } = this.props;
    const rootAttributes = {
      ref: this.rootRef,
      ...rootProps,
      ...(component && { 'data-ternsecure-component': component }),
    };

    //debugLog(component, 'Rendering', {
    //  hideRootHtmlElement,
    //  hasChildren: !!children,
    //  rootAttributes,
    //});

    return (
      <>
        {!hideRootHtmlElement && <div {...rootAttributes} />}
        {children}
      </>
    );
  }
}

export const isMountProps = (props: any): props is MountProps => {
  return typeof props.mount === 'function' && typeof props.unmount === 'function';
};
