import { 
    TernSecureInstanceContext,
} from '@tern-secure/shared/react';
import type {
    TernSecureInstanceTree
} from '@tern-secure/types';
import React, { useMemo } from 'react';

type TernSecureContextWrapperProps = {
    instance: TernSecureInstanceTree
    children: React.ReactNode;
}

export function TernSecureContextWrapper(props: TernSecureContextWrapperProps) {
    const ternSecure = props.instance
    const ternSecureCtx = useMemo(() => ({value: ternSecure}), [])
    return (
        <TernSecureInstanceContext.Provider value={ternSecureCtx}>
            {props.children}
        </TernSecureInstanceContext.Provider>
    );
}