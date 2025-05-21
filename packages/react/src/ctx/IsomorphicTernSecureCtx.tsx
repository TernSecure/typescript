import {
    TernSecureInstanceContext,
    useTernSecureInstanceContext,
} from '@tern-secure/shared/react';

import { IsomorphicTernSecure } from '../lib/isomorphicTernSecure';

export const IsomorphicTernSecureCtx = TernSecureInstanceContext;
export const useIsomorphicTernSecureCtx = useTernSecureInstanceContext as unknown as ()=> IsomorphicTernSecure;