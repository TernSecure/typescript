import { 
    TernSecureInstanceContext,
    TernSecureAuthContext,
    UserContext
} from '@tern-secure/shared/react';
import type {
    TernSecureInstanceTree,
    TernSecureUser,
} from '@tern-secure/types';
import React, { useMemo } from 'react';

type TernSecureContextWrapperProps = {
    instance: TernSecureInstanceTree
    children: React.ReactNode;
    ternSecureUser?: TernSecureUser;
}

type TernSecureUserProps = {
    ternSecureUser: TernSecureUser;
}

export function TernSecureContextWrapper(props: TernSecureContextWrapperProps): React.JSX.Element | null {
    const ternSecure = props.instance
    const ternSecureUser = props.ternSecureUser || null;
    const ternSecureCtx = useMemo(() => ({value: ternSecure}), [])
    const ternSecureUserCtx = useMemo(() => ({value: ternSecureUser}), [ternSecureUser]);
    const ternSecureAuthCtx = useMemo(() => ({
        value: ternSecure.ternAuth
    }), [ternSecure.ternAuth]);
    return (
        <TernSecureInstanceContext.Provider value={ternSecureCtx}>
            <TernSecureAuthContext.Provider value={ternSecureAuthCtx}>
                <UserContext.Provider value={ternSecureUserCtx}>
                {props.children}
                </UserContext.Provider>
            </TernSecureAuthContext.Provider>
        </TernSecureInstanceContext.Provider>
    );
}