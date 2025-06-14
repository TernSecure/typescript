import { 
    TernSecureInstanceContext,
    TernSecureAuthContext,
} from '@tern-secure/shared/react';
import type {
    TernSecureInstanceTree,
} from '@tern-secure/types';
import React, { useMemo } from 'react';

type TernSecureContextWrapperProps = {
    instance: TernSecureInstanceTree
    children: React.ReactNode;
    //ternSecureUser?: TernSecureUser;
}

export function TernSecureContextWrapper(props: TernSecureContextWrapperProps): React.JSX.Element | null {
    const ternSecure = props.instance
    //const ternSecureUser = props.ternSecureUser || null;
    const ternSecureCtx = useMemo(() => ({value: ternSecure}), [])
    //const ternSecureUserCtx = useMemo(() => ({value: ternSecureUser}), [ternSecureUser]);
    const ternSecureAuthCtx = useMemo(() => {
        const value = {
            authProvider: ternSecure.ternAuth,
            authState: ternSecure.ternAuth?.internalAuthState
        }
        return { value }
    }, [ternSecure.ternAuth, ternSecure.ternAuth?.internalAuthState]);
    return (
        <TernSecureInstanceContext.Provider value={ternSecureCtx}>
            <TernSecureAuthContext.Provider value={ternSecureAuthCtx}>
                {props.children}
            </TernSecureAuthContext.Provider>
        </TernSecureInstanceContext.Provider>
    );
}