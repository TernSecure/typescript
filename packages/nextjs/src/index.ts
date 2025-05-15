
//import { TernSecureServerProvider } from './app-router/server/TernSecureServerProvider'
//import type { TernSecureState } from './app-router/client/TernSecureProvider'
export { TernSecureAuth, TernSecureFirestore, ternSecureAuth } from '@tern-secure/next-frontend'
//export { loadFireConfig, validateConfig } from './utils/config'
//export { signInWithEmail } from '@tern-secure/next-backend'
//export { useInternalContext } from './boundary/TernSecureCtx'
//export { TernSecureClientProvider } from './app-router/client/TernSecureProvider'
export { TernSecureProvider } from './app-router/client/TernSecureProvider'
export {
    useAuth,
    useIdToken,
    useSignUp,
    useSession,
    SignIn,
    SignOut,
    SignOutButton,
    SignUp,
    Verify
} from './boundary/components'

export type { TernSecureUser, TernSecureUserData } from '@tern-secure/types'

//export const TernSecureProvider = TernSecureServerProvider
//export type { TernSecureState }