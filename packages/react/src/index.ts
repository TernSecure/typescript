export { useAuth } from "./hooks/useAuth"
export { useSignUp } from "./hooks/useSignUp"
export { useIdToken } from "./hooks/useIdToken"
export { useSession } from "./hooks/useSession"
export {
    TernSecureCtxProvider
} from './ctx/TernSecureCtxProvider'
export  {
    TernSecureProvider
} from './ctx/TernSecureProvider'

export {
    isAuthRoute,
    isBaseAuthRoute,
    isInternalRoute,
    handleInternalRoute
} from './route-handler/internal-route'

export  {
    TernSecureAuth,
    ternSecureAuth,
    TernSecureFirestore,
    TernSecureStorage
} from './utils/client-init'
export {
    SignIn,
    SignUp,
} from './components/uiComponent'
export {
    AuthBackground
} from './components/background'
export {
    cn
} from './lib/utils'

export type {
    IsomorphicTernSecureOptions,
    Browser,
    TernSecureProviderProps,
    initialState
} from './types'

export {
    loadTernUIScript,
    ternUIgetScriptUrl,
    constructScriptAttributes
} from '@tern-secure/shared/loadTernUIScript'

