import React from "react"
import { TernSecureClientProvider } from "@tern-secure/react"


/**
 * Configuration options for TernSecure authentication
 */
export interface TernSecureConfig {
  /** Whether email verification is required (defaults to true) */
  requiresVerification?: boolean
  /** Custom path for login page (defaults to /sign-in) */
  loginPath?: string
  /** Custom path for signup page (defaults to /sign-up) */
  signUpPath?: string
  /** Custom loading component */
  loadingComponent?: React.ReactNode
}

// Loading fallback component
/*function TernSecureLoadingFallback() {
  return (
    <div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}*/
/**
 * Root Provider for TernSecure
 * Use this in your Next.js App Router root layout
 * Automatically handles client/server boundary and authentication state
 * 
 * @example
 * /// app/layout.tsx
 * import { TernSecureProvider } from '@tern/secure'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TernSecureProvider>
 *           {children}
 *         </TernSecureProvider>
 *       </body>
 *     </html>
 *   )
 * }
 */
export async function TernSecureProvider({ 
  children,
  requiresVerification = true,
  //loginPath,
  //signUpPath,
  loadingComponent,
 }: React.PropsWithChildren<TernSecureConfig>) {
  return (
    <TernSecureClientProvider
      requiresVerification={requiresVerification}
      //loginPath={loginPath}
      //signUpPath={signUpPath}
      loadingComponent={loadingComponent}
    >
        {children}
    </TernSecureClientProvider>
  )
}