export { useAuth } from "./hooks/useAuth"
export { useSignUp } from "./hooks/useSignUp"
export { useIdToken } from "./hooks/useIdToken"
export { useSession } from "./hooks/useSession"
export {
    TernSecureCtx,
    useTernSecure,
    getCurrentUser
} from './ctx/TernSecureCtx'
export  {
    TernSecureClientProvider
} from './ctx/TernSecureClientProvider'

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
    Verify
} from './components/verify'
export {
    AuthBackground
} from './components/background'
export {
    cn
} from './lib/utils'

