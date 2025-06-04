import { 
    TernSecureInstanceContext,
    TernSecureAuthContext
} from '@tern-secure/shared/react';
import type {
    TernSecureInstanceTree,
} from '@tern-secure/types';
import React, { useMemo } from 'react';

type TernSecureContextWrapperProps = {
    instance: TernSecureInstanceTree
    children: React.ReactNode;
}

export function TernSecureContextWrapper(props: TernSecureContextWrapperProps): React.JSX.Element | null {
    const ternSecure = props.instance
    const ternSecureCtx = useMemo(() => ({value: ternSecure}), [])
    const ternSecureAuthCtx = useMemo(() => ({
        value: ternSecure.ternAuth
    }), [ternSecure.ternAuth]);
    return (
        <TernSecureInstanceContext.Provider value={ternSecureCtx}>
            <TernSecureAuthContext.Provider value={ternSecureAuthCtx}>
                {props.children}
            </TernSecureAuthContext.Provider>
        </TernSecureInstanceContext.Provider>
    );
}