import React from "react"
import { 
  TernSecureProvider as TernSecureReactProvider 
} from "@tern-secure/react"
import type { TernSecureNextProps } from "../../types"
import { allNextProviderPropsWithEnv } from "../../utils/allNextProviderProps"
import { TernUIScript } from "../../utils/tern-ui-script";



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
export function TernSecureProvider(props: React.PropsWithChildren<TernSecureNextProps>) {
  const {children, ...nextProps } = props;
  const providerProps = allNextProviderPropsWithEnv(nextProps);
  return (
    <TernSecureReactProvider {...providerProps}>
      <TernUIScript />
        {children}
    </TernSecureReactProvider>
  )
}